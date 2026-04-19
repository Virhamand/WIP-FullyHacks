import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// In-memory room store
// Each room looks like:
// {
//   code: string,
//   players: [{ id, name, socketId }],
//   aiId: string,
//   state: "lobby" | "question" | "answering" | "reveal" | "pointing" | "voting" | "gameover",
//   round: number,           // 1-3
//   question: string,
//   answers: [{ playerId, label, text }],
//   points: [{ fromPlayerId, suspectLabel }],
//   votes: [{ fromPlayerId, suspectId }],
//   timer: NodeJS.Timeout | null,
// }
// ---------------------------------------------------------------------------
const rooms = {};

const ROUND_COUNT = 3;
const ANSWER_TIME = 30;   // seconds players have to answer
const POINTING_TIME = 20; // seconds for pointing phase
const VOTING_TIME = 20;   // seconds for final vote

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (rooms[code]);
  return code;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function assignLabels(room) {
  // Shuffle all participants (players + AI) and assign A/B/C
  const all = [
    ...room.players.map((p) => p.id),
    room.aiId,
  ];
  const shuffled = all.sort(() => Math.random() - 0.5);
  const labels = ["A", "B", "C"];
  return shuffled.map((id, i) => ({ id, label: labels[i] }));
}

function clearTimer(room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
}

function getRoom(roomCode) {
  return rooms[roomCode] || null;
}

// Pick a question. Swap this out for a Reddit fetch or a larger bank later.
const QUESTIONS = [
  "What's something you believed as a child that turned out to be completely wrong?",
  "Describe your perfect Sunday morning.",
  "What's a skill you wish you had learned earlier in life?",
  "What's the most spontaneous thing you've ever done?",
  "What's a piece of advice you got that you actually ignored?",
  "What's something small that makes you irrationally happy?",
  "What's the weirdest dream you remember having?",
  "If you could live in any decade, which would it be and why?",
  "What's a food you hated as a kid but love now?",
  "What habit took you the longest to break?",
];

function pickQuestion(usedQuestions = []) {
  const available = QUESTIONS.filter((q) => !usedQuestions.includes(q));
  const pool = available.length > 0 ? available : QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------------------------------------------------------------------------
// AI answer generation
// Calls the Claude API. Falls back to a stub if the key isn't set.
// ---------------------------------------------------------------------------
async function generateAiAnswer(question) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Stub for local dev without an API key
    return "honestly i'm not sure, i think about this sometimes but never land on a good answer lol";
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        system: `You are a 20-something person casually answering a question in a group chat game.
Rules:
- Write 1-3 sentences max, under 60 words total.
- Use casual, informal language. Contractions, filler words like "honestly", "kinda", "idk" are fine.
- Occasionally be a little vague or trail off.
- Do NOT use lists, bullet points, or formal structure.
- Do NOT sound too articulate or polished. You're just a regular person typing quickly.
- Do NOT mention being an AI or anything about technology.`,
        messages: [{ role: "user", content: question }],
      }),
    });

    const data = await res.json();
    return data.content?.[0]?.text?.trim() ?? "i dunno, hard to say really";
  } catch {
    return "i dunno, hard to say really";
  }
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------

function startRound(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;

  room.round += 1;
  room.state = "question";
  room.answers = [];
  room.points = [];

  const question = pickQuestion(room.usedQuestions || []);
  room.question = question;
  room.usedQuestions = [...(room.usedQuestions || []), question];

  // Assign A/B/C labels for this round
  room.labelMap = assignLabels(room);

  io.to(roomCode).emit("round_start", {
    round: room.round,
    question,
    timeLimit: ANSWER_TIME,
  });

  room.state = "answering";

  // Auto-advance when timer expires
  room.timer = setTimeout(() => closeAnswerPhase(roomCode), ANSWER_TIME * 1000);
}

async function closeAnswerPhase(roomCode) {
  const room = getRoom(roomCode);
  if (!room || room.state !== "answering") return;
  clearTimer(room);
  room.state = "reveal";

  // Generate AI answer if it hasn't submitted one
  const aiEntry = room.answers.find((a) => a.playerId === room.aiId);
  if (!aiEntry) {
    const aiText = await generateAiAnswer(room.question);
    room.answers.push({ playerId: room.aiId, text: aiText });
  }

  // Map answers to their labels (A/B/C) — strip player identity
  const labeledAnswers = room.labelMap.map(({ id, label }) => {
    const entry = room.answers.find((a) => a.playerId === id);
    return { label, text: entry?.text ?? "" };
  });

  io.to(roomCode).emit("answers_reveal", { answers: labeledAnswers });

  // Move to pointing phase
  room.state = "pointing";
  room.timer = setTimeout(() => closePointingPhase(roomCode), POINTING_TIME * 1000);
}

function closePointingPhase(roomCode) {
  const room = getRoom(roomCode);
  if (!room || room.state !== "pointing") return;
  clearTimer(room);

  // Build the reveal: which label belongs to whom
  const reveal = room.labelMap.map(({ id, label }) => {
    const player = room.players.find((p) => p.id === id);
    return {
      label,
      playerId: id,
      name: player ? player.name : "AI",
      isAi: id === room.aiId,
    };
  });

  const nextState = room.round >= ROUND_COUNT ? "final_vote" : "next_round";

  io.to(roomCode).emit("round_end", { reveal, nextState });

  if (nextState === "next_round") {
    setTimeout(() => startRound(roomCode), 3000);
  } else {
    setTimeout(() => startVoting(roomCode), 3000);
  }
}

