import React, { useEffect, useRef } from 'react';

const MONO = '"Space Mono", monospace';

function OceanCanvas({ isPlayersWin }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    resize(); window.addEventListener('resize', resize);

    const bubbles = Array.from({length:16},()=>({x:Math.random()*window.innerWidth,y:window.innerHeight+Math.random()*100,r:1.2+Math.random()*4,speed:0.25+Math.random()*0.4,opacity:0.07+Math.random()*0.15}));
    const shark = { x: -160, y: 0, speed: 0.9, size: 55 };
    const fish = isPlayersWin ? Array.from({length:6},(_,i)=>({x:Math.random()*window.innerWidth,y:60+Math.random()*(window.innerHeight-120),speed:0.3+Math.random()*0.5,size:10+Math.random()*14,wobble:Math.random()*Math.PI*2,wobbleSpeed:0.022,color:['#38bdf8','#67e8f9','#a5f3fc','#7dd3fc','#93c5fd','#bae6fd'][i],opacity:0.2+Math.random()*0.2})) : [];

    let t=0;
    function animate(ts) {
      t=ts; const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H);

      // BG tint based on outcome
      const grad=ctx.createLinearGradient(0,0,0,H);
      if (isPlayersWin) { grad.addColorStop(0,'#020d1f'); grad.addColorStop(0.5,'#031a2e'); grad.addColorStop(1,'#020d1f'); }
      else { grad.addColorStop(0,'#0d0202'); grad.addColorStop(0.5,'#1a0303'); grad.addColorStop(1,'#0d0202'); }
      ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);

      // Rays
      const rayColor = isPlayersWin ? '56,189,248' : '239,68,68';
      for(let i=0;i<3;i++){const rx=W*(0.2+i*0.3);const rg=ctx.createLinearGradient(rx,0,rx+40,H*0.6);rg.addColorStop(0,`rgba(${rayColor},0.06)`);rg.addColorStop(1,`rgba(${rayColor},0)`);ctx.save();ctx.globalAlpha=0.5+Math.sin(t*0.0007+i)*0.3;ctx.fillStyle=rg;ctx.beginPath();ctx.moveTo(rx-10,0);ctx.lineTo(rx+50,0);ctx.lineTo(rx+70,H*0.6);ctx.lineTo(rx+10,H*0.6);ctx.closePath();ctx.fill();ctx.restore();}

      bubbles.forEach(b=>{b.y-=b.speed;b.x+=Math.sin(t*0.0015+b.r)*0.2;if(b.y<-10){b.y=H+10;b.x=Math.random()*W;}ctx.save();ctx.globalAlpha=b.opacity;ctx.strokeStyle= isPlayersWin?'#7dd3fc':'#fca5a5';ctx.lineWidth=0.7;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.stroke();ctx.restore();});

      // Celebratory fish (players win) or shark (AI wins)
      if (isPlayersWin) {
        fish.forEach(f=>{f.x+=f.speed;f.wobble+=f.wobbleSpeed;if(f.x>W+60)f.x=-60;const wy=Math.sin(f.wobble)*7;ctx.save();ctx.globalAlpha=f.opacity;ctx.translate(f.x,f.y+wy);ctx.fillStyle=f.color;ctx.beginPath();ctx.ellipse(0,0,f.size,f.size*0.42,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-f.size*0.8,0);ctx.lineTo(-f.size*1.35,-f.size*0.4);ctx.lineTo(-f.size*1.35,f.size*0.4);ctx.closePath();ctx.fill();ctx.restore();});
      } else {
        // Shark circles menacingly
        shark.y = H*0.5 + Math.sin(t*0.0005)*30;
        shark.x += shark.speed;
        if(shark.x>W+200)shark.x=-200;
        const s=shark.size;
        ctx.save();ctx.globalAlpha=0.25;ctx.translate(shark.x,shark.y);
        ctx.fillStyle='#3b0a0a';
        ctx.beginPath();ctx.ellipse(0,0,s,s*0.32,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.moveTo(-s*0.85,0);ctx.lineTo(-s*1.5,-s*0.48);ctx.lineTo(-s*1.5,s*0.48);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.moveTo(-s*0.1,-s*0.32);ctx.lineTo(s*0.25,-s*0.75);ctx.lineTo(s*0.45,-s*0.32);ctx.closePath();ctx.fill();
        ctx.restore();
      }

      animId=requestAnimationFrame(animate);
    }
    animId=requestAnimationFrame(animate);
    return ()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize);};
  },[isPlayersWin]);
  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0}} />;
}

