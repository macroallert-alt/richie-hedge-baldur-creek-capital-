// src/lib/dashboard-fetch.js
// Dummy-App: Fetches from /mock/dashboard.json (local)
// Production: Fetches from GitHub Raw URL via NEXT_PUBLIC_DASHBOARD_URL

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || '/mock/dashboard.json';

/**
 * Fetches dashboard.json with cache-busting.
 */
export async function fetchDashboard() {
  const cacheBuster = `?t=${Date.now()}`;
  const url = `${DASHBOARD_URL}${cacheBuster}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Dashboard fetch failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Basic validation
  if (!data.schema_version || !data.header || !data.date) {
    throw new Error('Dashboard JSON invalid: Missing required fields');
  }

  return data;
}
