import React, { useState, useEffect, useRef } from 'react';

export default function QuestionScreen({ round, question, onSubmit }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [wordCount, setWordCount] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const count = answer.trim() === '' ? 0 : answer.trim().split(/\s+/).length;
    setWordCount(count);
  }, [answer]);

  // Subtle ambient canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const bubbles = Array.from({ length: 10 }, () => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + Math.random() * 100,
      r: 1 + Math.random() * 3.5,
      speed: 0.2 + Math.random() * 0.35,
      opacity: 0.06 + Math.random() * 0.12,
    }));

    // One slow fish in the far background
    const bgFish = { x: -80, y: window.innerHeight * 0.15, speed: 0.25, size: 18, wobble: 0 };

    let t = 0;
    function animate(ts) {
      t = ts;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#020d1f');
      grad.addColorStop(1, '#031525');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Faint light ray
      const rayGrad = ctx.createLinearGradient(W * 0.6, 0, W * 0.6, H * 0.5);
      rayGrad.addColorStop(0, 'rgba(56,189,248,0.04)');
      rayGrad.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(W * 0.55, 0);
      ctx.lineTo(W * 0.7, 0);
      ctx.lineTo(W * 0.8, H * 0.5);
      ctx.lineTo(W * 0.45, H * 0.5);
      ctx.closePath();
      ctx.fill();

      bubbles.forEach(b => {
        b.y -= b.speed;
        b.x += Math.sin(t * 0.001 + b.r) * 0.2;
        if (b.y < -10) { b.y = H + 10; b.x = Math.random() * W; }
        ctx.save();
        ctx.globalAlpha = b.opacity;
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Background fish
      bgFish.x += bgFish.speed;
      bgFish.wobble += 0.02;
      if (bgFish.x > W + 80) bgFish.x = -80;
      const wy = Math.sin(bgFish.wobble) * 6;
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.translate(bgFish.x, bgFish.y + wy);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(0, 0, bgFish.size, bgFish.size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-bgFish.size * 0.8, 0);
      ctx.lineTo(-bgFish.size * 1.3, -bgFish.size * 0.38);
      ctx.lineTo(-bgFish.size * 1.3, bgFish.size * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) return;
    const wc = trimmed.split(/\s+/).length;
    if (wc < 5) { alert('Answer must be at least 5 words'); return; }
    if (wc > 40) { alert('Answer must be at most 40 words'); return; }
    onSubmit(trimmed);
    setSubmitted(true);
  };

  const progress = (timeLeft / 30) * 100;
  const monoFont = '"Space Mono", monospace';

  const panelStyle = {
    background: 'rgba(3, 18, 42, 0.7)',
    border: '1px solid rgba(56,189,248,0.18)',
    borderRadius: '0.75rem',
    backdropFilter: 'blur(10px)',
    padding: '1.5rem',
  };

  const tooFew = wordCount > 0 && wordCount < 5;
  const tooMany = wordCount > 40;
  const wordOk = wordCount >= 5 && wordCount <= 40;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#020d1f', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '2rem 1.5rem',
      }}>
        <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Round dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {[1, 2, 3].map(r => (
              <div key={r} style={{
                width: r === round ? 24 : 8, height: 8,
                borderRadius: 4,
                background: r <= round ? '#38bdf8' : 'rgba(56,189,248,0.15)',
                boxShadow: r === round ? '0 0 10px rgba(56,189,248,0.6)' : 'none',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>

          {/* Timer bar */}
          <div style={{ width: '100%', height: 3, background: 'rgba(56,189,248,0.1)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: timeLeft <= 8 ? '#f87171' : '#38bdf8',
              boxShadow: timeLeft <= 8 ? '0 0 8px #f87171' : '0 0 8px rgba(56,189,248,0.6)',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p style={{ fontFamily: monoFont, fontSize: '0.6rem', letterSpacing: '0.18em', color: 'rgba(125,211,252,0.5)', textTransform: 'uppercase' }}>
              Round {round} of 3
            </p>
            <p style={{
              fontFamily: monoFont, fontSize: '0.85rem',
              color: timeLeft <= 8 ? '#f87171' : 'rgba(125,211,252,0.6)',
              textShadow: timeLeft <= 8 ? '0 0 10px #f87171' : 'none',
            }}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </p>
          </div>

          {/* Question */}
          <div style={panelStyle}>
            <h2 style={{
              fontFamily: monoFont,
              fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
              fontWeight: 700, color: '#e0f2fe',
              lineHeight: 1.45, margin: 0,
            }}>
              {question}
            </h2>
          </div>

          {/* Input or submitted state */}
          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                maxLength={300}
                autoFocus
                rows={5}
                style={{
                  width: '100%',
                  background: 'rgba(3, 18, 42, 0.7)',
                  border: `1px solid ${wordOk ? 'rgba(56,189,248,0.4)' : tooFew || tooMany ? 'rgba(248,113,113,0.4)' : 'rgba(56,189,248,0.18)'}`,
                  borderRadius: '0.6rem',
                  padding: '0.875rem 1rem',
                  color: '#e0f2fe',
                  fontFamily: monoFont,
                  fontSize: '0.85rem',
                  lineHeight: 1.7,
                  resize: 'none',
                  outline: 'none',
                  backdropFilter: 'blur(8px)',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{
                  fontFamily: monoFont, fontSize: '0.6rem',
                  color: tooFew || tooMany ? '#f87171' : wordOk ? '#38bdf8' : 'rgba(125,211,252,0.4)',
                  letterSpacing: '0.08em',
                }}>
                  {wordCount} / 40 words &nbsp;{tooFew ? '(min 5)' : tooMany ? '(max 40)' : wordOk ? '✓' : ''}
                </p>
                <button
                  type="submit"
                  disabled={!wordOk}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: wordOk ? 'linear-gradient(135deg, #0369a1, #0284c7)' : 'rgba(3,18,42,0.5)',
                    border: `1px solid ${wordOk ? '#38bdf8' : 'rgba(56,189,248,0.15)'}`,
                    borderRadius: '0.5rem',
                    color: wordOk ? '#e0f2fe' : 'rgba(125,211,252,0.3)',
                    fontFamily: monoFont,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: wordOk ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    boxShadow: wordOk ? '0 0 16px rgba(56,189,248,0.2)' : 'none',
                  }}
                >
                  Submit answer
                </button>
              </div>
            </form>
          ) : (
            <div style={{
              ...panelStyle,
              textAlign: 'center', padding: '2.5rem',
            }}>
              <div style={{
                width: 40, height: 40, margin: '0 auto 1rem',
                borderRadius: '50%',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 20px rgba(56,189,248,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#38bdf8', fontSize: '1.1rem' }}>✓</span>
              </div>
              <p style={{
                fontFamily: monoFont, fontSize: '0.7rem',
                letterSpacing: '0.1em', color: 'rgba(125,211,252,0.5)',
                animation: 'pulse 2s ease-in-out infinite',
              }}>
                answer sent into the deep — waiting for others...
              </p>
            </div>
          )}
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        textarea::placeholder { color: rgba(125,211,252,0.3); }
        textarea:focus { border-color: rgba(56,189,248,0.5) !important; box-shadow: 0 0 16px rgba(56,189,248,0.1); }
      `}</style>
    </div>
  );
}