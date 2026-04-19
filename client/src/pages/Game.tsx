import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { nanoid } from "nanoid";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AvatarBadge, { getAvatarEmoji } from "@/components/AvatarBadge";
import WordCounter, { countWords } from "@/components/WordCounter";
import { MAX_WORDS, TOTAL_ROUNDS } from "../../../shared/game";

// ─── Session helpers ──────────────────────────────────────────────────────────

function getSessionId(): string {
  let id = localStorage.getItem("imposter_session_id");
  if (!id) {
    id = nanoid(16);
    localStorage.setItem("imposter_session_id", id);
  }
  return id;
}

function getPlayerName(): string {
  return localStorage.getItem("imposter_player_name") ?? "PLAYER";
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Participant = {
  id: string;
  name: string;
  avatarKey: string;
  isAi: boolean;
};

// ─── Sub-screens ──────────────────────────────────────────────────────────────

function LobbyScreen({
  roomCode,
  participants,
  playerCount,
  sessionId,
  onStart,
  isStarting,
}: {
  roomCode: string;
  participants: Participant[];
  playerCount: number;
  sessionId: string;
  onStart: () => void;
  isStarting: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎭</div>
          <h1 className="text-3xl font-bold">Game Lobby</h1>
          <p className="text-muted-foreground mt-1">Waiting for players to join...</p>
        </div>

        {/* Room code */}
        <div className="game-card text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">Room Code</p>
          <button
            onClick={copyCode}
            className="text-5xl font-mono font-bold tracking-widest text-primary hover:opacity-80 transition-opacity"
          >
            {roomCode}
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            {copied ? "✅ Copied!" : "Tap to copy and share with a friend"}
          </p>
        </div>

        {/* Players */}
        <div className="game-card">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Players ({playerCount}/2)
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            {participants
              .filter((p) => !p.isAi)
              .map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-2 slide-up">
                  <AvatarBadge avatarKey={p.avatarKey} name={p.name} size="lg" />
                  {p.id === sessionId && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                      You
                    </span>
                  )}
                </div>
              ))}
            {playerCount < 2 && (
              <div className="flex flex-col items-center gap-2 opacity-30">
                <div className="text-5xl pulse-ring">❓</div>
                <span className="text-sm font-bold uppercase tracking-wide">Waiting...</span>
              </div>
            )}
          </div>
        </div>

        {/* AI player hint */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-amber-800">
            🤖 An <strong>AI player</strong> will secretly join the game. Your mission: identify it!
          </p>
        </div>

        {playerCount >= 2 && (
          <Button className="w-full h-12 text-base font-bold" onClick={onStart} disabled={isStarting}>
            {isStarting ? "Starting..." : "🚀 Start Game"}
          </Button>
        )}
      </div>
    </div>
  );
}

