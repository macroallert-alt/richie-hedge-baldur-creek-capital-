'use client';

import { useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'bcc_auth';
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
  const [isChecking, setIsChecking] = useState(true);

  // Check stored auth state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved === AUTH_HASH) {
        setIsAuthenticated(true);
      }
    } catch (e) {
      // localStorage might not be available
    }
    setIsChecking(false);
  }, []);

  // Login
  const login = useCallback(async (password) => {
    const hash = await hashPassword(password);
    if (hash === AUTH_HASH) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, hash);
      } catch (e) {
        // Continue without persistence
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  // Logout
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      // Continue
    }
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, isChecking, login, logout };
}
