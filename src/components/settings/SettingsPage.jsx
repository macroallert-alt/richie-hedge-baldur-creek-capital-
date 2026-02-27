'use client';

import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';

export default function SettingsPage({ dashboard }) {
  const { logout } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);

  const handleClearCache = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      alert('Cache konnte nicht gelöscht werden');
    }
  };

  const pipelineHealth = dashboard?.pipeline_health || {};
  const lastStep = pipelineHealth.steps?.step_7_writer;

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title lg:text-page-title-desktop">Einstellungen</h1>

      {/* Password Section */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Passwort</h2>
        <p className="text-caption text-muted-blue mb-3">
          Passwort-Änderung generiert einen neuen SHA-256 Hash.
          Der neue Hash muss manuell in Vercel Environment Variables eingetragen werden.
        </p>
        {!showPassword ? (
          <button
            onClick={() => setShowPassword(true)}
            className="auth-button !w-auto px-6 text-body"
          >
            Passwort ändern
          </button>
        ) : (
          <PasswordChangeForm onClose={() => setShowPassword(false)} />
        )}
      </div>

      {/* Cache */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Cache & Daten</h2>
        <button
          onClick={handleClearCache}
          className="bg-signal-red/20 text-signal-red border border-signal-red/30
                     rounded-input px-4 py-2 text-body font-medium
                     hover:bg-signal-red/30 transition-colors"
        >
          Cache löschen & neu laden
        </button>
      </div>

      {/* System Info */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">System-Info</h2>
        <div className="space-y-1.5 text-caption">
          <InfoRow label="App Version" value="1.0.0 (Dummy-App)" />
          <InfoRow label="Schema Version" value={dashboard?.schema_version || '—'} />
          <InfoRow label="Agent R" value="DUMMY (nicht verbunden)" />
          <InfoRow label="Pipeline Run" value={lastStep?.completed_at ? `${lastStep.completed_at}` : '—'} />
          <InfoRow label="Dashboard Generated" value={dashboard?.generated_at || '—'} />
          <InfoRow label="Degradation" value={dashboard?.degradation_level || '—'} />
          <InfoRow label="Validation" value={dashboard?.validation?.status || '—'} />
        </div>
      </div>

      {/* Logout */}
      <div className="glass-card p-4">
        <button
          onClick={logout}
          className="bg-white/5 border border-white/10 rounded-input px-4 py-2
                     text-body text-muted-blue hover:bg-white/10 transition-colors"
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-blue">{label}</span>
      <span className="text-ice-white tabular-nums">{value}</span>
    </div>
  );
}

function PasswordChangeForm({ onClose }) {
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [hash, setHash] = useState('');

  const generate = async () => {
    if (newPw !== confirm) { alert('Passwörter stimmen nicht überein'); return; }
    if (newPw.length < 6) { alert('Mindestens 6 Zeichen'); return; }
    const encoder = new TextEncoder();
    const data = encoder.encode(newPw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setHash(hashHex);
  };

  return (
    <div className="space-y-3">
      <input type="password" placeholder="Neues Passwort" value={newPw}
        onChange={(e) => setNewPw(e.target.value)}
        className="auth-input !w-full" />
      <input type="password" placeholder="Passwort bestätigen" value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="auth-input !w-full" />
      <div className="flex gap-2">
        <button onClick={generate} className="auth-button !w-auto px-4 text-body">Hash generieren</button>
        <button onClick={onClose} className="text-muted-blue text-body px-4">Abbrechen</button>
      </div>
      {hash && (
        <div className="bg-white/5 rounded-input p-3">
          <p className="text-caption text-muted-blue mb-1">Neuer NEXT_PUBLIC_AUTH_HASH:</p>
          <p className="text-caption text-ice-white break-all font-mono select-all">{hash}</p>
          <p className="text-caption text-signal-yellow mt-2">⚠ In Vercel → Settings → Environment Variables eintragen</p>
        </div>
      )}
    </div>
  );
}
