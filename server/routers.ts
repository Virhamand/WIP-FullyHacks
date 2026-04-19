import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { AVATARS, TOTAL_ROUNDS, PLAYERS_PER_ROOM } from "../shared/game";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { generateQuestion, generateAiAnswer, generateAiCommentary } from "./gemini";
import {
  addPlayerToRoom,
  createGameRoom,
  createGameRound,
  getCurrentRound,
  getFullGameState,
  getGameRoomByCode,
  getPlayersInRoom,
  getPlayerBySession,
  getAnswersForRound,
  getPointingsForRound,
  getVotesForRoom,
  hasPlayerAnswered,
  hasPlayerPointed,
  hasPlayerVoted,
  submitAnswer,
  submitPointing,
  submitVote,
  updateGameRoomStatus,
  updateRoundStatus,
} from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getAvatarByKey(key: string) {
  return AVATARS.find((a) => a.key === key) ?? AVATARS[0];
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  game: router({
    // Create a new game room
    createRoom: publicProcedure.mutation(async () => {
      const roomCode = generateRoomCode();
      const avatarKeys = AVATARS.map((a) => a.key);
      const aiAvatarKey = avatarKeys[Math.floor(Math.random() * avatarKeys.length)]!;
      const aiAvatar = getAvatarByKey(aiAvatarKey);
      const aiPlayerId = `ai_${nanoid(8)}`;

      const room = await createGameRoom({
        roomCode,
        aiPlayerId,
        aiAvatarKey,
        aiName: aiAvatar.name,
      });

      return { roomCode: room.roomCode, roomId: room.id };
    }),

    // Join a room with a player name
    joinRoom: publicProcedure
      .input(
        z.object({
          roomCode: z.string().min(4).max(8),
          playerName: z.string().min(1).max(30),
          sessionId: z.string().min(8),
        })
      )
      .mutation(async ({ input }) => {
        const room = await getGameRoomByCode(input.roomCode.toUpperCase());
        if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
        if (room.status !== "lobby") throw new TRPCError({ code: "BAD_REQUEST", message: "Game already started" });

        const existingPlayers = await getPlayersInRoom(room.id);

        // Check if session already joined
        const existing = existingPlayers.find((p) => p.sessionId === input.sessionId);
        if (existing) {
          return { player: existing, room };
        }

        if (existingPlayers.length >= PLAYERS_PER_ROOM) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Room is full" });
        }

        // Assign avatar — avoid AI avatar and already-taken avatars
        const takenKeys = new Set([room.aiAvatarKey, ...existingPlayers.map((p) => p.avatarKey)]);
        const available = AVATARS.filter((a) => !takenKeys.has(a.key));
        const avatarKey = available.length > 0 ? available[Math.floor(Math.random() * available.length)]!.key : AVATARS[0]!.key;

        const player = await addPlayerToRoom({
          roomId: room.id,
          sessionId: input.sessionId,
          playerName: input.playerName.toUpperCase(),
          avatarKey,
        });

        return { player, room };
      }),

    // Get full game state (polling endpoint)
    getState: publicProcedure
      .input(z.object({ roomCode: z.string(), sessionId: z.string() }))
      .query(async ({ input }) => {
        const state = await getFullGameState(input.roomCode.toUpperCase());
        if (!state) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

        const { room, players, rounds, allAnswers, allPointings, votes } = state;

        const aiParticipant = {
          id: room.aiPlayerId,
          name: room.aiName,
          avatarKey: room.aiAvatarKey,
          isAi: true,
        };

        const humanParticipants = players.map((p) => ({
          id: p.sessionId,
          name: p.playerName,
          avatarKey: p.avatarKey,
          isAi: false,
        }));

        const currentRound = rounds.find((r) => r.roundNumber === room.currentRound) ?? null;
        const currentAnswers = currentRound ? allAnswers[currentRound.id] ?? [] : [];
        const currentPointings = currentRound ? allPointings[currentRound.id] ?? [] : [];

        const myPlayer = players.find((p) => p.sessionId === input.sessionId);
        const myAnswered = currentRound ? await hasPlayerAnswered(currentRound.id, input.sessionId) : false;
        const myPointed = currentRound ? await hasPlayerPointed(currentRound.id, input.sessionId) : false;
        const myVoted = await hasPlayerVoted(room.id, input.sessionId);

        const answersForDisplay = currentAnswers.map((a) => ({
          authorId: a.authorId,
          answerText: a.answerText,
          isAi: room.status === "results" ? a.isAi : false,
        }));

        const allRoundsPointings = rounds.map((r) => ({
          roundNumber: r.roundNumber,
          question: r.question,
          answers: (allAnswers[r.id] ?? []).map((a) => ({
            authorId: a.authorId,
            answerText: a.answerText,
            isAi: room.status === "results" ? a.isAi : false,
          })),
          pointings: (allPointings[r.id] ?? []).map((p) => ({
            pointerId: p.pointerId,
            suspectId: p.suspectId,
            explanation: p.explanation,
          })),
        }));

        return {
          room: {
            id: room.id,
            roomCode: room.roomCode,
            status: room.status,
            currentRound: room.currentRound,
            aiPlayerId: room.status === "results" ? room.aiPlayerId : null,
          },
          participants: [...humanParticipants, aiParticipant],
          humanParticipants,
          aiParticipant,
          currentRound: currentRound
            ? {
                id: currentRound.id,
                roundNumber: currentRound.roundNumber,
                question: currentRound.question,
                status: currentRound.status,
                aiCommentary: currentRound.aiCommentary ?? null,
              }
            : null,
          answers: answersForDisplay,
          pointings: currentPointings.map((p) => ({
            pointerId: p.pointerId,
            suspectId: p.suspectId,
            explanation: p.explanation,
          })),
          votes: votes.map((v) => ({
            voterId: v.voterId,
            suspectId: v.suspectId,
            explanation: v.explanation,
          })),
          allRoundsPointings,
          myPlayer: myPlayer ?? null,
          myAnswered,
          myPointed,
          myVoted,
          playerCount: players.length,
          maxPlayers: PLAYERS_PER_ROOM,
        };
      }),

    // Start the game — generates only the first question to save tokens
    startGame: publicProcedure
      .input(z.object({ roomCode: z.string(), sessionId: z.string() }))
      .mutation(async ({ input }) => {
        const room = await getGameRoomByCode(input.roomCode.toUpperCase());
        if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
        if (room.status !== "lobby") throw new TRPCError({ code: "BAD_REQUEST", message: "Game already started" });

        const players = await getPlayersInRoom(room.id);
        if (players.length < PLAYERS_PER_ROOM) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Need ${PLAYERS_PER_ROOM} players to start`,
          });
        }

        // Generate only round 1 question now — subsequent questions are
        // generated after each pointing phase to minimize token usage.
        const question = await generateQuestion();
        await createGameRound({
          roomId: room.id,
          roundNumber: 1,
          question,
        });

        await updateGameRoomStatus(room.id, "question", 1);
        return { success: true };
      }),

    // Submit an answer for the current round
    submitAnswer: publicProcedure
      .input(
        z.object({
          roomCode: z.string(),
          sessionId: z.string(),
          answerText: z.string().min(1).max(5000),
        })
      )
      .mutation(async ({ input }) => {
        const room = await getGameRoomByCode(input.roomCode.toUpperCase());
        if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
        if (room.status !== "question") throw new TRPCError({ code: "BAD_REQUEST", message: "Not in question phase" });

        const round = await getCurrentRound(room.id, room.currentRound);
        if (!round) throw new TRPCError({ code: "NOT_FOUND", message: "Round not found" });

        const alreadyAnswered = await hasPlayerAnswered(round.id, input.sessionId);
        if (alreadyAnswered) throw new TRPCError({ code: "BAD_REQUEST", message: "Already answered" });

        // Store this human's answer
        await submitAnswer({
          roundId: round.id,
          roomId: room.id,
          authorId: input.sessionId,
          isAi: false,
          answerText: input.answerText,
        });

        // Check if ALL human players have now answered
        const players = await getPlayersInRoom(room.id);
        const answers = await getAnswersForRound(round.id);
        const humanAnswerCount = answers.filter((a) => !a.isAi).length;

        if (humanAnswerCount >= players.length) {
          // ── Generate AI answer via Gemini ─────────────────────────────────
          const aiText = await generateAiAnswer(round.question);

          await submitAnswer({
            roundId: round.id,
            roomId: room.id,
            authorId: room.aiPlayerId,
            isAi: true,
            answerText: aiText || "Honestly not sure — I'd have to think on that one.",
          });

          // ── All answers in → generate AI commentary ───────────────────────
          const allAnswers = await getAnswersForRound(round.id);

          const participantNames: Record<string, string> = {};
          for (const p of players) {
            participantNames[p.sessionId] = p.playerName;
          }
          participantNames[room.aiPlayerId] = room.aiName;

          const responsesForCommentary = allAnswers.map((a) => ({
            name: participantNames[a.authorId] ?? "Unknown",
            text: a.answerText,
          }));

          const commentary = await generateAiCommentary(round.question, responsesForCommentary);

          await updateRoundStatus(round.id, "pointing", commentary || null);
          await updateGameRoomStatus(room.id, "pointing");
        }

        return { success: true };
      }),

    // Submit a pointing (suspicion) for the current round
    submitPointing: publicProcedure
      .input(
        z.object({
          roomCode: z.string(),
          sessionId: z.string(),
          suspectId: z.string(),
          explanation: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const room = await getGameRoomByCode(input.roomCode.toUpperCase());
        if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
        if (room.status !== "pointing") throw new TRPCError({ code: "BAD_REQUEST", message: "Not in pointing phase" });

        const round = await getCurrentRound(room.id, room.currentRound);
        if (!round) throw new TRPCError({ code: "NOT_FOUND", message: "Round not found" });

        const alreadyPointed = await hasPlayerPointed(round.id, input.sessionId);
        if (alreadyPointed) throw new TRPCError({ code: "BAD_REQUEST", message: "Already pointed" });

        await submitPointing({
          roundId: round.id,
          roomId: room.id,
          pointerId: input.sessionId,
          suspectId: input.suspectId,
          explanation: input.explanation ?? null,
        });

        // Advance when all human players have pointed
        const players = await getPlayersInRoom(room.id);
        const pointings = await getPointingsForRound(round.id);

        if (pointings.length >= players.length) {
          await updateRoundStatus(round.id, "done", null);

          if (room.currentRound < TOTAL_ROUNDS) {
            // ── Generate next round's question only now, after reactions ─────
            // This is the key token-saving change: questions are generated
            // one at a time, only after the previous round's reactions are shown.
            const nextQuestion = await generateQuestion();
            await createGameRound({
              roomId: room.id,
              roundNumber: room.currentRound + 1,
              question: nextQuestion,
            });
            await updateGameRoomStatus(room.id, "question", room.currentRound + 1);
          } else {
            await updateGameRoomStatus(room.id, "voting");
          }
        }

        return { success: true };
      }),

    // Submit final vote
    submitVote: publicProcedure
      .input(
        z.object({
          roomCode: z.string(),
          sessionId: z.string(),
          suspectId: z.string(),
          explanation: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const room = await getGameRoomByCode(input.roomCode.toUpperCase());
        if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
        if (room.status !== "voting") throw new TRPCError({ code: "BAD_REQUEST", message: "Not in voting phase" });

        const alreadyVoted = await hasPlayerVoted(room.id, input.sessionId);
        if (alreadyVoted) throw new TRPCError({ code: "BAD_REQUEST", message: "Already voted" });

        await submitVote({
          roomId: room.id,
          voterId: input.sessionId,
          suspectId: input.suspectId,
          explanation: input.explanation ?? null,
        });

        const players = await getPlayersInRoom(room.id);
        const votes = await getVotesForRoom(room.id);

        if (votes.length >= players.length) {
          await updateGameRoomStatus(room.id, "results");
        }

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;