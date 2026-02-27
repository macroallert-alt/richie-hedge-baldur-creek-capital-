'use client';

import { useState, useCallback } from 'react';

const AUTH_HASH = process.env.NEXT_PUBLIC_AUTH_HASH;

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const login = useCallback(async (password) => {
    const hash = await hashPassword(password);
    if (hash === AUTH_HASH) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, isChecking, login, logout };
}