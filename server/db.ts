import { and, asc, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, answers, evaluations, interviewSessions, questionsAsked, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) {
    values.role = user.role ?? "admin";
    updateSet.role = values.role;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createInterviewSession(input: typeof interviewSessions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(interviewSessions).values(input);
  return Number(result[0].insertId);
}

export async function getInterviewSession(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id)).limit(1);
  return rows[0];
}

export async function updateInterviewSession(id: number, input: Partial<typeof interviewSessions.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(interviewSessions).set(input).where(eq(interviewSessions.id, id));
}

export async function addQuestion(input: typeof questionsAsked.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(questionsAsked).values(input);
  return Number(result[0].insertId);
}

export async function getQuestion(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(questionsAsked).where(eq(questionsAsked.id, id)).limit(1);
  return rows[0];
}

export async function getSessionQuestions(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questionsAsked).where(eq(questionsAsked.sessionId, sessionId)).orderBy(asc(questionsAsked.sequence));
}

export async function markQuestionAnswered(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(questionsAsked).set({ answeredAt: new Date() }).where(eq(questionsAsked.id, id));
}

export async function addAnswer(input: typeof answers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(answers).values(input);
  return Number(result[0].insertId);
}

export async function getSessionAnswers(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(answers).where(eq(answers.sessionId, sessionId)).orderBy(asc(answers.createdAt));
}

export async function addEvaluation(input: typeof evaluations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(evaluations).values(input);
}

export async function getSessionEvaluations(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ evaluation: evaluations, answer: answers, question: questionsAsked })
    .from(evaluations)
    .innerJoin(answers, eq(evaluations.answerId, answers.id))
    .innerJoin(questionsAsked, eq(answers.questionId, questionsAsked.id))
    .where(eq(answers.sessionId, sessionId))
    .orderBy(asc(evaluations.createdAt));
}

export async function listRecentSessions(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewSessions).orderBy(desc(interviewSessions.startedAt)).limit(limit);
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { sessions: [], topicMisses: [] };
  const sessions = await db.select({ id: interviewSessions.id, role: interviewSessions.role, difficulty: interviewSessions.difficulty, interviewType: interviewSessions.interviewType, startedAt: interviewSessions.startedAt, status: interviewSessions.status }).from(interviewSessions).orderBy(desc(interviewSessions.startedAt)).limit(8);
  const topicMisses = await db.select({ category: questionsAsked.category, avgDepth: sql<number>`avg(${evaluations.depth})`, count: sql<number>`count(*)` })
    .from(evaluations)
    .innerJoin(answers, eq(evaluations.answerId, answers.id))
    .innerJoin(questionsAsked, eq(answers.questionId, questionsAsked.id))
    .groupBy(questionsAsked.category)
    .orderBy(asc(sql`avg(${evaluations.depth})`))
    .limit(5);
  return { sessions, topicMisses };
}
