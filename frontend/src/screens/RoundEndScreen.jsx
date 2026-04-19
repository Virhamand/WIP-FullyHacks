import React from 'react';

export default function RoundEndScreen({ reveal, round }) {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-4">
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            Round over — identities revealed
          </p>
          <div className="space-y-3">
            {reveal.map(({ label, name, isAi }) => (
              <div
                key={label}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isAi
                    ? 'border-red-500 bg-red-500 bg-opacity-10'
                    : 'border-slate-700 bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono tracking-widest text-slate-400">
                    Answer {label}
                  </span>
                  <span className="font-bold text-lg">{name}</span>
                </div>
                {isAi && (
                  <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                    AI
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm font-mono text-slate-400 animate-pulse pt-4">
            {round < 3 ? 'Next round starting soon...' : 'Final vote starting...'}
          </p>
        </div>
      </div>
    </div>
  );
}
