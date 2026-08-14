import { fixtureAnalytics, fixtureExam, nodes } from "./fixtures";
import type { Analytics, Exam, NodeId } from "./types";

export type EvidenceSummary = {
  room: string;
  subject: string;
  grade: string;
  examTitle: string;
  roundCount: number;
  currentAttemptNumber: number;
  learnerCount: number;
  questionCount: number;
  verifiedQuestionCount: number;
  mappedQuestionCount: number;
  knowledgeNodeCount: number;
  previousAverage: number;
  currentAverage: number;
  growth: number;
  flaggedCount: number;
  focusNodeId: NodeId;
  focusTitle: string;
  indicator: string;
  period: string;
  sourceLabel: string;
};

export const DEMO_INDICATOR = "ค 1.1 ม.3/1";
export const DEMO_PERIOD = "10 มิ.ย. – 15 ก.ค. 2569";
export const DEMO_SOURCE_LABEL = "การประเมินครั้งที่ 1 และ 2";

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

export const buildEvidenceSummary = (
  analytics: Analytics,
  exam: Exam,
): EvidenceSummary => {
  const mappedNodeIds = new Set(nodes.map((node) => node.id));
  const focusNode = nodes.find(
    (node) => node.id === analytics.insight.focus_node_id,
  );

  return {
    room: analytics.room,
    subject: exam.subject,
    grade: exam.grade,
    examTitle: exam.title,
    roundCount: analytics.attempt_number,
    currentAttemptNumber: exam.attempt_number,
    learnerCount: analytics.students.length,
    questionCount: exam.questions.length,
    verifiedQuestionCount: exam.questions.filter(
      (question) => question.sympy_verified,
    ).length,
    mappedQuestionCount: exam.questions.filter((question) =>
      mappedNodeIds.has(question.knowledge_node_id),
    ).length,
    knowledgeNodeCount: nodes.length,
    previousAverage: analytics.previous_average,
    currentAverage: analytics.class_average,
    growth: roundToOneDecimal(
      analytics.class_average - analytics.previous_average,
    ),
    flaggedCount: analytics.flagged_students.length,
    focusNodeId: analytics.insight.focus_node_id,
    focusTitle: focusNode?.title ?? analytics.insight.headline,
    indicator: DEMO_INDICATOR,
    period: DEMO_PERIOD,
    sourceLabel: DEMO_SOURCE_LABEL,
  };
};

export const fixtureEvidenceSummary = buildEvidenceSummary(
  fixtureAnalytics,
  fixtureExam,
);
