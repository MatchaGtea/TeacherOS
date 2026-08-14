import { describe, expect, it } from "vitest";
import {
  buildEvidenceSummary,
  fixtureEvidenceSummary,
} from "./evidence";
import { fixtureAnalytics, fixtureExam } from "./fixtures";

describe("assessment evidence summary", () => {
  it("builds the seeded deterministic evidence", () => {
    expect(fixtureEvidenceSummary).toMatchObject({
      room: "ม.3/2",
      subject: "คณิตศาสตร์",
      grade: "ม.3",
      examTitle: "สอบท้ายหน่วย ครั้งที่ 2",
      roundCount: 2,
      currentAttemptNumber: 2,
      learnerCount: 30,
      questionCount: 12,
      verifiedQuestionCount: 12,
      mappedQuestionCount: 12,
      knowledgeNodeCount: 5,
      previousAverage: 53.3,
      currentAverage: 65.3,
      growth: 12,
      focusNodeId: "N03",
      focusTitle: "การแยกตัวประกอบกำลังสอง",
      indicator: "ค 1.1 ม.3/1",
      period: "10 มิ.ย. – 15 ก.ค. 2569",
      sourceLabel: "การประเมินครั้งที่ 1 และ 2",
    });
  });

  it("derives values from the supplied copies without mutating fixtures", () => {
    const analytics = {
      ...fixtureAnalytics,
      room: "ม.3/3",
      attempt_number: 3,
      class_average: 70.04,
      previous_average: 59.98,
      insight: { ...fixtureAnalytics.insight, focus_node_id: "N01" as const },
      flagged_students: fixtureAnalytics.flagged_students.slice(0, 1),
    };
    const exam = {
      ...fixtureExam,
      title: "สอบท้ายหน่วย ครั้งที่ 3",
      attempt_number: 3,
      questions: fixtureExam.questions.slice(0, 10).map((question, index) => ({
        ...question,
        sympy_verified: index !== 0,
      })),
    };

    const summary = buildEvidenceSummary(analytics, exam);

    expect(summary).toMatchObject({
      room: "ม.3/3",
      examTitle: "สอบท้ายหน่วย ครั้งที่ 3",
      roundCount: 3,
      currentAttemptNumber: 3,
      questionCount: 10,
      verifiedQuestionCount: 9,
      previousAverage: 59.98,
      currentAverage: 70.04,
      growth: 10.1,
      flaggedCount: 1,
      focusNodeId: "N01",
      focusTitle: "จำนวนติดลบและเครื่องหมาย",
    });
    expect(fixtureEvidenceSummary.questionCount).toBe(12);
    expect(fixtureAnalytics.room).toBe("ม.3/2");
    expect(fixtureExam.questions[0].sympy_verified).toBe(true);
  });
});
