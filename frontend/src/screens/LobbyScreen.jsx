import React from 'react';

export default function LobbyScreen({ roomCode, players, isHost, onStart }) {
  const ready = players.length === 2;

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Room code */}
        <div className="text-center">
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-4">
            Room code
          </p>
          <div className="text-7xl font-black tracking-widest text-lime-400" style={{ letterSpacing: '0.15em' }}>
            {roomCode}
          </div>
        </div>

        {/* Players joined */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              Players joined
            </p>
            <span className="text-sm font-mono text-slate-400">{players.length} / 2</span>
          </div>

          <div className="space-y-2 min-h-[4rem]">
            {players.map((player, i) => (
              <div
                key={player.id}
                className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0"
              >
                <div className="w-2 h-2 rounded-full bg-lime-400" />
                <span className="font-semibold">{player.name}</span>
                {i === 0 && (
                  <span className="ml-auto text-xs font-mono text-slate-500">host</span>
                )}
              </div>
            ))}
            {players.length < 2 && (
              <div className="flex items-center gap-3 py-2">
                <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
                <span className="text-sm text-slate-500 animate-pulse">waiting for player 2...</span>
              </div>
            )}
          </div>
        </div>

        {/* Start button */}
        {isHost && (
          <button
            onClick={onStart}
            disabled={!ready}
            className="w-full bg-lime-400 text-slate-900 py-3 px-6 rounded-lg font-bold hover:bg-lime-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Start game
          </button>
        )}

        {!isHost && (
          <div className="text-center text-sm text-slate-400">
            Waiting for host to start...
          </div>
        )}

        <p className="text-center text-xs font-mono text-slate-500">
          Share the room code with your friend
        </p>
      </div>
    </div>
  );
}