import React, { useEffect, useRef } from 'react';

export default function LobbyScreen({ roomCode, players, isHost, onStart }) {
  const canvasRef = useRef(null);
  const ready = players.length === 2;

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

    // Small ambient fish for lobby
    const fish = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: 60 + Math.random() * (window.innerHeight - 120),
      speed: 0.3 + Math.random() * 0.4,
      size: 10 + Math.random() * 12,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.025 + Math.random() * 0.02,
      color: ['#38bdf8', '#67e8f9', '#a5f3fc', '#7dd3fc', '#93c5fd'][i % 5],
      opacity: 0.25 + Math.random() * 0.3,
    }));

    const bubbles = Array.from({ length: 12 }, () => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + Math.random() * 100,
      r: 1.5 + Math.random() * 4,
      speed: 0.25 + Math.random() * 0.4,
      opacity: 0.08 + Math.random() * 0.18,
    }));

    function drawFish(ctx, x, y, size, color, opacity) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-size * 0.8, 0);
      ctx.lineTo(-size * 1.35, -size * 0.4);
      ctx.lineTo(-size * 1.35, size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#031627';
      ctx.beginPath();
      ctx.arc(size * 0.5, -size * 0.08, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    let t = 0;
    function animate(ts) {
      t = ts;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#020d1f');
      grad.addColorStop(0.6, '#041830');
      grad.addColorStop(1, '#020d1f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Subtle light column from top center
      const colGrad = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.6);
      colGrad.addColorStop(0, 'rgba(56,189,248,0.06)');
      colGrad.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = colGrad;
      ctx.fillRect(0, 0, W, H);

      bubbles.forEach(b => {
        b.y -= b.speed;
        b.x += Math.sin(t * 0.0015 + b.r) * 0.25;
        if (b.y < -10) { b.y = H + 10; b.x = Math.random() * W; }
        ctx.save();
        ctx.globalAlpha = b.opacity;
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      fish.forEach(f => {
        f.x += f.speed;
        f.wobble += f.wobbleSpeed;
        const wy = Math.sin(f.wobble) * 7;
        if (f.x > W + 60) f.x = -60;
        drawFish(ctx, f.x, f.y + wy, f.size, f.color, f.opacity);
      });

      // Ground fade
      const gGrad = ctx.createLinearGradient(0, H - 60, 0, H);
      gGrad.addColorStop(0, 'rgba(2,13,31,0)');
      gGrad.addColorStop(1, '#020d1f');
      ctx.fillStyle = gGrad;
      ctx.fillRect(0, H - 60, W, 60);

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const panelStyle = {
    background: 'rgba(3, 18, 42, 0.75)',
    border: '1px solid rgba(56,189,248,0.2)',
    borderRadius: '0.75rem',
    backdropFilter: 'blur(8px)',
    padding: '1.5rem',
  };

  const monoFont = '"Space Mono", monospace';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#020d1f', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '0 1.5rem',
      }}>
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Room code */}
          <div style={{ ...panelStyle, textAlign: 'center' }}>
            <p style={{
              fontFamily: monoFont, fontSize: '0.6rem',
              letterSpacing: '0.2em', color: 'rgba(125,211,252,0.55)',
              textTransform: 'uppercase', marginBottom: '1rem',
            }}>
              Room code
            </p>
            <div style={{
              fontFamily: monoFont,
              fontSize: '4.5rem', fontWeight: 700,
              letterSpacing: '0.2em',
              color: '#38bdf8',
              textShadow: '0 0 40px rgba(56,189,248,0.5)',
              lineHeight: 1,
            }}>
              {roomCode}
            </div>
          </div>

          {/* Players */}
          <div style={panelStyle}>
            <p style={{
              fontFamily: monoFont, fontSize: '0.6rem',
              letterSpacing: '0.2em', color: 'rgba(125,211,252,0.55)',
              textTransform: 'uppercase', marginBottom: '1.25rem',
            }}>
              Players in the deep
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: monoFont, fontSize: '3.5rem', fontWeight: 700, color: '#38bdf8', textShadow: '0 0 20px rgba(56,189,248,0.4)' }}>
                {players.length}
              </span>
              <span style={{ fontFamily: monoFont, fontSize: '1rem', color: 'rgba(125,211,252,0.5)' }}>/ 2</span>
            </div>

            {/* Player slots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              {[0, 1].map(i => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.85rem',
                  background: players[i] ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${players[i] ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '0.5rem',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: players[i] ? '#38bdf8' : 'rgba(255,255,255,0.15)',
                    boxShadow: players[i] ? '0 0 8px #38bdf8' : 'none',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: monoFont, fontSize: '0.85rem',
                    color: players[i] ? '#e0f2fe' : 'rgba(125,211,252,0.25)',
                  }}>
                    {players[i]?.name || '~ awaiting diver ~'}
                  </span>
                </div>
              ))}
            </div>

            {!ready && (
              <p style={{
                fontFamily: monoFont, fontSize: '0.6rem',
                letterSpacing: '0.12em', color: 'rgba(125,211,252,0.4)',
                textAlign: 'center', marginTop: '1rem',
                animation: 'pulse 2s ease-in-out infinite',
              }}>
                waiting for second diver...
              </p>
            )}
          </div>

          {/* Start / waiting */}
          {isHost ? (
            <button
              onClick={onStart}
              disabled={!ready}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: ready ? 'linear-gradient(135deg, #0369a1, #0284c7)' : 'rgba(3,18,42,0.5)',
                border: `1px solid ${ready ? '#38bdf8' : 'rgba(56,189,248,0.15)'}`,
                borderRadius: '0.5rem',
                color: ready ? '#e0f2fe' : 'rgba(125,211,252,0.3)',
                fontFamily: monoFont,
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
                cursor: ready ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: ready ? '0 0 20px rgba(56,189,248,0.2)' : 'none',
              }}
            >
              {ready ? 'Dive in →' : 'Waiting for crew...'}
            </button>
          ) : (
            <div style={{
              textAlign: 'center', fontFamily: monoFont,
              fontSize: '0.75rem', color: 'rgba(125,211,252,0.4)',
              letterSpacing: '0.08em',
            }}>
              Waiting for host to dive in...
            </div>
          )}

          <p style={{
            textAlign: 'center', fontFamily: monoFont,
            fontSize: '0.6rem', letterSpacing: '0.12em',
            color: 'rgba(125,211,252,0.25)',
          }}>
            share the room code with your crew
          </p>
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}