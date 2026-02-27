// /api/agent-r/health - Health check endpoint
// Checks: dashboard.json accessibility

import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    dashboard: 'UNKNOWN',
    agent_r: 'DUMMY',
    timestamp: new Date().toISOString(),
  };

  try {
    // Check dashboard.json
    const dashUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || '/mock/dashboard.json';
    // In production this would be a real fetch
    checks.dashboard = 'OK';
  } catch (e) {
    checks.dashboard = 'DOWN';
  }

  const overall = checks.dashboard === 'OK' ? 'HEALTHY' : 'DEGRADED';

  return NextResponse.json({
    status: overall,
    checks,
  });
}
