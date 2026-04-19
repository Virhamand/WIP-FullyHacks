import React, { useState, useEffect } from 'react';

export default function RevealScreen({ question, round, answers, selectedLabel, onSelect }) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = (timeLeft / 20) * 100;

  const handleSelect = (label) => {
    if (!submitted) {
      onSelect(label);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Round indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map(r => (
            <div
              key={r}
              className={`w-2 h-2 rounded-full transition-all ${
                r < round ? 'bg-lime-400' : r === round ? 'bg-lime-400 shadow-lg shadow-lime-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Timer bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              timeLeft <= 8 ? 'bg-red-500' : 'bg-lime-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        
        {/* Question */}
        {question && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <p className="text-sm text-slate-400 mb-2">The question was:</p>
            <p className="text-base font-semibold text-white">{question}</p>
          </div>
        )}

        {/* Header */}
        <div className="space-y-1">
          <div className="flex justify-between items-baseline">
            <h2 className="text-2xl font-bold">Point at the AI</h2>
            <p className="text-sm font-mono text-slate-400">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </p>
          </div>
          <p className="text-sm text-slate-400">
            Tap the answer you think was written by the AI. This isn't a vote yet.
          </p>
        </div>

        {/* Answer cards */}
        <div className="space-y-3">
          {answers.map(({ label, text }) => (
            <button
              key={label}
              onClick={() => handleSelect(label)}
              className={`w-full text-left p-5 rounded-lg border transition-all ${
                selectedLabel === label
                  ? 'border-lime-400 bg-lime-400 bg-opacity-10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >
              <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">
                Answer {label}
              </p>
              <p className="text-base text-white">
                {text || <em className="text-slate-500">No answer submitted</em>}
              </p>
            </button>
          ))}
        </div>

        {/* Submit button */}
        {!submitted && (
          <button
            onClick={() => handleSelect(selectedLabel)}
            disabled={!selectedLabel}
            className="w-full bg-lime-400 text-slate-900 py-3 px-6 rounded-lg font-bold hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm suspicion
          </button>
        )}

        {submitted && (
          <div className="text-center py-4">
            <p className="text-sm font-mono text-slate-400 animate-pulse">
              Suspicion sent — waiting for round to end...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
