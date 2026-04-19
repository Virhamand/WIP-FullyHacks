import React, { useState, useEffect, useRef } from 'react';

const MONO = '"Space Mono", monospace';

function OceanCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const bubbles = Array.from({length:10},()=>({x:Math.random()*window.innerWidth,y:window.innerHeight+Math.random()*100,r:1.2+Math.random()*3.5,speed:0.2+Math.random()*0.35,opacity:0.06+Math.random()*0.12}));
    // Ominous shark for the vote screen
    const shark = { x: -150, y: 0, speed: 0.7, size: 50 };
    let t = 0;
    function animate(ts) {
      t=ts; const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H);
      const grad=ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,'#020d1f'); grad.addColorStop(0.5,'#06111f'); grad.addColorStop(1,'#020d1f'); ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
      // Ominous red tint
      const redGrad=ctx.createRadialGradient(W*0.5,H*0.5,0,W*0.5,H*0.5,W*0.6); redGrad.addColorStop(0,'rgba(127,29,29,0.06)'); redGrad.addColorStop(1,'rgba(127,29,29,0)'); ctx.fillStyle=redGrad; ctx.fillRect(0,0,W,H);
      bubbles.forEach(b => { b.y-=b.speed; b.x+=Math.sin(t*0.0015+b.r)*0.2; if(b.y<-10){b.y=H+10;b.x=Math.random()*W;} ctx.save(); ctx.globalAlpha=b.opacity; ctx.strokeStyle='#7dd3fc'; ctx.lineWidth=0.7; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.stroke(); ctx.restore(); });
      // Shark patrol
      shark.y = H*0.55 + Math.sin(t*0.0005)*20;
      shark.x += shark.speed;
      if (shark.x > W+200) shark.x = -200;
      const s = shark.size;
      ctx.save(); ctx.globalAlpha=0.18; ctx.translate(shark.x, shark.y);
      ctx.fillStyle='#1e293b';
      ctx.beginPath(); ctx.ellipse(0,0,s,s*0.32,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s*0.85,0); ctx.lineTo(-s*1.5,-s*0.48); ctx.lineTo(-s*1.5,s*0.48); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s*0.1,-s*0.32); ctx.lineTo(s*0.25,-s*0.75); ctx.lineTo(s*0.45,-s*0.32); ctx.closePath(); ctx.fill();
      ctx.restore();
      animId=requestAnimationFrame(animate);
    }
    animId=requestAnimationFrame(animate);
    return ()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize);};
  },[]);
  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0}} />;
}

export default function VotingScreen({ players, selectedVoteId, onVote }) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t-1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = (timeLeft/20)*100;
  const handleVote = (playerId) => { if (!submitted) { onVote(playerId); setSubmitted(true); } };

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#020d1f',overflow:'hidden'}}>
      <OceanCanvas />
      <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'2rem 1.5rem'}}>
        <div style={{width:'100%',maxWidth:560,display:'flex',flexDirection:'column',gap:'1.25rem'}}>

          {/* Timer */}
          <div style={{width:'100%',height:3,background:'rgba(248,113,113,0.15)',borderRadius:99,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${progress}%`,background: timeLeft<=8?'#ef4444':'#f87171',boxShadow:'0 0 8px rgba(248,113,113,0.5)',transition:'width 1s linear'}} />
          </div>

          {/* Header */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
            <div>
              <h2 style={{fontFamily:MONO,fontSize:'1.8rem',fontWeight:700,color:'#fca5a5',margin:0,textShadow:'0 0 30px rgba(248,113,113,0.3)'}}>Final vote</h2>
              <h3 style={{fontFamily:MONO,fontSize:'1.1rem',fontWeight:700,color:'#e0f2fe',margin:'0.25rem 0 0'}}>Who is the AI?</h3>
            </div>
            <p style={{fontFamily:MONO,fontSize:'0.9rem',color: timeLeft<=8?'#f87171':'rgba(252,165,165,0.6)',textShadow: timeLeft<=8?'0 0 10px #f87171':'none',flexShrink:0,marginLeft:'1rem'}}>
              {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
            </p>
          </div>

          <p style={{fontFamily:MONO,fontSize:'0.65rem',letterSpacing:'0.08em',color:'rgba(252,165,165,0.45)',marginTop:'-0.5rem'}}>
            Binding vote. Both players must choose the same person to win.
          </p>

          {/* Player options */}
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {players.map(player => {
              const sel = selectedVoteId===player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => handleVote(player.id)}
                  style={{width:'100%',textAlign:'left',padding:'1.25rem 1.5rem',borderRadius:'0.65rem',border: sel?'1px solid rgba(239,68,68,0.6)':'1px solid rgba(248,113,113,0.15)',background: sel?'rgba(127,29,29,0.25)':'rgba(3,18,42,0.65)',backdropFilter:'blur(8px)',cursor:'pointer',transition:'all 0.2s',boxShadow: sel?'0 0 24px rgba(239,68,68,0.15)':'none'}}
                >
                  <p style={{fontFamily:MONO,fontSize:'0.55rem',letterSpacing:'0.2em',color: sel?'#fca5a5':'rgba(252,165,165,0.35)',textTransform:'uppercase',marginBottom:'0.4rem'}}>Player</p>
                  <p style={{fontFamily:MONO,fontSize:'1.2rem',fontWeight:700,color: sel?'#fca5a5':'#e0f2fe',margin:0,textShadow: sel?'0 0 16px rgba(252,165,165,0.4)':'none'}}>{player.name}</p>
                </button>
              );
            })}
          </div>

          {/* Lock in / waiting */}
          {!submitted ? (
            <button
              onClick={() => selectedVoteId && handleVote(selectedVoteId)}
              disabled={!selectedVoteId}
              style={{width:'100%',padding:'0.875rem',background: selectedVoteId?'linear-gradient(135deg,#7f1d1d,#991b1b)':'rgba(3,18,42,0.5)',border:`1px solid ${selectedVoteId?'rgba(239,68,68,0.6)':'rgba(248,113,113,0.12)'}`,borderRadius:'0.5rem',color: selectedVoteId?'#fca5a5':'rgba(252,165,165,0.3)',fontFamily:MONO,fontWeight:700,fontSize:'0.9rem',letterSpacing:'0.05em',cursor: selectedVoteId?'pointer':'not-allowed',transition:'all 0.2s',boxShadow: selectedVoteId?'0 0 24px rgba(239,68,68,0.2)':'none'}}
            >
              Lock in vote
            </button>
          ) : (
            <div style={{textAlign:'center',padding:'1.5rem',background:'rgba(3,18,42,0.5)',border:'1px solid rgba(248,113,113,0.12)',borderRadius:'0.65rem'}}>
              <p style={{fontFamily:MONO,fontSize:'0.65rem',letterSpacing:'0.1em',color:'rgba(252,165,165,0.5)',animation:'pulse 2s ease-in-out infinite',margin:0}}>
                vote locked in — waiting for the other diver...
              </p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes pulse {0%,100%{opacity:0.45;}50%{opacity:0.9;}}
      `}</style>
    </div>
  );
}