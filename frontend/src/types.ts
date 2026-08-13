export type NodeId = "N01" | "N02" | "N03" | "N04" | "N05";
export type KnowledgeNode = {
  id: NodeId;
  title: string;
  short_title: string;
  description?: string;
  prerequisites?: NodeId[];
  indicator?: string;
};
export type Choice = {
  id: string;
  text: string;
  value: string[];
  root_cause_node: NodeId | null;
  explanation: string;
};
export type Question = {
  id: string;
  stem: string;
  equation: string;
  choices: Choice[];
  correct_choice_id: string;
  knowledge_node_id: NodeId;
  difficulty: "easy" | "medium" | "hard";
  sympy_verified: boolean;
  solution_explanation: string;
};
export type Exam = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  attempt_number: number;
  duration_minutes: number;
  total_points: number;
  questions: Question[];
  pipeline: {
    source: string;
    llm_status: string;
    sympy_verified_count: number;
    graph_mapped_count: number;
    warning?: string;
  };
};
export type Student = {
  id: string;
  student_number: number;
  student_code: string;
  name: string;
  room: string;
};
export type Mastery = {
  node_id: NodeId;
  correct: number;
  evidence_count: number;
  percentage: number;
  status: "mastered" | "developing" | "critical";
  root_cause_hits: number;
};
export type Attempt = {
  student_id: string;
  attempt_number: 1 | 2;
  exam_id: string;
  date: string;
  answers: Record<string, string>;
  score: number;
  total: number;
};
export type Analytics = {
  class_id: string;
  room: string;
  exam_title: string;
  attempt_number: number;
  students: {
    student: Student;
    score: number;
    total: number;
    growth: number;
    mastery: Mastery[];
  }[];
  node_summary: {
    node: KnowledgeNode;
    average_percentage: number;
    status_distribution: {
      mastered: number;
      developing: number;
      critical: number;
    };
  }[];
  class_average: number;
  previous_average: number;
  insight: { focus_node_id: NodeId; headline: string; recommendation: string };
  flagged_students: {
    student_id: string;
    name: string;
    score: number;
    growth: number;
    reason: string;
  }[];
};
export type Report = {
  student: Student;
  attempts: Attempt[];
  latest_score: number;
  latest_percentage: number;
  growth: number;
  mastery: Mastery[];
  primary_root_cause: NodeId | null;
  diagnosis: string;
  recommendations: string[];
  learning_level: string;
};
export type QuizResult = {
  student_name: string;
  exam_id: string;
  score: number;
  total: number;
  percentage: number;
  mastery: Mastery[];
  diagnosis: string;
};
export type ApiResult<T> = {
  data: T;
  source: "live" | "fallback";
  message?: string;
};
