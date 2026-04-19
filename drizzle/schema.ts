import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(), 
  createdAt: integer("createdAt", { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp' }).defaultNow().notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: 'timestamp' }).defaultNow().notNull(),
});

export const gameRooms = sqliteTable("game_rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomCode: text("roomCode").notNull().unique(),
  status: text("status").default("lobby").notNull(),
  currentRound: integer("currentRound").default(0).notNull(),
  // THESE THREE ARE THE ONES CAUSING THE ERROR IF MISSING:
  aiPlayerId: text("aiPlayerId").notNull(),
  aiAvatarKey: text("aiAvatarKey").notNull(),
  aiName: text("aiName").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp' }).defaultNow().notNull(),
});

export const gamePlayers = sqliteTable("game_players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: integer("roomId").notNull(),
  sessionId: text("sessionId").notNull(),
  playerName: text("playerName").notNull(),
  avatarKey: text("avatarKey").notNull(),
  isReady: integer("isReady", { mode: 'boolean' }).default(false).notNull(),
  joinedAt: integer("joinedAt", { mode: 'timestamp' }).defaultNow().notNull(),
});

export const gameRounds = sqliteTable("game_rounds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: integer("roomId").notNull(),
  roundNumber: integer("roundNumber").notNull(),
  question: text("question").notNull(),
  status: text("status").default("answering").notNull(),
  aiCommentary: text("aiCommentary"),
  createdAt: integer("createdAt", { mode: 'timestamp' }).defaultNow().notNull(),
});

export const gameAnswers = sqliteTable("game_answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roundId: integer("roundId").notNull(),
  roomId: integer("roomId").notNull(),
  authorId: text("authorId").notNull(),
  isAi: integer("isAi", { mode: 'boolean' }).default(false).notNull(),
  answerText: text("answerText").notNull(),
  submittedAt: integer("submittedAt", { mode: 'timestamp' }).defaultNow().notNull(),
});

export const gamePointings = sqliteTable("game_pointings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roundId: integer("roundId").notNull(),
  roomId: integer("roomId").notNull(),
  pointerId: text("pointerId").notNull(),
  suspectId: text("suspectId").notNull(),
  explanation: text("explanation"),
  submittedAt: integer("submittedAt", { mode: 'timestamp' }).defaultNow().notNull(),
});

export const gameVotes = sqliteTable("game_votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: integer("roomId").notNull(),
  voterId: text("voterId").notNull(),
  suspectId: text("suspectId").notNull(),
  explanation: text("explanation"),
  submittedAt: integer("submittedAt", { mode: 'timestamp' }).defaultNow().notNull(),
});