function startVoting(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;

  room.state = "voting";
  room.votes = [];

  io.to(roomCode).emit("voting_start", { timeLimit: VOTING_TIME });

  room.timer = setTimeout(() => closeVoting(roomCode), VOTING_TIME * 1000);
}

function closeVoting(roomCode) {
  const room = getRoom(roomCode);
  if (!room || room.state !== "voting") return;
  clearTimer(room);
  room.state = "gameover";

  // Tally: how many real players voted for the AI?
  const votesForAi = room.votes.filter((v) => v.suspectId === room.aiId).length;
  const majority = Math.floor(room.players.length / 2) + 1; // simple majority
  const winner = votesForAi >= majority ? "players" : "ai";

  io.to(roomCode).emit("game_over", {
    winner,
    aiPlayerId: room.aiId,
    votes: room.votes,
  });
}

// ---------------------------------------------------------------------------
// Socket.io event handlers
// ---------------------------------------------------------------------------

io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id}`);

  // -- LOBBY --

  socket.on("create_room", ({ playerName }) => {
    const code = generateRoomCode();
    const playerId = generateId();
    const aiId = generateId();

    rooms[code] = {
      code,
      players: [{ id: playerId, name: playerName, socketId: socket.id }],
      aiId,
      state: "lobby",
      round: 0,
      question: null,
      answers: [],
      points: [],
      votes: [],
      labelMap: [],
      usedQuestions: [],
      timer: null,
    };

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerId = playerId;

    socket.emit("room_created", { roomCode: code, playerId });

    io.to(code).emit("lobby_update", {
      players: rooms[code].players.map(({ id, name }) => ({ id, name })),
      ready: false,
    });

    console.log(`[room_created] ${code} by ${playerName}`);
  });

  socket.on("join_room", ({ roomCode, playerName }) => {
    const room = getRoom(roomCode);

    if (!room) {
      socket.emit("join_failed", { reason: "not_found" });
      return;
    }
    if (room.state !== "lobby") {
      socket.emit("join_failed", { reason: "in_progress" });
      return;
    }
    if (room.players.length >= 2) {
      socket.emit("join_failed", { reason: "full" });
      return;
    }

    const playerId = generateId();
    room.players.push({ id: playerId, name: playerName, socketId: socket.id });

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerId = playerId;

    io.to(roomCode).emit("lobby_update", {
      players: room.players.map(({ id, name }) => ({ id, name })),
      ready: room.players.length === 2,
    });

    console.log(`[join_room] ${playerName} joined ${roomCode}`);
  });

  socket.on("start_game", ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.state !== "lobby") return;
    if (room.players.length < 2) {
      socket.emit("error", { message: "Need 2 players to start." });
      return;
    }

    console.log(`[start_game] ${roomCode}`);
    startRound(roomCode);
  });

  // -- ROUND: ANSWER --

  socket.on("submit_answer", ({ roomCode, text }) => {
    const room = getRoom(roomCode);
    if (!room || room.state !== "answering") return;

    const playerId = socket.data.playerId;
    const alreadyAnswered = room.answers.some((a) => a.playerId === playerId);
    if (alreadyAnswered) return;

    // Enforce word limit (40 words)
    const trimmed = text.trim().split(/\s+/).slice(0, 40).join(" ");
    room.answers.push({ playerId, text: trimmed });

    console.log(`[submit_answer] ${playerId} in ${roomCode}`);

    // If all real players have answered, close early
    if (room.answers.length >= room.players.length) {
      closeAnswerPhase(roomCode);
    }
  });

  // -- ROUND: POINTING --

  socket.on("submit_point", ({ roomCode, suspectLabel }) => {
    const room = getRoom(roomCode);
    if (!room || room.state !== "pointing") return;

    const fromPlayerId = socket.data.playerId;

    // Allow players to change their point — remove old one first
    room.points = room.points.filter((p) => p.fromPlayerId !== fromPlayerId);
    room.points.push({ fromPlayerId, suspectLabel });

    io.to(roomCode).emit("pointing_update", { points: room.points });
  });

  // -- FINAL VOTE --

  socket.on("submit_vote", ({ roomCode, suspectId }) => {
    const room = getRoom(roomCode);
    if (!room || room.state !== "voting") return;

    const fromPlayerId = socket.data.playerId;
    const alreadyVoted = room.votes.some((v) => v.fromPlayerId === fromPlayerId);
    if (alreadyVoted) return;

    room.votes.push({ fromPlayerId, suspectId });

    console.log(`[submit_vote] ${fromPlayerId} → ${suspectId} in ${roomCode}`);

    // Close early if all players have voted
    if (room.votes.length >= room.players.length) {
      closeVoting(roomCode);
    }
  });

  // -- DISCONNECT --

  socket.on("disconnect", () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;

    const room = getRoom(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    console.log(`[disconnect] ${player.name} left ${roomCode}`);

    io.to(roomCode).emit("player_disconnected", {
      playerId,
      name: player.name,
    });

    // Clean up room if it's in lobby or everyone left
    room.players = room.players.filter((p) => p.id !== playerId);
    // if (room.players.length === 0 || room.state === "lobby") {
    //   clearTimer(room);
    //   delete rooms[roomCode];
    //   console.log(`[room_closed] ${roomCode}`);
    // }
    if (room.players.length === 0) {
        clearTimer(room);
        delete rooms[roomCode];
    }
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

httpServer.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});