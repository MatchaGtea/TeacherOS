import type {
  Analytics,
  Choice,
  Exam,
  Mastery,
  NodeId,
  QuizResult,
  Report,
  Student,
} from "./types";

export const nodes = [
  { id: "N01", title: "จำนวนติดลบและเครื่องหมาย", short_title: "จำนวนติดลบ" },
  { id: "N02", title: "การแจกแจงและพหุนาม", short_title: "พหุนาม" },
  { id: "N03", title: "การแยกตัวประกอบกำลังสอง", short_title: "แยกตัวประกอบ" },
  { id: "N04", title: "สมบัติผลคูณเป็นศูนย์", short_title: "ผลคูณเป็นศูนย์" },
  {
    id: "N05",
    title: "การแก้สมการกำลังสองตัวแปรเดียว",
    short_title: "แก้สมการกำลังสอง",
  },
] as const;

const specs: Array<
  [string, string, string[], NodeId, "easy" | "medium" | "hard"]
> = [
  ["Q01", "x² − 5x + 6", ["2", "3"], "N01", "easy"],
  ["Q02", "x² − x − 6", ["-2", "3"], "N02", "easy"],
  ["Q03", "x² + x − 12", ["-4", "3"], "N03", "medium"],
  ["Q04", "x² − 9", ["-3", "3"], "N04", "easy"],
  ["Q05", "x² − 7x + 12", ["3", "4"], "N05", "medium"],
  ["Q06", "x² + 5x + 6", ["-3", "-2"], "N01", "easy"],
  ["Q07", "x² − 4x − 12", ["-2", "6"], "N02", "medium"],
  ["Q08", "x² − 2x − 15", ["-3", "5"], "N03", "medium"],
  ["Q09", "x² − 16", ["-4", "4"], "N04", "easy"],
  ["Q10", "x² + 2x − 8", ["-4", "2"], "N05", "medium"],
  ["Q11", "x² − 10x + 25", ["5"], "N05", "hard"],
  ["Q12", "2x² − 8x", ["0", "4"], "N05", "medium"],
];

const formatRoots = (values: string[]) => `x = ${values.join(" หรือ x = ")}`;
const buildChoices = (roots: string[]): Choice[] => {
  const negative = roots.map((value) => String(-Number(value)));
  const shifted = roots.map((value) => String(Number(value) + 1));
  const symmetric =
    [...negative].sort().join("|") === [...roots].sort().join("|");
  const wrongSign = symmetric ? ["1"] : negative;
  const zero = roots.length === 1 && roots[0] === "0" ? ["ไม่มีคำตอบ"] : ["0"];
  return [
    {
      id: "A",
      text: formatRoots(roots),
      value: roots,
      root_cause_node: null,
      explanation: "คำตอบจากการแยกตัวประกอบ",
    },
    {
      id: "B",
      text: formatRoots(wrongSign),
      value: wrongSign,
      root_cause_node: "N01",
      explanation: "สลับเครื่องหมายของราก",
    },
    {
      id: "C",
      text: formatRoots(shifted),
      value: shifted,
      root_cause_node: "N03",
      explanation: "จับคู่ตัวประกอบไม่ถูกต้อง",
    },
    {
      id: "D",
      text: zero[0] === "ไม่มีคำตอบ" ? "ไม่มีคำตอบ" : formatRoots(zero),
      value: zero,
      root_cause_node: "N04",
      explanation: "ใช้สมบัติผลคูณเป็นศูนย์ไม่ครบถ้วน",
    },
  ];
};

export const fixtureExam: Exam = {
  id: "EXAM-DEMO-02",
  title: "สอบท้ายหน่วย ครั้งที่ 2",
  subject: "คณิตศาสตร์",
  grade: "ม.3",
  topic: "สมการกำลังสองตัวแปรเดียว",
  attempt_number: 2,
  duration_minutes: 40,
  total_points: 12,
  pipeline: {
    source: "fixture",
    llm_status: "not_requested",
    sympy_verified_count: 12,
    graph_mapped_count: 12,
  },
  questions: specs.map(([id, equation, roots, node, difficulty]) => ({
    id,
    stem: `จงแก้สมการ ${equation} = 0`,
    equation,
    choices: buildChoices(roots),
    correct_choice_id: "A",
    knowledge_node_id: node,
    difficulty,
    sympy_verified: true,
    solution_explanation: "จัดรูป แยกตัวประกอบ และใช้สมบัติผลคูณเป็นศูนย์",
  })),
};

