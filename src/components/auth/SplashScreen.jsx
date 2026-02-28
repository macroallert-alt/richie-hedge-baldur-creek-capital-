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
    <div className={`fixed inset-0 z-[100] bg-navy-deep flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out ${
      phase === 'fadeout' ? 'opacity-0' : 'opacity-100'
    }`}>
      <div className={`relative w-[160px] h-[160px] lg:w-[200px] lg:h-[200px] rounded-full overflow-hidden transition-all duration-700 ease-out ${
        phase === 'enter' ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
      }`}>
        <img
          src="/splash.jpeg"
          alt="Baldur Creek Capital"
          className="w-full h-full object-cover rounded-full"
        />

        {(phase === 'shimmer' || phase === 'hold') && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(105deg, transparent 35%, rgba(218,165,32,0.3) 48%, rgba(255,255,255,0.15) 50%, rgba(218,165,32,0.3) 52%, transparent 65%)',
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

        <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
          phase === 'shimmer' || phase === 'hold' ? 'opacity-100' : 'opacity-0'
        }`} style={{ boxShadow: '0 0 50px 10px rgba(218,165,32,0.12), 0 0 100px 20px rgba(218,165,32,0.06)' }} />
      </div>

      <h1 className={`mt-8 text-[22px] lg:text-[28px] font-light tracking-[0.2em] text-ice-white transition-all duration-700 ease-out ${
        phase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}>
        BALDUR CREEK CAPITAL
      </h1>

      <div className={`mt-3 h-[1px] bg-gradient-to-r from-transparent via-[#DAA520] to-transparent transition-all duration-700 ease-out ${
        phase !== 'enter' ? 'w-48 opacity-60' : 'w-0 opacity-0'
      }`} />
    </div>
  );
}