export default function GameOverScreen({ winner, aiPlayerId, players, votes, onPlayAgain }) {
  const aiPlayer = players.find(p => p.id === aiPlayerId);
  const isPlayersWin = winner === 'players';

  return (
    <div style={{position:'relative',minHeight:'100vh',background: isPlayersWin?'#020d1f':'#0d0202',overflow:'hidden'}}>
      <OceanCanvas isPlayersWin={isPlayersWin} />
      <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'2rem 1.5rem'}}>
        <div style={{width:'100%',maxWidth:560,display:'flex',flexDirection:'column',gap:'1.5rem'}}>

          {/* Outcome */}
          <div style={{textAlign:'center',animation:'fadeIn 0.7s ease-out forwards'}}>
            <p style={{fontFamily:MONO,fontSize:'0.6rem',letterSpacing:'0.2em',color: isPlayersWin?'rgba(125,211,252,0.5)':'rgba(252,165,165,0.5)',textTransform:'uppercase',marginBottom:'0.75rem'}}>
              {isPlayersWin ? 'Players win' : 'AI wins'}
            </p>
            <h1 style={{fontFamily:MONO,fontSize:'clamp(1.8rem,5vw,2.8rem)',fontWeight:700,color: isPlayersWin?'#38bdf8':'#f87171',margin:0,lineHeight:1.2,textShadow: isPlayersWin?'0 0 40px rgba(56,189,248,0.4)':'0 0 40px rgba(248,113,113,0.4)'}}>
              {isPlayersWin ? 'You spotted\nthe AI!' : 'The AI fooled\nyou all.'}
            </h1>
          </div>

          {/* Votes */}
          <div style={{background:'rgba(3,18,42,0.75)',border:`1px solid ${isPlayersWin?'rgba(56,189,248,0.18)':'rgba(248,113,113,0.15)'}`,borderRadius:'0.75rem',backdropFilter:'blur(10px)',padding:'1.5rem',animation:'fadeIn 0.7s 0.15s ease-out forwards',opacity:0}}>
            <p style={{fontFamily:MONO,fontSize:'0.6rem',letterSpacing:'0.18em',color: isPlayersWin?'rgba(125,211,252,0.45)':'rgba(252,165,165,0.45)',textTransform:'uppercase',marginBottom:'1rem'}}>
              The votes
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
              {votes.map((vote) => {
                const voter = players.find(p => p.id === vote.fromPlayerId);
                const suspect = players.find(p => p.id === vote.suspectId);
                const correct = vote.suspectId === aiPlayerId;
                return (
                  <div key={`${vote.fromPlayerId}-${vote.suspectId}`} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.85rem 0',borderBottom:'1px solid rgba(56,189,248,0.08)'}}>
                    <p style={{fontFamily:MONO,fontSize:'0.8rem',color:'rgba(224,242,254,0.75)',margin:0}}>
                      <span style={{color:'#e0f2fe',fontWeight:700}}>{voter?.name}</span>
                      <span style={{color:'rgba(125,211,252,0.4)'}}> voted for </span>
                      <span style={{color:'#e0f2fe',fontWeight:700}}>{suspect?.name}</span>
                    </p>
                    <span style={{fontFamily:MONO,fontSize:'0.55rem',letterSpacing:'0.12em',fontWeight:700,textTransform:'uppercase',padding:'0.2rem 0.6rem',borderRadius:'99px',flexShrink:0,marginLeft:'1rem',background: correct?'rgba(56,189,248,0.12)':'rgba(248,113,113,0.12)',border: correct?'1px solid rgba(56,189,248,0.3)':'1px solid rgba(248,113,113,0.3)',color: correct?'#38bdf8':'#f87171'}}>
                      {correct ? 'correct' : 'wrong'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI reveal */}
          <div style={{background:'rgba(127,29,29,0.2)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'0.75rem',backdropFilter:'blur(10px)',padding:'1.25rem 1.5rem',animation:'fadeIn 0.7s 0.25s ease-out forwards',opacity:0}}>
            <p style={{fontFamily:MONO,fontSize:'0.6rem',letterSpacing:'0.18em',color:'rgba(252,165,165,0.45)',textTransform:'uppercase',marginBottom:'0.5rem'}}>
              The AI was hiding as
            </p>
            <p style={{fontFamily:MONO,fontSize:'1.5rem',fontWeight:700,color:'#fca5a5',margin:0,textShadow:'0 0 20px rgba(252,165,165,0.3)'}}>
              {aiPlayer?.name}
            </p>
          </div>

          {/* Play again */}
          <button
            onClick={onPlayAgain}
            style={{width:'100%',padding:'0.875rem',background: isPlayersWin?'linear-gradient(135deg,#0369a1,#0284c7)':'linear-gradient(135deg,#7f1d1d,#991b1b)',border:`1px solid ${isPlayersWin?'#38bdf8':'rgba(239,68,68,0.5)'}`,borderRadius:'0.5rem',color: isPlayersWin?'#e0f2fe':'#fca5a5',fontFamily:MONO,fontWeight:700,fontSize:'0.9rem',letterSpacing:'0.05em',cursor:'pointer',transition:'all 0.2s',boxShadow: isPlayersWin?'0 0 20px rgba(56,189,248,0.2)':'0 0 20px rgba(239,68,68,0.15)',animation:'fadeIn 0.7s 0.35s ease-out forwards',opacity:0}}
          >
            Play again
          </button>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes fadeIn {from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
      `}</style>
    </div>
  );
}