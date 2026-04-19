import React, { useState, useEffect, useRef } from 'react';

const MONO = '"Space Mono", monospace';

function OceanCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const bubbles = Array.from({ length: 10 }, () => ({ x: Math.random()*window.innerWidth, y: window.innerHeight+Math.random()*100, r: 1.2+Math.random()*3.5, speed: 0.2+Math.random()*0.35, opacity: 0.06+Math.random()*0.12 }));
    const fish = Array.from({ length: 3 }, (_, i) => ({ x: Math.random()*window.innerWidth, y: 60+Math.random()*(window.innerHeight-120), speed: 0.2+Math.random()*0.35, size: 9+Math.random()*11, wobble: Math.random()*Math.PI*2, wobbleSpeed: 0.02, color: ['#38bdf8','#67e8f9','#93c5fd'][i], opacity: 0.12+Math.random()*0.15 }));
    let t = 0;
    function animate(ts) {
      t = ts; const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H);
      const grad=ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,'#020d1f'); grad.addColorStop(1,'#031525'); ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
      bubbles.forEach(b => { b.y-=b.speed; b.x+=Math.sin(t*0.0015+b.r)*0.2; if(b.y<-10){b.y=H+10;b.x=Math.random()*W;} ctx.save(); ctx.globalAlpha=b.opacity; ctx.strokeStyle='#7dd3fc'; ctx.lineWidth=0.7; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.stroke(); ctx.restore(); });
      fish.forEach(f => { f.x+=f.speed; f.wobble+=f.wobbleSpeed; if(f.x>W+60)f.x=-60; const wy=Math.sin(f.wobble)*6; ctx.save(); ctx.globalAlpha=f.opacity; ctx.translate(f.x,f.y+wy); ctx.fillStyle=f.color; ctx.beginPath(); ctx.ellipse(0,0,f.size,f.size*0.42,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-f.size*0.8,0); ctx.lineTo(-f.size*1.35,-f.size*0.4); ctx.lineTo(-f.size*1.35,f.size*0.4); ctx.closePath(); ctx.fill(); ctx.restore(); });
      animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:0 }} />;
}

