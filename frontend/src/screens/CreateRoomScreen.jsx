import React, { useState, useEffect, useRef } from 'react';

const MONO = '"Space Mono", monospace';
const panel = { background: 'rgba(3,18,42,0.75)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: '0.75rem', backdropFilter: 'blur(10px)', padding: '1.5rem' };

function OceanCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const bubbles = Array.from({ length: 12 }, () => ({ x: Math.random() * window.innerWidth, y: window.innerHeight + Math.random() * 100, r: 1.2 + Math.random() * 3.5, speed: 0.2 + Math.random() * 0.35, opacity: 0.06 + Math.random() * 0.14 }));
    const fish = Array.from({ length: 3 }, (_, i) => ({ x: Math.random() * window.innerWidth, y: 80 + Math.random() * (window.innerHeight - 160), speed: 0.25 + Math.random() * 0.4, size: 10 + Math.random() * 12, wobble: Math.random() * Math.PI * 2, wobbleSpeed: 0.022, color: ['#38bdf8','#67e8f9','#a5f3fc'][i], opacity: 0.15 + Math.random() * 0.18 }));
    let t = 0;
    function animate(ts) {
      t = ts; const W = canvas.width, H = canvas.height; ctx.clearRect(0, 0, W, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#020d1f'); grad.addColorStop(1, '#031525'); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) { const rx = W * (0.2 + i * 0.3); const rg = ctx.createLinearGradient(rx, 0, rx + 40, H * 0.5); rg.addColorStop(0, 'rgba(56,189,248,0.05)'); rg.addColorStop(1, 'rgba(56,189,248,0)'); ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 0.0007 + i) * 0.3; ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(rx-10,0); ctx.lineTo(rx+50,0); ctx.lineTo(rx+70,H*0.5); ctx.lineTo(rx+10,H*0.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
      bubbles.forEach(b => { b.y -= b.speed; b.x += Math.sin(t*0.0015+b.r)*0.2; if (b.y < -10) { b.y = H+10; b.x = Math.random()*W; } ctx.save(); ctx.globalAlpha = b.opacity; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.stroke(); ctx.restore(); });
      fish.forEach(f => { f.x += f.speed; f.wobble += f.wobbleSpeed; if (f.x > W+60) f.x = -60; const wy = Math.sin(f.wobble)*7; ctx.save(); ctx.globalAlpha = f.opacity; ctx.translate(f.x, f.y+wy); ctx.fillStyle = f.color; ctx.beginPath(); ctx.ellipse(0,0,f.size,f.size*0.42,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-f.size*0.8,0); ctx.lineTo(-f.size*1.35,-f.size*0.4); ctx.lineTo(-f.size*1.35,f.size*0.4); ctx.closePath(); ctx.fill(); ctx.restore(); });
      const gg = ctx.createLinearGradient(0, H-50, 0, H); gg.addColorStop(0,'rgba(2,13,31,0)'); gg.addColorStop(1,'#020d1f'); ctx.fillStyle = gg; ctx.fillRect(0, H-50, W, 50);
      animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />;
}

export default function CreateRoomScreen({ onCreate, onBack }) {
  const [name, setName] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (!name.trim()) return; onCreate(name.trim()); };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#020d1f', overflow: 'hidden' }}>
      <OceanCanvas />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '0 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div style={{ animation: 'fadeUp 0.6s ease-out forwards' }}>
            <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(125,211,252,0.5)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Create room
            </p>
            <h2 style={{ fontFamily: MONO, fontSize: '2rem', fontWeight: 700, color: '#e0f2fe', margin: 0, textShadow: '0 0 30px rgba(56,189,248,0.25)' }}>
              What's your name?
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeUp 0.6s 0.1s ease-out forwards', opacity: 0 }}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
              style={{ width: '100%', background: 'rgba(3,18,42,0.75)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '0.5rem', padding: '0.875rem 1rem', color: '#e0f2fe', fontFamily: MONO, fontSize: '0.9rem', backdropFilter: 'blur(8px)', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            />
            <button
              type="submit"
              disabled={!name.trim()}
              style={{ width: '100%', padding: '0.875rem', background: name.trim() ? 'linear-gradient(135deg,#0369a1,#0284c7)' : 'rgba(3,18,42,0.5)', border: `1px solid ${name.trim() ? '#38bdf8' : 'rgba(56,189,248,0.12)'}`, borderRadius: '0.5rem', color: name.trim() ? '#e0f2fe' : 'rgba(125,211,252,0.3)', fontFamily: MONO, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em', cursor: name.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: name.trim() ? '0 0 20px rgba(56,189,248,0.2)' : 'none' }}
            >
              Create &amp; get room code
            </button>
          </form>

          <button
            onClick={onBack}
            style={{ width: '100%', padding: '0.875rem', background: 'transparent', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '0.5rem', color: 'rgba(125,211,252,0.55)', fontFamily: MONO, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s', animation: 'fadeUp 0.6s 0.2s ease-out forwards', opacity: 0 }}
            onMouseEnter={e => { e.target.style.borderColor = 'rgba(56,189,248,0.45)'; e.target.style.color = '#7dd3fc'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(56,189,248,0.2)'; e.target.style.color = 'rgba(125,211,252,0.55)'; }}
          >
            ← Back
          </button>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color: rgba(125,211,252,0.3); }
        input:focus { outline:none; border-color:rgba(56,189,248,0.5)!important; box-shadow:0 0 16px rgba(56,189,248,0.1); }
      `}</style>
    </div>
  );
}