function QuestionScreen({
  question,
  roundNumber,
  participants,
  sessionId,
  myAnswered,
  onSubmit,
  isSubmitting,
}: {
  question: string;
  roundNumber: number;
  participants: Participant[];
  sessionId: string;
  myAnswered: boolean;
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const wordCount = countWords(answer);
  const isOver = wordCount > MAX_WORDS;
  const myParticipant = participants.find((p) => p.id === sessionId);

  if (myAnswered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="text-6xl pulse-ring">⏳</div>
          <h2 className="text-2xl font-bold">Answer Submitted!</h2>
          <p className="text-muted-foreground">Waiting for other players to answer...</p>
          <div className="game-card">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Round {roundNumber} of {TOTAL_ROUNDS}
            </p>
            <p className="text-foreground font-medium">{question}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-5">
        {/* Round indicator */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i < roundNumber ? "w-8 bg-primary" : i === roundNumber - 1 ? "w-8 bg-primary" : "w-8 bg-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground font-semibold">
            Round {roundNumber}/{TOTAL_ROUNDS}
          </span>
        </div>

        {/* Question card */}
        <div className="game-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Question</p>
          <p className="text-xl font-bold leading-snug">{question}</p>
        </div>

        {/* Answer input */}
        <div className="game-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your Answer</p>
            {myParticipant && (
              <AvatarBadge avatarKey={myParticipant.avatarKey} name={myParticipant.name} size="sm" />
            )}
          </div>
          <textarea
            className="w-full rounded-xl border border-input bg-background p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[140px]"
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={3000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Maximum of {MAX_WORDS} words</p>
            <WordCounter text={answer} />
          </div>
        </div>

        <Button
          className="w-full h-12 text-base font-bold"
          onClick={() => onSubmit(answer.trim())}
          disabled={isSubmitting || !answer.trim() || isOver}
        >
          {isSubmitting ? "Submitting..." : "Submit Answer →"}
        </Button>
      </div>
    </div>
  );
}

function PointingScreen({
  question,
  roundNumber,
  answers,
  participants,
  sessionId,
  myPointed,
  onSubmit,
  isSubmitting,
}: {
  question: string;
  roundNumber: number;
  answers: Array<{ authorId: string; answerText: string; isAi: boolean }>;
  participants: Participant[];
  sessionId: string;
  myPointed: boolean;
  onSubmit: (suspectId: string, explanation?: string) => void;
  isSubmitting: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");

  const getParticipant = (authorId: string) => participants.find((p) => p.id === authorId);

  if (myPointed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="text-6xl pulse-ring">⏳</div>
          <h2 className="text-2xl font-bold">Suspicion Noted!</h2>
          <p className="text-muted-foreground">Waiting for other players to point...</p>
        </div>
      </div>
    );
  }

  // Shuffle answers for display
  const shuffledAnswers = [...answers].sort((a, b) => a.authorId.localeCompare(b.authorId));

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">👉</div>
          <h2 className="text-2xl font-bold">Pointing</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Round {roundNumber} — Who do you think is the AI?
          </p>
        </div>

        {/* Question reminder */}
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">The Question</p>
          <p className="text-sm font-medium">{question}</p>
        </div>

        {/* Answer cards */}
        <div className="space-y-3">
          {shuffledAnswers.map((ans) => {
            const participant = getParticipant(ans.authorId);
            const isMe = ans.authorId === sessionId;
            const isSelected = selected === ans.authorId;

            return (
              <div
                key={ans.authorId}
                className={`answer-card p-5 ${isSelected ? "selected" : ""} ${isMe ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (!isMe) setSelected(isSelected ? null : ans.authorId);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {participant && (
                      <AvatarBadge
                        avatarKey={participant.avatarKey}
                        name={participant.name}
                        size="md"
                        showName={true}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-relaxed">{ans.answerText}</p>
                    {isMe && (
                      <p className="text-xs text-muted-foreground mt-2 italic">Your answer — you can't point at yourself</p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 text-2xl">👉</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        {selected && (
          <div className="game-card slide-up">
            <p className="text-sm font-semibold uppercase tracking-wide mb-2">
              Why do you suspect{" "}
              <span className="text-primary">
                {getParticipant(selected)?.name ?? selected}
              </span>
              ? <span className="text-muted-foreground font-normal">(optional)</span>
            </p>
            <textarea
              className="w-full rounded-xl border border-input bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
              placeholder="e.g. Their answer felt too generic and safe..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              maxLength={500}
            />
          </div>
        )}

        <Button
          className="w-full h-12 text-base font-bold"
          onClick={() => selected && onSubmit(selected, explanation || undefined)}
          disabled={!selected || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : selected ? `Point at ${getParticipant(selected)?.name ?? "?"} →` : "Select a suspect first"}
        </Button>
      </div>
    </div>
  );
}

function VotingScreen({
  participants,
  sessionId,
  myVoted,
  allRoundsPointings,
  onSubmit,
  isSubmitting,
}: {
  participants: Participant[];
  sessionId: string;
  myVoted: boolean;
  allRoundsPointings: Array<{
    roundNumber: number;
    question: string;
    answers: Array<{ authorId: string; answerText: string }>;
    pointings: Array<{ pointerId: string; suspectId: string; explanation: string | null }>;
  }>;
  onSubmit: (suspectId: string, explanation?: string) => void;
  isSubmitting: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");

  const getParticipant = (id: string) => participants.find((p) => p.id === id);

  if (myVoted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="text-6xl pulse-ring">🗳️</div>
          <h2 className="text-2xl font-bold">Vote Cast!</h2>
          <p className="text-muted-foreground">Waiting for all votes to come in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">🗳️</div>
          <h2 className="text-3xl font-bold">Final Vote</h2>
          <p className="text-muted-foreground mt-1">
            Who is the AI imposter? This is your final answer.
          </p>
        </div>

        {/* Round summary */}
        <div className="space-y-3">
          {allRoundsPointings.map((round) => (
            <details key={round.roundNumber} className="game-card cursor-pointer">
              <summary className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Round {round.roundNumber} — {round.question}
              </summary>
              <div className="mt-3 space-y-2">
                {round.pointings.map((p, i) => {
                  const pointer = getParticipant(p.pointerId);
                  const suspect = getParticipant(p.suspectId);
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-bold">{pointer?.name ?? p.pointerId}</span>
                      <span className="text-muted-foreground">pointed at</span>
                      <span className="font-bold text-primary">{suspect?.name ?? p.suspectId}</span>
                      {p.explanation && (
                        <span className="text-muted-foreground italic">— "{p.explanation}"</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>

        {/* Vote selection */}
        <div className="game-card">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Cast Your Vote
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {participants
              .filter((p) => p.id !== sessionId)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(selected === p.id ? null : p.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    selected === p.id
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <AvatarBadge avatarKey={p.avatarKey} name={p.name} size="lg" showName={true} />
                  {selected === p.id && <span className="text-xs text-primary font-bold">SELECTED</span>}
                </button>
              ))}
          </div>
        </div>

        {/* Explanation */}
        {selected && (
          <div className="game-card slide-up">
            <p className="text-sm font-semibold uppercase tracking-wide mb-2">
              Why do you think{" "}
              <span className="text-primary">{getParticipant(selected)?.name}</span>{" "}
              is the AI?{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </p>
            <textarea
              className="w-full rounded-xl border border-input bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
              placeholder="Share your reasoning..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              maxLength={500}
            />
          </div>
        )}

        <Button
          className="w-full h-12 text-base font-bold"
          onClick={() => selected && onSubmit(selected, explanation || undefined)}
          disabled={!selected || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : selected ? `Vote for ${getParticipant(selected)?.name} →` : "Select who you think is the AI"}
        </Button>
      </div>
    </div>
  );
}

function ResultsScreen({
  room,
  participants,
  votes,
  allRoundsPointings,
  sessionId,
}: {
  room: { aiPlayerId: string | null; roomCode: string };
  participants: Participant[];
  votes: Array<{ voterId: string; suspectId: string; explanation: string | null }>;
  allRoundsPointings: Array<{
    roundNumber: number;
    question: string;
    answers: Array<{ authorId: string; answerText: string; isAi: boolean }>;
    pointings: Array<{ pointerId: string; suspectId: string; explanation: string | null }>;
  }>;
  sessionId: string;
}) {
  const [, navigate] = useLocation();
  const aiPlayerId = room.aiPlayerId;
  const aiParticipant = participants.find((p) => p.isAi || p.id === aiPlayerId);

  // Tally votes
  const correctVotes = votes.filter((v) => v.suspectId === aiPlayerId).length;
  const humanCount = participants.filter((p) => !p.isAi).length;
  const playersWin = correctVotes > humanCount / 2;

  const getParticipant = (id: string) => participants.find((p) => p.id === id);

  return (
    <div className="results-screen min-h-screen flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-2xl space-y-8">
        {/* Outcome banner */}
        <div className="text-center reveal-pop">
          <div className="text-7xl mb-4">{playersWin ? "🏆" : "🤖"}</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: playersWin ? "oklch(0.75 0.2 150)" : "oklch(0.7 0.22 25)" }}>
            {playersWin ? "Players Win!" : "AI Wins!"}
          </h1>
          <p className="text-lg opacity-70">
            {playersWin
              ? "The humans successfully identified the AI imposter!"
              : "The AI successfully fooled the players!"}
          </p>
        </div>

        {/* AI reveal */}
        {aiParticipant && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "oklch(0.17 0.03 270)", border: "1px solid oklch(0.3 0.04 270)" }}
          >
            <p className="text-sm font-semibold uppercase tracking-widest opacity-50 mb-3">The AI was...</p>
            <AvatarBadge
              avatarKey={aiParticipant.avatarKey}
              name={aiParticipant.name}
              size="xl"
              showName={true}
              isAi={true}
            />
          </div>
        )}

        {/* Votes breakdown */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "oklch(0.17 0.03 270)" }}>
          <p className="text-sm font-semibold uppercase tracking-widest opacity-50 mb-3">Voting Results</p>
          {votes.map((vote, i) => {
            const voter = getParticipant(vote.voterId);
            const suspect = getParticipant(vote.suspectId);
            const correct = vote.suspectId === aiPlayerId;
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "oklch(0.22 0.03 270)" }}
              >
                <span className="text-2xl">{getAvatarEmoji(voter?.avatarKey ?? "")}</span>
                <div className="flex-1">
                  <span className="font-bold text-sm">{voter?.name ?? vote.voterId}</span>
                  <span className="opacity-50 text-sm"> voted for </span>
                  <span className="font-bold text-sm">{suspect?.name ?? vote.suspectId}</span>
                  {vote.explanation && (
                    <p className="text-xs opacity-50 mt-0.5 italic">"{vote.explanation}"</p>
                  )}
                </div>
                <span className="text-xl">{correct ? "✅" : "❌"}</span>
              </div>
            );
          })}
        </div>

        {/* Round recap */}
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest opacity-50">Round Recap</p>
          {allRoundsPointings.map((round) => (
            <div
              key={round.roundNumber}
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "oklch(0.17 0.03 270)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide opacity-50">
                Round {round.roundNumber}
              </p>
              <p className="font-medium text-sm opacity-80">{round.question}</p>
              <div className="space-y-2">
                {round.answers.map((ans) => {
                  const participant = getParticipant(ans.authorId);
                  return (
                    <div
                      key={ans.authorId}
                      className="p-3 rounded-xl"
                      style={{
                        background: ans.isAi ? "oklch(0.25 0.06 280 / 0.5)" : "oklch(0.22 0.03 270)",
                        border: ans.isAi ? "1px solid oklch(0.52 0.24 280 / 0.4)" : "none",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getAvatarEmoji(participant?.avatarKey ?? "")}</span>
                        <span className="text-xs font-bold uppercase tracking-wide">
                          {participant?.name ?? ans.authorId}
                        </span>
                        {ans.isAi && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: "oklch(0.52 0.24 280)", color: "white" }}
                          >
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-80">{ans.answerText}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Play again */}
        <button
          onClick={() => navigate("/")}
          className="w-full h-12 rounded-2xl font-bold text-base transition-opacity hover:opacity-80"
          style={{ background: "oklch(0.52 0.24 280)", color: "white" }}
        >
          🎮 Play Again
        </button>
      </div>
    </div>
  );
}

// ─── Main Game Component ──────────────────────────────────────────────────────

export default function Game() {
  const params = useParams<{ roomCode: string }>();
  const [, navigate] = useLocation();
  const roomCode = params.roomCode?.toUpperCase() ?? "";
  const sessionId = getSessionId();

  // Join room on mount if not already joined
  const joinRoom = trpc.game.joinRoom.useMutation({
    onError: (err) => {
      if (!err.message.includes("already")) {
        toast.error(err.message);
      }
    },
  });

  useEffect(() => {
    const playerName = getPlayerName();
    joinRoom.mutate({ roomCode, playerName, sessionId });
  }, [roomCode]);

  // Poll game state every 2 seconds
  const { data: state, isLoading, error } = trpc.game.getState.useQuery(
    { roomCode, sessionId },
    { refetchInterval: 2000, retry: 3 }
  );

  const startGame = trpc.game.startGame.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const submitAnswer = trpc.game.submitAnswer.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const submitPointing = trpc.game.submitPointing.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const submitVote = trpc.game.submitVote.useMutation({
    onError: (err) => toast.error(err.message),
  });

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl pulse-ring">🎭</div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">😕</div>
          <h2 className="text-xl font-bold">Room not found</h2>
          <p className="text-muted-foreground">The room code may be invalid or the game has ended.</p>
          <Button onClick={() => navigate("/")}>← Back to Home</Button>
        </div>
      </div>
    );
  }

  const { room, participants, currentRound, answers, pointings, votes, allRoundsPointings, myAnswered, myPointed, myVoted, playerCount } = state;

  // ── Render by game phase ──────────────────────────────────────────────────

  if (room.status === "lobby") {
    return (
      <LobbyScreen
        roomCode={roomCode}
        participants={participants}
        playerCount={playerCount}
        sessionId={sessionId}
        onStart={() => startGame.mutate({ roomCode, sessionId })}
        isStarting={startGame.isPending}
      />
    );
  }

  if (room.status === "question" && currentRound) {
    return (
      <QuestionScreen
        question={currentRound.question}
        roundNumber={currentRound.roundNumber}
        participants={participants}
        sessionId={sessionId}
        myAnswered={myAnswered}
        onSubmit={(text) => submitAnswer.mutate({ roomCode, sessionId, answerText: text })}
        isSubmitting={submitAnswer.isPending}
      />
    );
  }

  if (room.status === "pointing" && currentRound) {
    return (
      <PointingScreen
        question={currentRound.question}
        roundNumber={currentRound.roundNumber}
        answers={answers}
        participants={participants}
        sessionId={sessionId}
        myPointed={myPointed}
        onSubmit={(suspectId, explanation) =>
          submitPointing.mutate({ roomCode, sessionId, suspectId, explanation })
        }
        isSubmitting={submitPointing.isPending}
      />
    );
  }

  if (room.status === "voting") {
    return (
      <VotingScreen
        participants={participants}
        sessionId={sessionId}
        myVoted={myVoted}
        allRoundsPointings={allRoundsPointings}
        onSubmit={(suspectId, explanation) =>
          submitVote.mutate({ roomCode, sessionId, suspectId, explanation })
        }
        isSubmitting={submitVote.isPending}
      />
    );
  }

  if (room.status === "results") {
    return (
      <ResultsScreen
        room={room}
        participants={participants}
        votes={votes}
        allRoundsPointings={allRoundsPointings}
        sessionId={sessionId}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Unknown game state: {room.status}</p>
    </div>
  );
}