export default function RevealScreen({ question, round, answers, selectedLabel, onSelect }) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = (timeLeft / 20) * 100;

  const handleSelect = (label) => {
    if (!submitted) { onSelect(label); setSubmitted(true); }
  };

  return (
    <div style={{ position:'relative', minHeight:'100vh', background:'#020d1f', overflow:'hidden' }}>
      <OceanCanvas />
      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'2rem 1.5rem' }}>
        <div style={{ width:'100%', maxWidth:680, display:'flex', flexDirection:'column', gap:'1.25rem' }}>

          {/* Round dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem' }}>
            {[1,2,3].map(r => (
              <div key={r} style={{ width: r===round?24:8, height:8, borderRadius:4, background: r<=round?'#38bdf8':'rgba(56,189,248,0.15)', boxShadow: r===round?'0 0 10px rgba(56,189,248,0.6)':'none', transition:'all 0.3s' }} />
            ))}
          </div>

          {/* Timer bar */}
          <div style={{ width:'100%', height:3, background:'rgba(56,189,248,0.1)', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress}%`, background: timeLeft<=8?'#f87171':'#38bdf8', boxShadow: timeLeft<=8?'0 0 8px #f87171':'0 0 8px rgba(56,189,248,0.6)', transition:'width 1s linear, background 0.3s' }} />
          </div>

          {/* Question context */}
          {question && (
            <div style={{ background:'rgba(3,18,42,0.6)', border:'1px solid rgba(56,189,248,0.12)', borderRadius:'0.6rem', padding:'1rem 1.25rem' }}>
              <p style={{ fontFamily:MONO, fontSize:'0.55rem', letterSpacing:'0.18em', color:'rgba(125,211,252,0.45)', textTransform:'uppercase', marginBottom:'0.5rem' }}>The question was</p>
              <p style={{ fontFamily:MONO, fontSize:'0.85rem', color:'rgba(224,242,254,0.8)', margin:0, lineHeight:1.5 }}>{question}</p>
            </div>
          )}

          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <div>
              <h2 style={{ fontFamily:MONO, fontSize:'1.6rem', fontWeight:700, color:'#e0f2fe', margin:0, textShadow:'0 0 20px rgba(56,189,248,0.3)' }}>Point at the AI</h2>
              <p style={{ fontFamily:MONO, fontSize:'0.65rem', color:'rgba(125,211,252,0.45)', marginTop:'0.35rem', letterSpacing:'0.05em' }}>Tap the answer you think was written by the AI. Not a vote yet.</p>
            </div>
            <p style={{ fontFamily:MONO, fontSize:'0.9rem', color: timeLeft<=8?'#f87171':'rgba(125,211,252,0.6)', textShadow: timeLeft<=8?'0 0 10px #f87171':'none', flexShrink:0, marginLeft:'1rem' }}>
              {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
            </p>
          </div>

          {/* Answer cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {answers.map(({ label, text }) => {
              const sel = selectedLabel === label;
              return (
                <button
                  key={label}
                  onClick={() => handleSelect(label)}
                  style={{ width:'100%', textAlign:'left', padding:'1.25rem', borderRadius:'0.65rem', border: sel ? '1px solid rgba(56,189,248,0.6)' : '1px solid rgba(56,189,248,0.15)', background: sel ? 'rgba(56,189,248,0.08)' : 'rgba(3,18,42,0.65)', backdropFilter:'blur(8px)', cursor:'pointer', transition:'all 0.2s', boxShadow: sel ? '0 0 20px rgba(56,189,248,0.12)' : 'none' }}
                >
                  <p style={{ fontFamily:MONO, fontSize:'0.55rem', letterSpacing:'0.2em', color: sel?'#38bdf8':'rgba(125,211,252,0.4)', textTransform:'uppercase', marginBottom:'0.6rem' }}>Answer {label}</p>
                  <p style={{ fontFamily:MONO, fontSize:'0.85rem', color: sel?'#e0f2fe':'rgba(224,242,254,0.75)', margin:0, lineHeight:1.6 }}>
                    {text || <em style={{ color:'rgba(125,211,252,0.3)' }}>No answer submitted</em>}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Confirm / waiting */}
          {!submitted ? (
            <button
              onClick={() => selectedLabel && handleSelect(selectedLabel)}
              disabled={!selectedLabel}
              style={{ width:'100%', padding:'0.875rem', background: selectedLabel?'linear-gradient(135deg,#0369a1,#0284c7)':'rgba(3,18,42,0.5)', border:`1px solid ${selectedLabel?'#38bdf8':'rgba(56,189,248,0.12)'}`, borderRadius:'0.5rem', color: selectedLabel?'#e0f2fe':'rgba(125,211,252,0.3)', fontFamily:MONO, fontWeight:700, fontSize:'0.9rem', letterSpacing:'0.05em', cursor: selectedLabel?'pointer':'not-allowed', transition:'all 0.2s', boxShadow: selectedLabel?'0 0 20px rgba(56,189,248,0.2)':'none' }}
            >
              Confirm suspicion
            </button>
          ) : (
            <div style={{ textAlign:'center', padding:'1.5rem', background:'rgba(3,18,42,0.5)', border:'1px solid rgba(56,189,248,0.12)', borderRadius:'0.65rem' }}>
              <p style={{ fontFamily:MONO, fontSize:'0.65rem', letterSpacing:'0.1em', color:'rgba(125,211,252,0.5)', animation:'pulse 2s ease-in-out infinite', margin:0 }}>
                suspicion logged — waiting for round to end...
              </p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:0.45;} 50%{opacity:0.9;} }
      `}</style>
    </div>
  );
}