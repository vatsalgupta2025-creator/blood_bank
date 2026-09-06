import { useEffect, useState } from 'react';

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => { setPhase('done'); setTimeout(onDone, 500); }, 300);
          return 100;
        }
        return p + Math.random() * 3.5 + 1.5;
      });
    }, 55);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at 50% 38%, #1e0303 0%, #0a0101 55%, #000 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'done' ? 0 : 1,
      transition: 'opacity 0.55s ease',
      overflow: 'hidden',
    }}>

      {/* Background glow layers */}
      <div style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%)', width: 340, height: 260, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(200,10,40,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%)', width: 580, height: 440, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(120,0,20,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Ripple rings */}
      {[0.6, 1.2, 1.9].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute', top: '46%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 90, height: 90, borderRadius: '50%',
          border: '1.5px solid rgba(220,20,60,0.28)',
          animation: `ripple 2.6s ease-out ${delay}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── MAIN LOGO COMPOSITION ── */}
      <div style={{ position: 'relative', width: 300, height: 300, marginBottom: 28 }}>

        {/* ── TOP HAND (reaching / hovering downward) ── */}
        <div className="anim-hand-top" style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <svg width="280" height="130" viewBox="0 0 280 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="handTopGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a1a1a"/>
                <stop offset="100%" stopColor="#2e2e2e"/>
              </linearGradient>
            </defs>
            {/*
              Palm / wrist band across bottom of top hand.
              The hand is flipped: wrist at top-right, fingers dangle down on left.
            */}
            {/* Wrist / heel of palm */}
            <path d="
              M 200 10
              C 220 8, 250 12, 268 22
              C 272 26, 274 32, 270 38
              C 264 48, 248 54, 230 56
              C 218 58, 205 56, 195 52
              L 185 48
              L 180 60
              L 175 52
              L 168 62
              L 162 50
              L 156 60
              L 150 50
              L 144 58
              L 138 48
              C 130 44, 122 46, 115 50
              C 105 56, 96 62, 88 68
              C 76 76, 64 80, 52 78
              C 38 76, 26 68, 18 58
              C 12 50, 10 40, 14 32
              C 18 24, 28 18, 40 16
              C 55 14, 72 18, 88 24
              C 104 30, 118 36, 134 36
              C 152 36, 168 28, 185 22
              C 190 18, 196 12, 200 10 Z
            " fill="url(#handTopGrad)"/>

            {/* Finger separation lines for realism */}
            <path d="M 180 60 C 178 56, 176 50, 175 44" stroke="#111" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <path d="M 168 62 C 165 57, 164 51, 162 44" stroke="#111" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <path d="M 156 60 C 153 55, 151 49, 150 43" stroke="#111" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <path d="M 144 58 C 141 53, 140 47, 138 41" stroke="#111" strokeWidth="1.2" fill="none" opacity="0.6"/>

            {/* Knuckle highlight */}
            <path d="M 150 38 C 158 34, 168 32, 178 34 C 184 36, 188 40, 186 44" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none"/>

            {/* Thumb area (left of palm) */}
            <path d="
              M 88 24 C 78 20, 66 20, 56 26
              C 46 32, 40 42, 44 52
              C 46 58, 52 62, 58 60
              C 66 58, 72 52, 76 46
              C 80 40, 84 32, 88 24 Z
            " fill="#252525"/>

            {/* Palm center shadow for depth */}
            <ellipse cx="160" cy="46" rx="40" ry="10" fill="rgba(0,0,0,0.18)"/>
          </svg>
        </div>

        {/* ── BLOOD DROP ── */}
        <div className="anim-drop anim-pulse" style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -54%)',
        }}>
          <svg width="76" height="92" viewBox="0 0 76 92" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="dg1" cx="35%" cy="28%" r="70%">
                <stop offset="0%" stopColor="#ff5050"/>
                <stop offset="35%" stopColor="#e01535"/>
                <stop offset="75%" stopColor="#9b0020"/>
                <stop offset="100%" stopColor="#5c0010"/>
              </radialGradient>
              <radialGradient id="dg2" cx="28%" cy="22%" r="42%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.60)"/>
                <stop offset="70%" stopColor="rgba(255,255,255,0.05)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
              </radialGradient>
              <filter id="ds" x="-30%" y="-20%" width="160%" height="160%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
                <feOffset dx="0" dy="5"/>
                <feFlood floodColor="#6b0000" floodOpacity="0.65"/>
                <feComposite in2="SourceAlpha" operator="in"/>
                <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Drop body */}
            <path d="M38 2 C38 2 6 36 6 56 C6 74.8 20.8 88 38 88 C55.2 88 70 74.8 70 56 C70 36 38 2 38 2Z"
              fill="url(#dg1)" filter="url(#ds)"/>
            {/* Gloss overlay */}
            <path d="M38 2 C38 2 6 36 6 56 C6 74.8 20.8 88 38 88 C55.2 88 70 74.8 70 56 C70 36 38 2 38 2Z"
              fill="url(#dg2)"/>
            {/* Specular highlight top-left */}
            <ellipse cx="25" cy="32" rx="7" ry="10" fill="rgba(255,255,255,0.30)" transform="rotate(-18 25 32)"/>
            <ellipse cx="21" cy="25" rx="3" ry="5" fill="rgba(255,255,255,0.48)" transform="rotate(-18 21 25)"/>
            {/* Bottom inner reflection */}
            <ellipse cx="42" cy="74" rx="10" ry="5" fill="rgba(255,80,80,0.18)"/>
          </svg>
        </div>

        {/* ── BOTTOM HAND (cupped upward, receiving) ── */}
        <div className="anim-hand-bot" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <svg width="280" height="130" viewBox="0 0 280 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="handBotGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#1a1a1a"/>
                <stop offset="100%" stopColor="#2e2e2e"/>
              </linearGradient>
            </defs>

            {/* Palm cupped — mirrored of top hand */}
            <path d="
              M 200 120
              C 220 122, 250 118, 268 108
              C 272 104, 274 98, 270 92
              C 264 82, 248 76, 230 74
              C 218 72, 205 74, 195 78
              L 185 82
              L 180 70
              L 175 78
              L 168 68
              L 162 80
              L 156 70
              L 150 80
              L 144 72
              L 138 82
              C 130 86, 122 84, 115 80
              C 105 74, 96 68, 88 62
              C 76 54, 64 50, 52 52
              C 38 54, 26 62, 18 72
              C 12 80, 10 90, 14 98
              C 18 106, 28 112, 40 114
              C 55 116, 72 112, 88 106
              C 104 100, 118 94, 134 94
              C 152 94, 168 102, 185 108
              C 190 112, 196 118, 200 120 Z
            " fill="url(#handBotGrad)"/>

            {/* Finger crease lines */}
            <path d="M 180 70 C 178 74, 176 80, 175 86" stroke="#111" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <path d="M 168 68 C 165 73, 164 79, 162 86" stroke="#111" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <path d="M 156 70 C 153 75, 151 81, 150 87" stroke="#111" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <path d="M 144 72 C 141 77, 140 83, 138 89" stroke="#111" strokeWidth="1.2" fill="none" opacity="0.6"/>

            {/* Knuckle highlight */}
            <path d="M 150 92 C 158 96, 168 98, 178 96 C 184 94, 188 90, 186 86" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none"/>

            {/* Thumb area */}
            <path d="
              M 88 106 C 78 110, 66 110, 56 104
              C 46 98, 40 88, 44 78
              C 46 72, 52 68, 58 70
              C 66 72, 72 78, 76 84
              C 80 90, 84 98, 88 106 Z
            " fill="#252525"/>

            {/* Cup shadow */}
            <ellipse cx="160" cy="84" rx="40" ry="10" fill="rgba(0,0,0,0.15)"/>

            {/* Inner palm glow (receiving blood) */}
            <ellipse cx="140" cy="86" rx="50" ry="12" fill="rgba(180,0,30,0.06)"/>
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className="anim-fadeup" style={{ animationDelay: '0.7s', textAlign: 'center', marginBottom: 34 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 34, fontWeight: 700, color: '#fff',
          letterSpacing: '-0.5px', marginBottom: 5, lineHeight: 1.15,
        }}>
          Blood<span style={{ color: '#dc143c' }}>Bank</span>
        </h1>
        <p style={{ color: '#e08080', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Management System
        </p>
      </div>

      {/* Progress bar */}
      <div className="anim-fadeup" style={{ animationDelay: '0.9s', width: 230 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ color: '#804040', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Initializing
          </span>
          <span style={{ color: '#e09090', fontSize: 10, fontWeight: 700 }}>{Math.min(Math.round(progress), 100)}%</span>
        </div>
        <div style={{ background: '#1a0505', borderRadius: 99, height: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #6b0010, #dc143c, #ff5a5a)',
            width: `${Math.min(progress, 100)}%`,
            transition: 'width 0.08s linear',
            boxShadow: '0 0 10px rgba(220,20,60,0.7)',
          }} />
        </div>
      </div>
    </div>
  );
}
