'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('logo'); // 'logo' → 'title' → 'transition'

  useEffect(() => {
    // Play jingle (triggered by auth submit = user interaction, so autoplay OK)
    try {
      const audio = new Audio('/jingle.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {
        console.log('Audio autoplay blocked — continuing silently');
      });
    } catch (e) {
      // Continue without audio
    }

    // Timeline per Spec §3.3:
    // 0.0s - Logo appears (scale 0→1)
    // 0.3s - Title fades in
    // 2.0s - Transition to dashboard
    const titleTimer = setTimeout(() => setPhase('title'), 300);
    const completeTimer = setTimeout(() => {
      setPhase('transition');
      setTimeout(onComplete, 500); // Wait for transition animation
    }, 2000);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-splash bg-navy-deep flex flex-col items-center justify-center">
      {/* Logo - scale animation */}
      <div
        className={`transition-all duration-300 ease-out ${
          phase === 'transition'
            ? 'w-8 h-8 -translate-y-[40vh] -translate-x-[30vw] opacity-0'
            : 'w-[120px] h-[120px] lg:w-[160px] lg:h-[160px]'
        } ${phase === 'logo' ? 'animate-[scale-in_300ms_ease-out_forwards]' : ''}`}
      >
        <img
          src="/logo.jpeg"
          alt="Baldur Creek Capital"
          className="w-full h-full object-contain rounded-full"
        />
      </div>

      {/* Title - fade in with delay */}
      <h1
        className={`mt-6 text-[20px] font-semibold text-ice-white tracking-wide transition-all duration-200 ease-out ${
          phase === 'logo'
            ? 'opacity-0 translate-y-[10px]'
            : phase === 'transition'
            ? 'opacity-0 -translate-y-4'
            : 'opacity-100 translate-y-0'
        }`}
      >
        Baldur Creek Capital
      </h1>
    </div>
  );
}
