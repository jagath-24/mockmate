import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { addAnswer, addEvaluation, addQuestion, createInterviewSession, getDashboardStats, getInterviewSession, getQuestion, getSessionAnswers, getSessionEvaluations, getSessionQuestions, listRecentSessions, markQuestionAnswered, updateInterviewSession } from "./db";
import { buildInterviewContext, evaluateAnswer, modelAnswer, selectQuestion, type InterviewSetup } from "./interview";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

const setupSchema = z.object({
  role: z.string().min(1),
  difficulty: z.string().min(1),
  interviewType: z.string().min(1),
  questionCount: z.number().int().min(5).max(10),
});

async function requireSession(id: number) {
  const session = await getInterviewSession(id);
  if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Interview session not found" });
  return session;
}

export const appRouter = router({
  system: router({ health: publicProcedure.query(() => ({ ok: true })) }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  interviews: router({
    recent: publicProcedure.query(() => listRecentSessions(8)),
    dashboard: publicProcedure.query(() => getDashboardStats()),
    create: publicProcedure.input(setupSchema).mutation(async ({ input, ctx }) => {
      const setup: InterviewSetup = input;
      const sessionId = await createInterviewSession({
        userId: ctx.user?.id ?? null,
        role: input.role,
        difficulty: input.difficulty,
        interviewType: input.interviewType,
        questionCount: input.questionCount,
        status: "in_progress",
        currentQuestionIndex: 0,
      });
      const first = selectQuestion(setup);
      const questionId = await addQuestion({ sessionId, sequence: 0, questionText: first.text, category: first.category, isFollowup: false });
      return { sessionId, questionId, question: first.text, category: first.category, sequence: 0, total: input.questionCount };
    }),
    answer: publicProcedure.input(z.object({ sessionId: z.number().int(), questionId: z.number().int(), answerText: z.string().min(1), timeSpentSeconds: z.number().int().min(0).max(3600) })).mutation(async ({ input }) => {
      const session = await requireSession(input.sessionId);
      const question = await getQuestion(input.questionId);
      if (!question || question.sessionId !== session.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Question does not belong to this session" });
      const previousAnswers = await getSessionAnswers(session.id);
      const questions = await getSessionQuestions(session.id);
      const context = buildInterviewContext(questions.map(item => ({ question: item.questionText, answer: previousAnswers.find(answer => answer.questionId === item.id)?.answerText })));
      const evaluation = await evaluateAnswer({ setup: { role: session.role, difficulty: session.difficulty, interviewType: session.interviewType, questionCount: session.questionCount }, question: question.questionText, answer: input.answerText, context });
      const answerId = await addAnswer({ sessionId: session.id, questionId: question.id, answerText: input.answerText, timeSpentSeconds: input.timeSpentSeconds });
      await addEvaluation({ answerId, correctness: evaluation.correctness, clarity: evaluation.clarity, depth: evaluation.depth, communication: evaluation.communication, rationale: evaluation.rationale, isShallow: evaluation.isShallow });
      await markQuestionAnswered(question.id);
      const nextSequence = session.currentQuestionIndex + 1;
      const isLast = nextSequence >= session.questionCount;
      if (isLast) {
        await updateInterviewSession(session.id, { status: "completed", currentQuestionIndex: nextSequence, completedAt: new Date() });
        return { done: true, evaluation: { ...evaluation, followup: "" }, nextQuestion: null };
      }
      const usedCategories = questions.map(item => item.category);
      const next = evaluation.isShallow && evaluation.followup ? { text: evaluation.followup, category: question.category, isFollowup: true } : { ...selectQuestion({ role: session.role, difficulty: session.difficulty, interviewType: session.interviewType, questionCount: session.questionCount }, usedCategories), isFollowup: false };
      const nextQuestionId = await addQuestion({ sessionId: session.id, sequence: nextSequence, questionText: next.text, category: next.category, isFollowup: next.isFollowup });
      await updateInterviewSession(session.id, { currentQuestionIndex: nextSequence });
      return { done: false, evaluation: { ...evaluation, followup: "" }, nextQuestion: { questionId: nextQuestionId, question: next.text, category: next.category, sequence: nextSequence, total: session.questionCount, isFollowup: next.isFollowup } };
    }),
    report: publicProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
      const session = await requireSession(input.id);
      const rows = await getSessionEvaluations(session.id);
      const scores = rows.map(row => row.evaluation);
      const average = (key: "correctness" | "clarity" | "depth" | "communication") => scores.length ? Math.round((scores.reduce((sum, item) => sum + item[key], 0) / scores.length) * 10) / 10 : 0;
      const skillScores = [
        { skill: "Correctness", score: average("correctness") },
        { skill: "Clarity", score: average("clarity") },
        { skill: "Depth", score: average("depth") },
        { skill: "Communication", score: average("communication") },
      ];
      const poor = rows.filter(row => (row.evaluation.correctness + row.evaluation.clarity + row.evaluation.depth + row.evaluation.communication) / 4 < 6).map(row => ({ question: row.question.questionText, category: row.question.category, answer: row.answer.answerText, modelAnswer: modelAnswer(row.question.questionText, row.question.category) }));
      const strengths = skillScores.filter(item => item.score >= 7).sort((a, b) => b.score - a.score).slice(0, 2).map(item => `${item.skill} — ${item.score}/10`);
      const weakAreas = skillScores.filter(item => item.score < 7).sort((a, b) => a.score - b.score).slice(0, 2).map(item => `${item.skill} — ${item.score}/10`);
      const plan = [
        { day: "Day 1", title: "Build your answer spine", detail: "Practice a 60-second introduction and one STAR story out loud." },
        { day: "Day 2", title: "Refresh the fundamentals", detail: `Revise ${session.role === "Data Analyst" ? "SQL joins, aggregations, and case framing" : "OOPs, DBMS joins, and REST fundamentals"}.` },
        { day: "Day 3", title: "Add evidence", detail: "Answer three questions using a project example, trade-off, and measurable result." },
        { day: "Day 4", title: "Tighten communication", detail: "Use signposting: first, because, for example, and therefore." },
        { day: "Day 5", title: "Run a pressure drill", detail: "Set a 90-second timer and practice recovering when you lose your train of thought." },
        { day: "Day 6", title: "Review weak areas", detail: weakAreas.length ? `Revisit ${weakAreas.join(" and ")}.` : "Review your lowest-scoring answer and improve its depth." },
        { day: "Day 7", title: "Take MockMate again", detail: "Repeat this interview and aim to lift your average by at least one point." },
      ];
      return { session, overall: skillScores.length ? Math.round((skillScores.reduce((sum, item) => sum + item.score, 0) / skillScores.length) * 10) / 10 : 0, skillScores, strengths, weakAreas, poor, plan, answered: scores.length };
    }),
  }),
});

export type AppRouter = typeof appRouter;
