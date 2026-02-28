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

    const t1 = setTimeout(() => setPhase('shimmer'), 600);
    const t2 = setTimeout(() => setPhase('title'), 1200);
    const t3 = setTimeout(() => setPhase('hold'), 2000);
    const t4 = setTimeout(() => setPhase('flyout'), 3200);
    const t5 = setTimeout(() => onComplete(), 4200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onComplete]);

  const logoStyle = () => {
    if (phase === 'enter') return 'w-[140px] h-[140px] lg:w-[180px] lg:h-[180px] scale-0 opacity-0';
    if (phase === 'flyout') return 'w-8 h-8 fixed top-4 left-4 opacity-100';
    return 'w-[140px] h-[140px] lg:w-[180px] lg:h-[180px] scale-100 opacity-100';
  };

  const showShimmer = phase === 'shimmer' || phase === 'title' || phase === 'hold';
  const showTitle = phase === 'title' || phase === 'hold';
  const isFlyout = phase === 'flyout';

  return (
    <div className={`fixed inset-0 z-[100] bg-navy-deep flex flex-col items-center justify-center transition-opacity duration-700 ${isFlyout ? 'opacity-0' : 'opacity-100'}`}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #DAA520 0%, transparent 70%)' }} />
      </div>

      <div className={`relative transition-all duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${logoStyle()}`}>
        <img
          src="/logo.jpeg"
          alt="Baldur Creek Capital"
          className="w-full h-full object-contain rounded-full"
        />

        {phase === 'enter' && (
          <style>{`
            div[class*="scale-0"] { animation: logoReveal 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            @keyframes logoReveal {
              0% { transform: scale(0) rotate(-10deg); opacity: 0; }
              60% { transform: scale(1.05) rotate(2deg); opacity: 1; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
          `}</style>
        )}

        {showShimmer && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(218,165,32,0.3) 50%, transparent 60%)',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }} />
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>
          </div>
        )}

        <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${showShimmer ? 'opacity-100' : 'opacity-0'}`}
          style={{ boxShadow: '0 0 40px 8px rgba(218,165,32,0.15), 0 0 80px 16px rgba(218,165,32,0.08)' }} />
      </div>

      <h1 className={`mt-8 text-[22px] lg:text-[28px] font-light tracking-[0.2em] text-ice-white transition-all duration-700 ease-out ${
        showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        BALDUR CREEK CAPITAL
      </h1>

      <div className={`mt-3 h-[1px] bg-gradient-to-r from-transparent via-[#DAA520] to-transparent transition-all duration-700 ease-out ${
        showTitle ? 'w-48 opacity-60' : 'w-0 opacity-0'
      }`} />

      <p className={`mt-4 text-[11px] tracking-[0.3em] uppercase transition-all duration-500 delay-200 ${
        showTitle ? 'opacity-40' : 'opacity-0'
      }`} style={{ color: '#DAA520' }}>
        Global Macro Intelligence
      </p>
    </div>
  );
}