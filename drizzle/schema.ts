import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const interviewSessions = mysqlTable("interview_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  role: varchar("role", { length: 120 }).notNull(),
  difficulty: varchar("difficulty", { length: 40 }).notNull(),
  interviewType: varchar("interviewType", { length: 60 }).notNull(),
  questionCount: int("questionCount").notNull(),
  status: mysqlEnum("status", ["in_progress", "completed"]).default("in_progress").notNull(),
  currentQuestionIndex: int("currentQuestionIndex").default(0).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const questionsAsked = mysqlTable("questions_asked", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  sequence: int("sequence").notNull(),
  questionText: text("questionText").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  isFollowup: boolean("isFollowup").default(false).notNull(),
  answeredAt: timestamp("answeredAt"),
});

export const answers = mysqlTable("answers", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  questionId: int("questionId").notNull(),
  answerText: text("answerText").notNull(),
  timeSpentSeconds: int("timeSpentSeconds").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  answerId: int("answerId").notNull(),
  correctness: int("correctness").notNull(),
  clarity: int("clarity").notNull(),
  depth: int("depth").notNull(),
  communication: int("communication").notNull(),
  rationale: text("rationale").notNull(),
  isShallow: boolean("isShallow").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type QuestionAsked = typeof questionsAsked.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
