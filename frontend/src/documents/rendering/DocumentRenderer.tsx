import type { DocumentTemplate, TemplatePart, WorkspaceDocument } from "../domain";

type PrintProps = { document: WorkspaceDocument; template: DocumentTemplate; part: TemplatePart };

const school = "โรงเรียนตัวอย่างวิทยา";
const value = (document: WorkspaceDocument, key: string) => {
  const item = document.fields[key];
  if (Array.isArray(item)) return item.length ? item : ["—"];
  return item?.trim() || "—";
};
const text = (document: WorkspaceDocument, key: string) => {
  const item = value(document, key);
  return Array.isArray(item) ? item.join(", ") : item;
};
const people = (document: WorkspaceDocument, key: string) => {
  const item = value(document, key);
  return Array.isArray(item) ? item : [item];
};
const thaiDate = (raw: string) => {
  if (raw === "—") return raw;
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" }).format(date);
};
const dateRange = (document: WorkspaceDocument) => {
  const start = thaiDate(text(document, "start_date"));
  const end = thaiDate(text(document, "end_date"));
  if (start === "—" && end === "—") return "—";
  if (start === "—") return end;
  if (end === "—" || end === start) return start;
  return `${start} ถึง ${end}`;
};

function Header({ title, number = "ที่ [กรอกเลขที่]/2569" }: { title: string; number?: string }) {
  return <header className="official-header"><div><b>{school}</b><span>สำนักงานเขตพื้นที่การศึกษาตัวอย่าง</span></div><div className="official-number">{number}</div><h1>{title}</h1></header>;
}
function Signature({ label = "ผู้เสนอ", name = "—" }: { label?: string; name?: string }) {
  return <div className="signature"><div className="signature-line">ลงชื่อ ........................................................</div><b>({name})</b><span>{label}</span></div>;
}
function Meta({ document }: { document: WorkspaceDocument }) {
  return <dl className="official-meta"><div><dt>เรื่อง</dt><dd>{document.title}</dd></div><div><dt>วันที่จัดทำ</dt><dd>{thaiDate(text(document, "date"))}</dd></div></dl>;
}
function ApprovalMemo({ document, part }: PrintProps) {
  return <article className="a4-document"><Header title="บันทึกข้อความ" /><section className="memo-lines"><p><b>ส่วนราชการ</b> {school}</p><p><b>ที่</b> [กรอกเลขที่]/2569 <b>วันที่</b> {thaiDate(text(document, "date"))}</p><p><b>เรื่อง</b> ขออนุมัตินำนักเรียนเข้าร่วม {text(document, "title")}</p><p><b>เรียน</b> ผู้อำนวยการ{school}</p><p className="indent">ด้วย{school} มีความประสงค์นำนักเรียนเข้าร่วม <b>{text(document, "title")}</b> ณ <b>{text(document, "destination")}</b> ในวันที่ <b>{dateRange(document)}</b> จัดโดย <b>{text(document, "organizer")}</b> เพื่อส่งเสริมประสบการณ์และศักยภาพของผู้เรียน</p><p className="indent">ในการนี้ ขออนุมัติให้ครูผู้ควบคุม {text(document, "teacher_names")} นำนักเรียนตามบัญชีรายชื่อเข้าร่วมกิจกรรม โดยใช้งบประมาณไม่เกิน <b>{text(document, "budget")} บาท</b> ตามระเบียบที่เกี่ยวข้อง</p><p className="indent">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</p></section><div className="signature-pair"><Signature label="ครูผู้รับผิดชอบ" name={people(document, "teacher_names")[0]} /><Signature label="ผู้อำนวยการโรงเรียน" /></div><p className="approval-box">ความเห็น/คำสั่ง: ☐ อนุมัติ &nbsp;&nbsp; ☐ ไม่อนุมัติ &nbsp;&nbsp; ลงชื่อ ........................................</p><Footer part={part} /></article>;
}
function SchoolOrder({ document, part }: PrintProps) {
  return <article className="a4-document"><Header title="คำสั่งโรงเรียนตัวอย่างวิทยา" number="คำสั่งที่ [กรอกเลขที่]/2569" /><h2>เรื่อง แต่งตั้งครูผู้ควบคุมนักเรียนเข้าร่วม {text(document, "title")}</h2><p className="center">————————————</p><p className="indent">เพื่อให้การนำนักเรียนเข้าร่วมกิจกรรม ณ {text(document, "destination")} วันที่ {dateRange(document)} เป็นไปด้วยความเรียบร้อย จึงแต่งตั้งบุคคลดังต่อไปนี้</p><table><thead><tr><th>ลำดับ</th><th>ชื่อ–สกุล</th><th>หน้าที่</th></tr></thead><tbody>{people(document, "teacher_names").map((name, index) => <tr key={`${name}-${index}`}><td>{index + 1}</td><td>{name}</td><td>ครูผู้ควบคุมและดูแลนักเรียน</td></tr>)}</tbody></table><p className="indent">ทั้งนี้ ให้ผู้ได้รับแต่งตั้งปฏิบัติหน้าที่ด้วยความรับผิดชอบ ตั้งแต่วันที่ {dateRange(document)} เป็นต้นไป</p><Signature label="ผู้อำนวยการโรงเรียน" /><Footer part={part} /></article>;
}
function ParentPermission({ document, part }: PrintProps) {
  return <article className="a4-document"><Header title="หนังสือขออนุญาตผู้ปกครอง" /><p>เรื่อง ขออนุญาตให้นักเรียนเข้าร่วมกิจกรรม</p><p>เรียน ผู้ปกครองนักเรียน</p><p className="indent">{school} กำหนดนำนักเรียนเข้าร่วม <b>{text(document, "title")}</b> ณ <b>{text(document, "destination")}</b> ระหว่างวันที่ <b>{dateRange(document)}</b> โดยมีครูผู้ควบคุม {text(document, "teacher_names")}</p><p className="indent">จึงขอความร่วมมือผู้ปกครองโปรดพิจารณาอนุญาตให้นักเรียนในความปกครองเข้าร่วมกิจกรรมดังกล่าว และรับทราบรายละเอียดการเดินทางตามกำหนดการแนบ</p><div className="permission"><p>ข้าพเจ้า ........................................................ ผู้ปกครองของ ........................................................</p><p>☐ อนุญาต &nbsp;&nbsp; ☐ ไม่อนุญาต ให้นักเรียนเข้าร่วมกิจกรรม</p><Signature label="ผู้ปกครอง" /></div><Signature label="ครูผู้รับผิดชอบ" name={people(document, "teacher_names")[0]} /><Footer part={part} /></article>;
}
function StudentRoster({ document, part }: PrintProps) {
  const students = people(document, "student_names");
  return <article className="a4-document"><Header title="บัญชีรายชื่อนักเรียน" /><h2>ผู้เข้าร่วม {text(document, "title")}</h2><p>สถานที่ {text(document, "destination")} · วันที่ {dateRange(document)}</p><table className="roster"><thead><tr><th>ลำดับ</th><th>ชื่อ–สกุล</th><th>ชั้น</th><th>ลายมือชื่อ</th></tr></thead><tbody>{students.map((student, index) => <tr key={`${student}-${index}`}><td>{index + 1}</td><td>{student}</td><td>—</td><td></td></tr>)}</tbody></table><p>ครูผู้ควบคุม: {text(document, "teacher_names")}</p><Signature label="ผู้จัดทำบัญชี" name={people(document, "teacher_names")[0]} /><Footer part={part} /></article>;
}
function Itinerary({ document, part }: PrintProps) {
  return <article className="a4-document"><Header title="กำหนดการเดินทางและกิจกรรม" /><h2>{text(document, "title")}</h2><p>สถานที่ {text(document, "destination")} · ระยะเวลา {dateRange(document)}</p><table><thead><tr><th>วัน/เวลา</th><th>รายการ</th><th>ผู้รับผิดชอบ</th></tr></thead><tbody><tr><td>ก่อนเดินทาง</td><td>ตรวจสอบรายชื่อและชี้แจงความปลอดภัย</td><td>{text(document, "teacher_names")}</td></tr><tr><td>ตามกำหนดกิจกรรม</td><td>เข้าร่วม {text(document, "title")}</td><td>ครูผู้ควบคุม</td></tr><tr><td>หลังเสร็จกิจกรรม</td><td>รวบรวมผู้เรียนและเดินทางกลับโรงเรียน</td><td>ครูผู้ควบคุม</td></tr></tbody></table><p className="note">หมายเหตุ: เวลาและรายละเอียดเพิ่มเติมให้ยึดตามกำหนดการของผู้จัด {text(document, "organizer")}</p><Signature label="ผู้จัดทำกำหนดการ" name={people(document, "teacher_names")[0]} /><Footer part={part} /></article>;
}
function TravelAuthorization({ document, part }: PrintProps) {
  return <article className="a4-document"><Header title="แบบขออนุญาตเดินทางนอกสถานที่" /><Meta document={document} /><p><b>เรียน</b> ผู้อำนวยการ{school}</p><p className="indent">ข้าพเจ้า {text(document, "teacher_names")} มีความประสงค์ขออนุญาตนำนักเรียนเดินทางไป <b>{text(document, "destination")}</b> เพื่อเข้าร่วม <b>{text(document, "title")}</b> ระหว่างวันที่ <b>{dateRange(document)}</b></p><p className="indent">ผู้เดินทาง/ผู้ควบคุม: {text(document, "teacher_names")} &nbsp; นักเรียนตามบัญชีรายชื่อแนบ</p><p className="indent">แหล่งงบประมาณ: {text(document, "budget")} บาท &nbsp; หน่วยงานผู้จัด: {text(document, "organizer")}</p><div className="signature-pair"><Signature label="ผู้ขออนุญาต" name={people(document, "teacher_names")[0]} /><Signature label="ผู้อนุญาต" /></div><Footer part={part} /></article>;
}
function ExpenseEstimate({ document, part }: PrintProps) {
  const budget = text(document, "budget");
  return <article className="a4-document"><Header title="ประมาณการค่าใช้จ่าย" /><h2>{text(document, "title")}</h2><p>สถานที่ {text(document, "destination")} · ผู้จัด {text(document, "organizer")}</p><table className="expense"><thead><tr><th>ลำดับ</th><th>รายการประมาณการ</th><th>จำนวนเงิน (บาท)</th></tr></thead><tbody><tr><td>1</td><td>ค่าเดินทางและพาหนะ</td><td>—</td></tr><tr><td>2</td><td>ค่าลงทะเบียน/ค่าวัสดุ</td><td>—</td></tr><tr><td>3</td><td>ค่าใช้จ่ายอื่นตามระเบียบ</td><td>—</td></tr><tr className="total"><td colSpan={2}>รวมวงเงินที่ขออนุมัติ (ไม่เกิน)</td><td>{budget}</td></tr></tbody></table><p className="note">หมายเหตุ: การเบิกจ่ายให้เป็นไปตามระเบียบของทางราชการและหลักฐานจริง</p><div className="signature-pair"><Signature label="ผู้ประมาณการ" name={people(document, "teacher_names")[0]} /><Signature label="ผู้อนุมัติ" /></div><Footer part={part} /></article>;
}
function PostEventReport({ document, part }: PrintProps) {
  return <article className="a4-document"><Header title="รายงานผลหลังเข้าร่วมกิจกรรม" /><Meta document={document} /><section><h2>1. ข้อมูลกิจกรรม</h2><p>กิจกรรม {text(document, "title")} ณ {text(document, "destination")} ระหว่างวันที่ {dateRange(document)} จัดโดย {text(document, "organizer")}</p><h2>2. ผู้เข้าร่วม</h2><p>ครูผู้ควบคุม {text(document, "teacher_names")} และนักเรียน {text(document, "student_names")}</p><h2>3. ผลการดำเนินงาน</h2><p>................................................................................................................................................</p><p>................................................................................................................................................</p><h2>4. ปัญหา อุปสรรค และข้อเสนอแนะ</h2><p>................................................................................................................................................</p></section><Signature label="ผู้รายงาน" name={people(document, "teacher_names")[0]} /><Footer part={part} /></article>;
}
function GenericDocument({ document, template, part }: PrintProps) {
  return <article className="a4-document"><Header title={template.title} /><Meta document={document} /><section className="generic-body"><p className="indent">รายละเอียดตามแบบฟอร์ม <b>{template.title}</b></p>{template.fields.filter((field) => field.key !== "title" && field.key !== "date").map((field) => <p key={field.key}><b>{field.label}</b> {text(document, field.key)}</p>)}<p className="write-space">................................................................................................................................................</p><p className="write-space">................................................................................................................................................</p></section><Signature label="ผู้จัดทำ" /><Footer part={part} /></article>;
}
function Footer({ part }: { part: TemplatePart }) { return <footer className="official-footer">เอกสารต้นแบบ TeacherOS · {part.title}</footer>; }

export function DocumentRenderer(props: PrintProps) {
  if (props.template.id !== "offsite-competition-pack") return <GenericDocument {...props} />;
  const renderers: Record<string, (item: PrintProps) => React.JSX.Element> = {
    "approval-memo": ApprovalMemo, "school-order": SchoolOrder, "parent-permission": ParentPermission,
    "student-roster": StudentRoster, itinerary: Itinerary, "travel-authorization": TravelAuthorization,
    "expense-estimate": ExpenseEstimate, "post-event-report": PostEventReport,
  };
  const Renderer = renderers[props.part.id] ?? GenericDocument;
  return <Renderer {...props} />;
}
