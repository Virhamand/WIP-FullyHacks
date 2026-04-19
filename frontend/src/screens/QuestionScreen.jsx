import React, { useState, useEffect } from 'react';

export default function QuestionScreen({ round, question, onSubmit }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [wordCount, setWordCount] = useState(0);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Word count
  useEffect(() => {
    const count = answer.trim() === '' ? 0 : answer.trim().split(/\s+/).length;
    setWordCount(count);
  }, [answer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) return;

    const wordCount = trimmed.split(/\s+/).length;
    
    if (wordCount < 5) {
      alert("Answer must be at least 5 words");
      return;
    }
    
    if (wordCount > 40) {
      alert("Answer must be at most 40 words");
      return;
    }

    onSubmit(trimmed);
    setSubmitted(true);
  };

  const progress = (timeLeft / 30) * 100;

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

        {/* Header */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              Round {round} of 3
            </p>
            <p className="text-sm font-mono text-slate-400">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </p>
          </div>
        </div>

        {/* Question */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold leading-snug">
            {question}
          </h2>
        </div>

        {/* Input area */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              maxLength="300"
              autoFocus
              rows="5"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-lime-400 focus:outline-none transition resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs font-mono text-slate-400">
                Word must be between 5-40 words: {wordCount} / 40
              </p>
              <button
                type="submit"
                disabled={!answer.trim()}
                className="bg-lime-400 text-slate-900 py-2 px-6 rounded-lg font-bold hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit answer
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm font-mono text-slate-400 animate-pulse">
              Answer submitted — waiting for others...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
