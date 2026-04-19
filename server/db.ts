import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import {
  gameAnswers,
  gamePlayers,
  gamePointings,
  gameRooms,
  gameRounds,
  gameVotes,
  InsertUser,
  users,
} from "../drizzle/schema.ts"; 
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      // Using the absolute path avoids the "CANTOPEN" error
      _db = drizzle("C:/Users/samir/WIP-FullyHacks/sqlite.db"); 
      console.log("[Database] Absolute connection established.");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onConflictDoUpdate({ 
    target: users.openId, 
    set: updateSet 
  });
} // <--- The missing brace that was causing your "Unexpected export" error

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Game Rooms ───────────────────────────────────────────────────────────────

export async function createGameRoom(data: {
  roomCode: string;
  aiPlayerId: string;
  aiAvatarKey: string;
  aiName: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(gameRooms).values(data);
  const rows = await db.select().from(gameRooms).where(eq(gameRooms.roomCode, data.roomCode)).limit(1);
  return rows[0]!;
}

export async function getGameRoomByCode(roomCode: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rows = await db.select().from(gameRooms).where(eq(gameRooms.roomCode, roomCode)).limit(1);
  return rows[0] ?? null;
}

export async function getGameRoomById(roomId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rows = await db.select().from(gameRooms).where(eq(gameRooms.id, roomId)).limit(1);
  return rows[0] ?? null;
}

export async function updateGameRoomStatus(
  roomId: number,
  status: "lobby" | "question" | "pointing" | "voting" | "results",
  currentRound?: number
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const updateData: Record<string, unknown> = { status };
  if (currentRound !== undefined) updateData.currentRound = currentRound;
  await db.update(gameRooms).set(updateData).where(eq(gameRooms.id, roomId));
}

// ─── Game Players ─────────────────────────────────────────────────────────────

export async function addPlayerToRoom(data: {
  roomId: number;
  sessionId: string;
  playerName: string;
  avatarKey: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(gamePlayers).values(data);
  const rows = await db
    .select()
    .from(gamePlayers)
    .where(and(eq(gamePlayers.roomId, data.roomId), eq(gamePlayers.sessionId, data.sessionId)))
    .limit(1);
  return rows[0]!;
}

export async function getPlayersInRoom(roomId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(gamePlayers).where(eq(gamePlayers.roomId, roomId));
}

export async function getPlayerBySession(roomId: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rows = await db
    .select()
    .from(gamePlayers)
    .where(and(eq(gamePlayers.roomId, roomId), eq(gamePlayers.sessionId, sessionId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function setPlayerReady(roomId: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(gamePlayers)
    .set({ isReady: true })
    .where(and(eq(gamePlayers.roomId, roomId), eq(gamePlayers.sessionId, sessionId)));
}

// ─── Game Rounds ──────────────────────────────────────────────────────────────

export async function createGameRound(data: { roomId: number; roundNumber: number; question: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(gameRounds).values(data);
  const rows = await db
    .select()
    .from(gameRounds)
    .where(and(eq(gameRounds.roomId, data.roomId), eq(gameRounds.roundNumber, data.roundNumber)))
    .limit(1);
  return rows[0]!;
}

export async function getCurrentRound(roomId: number, roundNumber: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rows = await db
    .select()
    .from(gameRounds)
    .where(and(eq(gameRounds.roomId, roomId), eq(gameRounds.roundNumber, roundNumber)))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateRoundStatus(
  roundId: number,
  status: "answering" | "pointing" | "done",
  aiCommentary?: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const update: Record<string, unknown> = { status };
  if (aiCommentary !== undefined) update.aiCommentary = aiCommentary;
  await db.update(gameRounds).set(update).where(eq(gameRounds.id, roundId));
}

// ─── Game Answers ─────────────────────────────────────────────────────────────

export async function submitAnswer(data: {
  roundId: number;
  roomId: number;
  authorId: string;
  isAi: boolean;
  answerText: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(gameAnswers).values(data);
}

export async function getAnswersForRound(roundId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(gameAnswers).where(eq(gameAnswers.roundId, roundId));
}

export async function hasPlayerAnswered(roundId: number, authorId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rows = await db
    .select()
    .from(gameAnswers)
    .where(and(eq(gameAnswers.roundId, roundId), eq(gameAnswers.authorId, authorId)))
    .limit(1);
  return rows.length > 0;
}

// ─── Game Pointings ───────────────────────────────────────────────────────────

export async function submitPointing(data: {
  roundId: number;
  roomId: number;
  pointerId: string;
  suspectId: string;
  explanation?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(gamePointings).values(data);
}

export async function getPointingsForRound(roundId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(gamePointings).where(eq(gamePointings.roundId, roundId));
}

export async function hasPlayerPointed(roundId: number, pointerId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rows = await db
    .select()
    .from(gamePointings)
    .where(and(eq(gamePointings.roundId, roundId), eq(gamePointings.pointerId, pointerId)))
    .limit(1);
  return rows.length > 0;
}

// ─── Game Votes ───────────────────────────────────────────────────────────────

export async function submitVote(data: {
  roomId: number;
  voterId: string;
  suspectId: string;
  explanation?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(gameVotes).values(data);
}

export async function getVotesForRoom(roomId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(gameVotes).where(eq(gameVotes.roomId, roomId));
}

export async function hasPlayerVoted(roomId: number, voterId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rows = await db
    .select()
    .from(gameVotes)
    .where(and(eq(gameVotes.roomId, roomId), eq(gameVotes.voterId, voterId)))
    .limit(1);
  return rows.length > 0;
}

// ─── Full Game State ──────────────────────────────────────────────────────────

export async function getFullGameState(roomCode: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const room = await getGameRoomByCode(roomCode);
  if (!room) return null;

  const players = await getPlayersInRoom(room.id);
  const rounds = await db.select().from(gameRounds).where(eq(gameRounds.roomId, room.id));

  const allAnswers: Record<number, Awaited<ReturnType<typeof getAnswersForRound>>> = {};
  const allPointings: Record<number, Awaited<ReturnType<typeof getPointingsForRound>>> = {};

  for (const round of rounds) {
    allAnswers[round.id] = await getAnswersForRound(round.id);
    allPointings[round.id] = await getPointingsForRound(round.id);
  }

  const votes = await getVotesForRoom(room.id);

  return { room, players, rounds, allAnswers, allPointings, votes };
}