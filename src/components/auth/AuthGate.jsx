'use client';

import { useState, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';

export default function AuthGate() {
  const { login } = useAuthContext();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError(false);

    const success = await login(password);

    if (!success) {
      setError(true);
      setPassword('');
      setLoading(false);
      // Focus back on input
      setTimeout(() => {
        inputRef.current?.focus();
        // Reset error state after animation
        setTimeout(() => setError(false), 300);
      }, 50);
    }
  };

  return (
    <div className="fixed inset-0 z-auth bg-navy-deep flex flex-col items-center justify-center">
      {/* Title - no logo on auth screen per Spec §3.2 */}
      <h1 className="text-[20px] font-semibold text-ice-white mb-10 tracking-wide">
        Baldur Creek Capital
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
        <input
          ref={inputRef}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          className={`auth-input ${error ? 'error' : ''}`}
          autoFocus
        />

        <button
          type="submit"
          disabled={loading || !password.trim()}
          className="auth-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </span>
          ) : (
            'Enter'
          )}
        </button>
      </form>
    </div>
  );
}
