import { describe, expect, it } from "vitest";
import { buildInterviewContext, modelAnswer, selectQuestion } from "./interview";

describe("MockMate interview engine", () => {
  it("selects questions tuned to the configured role and type", () => {
    const question = selectQuestion({ role: "Java Backend", difficulty: "Fresher", interviewType: "Technical", questionCount: 5 });
    expect(question.roles).toContain("Java Backend");
    expect(question.types).toContain("Technical");
    expect(question.text.length).toBeGreaterThan(20);
  });

  it("avoids repeating a category while fresh questions remain", () => {
    const first = selectQuestion({ role: "Full Stack", difficulty: "Fresher", interviewType: "Mixed", questionCount: 5 });
    const second = selectQuestion({ role: "Full Stack", difficulty: "Fresher", interviewType: "Mixed", questionCount: 5 }, [first.category]);
    expect(second.category).not.toBe(first.category);
  });

  it("keeps only the latest six turns in the LLM context window", () => {
    const turns = Array.from({ length: 8 }, (_, index) => ({ question: `Question ${index}`, answer: `Answer ${index}` }));
    const context = buildInterviewContext(turns);
    expect(context).not.toContain("Question 0");
    expect(context).not.toContain("Question 1");
    expect(context).toContain("Question 2");
    expect(context).toContain("Answer 7");
  });

  it("provides a category-aware model answer shape", () => {
    expect(modelAnswer("Explain joins", "SQL & DBMS")).toContain("EXPLAIN");
    expect(modelAnswer("Tell me about yourself", "HR & communication")).toContain("STAR");
  });
});
