import React, { useEffect, useRef } from 'react';

const MONO = '"Space Mono", monospace';

function OceanCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const bubbles = Array.from({length:14},()=>({x:Math.random()*window.innerWidth,y:window.innerHeight+Math.random()*100,r:1.2+Math.random()*4,speed:0.25+Math.random()*0.4,opacity:0.07+Math.random()*0.14}));
    const fish = Array.from({length:4},(_,i)=>({x:Math.random()*window.innerWidth,y:60+Math.random()*(window.innerHeight-120),speed:0.25+Math.random()*0.4,size:9+Math.random()*12,wobble:Math.random()*Math.PI*2,wobbleSpeed:0.02,color:['#38bdf8','#67e8f9','#a5f3fc','#93c5fd'][i],opacity:0.14+Math.random()*0.16}));
    let t=0;
    function animate(ts) {
      t=ts; const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H);
      const grad=ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,'#020d1f'); grad.addColorStop(1,'#031525'); ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
      for(let i=0;i<3;i++){const rx=W*(0.2+i*0.3);const rg=ctx.createLinearGradient(rx,0,rx+40,H*0.5);rg.addColorStop(0,'rgba(56,189,248,0.04)');rg.addColorStop(1,'rgba(56,189,248,0)');ctx.save();ctx.globalAlpha=0.5+Math.sin(t*0.0007+i)*0.3;ctx.fillStyle=rg;ctx.beginPath();ctx.moveTo(rx-10,0);ctx.lineTo(rx+50,0);ctx.lineTo(rx+70,H*0.5);ctx.lineTo(rx+10,H*0.5);ctx.closePath();ctx.fill();ctx.restore();}
      bubbles.forEach(b=>{b.y-=b.speed;b.x+=Math.sin(t*0.0015+b.r)*0.2;if(b.y<-10){b.y=H+10;b.x=Math.random()*W;}ctx.save();ctx.globalAlpha=b.opacity;ctx.strokeStyle='#7dd3fc';ctx.lineWidth=0.7;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.stroke();ctx.restore();});
      fish.forEach(f=>{f.x+=f.speed;f.wobble+=f.wobbleSpeed;if(f.x>W+60)f.x=-60;const wy=Math.sin(f.wobble)*6;ctx.save();ctx.globalAlpha=f.opacity;ctx.translate(f.x,f.y+wy);ctx.fillStyle=f.color;ctx.beginPath();ctx.ellipse(0,0,f.size,f.size*0.42,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-f.size*0.8,0);ctx.lineTo(-f.size*1.35,-f.size*0.4);ctx.lineTo(-f.size*1.35,f.size*0.4);ctx.closePath();ctx.fill();ctx.restore();});
      animId=requestAnimationFrame(animate);
    }
    animId=requestAnimationFrame(animate);
    return ()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize);};
  },[]);
  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0}} />;
}

export default function RoundEndScreen({ reveal, round }) {
  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#020d1f',overflow:'hidden'}}>
      <OceanCanvas />
      <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'2rem 1.5rem'}}>
        <div style={{width:'100%',maxWidth:560,display:'flex',flexDirection:'column',gap:'1.5rem'}}>

          {/* Header */}
          <div style={{textAlign:'center',animation:'fadeUp 0.6s ease-out forwards'}}>
            <p style={{fontFamily:MONO,fontSize:'0.6rem',letterSpacing:'0.2em',color:'rgba(125,211,252,0.5)',textTransform:'uppercase',marginBottom:'0.6rem'}}>
              Round over — masks off
            </p>
            <h2 style={{fontFamily:MONO,fontSize:'1.8rem',fontWeight:700,color:'#e0f2fe',margin:0,textShadow:'0 0 30px rgba(56,189,248,0.25)'}}>
              Identities revealed
            </h2>
          </div>

          {/* Reveal cards */}
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',animation:'fadeUp 0.6s 0.1s ease-out forwards',opacity:0}}>
            {reveal.map(({label, name, isAi}) => (
              <div
                key={label}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'1.1rem 1.4rem',
                  borderRadius:'0.65rem',
                  border: isAi?'1px solid rgba(239,68,68,0.45)':'1px solid rgba(56,189,248,0.18)',
                  background: isAi?'rgba(127,29,29,0.2)':'rgba(3,18,42,0.7)',
                  backdropFilter:'blur(8px)',
                  boxShadow: isAi?'0 0 24px rgba(239,68,68,0.1)':'none',
                }}
              >
                <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                  <span style={{fontFamily:MONO,fontSize:'0.55rem',letterSpacing:'0.18em',color: isAi?'rgba(252,165,165,0.5)':'rgba(125,211,252,0.4)',textTransform:'uppercase'}}>
                    Answer {label}
                  </span>
                  <span style={{fontFamily:MONO,fontSize:'1.05rem',fontWeight:700,color: isAi?'#fca5a5':'#e0f2fe'}}>
                    {name}
                  </span>
                </div>
                {isAi && (
                  <span style={{fontFamily:MONO,fontSize:'0.6rem',letterSpacing:'0.12em',background:'rgba(239,68,68,0.2)',border:'1px solid rgba(239,68,68,0.4)',color:'#fca5a5',padding:'0.25rem 0.75rem',borderRadius:'99px',fontWeight:700,textTransform:'uppercase'}}>
                    AI
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Next round indicator */}
          <div style={{textAlign:'center',animation:'fadeUp 0.6s 0.25s ease-out forwards',opacity:0}}>
            <p style={{fontFamily:MONO,fontSize:'0.65rem',letterSpacing:'0.12em',color:'rgba(125,211,252,0.4)',animation:'pulse 2s ease-in-out infinite'}}>
              {round < 3 ? '~ next round surfacing soon... ~' : '~ final vote descending... ~'}
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes fadeUp {from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse {0%,100%{opacity:0.45;}50%{opacity:0.9;}}
      `}</style>
    </div>
  );
}