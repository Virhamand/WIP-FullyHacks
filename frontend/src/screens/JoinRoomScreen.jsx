import React, { useState } from 'react';

export default function JoinRoomScreen({ onJoin, onBack }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || code.length !== 4) return;
    onJoin(name.trim(), code.toUpperCase());
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-3">
            Join room
          </p>
          <h2 className="text-3xl font-bold">Enter the code</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength="20"
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-lime-400 focus:outline-none transition"
          />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength="4"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 text-center text-2xl tracking-widest font-mono font-bold focus:border-lime-400 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={!name.trim() || code.length !== 4}
            className="w-full bg-lime-400 text-slate-900 py-3 px-6 rounded-lg font-bold hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Join game
          </button>
        </form>

        <button
          onClick={onBack}
          className="w-full border border-slate-600 text-slate-300 py-3 px-6 rounded-lg font-semibold hover:border-slate-400 hover:text-slate-100 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
