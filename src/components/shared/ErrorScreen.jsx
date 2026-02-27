'use client';

export default function ErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center px-8 text-center">
      <h2 className="text-page-title text-ice-white mb-4">KEINE DATEN VERFÜGBAR</h2>
      <p className="text-body text-muted-blue mb-2">
        Dashboard.json konnte nicht geladen werden.
      </p>
      <p className="text-caption text-faded-blue mb-8 max-w-sm">
        {error || 'Unbekannter Fehler'}
      </p>
      <button
        onClick={onRetry}
        className="auth-button !w-auto px-8"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
