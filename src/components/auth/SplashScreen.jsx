'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    try {
      const audio = new Audio('/jingle.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch (e) {}

    const t1 = setTimeout(() => setPhase('shimmer'), 400);
    const t2 = setTimeout(() => setPhase('hold'), 1400);
    const t3 = setTimeout(() => setPhase('fadeout'), 3000);
    const t4 = setTimeout(() => onComplete(), 4000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-[#0f1729] flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
      phase === 'fadeout' ? 'opacity-0' : 'opacity-100'
    }`}>
      <div className={`relative max-w-[80vw] max-h-[60vh] lg:max-w-[500px] transition-all duration-700 ease-out ${
        phase === 'enter' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <img
          src="/splash.jpeg"
          alt="Baldur Creek Capital"
          className="w-full h-full object-contain"
        />

        {(phase === 'shimmer' || phase === 'hold') && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(105deg, transparent 35%, rgba(218,165,32,0.25) 48%, rgba(255,255,255,0.1) 50%, rgba(218,165,32,0.25) 52%, transparent 65%)',
              animation: 'splashShimmer 2s ease-in-out infinite',
            }} />
            <style>{`
              @keyframes splashShimmer {
                0% { transform: translateX(-150%); }
                100% { transform: translateX(150%); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}