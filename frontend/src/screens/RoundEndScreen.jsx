import React from 'react';

export default function RoundEndScreen({ reveal, round }) {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-6">
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            Round {round} of 3 — suspicions
          </p>

          <div className="space-y-3">
            {reveal.map(({ label, pointedAtLabel }) => (
              <div
                key={label}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800"
              >
                <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
                  Answer {label}
                </span>
                <span className="text-sm text-slate-300">
                  pointed at{' '}
                  <span className="font-bold text-white">Answer {pointedAtLabel ?? '—'}</span>
                </span>
              </div>
            ))}
          </div>

          <p className="text-sm font-mono text-slate-400 animate-pulse pt-2">
            {round < 3 ? 'Next round starting soon...' : 'Final vote starting...'}
          </p>
        </div>
      </div>
    </div>
  );
}