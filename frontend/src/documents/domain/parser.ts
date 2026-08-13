import { documentTemplates, getTemplate } from "./catalog";
import type { ParsedIntent } from "./types";

const thaiDigits = "๐๑๒๓๔๕๖๗๘๙";
const months: Record<string, number> = {
  "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4, "พฤษภาคม": 5, "มิถุนายน": 6,
  "กรกฎาคม": 7, "สิงหาคม": 8, "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
  "มค": 1, "กพ": 2, "มีค": 3, "เมย": 4, "พค": 5, "มิย": 6,
  "กค": 7, "สค": 8, "กย": 9, "ตค": 10, "พย": 11, "ธค": 12,
};

export function normalizeThaiText(input: string): string {
  return input.replace(/[๐-๙]/g, (char) => String(thaiDigits.indexOf(char)))
    .replace(/ฯ/g, " ")
    .replace(/[\u200b\s]+/g, " ").trim();
}

export function thaiDateToIso(value: string): string | undefined {
  const text = normalizeThaiText(value).replace(/[,]/g, " ");
  const numeric = text.match(/(?:วันที่\s*)?(\d{1,2})\s*[\/-]\s*(\d{1,2})\s*[\/-]\s*(\d{2,4})/);
  const named = text.match(/(?:วันที่\s*)?(\d{1,2})\s+([ก-๙.]+)\s+(\d{2,4})/);
  const day = Number(numeric?.[1] ?? named?.[1]);
  const month = Number(numeric?.[2] ?? (named ? months[named[2].replace(/\./g, "")] : undefined));
  let year = Number(numeric?.[3] ?? named?.[3]);
  if (!day || !month || !year || month > 12 || day > 31) return undefined;
  if (year > 2400) year -= 543;
  else if (year < 100) year += 2500 - 543;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

const cleanValue = (value: string) => value.replace(/\s+(?:ณ|วันที่|ระหว่างวันที่|งบประมาณ|ครู|นักเรียน|ผู้จัด).*/u, "").trim();
const extractLabeled = (text: string, labels: string[]) => {
  const label = labels.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return cleanValue(text.match(new RegExp(`(?:${label})\\s*[:：]?\\s*([^,;\\n]+)`, "u"))?.[1] ?? "");
};
const people = (text: string, labels: string[]): string[] => {
  const value = extractLabeled(text, labels);
  return value ? value.split(/[,、/]|\s+และ\s+/u).map((name) => name.trim()).filter(Boolean) : [];
};

export function parseThaiDocumentIntent(input: string): ParsedIntent {
  const text = normalizeThaiText(input);
  const score = documentTemplates.map((template, index) => ({
    template, index, matched: template.keywords.filter((keyword) => text.includes(keyword)),
  })).map((entry) => ({ ...entry, score: entry.matched.length }));
  const winner = score.reduce((best, item) => item.score > best.score ? item : best, score[0]);
  const offsiteMatched = getTemplate("offsite-competition-pack")!.keywords.filter((keyword) => text.includes(keyword));
  const competition = /แข่งขัน|นำนักเรียน|นอกสถานที่/u.test(text) || offsiteMatched.length >= 2;
  const template = competition ? getTemplate("offsite-competition-pack")! : winner.template;
  const matchedKeywords = competition
    ? template.keywords.filter((keyword) => text.includes(keyword))
    : winner.matched;
  const fields: Record<string, string | string[]> = {};
  for (const field of template.fields) fields[field.key] = field.kind === "people" ? [] : "";
  const title = extractLabeled(text, ["เรื่อง", "กิจกรรม", "การแข่งขัน", "แข่งขัน"]);
  if (title) fields.title = title;
  const destination = extractLabeled(text, ["สถานที่", "ณ", "เดินทางไป"]);
  if (destination) fields.destination = destination;
  const sharedMonthRange = text.match(/(\d{1,2})\s*(?:–|-|ถึง)\s*(\d{1,2})\s+([ก-๙.]+)\s+(\d{2,4})/u);
  const dateMatches = sharedMonthRange
    ? [thaiDateToIso(`${sharedMonthRange[1]} ${sharedMonthRange[3]} ${sharedMonthRange[4]}`), thaiDateToIso(`${sharedMonthRange[2]} ${sharedMonthRange[3]} ${sharedMonthRange[4]}`)].filter((date): date is string => Boolean(date))
    : [...text.matchAll(/(?:\d{1,2}\s*[\/-]\s*\d{1,2}\s*[\/-]\s*\d{2,4}|\d{1,2}\s+[ก-๙.]+\s+\d{2,4})/gu)]
      .map((match) => thaiDateToIso(match[0])).filter((date): date is string => Boolean(date));
  if (dateMatches[0]) fields.start_date = dateMatches[0];
  if (dateMatches[1]) fields.end_date = dateMatches[1];
  const teachers = people(text, ["ครูผู้ควบคุม", "ครู", "อาจารย์"]);
  const students = people(text, ["รายชื่อนักเรียน", "นักเรียน"]);
  if (teachers.length) fields.teacher_names = teachers;
  if (students.length) fields.student_names = students;
  const budget = text.match(/(?:งบประมาณ|ค่าใช้จ่าย)\s*[:：]?\s*([\d,]+(?:\.\d{1,2})?)/u)?.[1]?.replace(/,/g, "");
  if (budget) fields.budget = budget;
  const organizer = extractLabeled(text, ["ผู้จัด", "หน่วยงานผู้จัด", "จัดโดย"]);
  if (organizer) fields.organizer = organizer;
  return { templateId: template.id, confidence: competition || matchedKeywords.length >= 2 ? "high" : matchedKeywords.length ? "medium" : "low", fields, matchedKeywords };
}
