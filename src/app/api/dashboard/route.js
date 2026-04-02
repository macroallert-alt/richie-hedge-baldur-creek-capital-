// /api/dashboard - Proxy route for dashboard.json
// Fetches from GitHub Raw URL server-side with caching.
// Prevents client-side 429 rate limiting from raw.githubusercontent.com.

import { NextResponse } from 'next/server';

// In-memory cache
let cachedData = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minuten

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_DASHBOARD_URL || '';

    // Fallback: kein URL konfiguriert
    if (!url || url.startsWith('/')) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_DASHBOARD_URL nicht konfiguriert' },
        { status: 500 }
      );
    }

    // Cache pruefen
    const now = Date.now();
    if (cachedData && (now - cachedAt) < CACHE_TTL_MS) {
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cached-At': new Date(cachedAt).toISOString(),
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Server-side fetch von GitHub
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      // Bei GitHub Rate Limit: stale Cache zurueckgeben wenn vorhanden
      if (res.status === 429 && cachedData) {
        return NextResponse.json(cachedData, {
          headers: {
            'X-Cache': 'STALE',
            'X-Cached-At': new Date(cachedAt).toISOString(),
            'X-Stale-Reason': 'GitHub 429',
            'Cache-Control': 'public, max-age=60',
          },
        });
      }
      return NextResponse.json(
        { error: `Dashboard fetch failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Cache updaten
    cachedData = data;
    cachedAt = now;

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    // Bei Netzwerk-Fehler: stale Cache zurueckgeben wenn vorhanden
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'STALE',
          'X-Cached-At': new Date(cachedAt).toISOString(),
          'X-Stale-Reason': error.message,
          'Cache-Control': 'public, max-age=60',
        },
      });
    }
    return NextResponse.json(
      { error: 'Dashboard fetch failed', details: error.message },
      { status: 500 }
    );
  }
}
