import { useState } from "react";
import { useLocation } from "wouter";
import { nanoid } from "nanoid";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function getOrCreateSessionId(): string {
  let id = localStorage.getItem("imposter_session_id");
  if (!id) {
    id = nanoid(16);
    localStorage.setItem("imposter_session_id", id);
  }
  return id;
}

export default function Home() {
  const [, navigate] = useLocation();
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("imposter_player_name") ?? "");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"home" | "create" | "join">("home");

  const createRoom = trpc.game.createRoom.useMutation({
    onSuccess: (data) => {
      const sessionId = getOrCreateSessionId();
      localStorage.setItem("imposter_player_name", playerName.trim().toUpperCase());
      navigate(`/game/${data.roomCode}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const joinRoom = trpc.game.joinRoom.useMutation({
    onSuccess: () => {
      localStorage.setItem("imposter_player_name", playerName.trim().toUpperCase());
      navigate(`/game/${joinCode.trim().toUpperCase()}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!playerName.trim()) return toast.error("Enter your name first");
    createRoom.mutate();
  };

  const handleJoin = () => {
    if (!playerName.trim()) return toast.error("Enter your name first");
    if (!joinCode.trim()) return toast.error("Enter a room code");
    const sessionId = getOrCreateSessionId();
    joinRoom.mutate({
      roomCode: joinCode.trim().toUpperCase(),
      playerName: playerName.trim(),
      sessionId,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.88 0.08 280 / 0.4) 0%, transparent 70%)",
        }}
      />

      {/* Floating emoji decorations */}
      <div className="absolute top-12 left-8 text-5xl opacity-20 rotate-[-15deg] select-none">🍍</div>
      <div className="absolute top-24 right-12 text-4xl opacity-20 rotate-[12deg] select-none">🍎</div>
      <div className="absolute bottom-20 left-16 text-4xl opacity-15 rotate-[8deg] select-none">🐢</div>
      <div className="absolute bottom-16 right-10 text-5xl opacity-15 rotate-[-10deg] select-none">🍇</div>
      <div className="absolute top-1/2 left-4 text-3xl opacity-10 select-none">🍉</div>
      <div className="absolute top-1/3 right-6 text-3xl opacity-10 select-none">🍒</div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎭</div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-2">
            AI Imposter
          </h1>
          <p className="text-muted-foreground text-lg">
            Can you spot the AI hiding among real players?
          </p>
        </div>

        {/* Main card */}
        <div className="game-card">
          {mode === "home" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">
                  Your Name
                </label>
                <Input
                  placeholder="Enter your name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={30}
                  className="text-center text-lg font-bold uppercase tracking-wide h-12"
                  onKeyDown={(e) => e.key === "Enter" && setMode("create")}
                />
              </div>

              <Button
                className="w-full h-12 text-base font-bold"
                onClick={() => {
                  if (!playerName.trim()) return toast.error("Enter your name first");
                  setMode("create");
                }}
              >
                🎮 Create New Game
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 text-base font-bold"
                onClick={() => {
                  if (!playerName.trim()) return toast.error("Enter your name first");
                  setMode("join");
                }}
              >
                🔗 Join Existing Game
              </Button>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-4">
              <button
                onClick={() => setMode("home")}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back
              </button>
              <div className="text-center">
                <div className="text-4xl mb-2">🎮</div>
                <h2 className="text-xl font-bold">Create a New Game</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll get a room code to share with one friend
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Playing as</p>
                <p className="text-2xl font-bold mt-1">{playerName.trim().toUpperCase() || "—"}</p>
              </div>
              <Button
                className="w-full h-12 text-base font-bold"
                onClick={handleCreate}
                disabled={createRoom.isPending}
              >
                {createRoom.isPending ? "Creating..." : "Create Room →"}
              </Button>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-4">
              <button
                onClick={() => setMode("home")}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back
              </button>
              <div className="text-center">
                <div className="text-4xl mb-2">🔗</div>
                <h2 className="text-xl font-bold">Join a Game</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the room code your friend shared
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">
                  Room Code
                </label>
                <Input
                  placeholder="e.g. ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="text-center text-2xl font-mono font-bold tracking-widest h-14"
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>
              <Button
                className="w-full h-12 text-base font-bold"
                onClick={handleJoin}
                disabled={joinRoom.isPending}
              >
                {joinRoom.isPending ? "Joining..." : "Join Room →"}
              </Button>
            </div>
          )}
        </div>

        {/* How to play */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="font-semibold mb-2 uppercase tracking-wide">How to Play</p>
          <div className="flex justify-center gap-6 text-xs">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">✍️</span>
              <span>Answer questions</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">👉</span>
              <span>Point suspects</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">🗳️</span>
              <span>Vote the AI out</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