const thaiNames = [
  "นายสมชาย ใจดี",
  "นางสาวสมหญิง",
  "นายเด็กดี",
  "นายกิตติพงศ์ วัฒนชัย",
  "นางสาวพิมพ์ชนก แสงทอง",
  "นายธนกฤต ศรีสุข",
  "นางสาวชลธิชา บุญส่ง",
  "นายปัณณวิชญ์ คงมั่น",
  "นางสาวณัฐณิชา สุวรรณ",
  "นายภูริณัฐ เกียรติก้อง",
  "นางสาวกัญญาวีร์ พูลผล",
  "นายศุภกร เมธาวี",
  "นางสาวอริสา ตั้งใจ",
  "นายวรเมธ เจริญพร",
  "นางสาวเบญญาภา ทวีทรัพย์",
  "นายชยพล รุ่งเรือง",
  "นางสาวศิริลักษณ์ พรหมดี",
  "นายธนวัฒน์ ชาญกิจ",
  "นางสาวญาณิศา วงศ์งาม",
  "นายสิรวิชญ์ มั่นคง",
  "นางสาวปวีณ์ธิดา เลิศล้ำ",
  "นายณภัทร พิพัฒน์",
  "นางสาวชนาภา รักษ์ดี",
  "นายพีรพัฒน์ นาคทอง",
  "นางสาวภัทรวดี แก้วใส",
  "นายจักรินทร์ อินทร์แก้ว",
  "นางสาวรมิตา ชูศรี",
  "นายอนันตชัย พรประเสริฐ",
  "นางสาวสุพิชญา จันทร์เพ็ญ",
  "นายรัชชานนท์ ธรรมรักษ์",
];

export const students: Student[] = thaiNames.map((name, index) => ({
  id: `STU${String(index + 1).padStart(3, "0")}`,
  student_number: index + 1,
  student_code: `2567${String(index + 1).padStart(3, "0")}`,
  name,
  room: "ม.3/2",
}));

const secondScores = [
  8, 7, 12, 5, 7, 8, 9, 7, 4, 6, 10, 11, 8, 10, 2, 3, 6, 9, 5, 8, 8, 10, 11, 12,
  7, 5, 6, 9, 10, 12,
];
const firstScores = [
  5, 6, 12, 3, 4, 6, 7, 9, 2, 5, 7, 8, 4, 12, 1, 4, 5, 6, 3, 7, 10, 6, 8, 9, 4,
  7, 8, 5, 9, 10,
];

export const masteryForScore = (
  score: number,
  rootCause: NodeId = "N01",
): Mastery[] => {
  const correctQuestions = new Set(
    fixtureExam.questions.slice(0, score).map((question) => question.id),
  );
  return nodes.map((node) => {
    const relevant = fixtureExam.questions.filter(
      (question) => question.knowledge_node_id === node.id,
    );
    const correct = relevant.filter((question) =>
      correctQuestions.has(question.id),
    ).length;
    const percentage = Math.round((correct / relevant.length) * 1000) / 10;
    return {
      node_id: node.id,
      correct,
      evidence_count: relevant.length,
      percentage,
      status:
        percentage >= 80
          ? "mastered"
          : percentage >= 50
            ? "developing"
            : "critical",
      root_cause_hits:
        score < 12 && node.id === rootCause
          ? fixtureExam.questions.length - score
          : 0,
    };
  });
};

const rows = students.map((student, index) => {
  const root: NodeId = student.id === "STU002" ? "N03" : "N01";
  return {
    student,
    score: secondScores[index],
    total: 12,
    growth: secondScores[index] - firstScores[index],
    mastery: masteryForScore(secondScores[index], root),
  };
});

const nodeSummary = nodes.map((node) => {
  const values = rows.map(
    (row) => row.mastery.find((item) => item.node_id === node.id)!,
  );
  const count = (status: Mastery["status"]) =>
    values.filter((item) => item.status === status).length;
  return {
    node,
    average_percentage:
      Math.round(
        (values.reduce((sum, item) => sum + item.percentage, 0) /
          values.length) *
          10,
      ) / 10,
    status_distribution: {
      mastered: count("mastered"),
      developing: count("developing"),
      critical: count("critical"),
    },
  };
});

const flagged = rows
  .filter(
    (row) =>
      row.score < 6 ||
      row.mastery.filter((item) => item.status === "critical").length >= 2 ||
      row.growth < 0,
  )
  .map((row) => ({
    student_id: row.student.id,
    name: row.student.name,
    score: row.score,
    growth: row.growth,
    reason:
      row.score < 6
        ? "คะแนนต่ำกว่า 50%"
        : row.mastery.filter((item) => item.status === "critical").length >= 2
          ? "มีอย่างน้อย 2 ทักษะวิกฤต"
          : "ผลคะแนนลดลง",
  }));

