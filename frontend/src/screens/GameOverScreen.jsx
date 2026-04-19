import React from 'react';

export default function GameOverScreen({ winner, aiPlayerId, players, votes, onPlayAgain }) {
  const aiPlayer = players.find(p => p.id === aiPlayerId);
  const isPlayersWin = winner === 'players';

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-xl space-y-8">
        {/* Outcome */}
        <div className="text-center space-y-4 animate-fade-in">
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            {isPlayersWin ? 'Players win' : 'AI wins'}
          </p>
          <h1 className={`text-5xl font-black leading-tight ${
            isPlayersWin ? 'text-lime-400' : 'text-red-500'
          }`}>
            {isPlayersWin ? 'You spotted the AI!' : 'The AI fooled you all.'}
          </h1>
        </div>

        {/* Vote breakdown */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            The votes
          </p>
          <div className="space-y-3">
            {votes.map((vote) => {
              const voter = players.find(p => p.id === vote.fromPlayerId);
              const suspect = players.find(p => p.id === vote.suspectId);
              const correct = vote.suspectId === aiPlayerId;

              return (
                <div
                  key={`${vote.fromPlayerId}-${vote.suspectId}`}
                  className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0"
                >
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold">{voter?.name}</span> voted for{' '}
                      <span className="font-semibold">{suspect?.name}</span>
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    correct
                      ? 'bg-lime-400 bg-opacity-20 text-lime-400'
                      : 'bg-red-500 bg-opacity-20 text-red-500'
                  }`}>
                    {correct ? 'correct' : 'wrong'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI reveal */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-3">
            The AI was
          </p>
          <p className="text-2xl font-bold text-red-400">
            {aiPlayer?.name}
          </p>
        </div>

        {/* Play again */}
        <button
          onClick={onPlayAgain}
          className="w-full bg-lime-400 text-slate-900 py-3 px-6 rounded-lg font-bold hover:bg-lime-300 transition-colors"
        >
          Play again
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.6s ease-out; }
      `}</style>
    </div>
  );
}
