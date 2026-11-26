import { invokeLLM } from "./_core/llm";
import { QUESTION_BANK, type CatalogQuestion } from "@shared/questions";
export { QUESTION_BANK, type CatalogQuestion };

export type InterviewSetup = {
  role: string;
  difficulty: string;
  interviewType: string;
  questionCount: number;
};

export function selectQuestion(setup: InterviewSetup, usedCategories: string[] = []) {
  const eligible = QUESTION_BANK.filter(question =>
    question.roles.includes(setup.role) && question.types.includes(setup.interviewType),
  );
  const pool = eligible.length ? eligible : QUESTION_BANK.filter(question => question.roles.includes(setup.role));
  const fresh = pool.find(question => !usedCategories.includes(question.category));
  return fresh ?? pool[usedCategories.length % Math.max(pool.length, 1)] ?? QUESTION_BANK[0];
}

export function buildInterviewContext(turns: Array<{ question: string; answer?: string }>) {
  return turns.slice(-6).map(turn => `Interviewer: ${turn.question}\nCandidate: ${turn.answer ?? "(not answered yet)"}`).join("\n\n");
}

export async function evaluateAnswer(input: {
  setup: InterviewSetup;
  question: string;
  answer: string;
  context: string;
}) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a demanding but supportive Indian campus placement interviewer. Evaluate the candidate silently. Score each dimension 1-10. A shallow answer is one that is generic, under-explained, or misses the core of the question. Return only valid JSON matching the schema.",
        },
        {
          role: "user",
          content: `Role: ${input.setup.role}\nDifficulty: ${input.setup.difficulty}\nInterview type: ${input.setup.interviewType}\nRecent turns:\n${input.context}\n\nCurrent question: ${input.question}\nCandidate answer: ${input.answer}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "mockmate_evaluation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              correctness: { type: "integer", minimum: 1, maximum: 10 },
              clarity: { type: "integer", minimum: 1, maximum: 10 },
              depth: { type: "integer", minimum: 1, maximum: 10 },
              communication: { type: "integer", minimum: 1, maximum: 10 },
              rationale: { type: "string" },
              isShallow: { type: "boolean" },
              followup: { type: "string" },
            },
            required: ["correctness", "clarity", "depth", "communication", "rationale", "isShallow", "followup"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = response.choices?.[0]?.message?.content;
    const text = Array.isArray(raw) ? raw.map(part => part.type === "text" ? part.text : "").join("") : raw;
    if (text) return JSON.parse(text) as {
      correctness: number; clarity: number; depth: number; communication: number; rationale: string; isShallow: boolean; followup: string;
    };
  } catch (error) {
    console.warn("[MockMate] LLM evaluation unavailable; using deterministic fallback", error);
  }

  const words = input.answer.trim().split(/\s+/).filter(Boolean).length;
  const hasEvidence = /because|for example|project|trade-?off|first|then|finally|impact|result/i.test(input.answer);
  const baseline = Math.min(9, Math.max(3, Math.round(words / 18) + 3));
  return {
    correctness: Math.min(9, baseline + (hasEvidence ? 1 : 0)),
    clarity: Math.min(9, baseline + (words > 35 ? 1 : 0)),
    depth: Math.min(9, baseline + (hasEvidence ? 1 : 0)),
    communication: Math.min(9, baseline + (words > 25 ? 1 : 0)),
    rationale: words < 22 ? "Your answer is a useful start, but it needs a concrete example and a clearer explanation of the why behind your approach." : "You covered the main idea with reasonable structure. Add one concrete result or trade-off to make the answer more convincing.",
    isShallow: words < 22,
    followup: "Can you make that more concrete with a short example from a project or placement-style scenario?",
  };
}

export function modelAnswer(question: string, category: string) {
  const byCategory: Record<string, string> = {
    "OOPs": "Start with encapsulation, abstraction, inheritance, and polymorphism, then anchor each in a small example. For instance, a payment interface can hide implementation details, while different payment providers override the same pay() contract.",
    "SQL & DBMS": "Explain the join or query plan in plain language, mention indexes and cardinality, and describe how you would validate the fix with EXPLAIN and before/after timings.",
    "HR & communication": "Use a STAR-style present-past-future structure: what you are studying now, one project result that proves your fit, and the kind of problems you want to solve in the role.",
    "Spring Boot": "Describe the application context, component scanning and dependency injection, embedded server startup, request mapping, service/repository flow, and how the response is serialized.",
  };
  return byCategory[category] ?? `A strong answer to “${question}” should define the core idea, explain the reasoning step by step, and finish with a concise example, trade-off, or measurable result.`;
}