export const fixtureAnalytics: Analytics = {
  class_id: "demo",
  room: "ม.3/2",
  exam_title: fixtureExam.title,
  attempt_number: 2,
  students: rows,
  node_summary: nodeSummary,
  class_average:
    Math.round((secondScores.reduce((a, b) => a + b, 0) / 30 / 12) * 1000) / 10,
  previous_average:
    Math.round((firstScores.reduce((a, b) => a + b, 0) / 30 / 12) * 1000) / 10,
  insight: {
    focus_node_id: "N03",
    headline: "ควรเร่งเสริม การแยกตัวประกอบ",
    recommendation: "จัดกิจกรรมทบทวน การแยกตัวประกอบกำลังสอง",
  },
  flagged_students: flagged,
};

export const fixtureReport = (id: string): Report => {
  const index = Math.max(
    0,
    students.findIndex((student) => student.id === id),
  );
  const student = students[index];
  const score = secondScores[index];
  const growth = score - firstScores[index];
  const perfect = score === 12;
  const root: NodeId | null = perfect ? null : id === "STU002" ? "N03" : "N01";
  const diagnosis = perfect
    ? "ทำได้ครบทุกทักษะ พร้อมสำหรับโจทย์ท้าทาย"
    : root === "N03"
      ? "ควรทบทวนเรื่องการแยกตัวประกอบกำลังสอง และพื้นฐานพหุนาม"
      : "ควรทบทวนเรื่องจำนวนติดลบและเครื่องหมาย";
  return {
    student,
    attempts: [
      {
        student_id: id,
        attempt_number: 1,
        exam_id: "EXAM-DEMO-01",
        date: "2026-06-10",
        answers: {},
        score: firstScores[index],
        total: 12,
      },
      {
        student_id: id,
        attempt_number: 2,
        exam_id: "EXAM-DEMO-02",
        date: "2026-07-15",
        answers: {},
        score,
        total: 12,
      },
    ],
    latest_score: score,
    latest_percentage: Math.round((score / 12) * 1000) / 10,
    growth,
    mastery: perfect
      ? nodes.map((node) => ({
          node_id: node.id,
          correct: fixtureExam.questions.filter(
            (q) => q.knowledge_node_id === node.id,
          ).length,
          evidence_count: fixtureExam.questions.filter(
            (q) => q.knowledge_node_id === node.id,
          ).length,
          percentage: 100,
          status: "mastered",
          root_cause_hits: 0,
        }))
      : masteryForScore(score, root ?? "N05"),
    primary_root_cause: root,
    diagnosis,
    recommendations: perfect
      ? ["ฝึกโจทย์ประยุกต์หลายขั้นตอน", "อธิบายวิธีคิดให้เพื่อนในกลุ่ม"]
      : root === "N03"
        ? ["ทบทวน การแจกแจงและพหุนาม", "ทบทวน การแยกตัวประกอบกำลังสอง"]
        : ["ทบทวน จำนวนติดลบและเครื่องหมาย"],
    learning_level: perfect
      ? "ก้าวหน้า"
      : score / 12 >= 0.8
        ? "เชี่ยวชาญ"
        : score / 12 >= 0.5
          ? "กำลังพัฒนา"
          : "ต้องเสริมเร่งด่วน",
  };
};

export const scoreFixtureQuiz = (
  studentName: string,
  exam: Exam,
  answers: Record<string, string>,
): QuizResult => {
  const score = exam.questions.filter(
    (question) => answers[question.id] === question.correct_choice_id,
  ).length;
  const mastery = nodes.map((node) => {
    const questions = exam.questions.filter(
      (question) => question.knowledge_node_id === node.id,
    );
    const correct = questions.filter(
      (question) => answers[question.id] === question.correct_choice_id,
    ).length;
    const percentage = questions.length
      ? Math.round((correct / questions.length) * 1000) / 10
      : 0;
    return {
      node_id: node.id,
      correct,
      evidence_count: questions.length,
      percentage,
      status:
        percentage >= 80
          ? "mastered"
          : percentage >= 50
            ? "developing"
            : "critical",
      root_cause_hits: questions.filter(
        (question) =>
          question.choices.find((choice) => choice.id === answers[question.id])
            ?.root_cause_node === node.id,
      ).length,
    } as Mastery;
  });
  const focus = [...mastery].sort(
    (a, b) =>
      b.root_cause_hits - a.root_cause_hits || a.percentage - b.percentage,
  )[0];
  return {
    student_name: studentName,
    exam_id: exam.id,
    score,
    total: exam.questions.length,
    percentage: Math.round((score / exam.questions.length) * 1000) / 10,
    mastery,
    diagnosis: `ควรทบทวน ${nodes.find((node) => node.id === focus.node_id)?.title}`,
  };
};
