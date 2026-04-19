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

        {/* Player count */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            Players joined
          </p>
          <div className="text-center">
            <div className="text-5xl font-black text-lime-400 mb-2">{players.length}</div>
            <p className="text-slate-400">/ 2 players</p>
          </div>
          {!ready && (
            <div className="text-xs font-mono text-slate-500 text-center mt-4 animate-pulse">
              waiting for second player...
            </div>
          )}
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