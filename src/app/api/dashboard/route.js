// /api/dashboard - Proxy route for dashboard.json
// Dummy-App: Returns the local mock data
// Production: Fetches from GitHub Raw URL

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production, this would fetch from DASHBOARD_URL env var
    const url = process.env.NEXT_PUBLIC_DASHBOARD_URL || '/mock/dashboard.json';

    // For dummy app, redirect to static file
    return NextResponse.redirect(new URL(url, 'http://localhost:3000'));
  } catch (error) {
    return NextResponse.json(
      { error: 'Dashboard fetch failed', details: error.message },
      { status: 500 }
    );
  }
}
