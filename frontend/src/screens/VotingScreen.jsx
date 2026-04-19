import React, { useState, useEffect } from 'react';

export default function VotingScreen({ players, selectedVoteId, onVote }) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = (timeLeft / 20) * 100;

  const handleVote = (playerId) => {
    if (!submitted) {
      onVote(playerId);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Timer bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              timeLeft <= 8 ? 'bg-red-500' : 'bg-lime-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <h2 className="text-3xl font-bold">Final vote</h2>
            <p className="text-sm font-mono text-slate-400">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </p>
          </div>
          <h3 className="text-2xl font-bold">Who is the AI?</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400">
          This is your binding vote. Both players must vote for the same person to win.
        </p>

        {/* Vote options */}
        <div className="space-y-3">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => handleVote(player.id)}
              className={`w-full text-left p-5 rounded-lg border transition-all ${
                selectedVoteId === player.id
                  ? 'border-red-500 bg-red-500 bg-opacity-10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >
              <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">
                Player
              </p>
              <p className="text-xl font-bold text-white">
                {player.name}
              </p>
            </button>
          ))}
        </div>

        {/* Submit button */}
        {!submitted && (
          <button
            onClick={() => handleVote(selectedVoteId)}
            disabled={!selectedVoteId}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Lock in vote
          </button>
        )}

        {submitted && (
          <div className="text-center py-4">
            <p className="text-sm font-mono text-slate-400 animate-pulse">
              Vote locked — waiting for other player...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}