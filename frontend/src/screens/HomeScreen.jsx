import React from 'react';

export default function HomeScreen({ onNavigate }) {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-up">
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            A social deduction game
          </p>
          <h1 className="text-5xl md:text-6xl font-black leading-none">
            So you think you can <span className="text-lime-400">spot the AI?</span>
          </h1>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => onNavigate('create')}
            className="w-full bg-lime-400 text-slate-900 py-3 px-6 rounded-lg font-bold hover:bg-lime-300 transition-colors"
          >
            Create room
          </button>
          <button
            onClick={() => onNavigate('join')}
            className="w-full border border-slate-600 text-slate-300 py-3 px-6 rounded-lg font-semibold hover:border-slate-400 hover:text-slate-100 transition-colors"
          >
            Join room
          </button>
        </div>

        {/* Description */}
        <p className="text-center text-xs font-mono text-slate-400 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          2 players + 1 AI • 3 rounds • one vote
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.6s ease-out forwards; opacity: 0; }
      `}</style>
    </div>
  );
}
