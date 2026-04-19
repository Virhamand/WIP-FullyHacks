import React, { useState } from 'react';

export default function CreateRoomScreen({ onCreate, onBack }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-3">
            Create room
          </p>
          <h2 className="text-3xl font-bold">What's your name?</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength="20"
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-lime-400 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-lime-400 text-slate-900 py-3 px-6 rounded-lg font-bold hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create &amp; get room code
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
