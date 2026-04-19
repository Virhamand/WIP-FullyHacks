import React, { useEffect, useRef } from 'react';

export default function HomeScreen({ onNavigate }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fish = Array.from({ length: 7 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: 120 + Math.random() * (window.innerHeight - 200),
      speed: 0.4 + Math.random() * 0.6,
      size: 14 + Math.random() * 18,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.02,
      color: ['#38bdf8', '#7dd3fc', '#a5f3fc', '#67e8f9', '#93c5fd'][i % 5],
      opacity: 0.5 + Math.random() * 0.4,
    }));

    const shark = { x: -120, y: window.innerHeight * 0.55, speed: 1.1, size: 55 };

    const bubbles = Array.from({ length: 18 }, () => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + Math.random() * 200,
      r: 2 + Math.random() * 5,
      speed: 0.3 + Math.random() * 0.5,
      opacity: 0.1 + Math.random() * 0.25,
    }));

    function drawFish(ctx, x, y, size, color, opacity, flip) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      if (flip) ctx.scale(-1, 1);
      ctx.fillStyle = color;
      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(-size * 0.8, 0);
      ctx.lineTo(-size * 1.4, -size * 0.45);
      ctx.lineTo(-size * 1.4, size * 0.45);
      ctx.closePath();
      ctx.fill();
      // Eye
      ctx.fillStyle = '#0c1a2e';
      ctx.beginPath();
      ctx.arc(size * 0.5, -size * 0.1, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawShark(ctx, x, y, size) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.translate(x, y);
      ctx.fillStyle = '#1e3a5f';
      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(-size * 0.85, 0);
      ctx.lineTo(-size * 1.5, -size * 0.5);
      ctx.lineTo(-size * 1.5, size * 0.5);
      ctx.closePath();
      ctx.fill();
      // Dorsal fin
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, -size * 0.35);
      ctx.lineTo(size * 0.25, -size * 0.8);
      ctx.lineTo(size * 0.45, -size * 0.35);
      ctx.closePath();
      ctx.fill();
      // Eye
      ctx.fillStyle = '#0c1a2e';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(size * 0.45, -size * 0.08, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawRay(ctx, t) {
      ctx.save();
      const x = (window.innerWidth * 0.15) + Math.sin(t * 0.0003) * 40;
      const y = window.innerHeight * 0.75 + Math.sin(t * 0.0005) * 20;
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#4f86c6';
      ctx.beginPath();
      ctx.ellipse(x, y, 70, 28, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // tail
      ctx.strokeStyle = '#4f86c6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 65, y + 8);
      ctx.quadraticCurveTo(x - 110, y + 40, x - 90, y + 80);
      ctx.stroke();
      ctx.restore();
    }

    function drawSeaweed(ctx, baseX, height) {
      ctx.save();
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const bx = baseX + i * 22;
        ctx.beginPath();
        ctx.moveTo(bx, canvas.height);
        for (let j = 0; j < 6; j++) {
          const yy = canvas.height - (j + 1) * (height / 6);
          const wave = Math.sin(t * 0.01 + j * 0.8 + i) * 10;
          ctx.quadraticCurveTo(bx + wave + 12, yy + height / 12, bx + wave * 0.5, yy);
        }
        ctx.globalAlpha = 0.45;
        ctx.stroke();
      }
      ctx.restore();
    }

    function animate(ts) {
      t = ts;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Ocean gradient bg
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#020d1f');
      grad.addColorStop(0.5, '#051c3b');
      grad.addColorStop(1, '#03122a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Light rays from top
      for (let i = 0; i < 5; i++) {
        const rx = W * 0.2 + i * W * 0.16;
        const rayGrad = ctx.createLinearGradient(rx, 0, rx + 60, H * 0.7);
        rayGrad.addColorStop(0, 'rgba(100,180,255,0.07)');
        rayGrad.addColorStop(1, 'rgba(100,180,255,0)');
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(t * 0.0008 + i) * 0.3;
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(rx - 20, 0);
        ctx.lineTo(rx + 80, 0);
        ctx.lineTo(rx + 80 + 60, H * 0.7);
        ctx.lineTo(rx - 20 + 20, H * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Bubbles
      bubbles.forEach(b => {
        b.y -= b.speed;
        b.x += Math.sin(t * 0.002 + b.r) * 0.3;
        if (b.y < -10) { b.y = H + 10; b.x = Math.random() * W; }
        ctx.save();
        ctx.globalAlpha = b.opacity;
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Seaweed clusters
      drawSeaweed(ctx, W * 0.05, 130);
      drawSeaweed(ctx, W * 0.88, 100);
      drawSeaweed(ctx, W * 0.93, 80);

      // Manta ray
      drawRay(ctx, t);

      // Fish
      fish.forEach(f => {
        f.x += f.speed;
        f.wobble += f.wobbleSpeed;
        const wy = Math.sin(f.wobble) * 8;
        if (f.x > W + 80) f.x = -80;
        drawFish(ctx, f.x, f.y + wy, f.size, f.color, f.opacity, false);
      });

      // Shark (slow patrol)
      shark.x += shark.speed;
      if (shark.x > W + 200) shark.x = -200;
      drawShark(ctx, shark.x, shark.y + Math.sin(t * 0.0006) * 15, shark.size);

      // Ground
      const groundGrad = ctx.createLinearGradient(0, H - 80, 0, H);
      groundGrad.addColorStop(0, 'rgba(5,30,60,0)');
      groundGrad.addColorStop(1, '#020d1f');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H - 80, W, 80);

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#020d1f', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
      />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '0 1.5rem',
      }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          {/* Depth badge */}
          <p style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.65rem', letterSpacing: '0.2em',
            color: '#38bdf8', textTransform: 'uppercase',
            marginBottom: '1.5rem', opacity: 0.8,
            animation: 'fadeUp 0.7s ease-out forwards',
          }}>
            ～ A social deduction game ～
          </p>

          {/* Title */}
          <h1 style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: '#e0f2fe',
            marginBottom: '0.5rem',
            animation: 'fadeUp 0.7s 0.1s ease-out forwards',
            opacity: 0,
            textShadow: '0 0 40px rgba(56,189,248,0.3)',
          }}>
            So you think<br />you can spot
          </h1>
          <h1 style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: '#38bdf8',
            marginBottom: '2.5rem',
            animation: 'fadeUp 0.7s 0.2s ease-out forwards',
            opacity: 0,
            textShadow: '0 0 60px rgba(56,189,248,0.5)',
          }}>
            the AI?
          </h1>

          {/* Buttons */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            animation: 'fadeUp 0.7s 0.3s ease-out forwards',
            opacity: 0,
          }}>
            <button
              onClick={() => onNavigate('create')}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                background: 'linear-gradient(135deg, #0369a1, #0284c7)',
                border: '1px solid #38bdf8',
                borderRadius: '0.5rem',
                color: '#e0f2fe',
                fontFamily: '"Space Mono", monospace',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 0 20px rgba(56,189,248,0.2)',
              }}
              onMouseEnter={e => { e.target.style.boxShadow = '0 0 30px rgba(56,189,248,0.4)'; e.target.style.borderColor = '#7dd3fc'; }}
              onMouseLeave={e => { e.target.style.boxShadow = '0 0 20px rgba(56,189,248,0.2)'; e.target.style.borderColor = '#38bdf8'; }}
            >
              Create room
            </button>
            <button
              onClick={() => onNavigate('join')}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                background: 'transparent',
                border: '1px solid rgba(56,189,248,0.35)',
                borderRadius: '0.5rem',
                color: '#7dd3fc',
                fontFamily: '"Space Mono", monospace',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'rgba(56,189,248,0.7)'; e.target.style.color = '#bae6fd'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(56,189,248,0.35)'; e.target.style.color = '#7dd3fc'; }}
            >
              Join room
            </button>
          </div>

          {/* Footer */}
          <p style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.65rem', letterSpacing: '0.12em',
            color: 'rgba(125,211,252,0.45)',
            marginTop: '2rem',
            animation: 'fadeUp 0.7s 0.4s ease-out forwards',
            opacity: 0,
          }}>
            2 players + 1 AI &nbsp;•&nbsp; 3 rounds &nbsp;•&nbsp; one vote
          </p>
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}