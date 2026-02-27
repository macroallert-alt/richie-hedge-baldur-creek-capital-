'use client';

import { AuthProvider } from '@/context/AuthContext';
import { DashboardProvider } from '@/context/DashboardContext';
import { useAuthContext } from '@/context/AuthContext';
import AuthGate from '@/components/auth/AuthGate';
import SplashScreen from '@/components/auth/SplashScreen';
import AppShell from '@/components/layout/AppShell';
import { useState } from 'react';

function AppContent() {
  const { isAuthenticated, isChecking } = useAuthContext();
  const [showSplash, setShowSplash] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  // Still checking localStorage
  if (isChecking) {
    return (
      <div className="min-h-screen bg-navy-deep flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-baldur-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated → show password screen
  if (!isAuthenticated) {
    return <AuthGate />;
  }

  // Authenticated but splash not done
  if (showSplash && !splashDone) {
    return (
      <SplashScreen
        onComplete={() => {
          setShowSplash(false);
          setSplashDone(true);
        }}
      />
    );
  }

  // Authenticated + splash done → show app
  return (
    <DashboardProvider>
      <AppShell />
    </DashboardProvider>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
