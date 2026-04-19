import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, tinyint } from "drizzle-orm/mysql-core";

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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Game rooms
export const gameRooms = mysqlTable("game_rooms", {
  id: int("id").autoincrement().primaryKey(),
  roomCode: varchar("roomCode", { length: 8 }).notNull().unique(),
  status: mysqlEnum("status", ["lobby", "question", "pointing", "voting", "results"]).default("lobby").notNull(),
  currentRound: tinyint("currentRound").default(0).notNull(), // 0 = not started, 1-3 = rounds
  aiPlayerId: varchar("aiPlayerId", { length: 16 }).notNull(), // internal AI player identifier
  aiAvatarKey: varchar("aiAvatarKey", { length: 32 }).notNull(),
  aiName: varchar("aiName", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameRoom = typeof gameRooms.$inferSelect;

// Players in a room (human players only)
export const gamePlayers = mysqlTable("game_players", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // anonymous session token
  playerName: varchar("playerName", { length: 64 }).notNull(),
  avatarKey: varchar("avatarKey", { length: 32 }).notNull(),
  isReady: boolean("isReady").default(false).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type GamePlayer = typeof gamePlayers.$inferSelect;

// Questions bank and per-round question selection
export const gameRounds = mysqlTable("game_rounds", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  roundNumber: tinyint("roundNumber").notNull(), // 1, 2, or 3
  question: text("question").notNull(),
  status: mysqlEnum("status", ["answering", "pointing", "done"]).default("answering").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameRound = typeof gameRounds.$inferSelect;

// Answers submitted by players (and AI)
export const gameAnswers = mysqlTable("game_answers", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("roundId").notNull(),
  roomId: int("roomId").notNull(),
  authorId: varchar("authorId", { length: 64 }).notNull(), // sessionId for humans, aiPlayerId for AI
  isAi: boolean("isAi").default(false).notNull(),
  answerText: text("answerText").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type GameAnswer = typeof gameAnswers.$inferSelect;

// Pointings (suspicion during rounds)
export const gamePointings = mysqlTable("game_pointings", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("roundId").notNull(),
  roomId: int("roomId").notNull(),
  pointerId: varchar("pointerId", { length: 64 }).notNull(), // who is pointing
  suspectId: varchar("suspectId", { length: 64 }).notNull(), // who they suspect
  explanation: text("explanation"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type GamePointing = typeof gamePointings.$inferSelect;

// Final votes
export const gameVotes = mysqlTable("game_votes", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  voterId: varchar("voterId", { length: 64 }).notNull(),
  suspectId: varchar("suspectId", { length: 64 }).notNull(),
  explanation: text("explanation"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type GameVote = typeof gameVotes.$inferSelect;
