// src/lib/dashboard-fetch.js
// Fetches dashboard.json via /api/dashboard (server-side proxy with cache).
// Prevents 429 rate limiting from raw.githubusercontent.com.

/**
 * Fetches dashboard.json via server-side proxy.
 */
export async function fetchDashboard() {
  const response = await fetch('/api/dashboard', {
    headers: {
      'Accept': 'application/json',
    },
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
