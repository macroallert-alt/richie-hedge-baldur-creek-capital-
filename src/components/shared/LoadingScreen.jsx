'use client';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center gap-4">
      <img
        src="/logo.jpeg"
        alt="Loading"
        className="w-12 h-12 rounded-full animate-spin-logo"
      />
      <p className="text-muted-blue text-body">Lade Dashboard...</p>
    </div>
  );
}
