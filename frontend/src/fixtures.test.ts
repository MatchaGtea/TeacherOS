import { describe, expect, it } from "vitest";
import {
  fixtureAnalytics,
  fixtureExam,
  fixtureReport,
  students,
} from "./fixtures";

describe("deterministic fallback contracts", () => {
  it("matches the verified exam contract", () => {
    expect(fixtureExam.id).toBe("EXAM-DEMO-02");
    expect(fixtureExam.questions).toHaveLength(12);
    expect(
      fixtureExam.questions.every(
        (question) =>
          question.choices.length === 4 &&
          question.choices.every((choice) => choice.value.length > 0) &&
          question.sympy_verified,
      ),
    ).toBe(true);
    expect(
      new Set(fixtureExam.questions.map((question) => question.stem)).size,
    ).toBe(12);
  });
  it("contains 30 unique learners with valid scores", () => {
    expect(students).toHaveLength(30);
    expect(new Set(students.map((student) => student.name)).size).toBe(30);
    expect(
      fixtureAnalytics.students.every(
        (row) => row.score >= 0 && row.score <= row.total,
      ),
    ).toBe(true);
    expect(
      fixtureAnalytics.flagged_students.every((row) => row.score <= 12),
    ).toBe(true);
  });
  it("keeps named report invariants and nullable perfect root cause", () => {
    expect(fixtureReport("STU001").growth).toBe(3);
    expect(fixtureReport("STU001").primary_root_cause).toBe("N01");
    expect(fixtureReport("STU002").primary_root_cause).toBe("N03");
    expect(fixtureReport("STU003").latest_score).toBe(12);
    expect(fixtureReport("STU003").primary_root_cause).toBeNull();
  });
});
