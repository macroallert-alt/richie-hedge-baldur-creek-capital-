// src/lib/agent-r-tools.js
// Agent R Tool Definitions + Implementations
// All tools use REST fetch (Edge Runtime compatible — no npm packages)
// Based on: AGENT_R_TECH_SPEC_TEIL_4.md + TEIL_7.md

import { PROMPT_VERSION } from './agent-r-prompt';

// ===== TOOL DEFINITIONS (JSON Schema for Claude API) =====

export const TOOL_DEFINITIONS = [
  {
    name: 'get_dashboard',
    description: 'Lade das vollständige dashboard.json mit allen System-Daten: Regime, Layer Scores, V16 Gewichte, F6 Positionen, Risk Alerts, CIO Memo, G7 Status, Action Items, Known Unknowns, und Agent R Context. Nutze dieses Tool wenn du detaillierte System-Informationen brauchst die über den komprimierten Header im System Prompt hinausgehen.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_stock_data',
    description: 'Hole Fundamentaldaten, Technicals und Price History für einen Aktien-Ticker. Liefert: Preis, Market Cap, P/E, P/S, EV/EBITDA, ROE, FCF Yield, Debt/Equity, Revenue Growth, EPS, 52W High/Low, SMA 50/200, RSI 14, Volume vs Avg, Sektor, Industry. Nutze für Einzelaktien-Analyse.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: "Aktien-Ticker (z.B. 'NVDA', 'AAPL', 'MSFT')",
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'get_options_chain',
    description: 'Hole die Live Options Chain für einen Ticker via EODHD API. Liefert: Alle Expiries, Strikes, Calls und Puts mit IV, Delta, Gamma, Theta, Vega, Open Interest, Volume, Bid/Ask, Last Price. Nutze für Options-Analyse, IV Percentile, GEX Abschätzung, Put/Call Ratio, Unusual Volume Detection.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: "Aktien-Ticker (z.B. 'NVDA', 'SPY')",
        },
        expiry_filter: {
          type: 'string',
          description: 'Optional: Spezifisches Expiry-Datum (YYYY-MM-DD). Ohne Filter: nächste 3 Expiries.',
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'get_fred_data',
    description: 'Hole Makro-Zeitreihen von der FRED API. Nutze für Yield Curves (DGS2, DGS10), Credit Spreads (BAMLH0A0HYM2), Liquidity-Indikatoren, Arbeitsmarkt, Inflation. Liefert letzte 30 Datenpunkte mit Datum und Wert.',
    input_schema: {
      type: 'object',
      properties: {
        series_id: {
          type: 'string',
          description: "FRED Series ID (z.B. 'DGS10', 'BAMLH0A0HYM2', 'UNRATE', 'CPIAUCSL')",
        },
        observation_count: {
          type: 'integer',
          description: 'Anzahl der letzten Datenpunkte (default: 30)',
        },
      },
      required: ['series_id'],
    },
  },
  {
    name: 'get_live_snapshot',
    description: 'Hole aktuelle Kurse für 5 Kern-Ticker (SPY, VIX, DXY, TLT, HYG) plus optionale zusätzliche Ticker. Nutze wenn das Dashboard >4h alt ist und Richie nach aktuellen Marktbedingungen fragt. Schneller als get_stock_data — nur Preise, keine Fundamentals.',
    input_schema: {
      type: 'object',
      properties: {
        additional_tickers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optionale zusätzliche Ticker neben den 5 Kern-Tickern',
        },
      },
      required: [],
    },
  },
  {
    name: 'web_search',
    description: 'Durchsuche das Web nach aktuellen Nachrichten, Events, Regulierung, oder Marktkommentaren. Nutze für Fragen die aktuelleres Wissen erfordern als das Dashboard bietet. Liefert Top-5 Ergebnisse mit Titel, Snippet und URL.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Suchbegriff (z.B. "Fed rate decision March 2026", "NVDA earnings guidance")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'calculate_position_impact',
    description: 'Berechne den exakten Portfolio-Impact einer neuen oder geänderten Position. Liefert: ENB vorher/nachher, Konzentration Top-3, Net Long Exposure, Korrelation mit bestehenden Positionen, Kelly-optimale Size, Axiom-Flags. PFLICHT bei jedem DECISIONAL Trade. Schätze NICHT — nutze dieses Tool.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'Ticker der neuen/geänderten Position',
        },
        size_pct: {
          type: 'number',
          description: 'Geplante Positionsgröße in % des Portfolios',
        },
        direction: {
          type: 'string',
          enum: ['LONG', 'SHORT', 'CLOSE', 'REDUCE', 'INCREASE'],
          description: 'Richtung der geplanten Aktion',
        },
      },
      required: ['ticker', 'size_pct', 'direction'],
    },
  },
  {
    name: 'run_what_if',
    description: 'Simuliere das Portfolio unter einem historischen Stress-Szenario. Verfügbare Szenarien: COVID_2020, GFC_2008, TAPER_TANTRUM_2013, CHINA_DEVAL_2015, SVB_2023, YEN_CARRY_2024, oder CUSTOM mit eigenen Shocks. Liefert: Geschätzten Portfolio-Drawdown, Kill Switch Analyse, Position-Level Impact, Recovery-Schätzung.',
    input_schema: {
      type: 'object',
      properties: {
        scenario: {
          type: 'string',
          enum: ['COVID_2020', 'GFC_2008', 'TAPER_TANTRUM_2013', 'CHINA_DEVAL_2015', 'SVB_2023', 'YEN_CARRY_2024', 'CUSTOM'],
          description: 'Stress-Szenario Name',
        },
        custom_shocks: {
          type: 'object',
          description: 'Nur bei CUSTOM: Asset-Ticker → Shock in % (z.B. {"SPY": -20, "GLD": 10})',
        },
      },
      required: ['scenario'],
    },
  },
  {
    name: 'save_decision',
    description: 'Speichere einen neuen Decision Journal Entry. Nutze nach dem DECISIONAL Protocol wenn alle 3 Pflichtfragen beantwortet sind. Speichert: These, Kill Shot, Exit, System State, Agent R Assessment, Bias Check.',
    input_schema: {
      type: 'object',
      properties: {
        decision_type: {
          type: 'string',
          enum: ['TRADE_ENTRY', 'TRADE_EXIT', 'OVERRIDE', 'SYSTEM_CHANGE', 'POSITION_CHANGE'],
          description: 'Art der Entscheidung',
        },
        ticker: {
          type: 'string',
          description: "Relevanter Ticker (oder 'PORTFOLIO' bei System-Änderungen)",
        },
        direction: {
          type: 'string',
          enum: ['LONG', 'SHORT', 'CLOSE', 'REDUCE', 'INCREASE', 'SKIP', 'N/A'],
          description: 'Richtung der Aktion',
        },
        size_pct: {
          type: 'number',
          description: 'Positionsgröße in % des Portfolios',
        },
        thesis: {
          type: 'string',
          description: 'These in einem Satz',
        },
        kill_shot: {
          type: 'string',
          description: 'Was muss passieren damit die These stirbt',
        },
        exit_criteria: {
          type: 'string',
          description: 'Preis/Event für Exit',
        },
        agent_r_assessment: {
          type: 'string',
          description: "Agent R's Einschätzung inkl. Konfidenz",
        },
        confidence: {
          type: 'integer',
          description: 'Agent R Konfidenz 1-10',
        },
        bias_check: {
          type: 'string',
          description: "Erkannte Biases oder 'Keine erkannt'",
        },
        regime_state: {
          type: 'string',
          description: 'Aktueller V16 Regime State',
        },
      },
      required: ['decision_type', 'ticker', 'direction', 'thesis', 'kill_shot', 'exit_criteria', 'agent_r_assessment', 'confidence'],
    },
  },
  {
    name: 'update_decision',
    description: 'Aktualisiere einen bestehenden Decision Journal Entry oder Thesis Tracker Entry. Nutze für: Outcome-Updates (5d/21d Performance), Process Score Reviews, Learnings, oder Thesis Probability/Status Updates.',
    input_schema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['DECISION_JOURNAL', 'THESIS_TRACKER'],
          description: 'Welche Tabelle aktualisieren',
        },
        entry_id: {
          type: 'string',
          description: "Decision ID (z.B. 'D-2026-003') oder Thesis ID (z.B. 'T-2026-007')",
        },
        updates: {
          type: 'object',
          description: 'Key-Value Pairs der zu aktualisierenden Felder',
        },
      },
      required: ['target', 'entry_id', 'updates'],
    },
  },
  {
    name: 'read_sheet',
    description: `Lese beliebige Daten aus den 4 System-Sheets. WICHTIG: Direkt den vollen Range abfragen (z.B. 'CALC_Macro_State!A:O'), NICHT erst klein testen. Nutze max_rows um Token zu begrenzen.

=== V16 Sheet (21 Tabs, Daten bis 2007) ===
CALC_Macro_State: DEFAULT fuer historische Fragen. TAUSENDE Zeilen. Date + Growth_Signal + Liq_Direction + Stress_Score + Macro_State_Num + Macro_State_Name + Howell_Phase + VIX.
CALC_Changelog: Gewichts-Aenderungen (Timestamp, Asset, FM_Alt, FM_Neu, FM_Delta).
DATA_Prices: Taegliche Preise aller 25 Assets seit 2007.
SIGNAL_HISTORY: NUR ~11 aktuelle Zeilen. NICHT fuer History.
DATA_K16_K17 / DATA_Liquidity / CYCLES_Howell: Liquidity-Indikatoren + Howell Phasen.
CALC_Confluence / CALC_CTM / CALC_OEWS: Asset-Level Scores.
EXECUTION_LOG / SYSTEM_HEALTH: Run-Logs.
PARAMS_*: 7 Kalibrierungs-Tabs.

=== DW Sheet (15 Tabs) ===
DASHBOARD, RAW_MARKET, RAW_MACRO, RAW_AGENT2, RAW_AGENT2_HISTORY, INTELLIGENCE, SCORES, DIVERGENCE, AGENT_SUMMARY, BELIEFS, ALERT_LOG, AGENT_R_LOG, CONFIG, RISK_ALLERTS, RISK_HISTORY.

=== G7 Sheet (19 Tabs) ===
DASHBOARD, POWER_SCORES, STRUCTURAL, FINANCIAL, LEADING, FEEDBACK_LOOPS, SCENARIOS, UNIVERSE_MAP, HISTORY, SOURCES, SCORING, G7_STATUS, G7_THESIS, G7_NARRATIVE, G7_THESIS_HISTORY, G7_POWER_SCORE_HISTORY, G7_RUN_LOG, G7_DATA_CACHE, G7_OPERATOR_OVERRIDES.

=== F6 Sheet (8 Tabs) ===
DASHBOARD, POSITIONS, SIGNALS, OPTIONS, V16_WEIGHTS, PERFORMANCE, CONFIG, CBOE_SIGNALS.

Tab-Namen sind CASE-SENSITIVE.`,
    input_schema: {
      type: 'object',
      properties: {
        sheet: {
          type: 'string',
          enum: ['V16', 'DW', 'G7', 'F6'],
          description: 'V16=Macro/Price History bis 2007, DW=Data Warehouse/Layers/Alerts, G7=World Order Monitor, F6=StockPicker',
        },
        range: {
          type: 'string',
          description: "Tab und Zellbereich im A1-Format. Beispiele: 'signal_history!A:Z' (alle Spalten), 'signal_history!A1:Z50' (letzte 50 Zeilen), 'DASHBOARD!A:F', 'SCORES!A:M'. Tipp: Erst mit kleinem Range testen um die Spalten zu sehen, dann gezielt abfragen.",
        },
        max_rows: {
          type: 'integer',
          description: 'Maximale Anzahl Zeilen die zurueckgegeben werden (default: 100). Nutze kleinere Werte fuer grosse Sheets um Token zu sparen.',
        },
      },
      required: ['sheet', 'range'],
    },
  },
];


// ===== TOOL IMPLEMENTATIONS =====

// Helper: Google Sheets JWT auth for Edge Runtime (no googleapis package)
async function getGoogleAccessToken() {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
  if (!serviceAccount.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT nicht konfiguriert');
  }

  // Build JWT
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();

  // Base64url encode
  function b64url(obj) {
    const json = JSON.stringify(obj);
    const bytes = encoder.encode(json);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  const headerB64 = b64url(header);
  const claimB64 = b64url(claim);
  const signInput = `${headerB64}.${claimB64}`;

  // Import private key and sign
  const pemContent = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const keyBytes = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${signInput}.${sigB64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google Auth failed: ${err}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

// Helper: Read Google Sheet
async function readSheet(spreadsheetId, range) {
  const token = await getGoogleAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets read failed: ${err}`);
  }
  const data = await res.json();
  return data.values || [];
}

// Helper: Append to Google Sheet
async function appendToSheet(spreadsheetId, range, values) {
  const token = await getGoogleAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets append failed: ${err}`);
  }
  return await res.json();
}

// Helper: Update Google Sheet row
async function updateSheet(spreadsheetId, range, values) {
  const token = await getGoogleAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets update failed: ${err}`);
  }
  return await res.json();
}

// Sheet IDs
const DW_SHEET_ID = '1sZeZ4VVztAqjBjyfXcCfhpSWJ4pCGF8ip1ksu_TYMHY';
const V16_SHEET_ID = '11xoZ-E-W0eG23V_HSKloqzC4ubLYg9pfcf6k7HJ0oSE';
const G7_SHEET_ID = '1TVl-GNYxK7Sppn8Tv8lSlMVgFfCwr8WslWSwABpOybk';
const F6_SHEET_ID = '13VBh0hLjwRJ8hQsy6RxojDnMAmv81IPNIMMvcu3Bg8s';

// Sheet name → ID mapping for read_sheet tool
const SHEET_MAP = {
  DW: DW_SHEET_ID,
  DATA_WAREHOUSE: DW_SHEET_ID,
  V16: V16_SHEET_ID,
  G7: G7_SHEET_ID,
  F6: F6_SHEET_ID,
};


// ===== TOOL 1: get_dashboard =====
async function toolGetDashboard(input, dashboard) {
  if (!dashboard) {
    throw new Error('dashboard.json nicht verfügbar. Pipeline möglicherweise nicht gelaufen.');
  }
  const ageHours = dashboard.generated_at
    ? ((Date.now() - new Date(dashboard.generated_at).getTime()) / 3600000).toFixed(1)
    : '?';
  return {
    ...dashboard,
    _meta: {
      age_hours: parseFloat(ageHours),
      stale: parseFloat(ageHours) > 14,
    },
  };
}


// ===== TOOL 2: get_stock_data =====
async function toolGetStockData({ ticker }) {
  // FMP API (already available in pipeline) for fundamentals + quote
  const fmpKey = process.env.FMP_API_KEY;
  if (!fmpKey) {
    throw new Error('FMP_API_KEY nicht konfiguriert');
  }

  const [quoteRes, profileRes, ratiosRes] = await Promise.all([
    fetch(`https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${fmpKey}`),
    fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${fmpKey}`),
    fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${fmpKey}`),
  ]);

  const [quoteData, profileData, ratiosData] = await Promise.all([
    quoteRes.json(), profileRes.json(), ratiosRes.json(),
  ]);

  const quote = quoteData?.[0];
  const profile = profileData?.[0];
  const ratios = ratiosData?.[0];

  if (!quote) throw new Error(`Ticker ${ticker} nicht gefunden`);

  // Historical prices for technicals (50d)
  const histRes = await fetch(
    `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?timeseries=60&apikey=${fmpKey}`
  );
  const histData = await histRes.json();
  const hist = histData?.historical || [];
  const closes = hist.map(d => d.close).reverse(); // oldest first

  // Calculate SMA
  const sma = (arr, period) => {
    if (arr.length < period) return null;
    const slice = arr.slice(-period);
    return Math.round((slice.reduce((s, v) => s + v, 0) / period) * 100) / 100;
  };

  // Calculate RSI 14
  const calcRSI = (closes, period = 14) => {
    if (closes.length < period + 1) return null;
    const recent = closes.slice(-(period + 1));
    let gains = 0, losses = 0;
    for (let i = 1; i < recent.length; i++) {
      const diff = recent[i] - recent[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
  };

  return {
    ticker,
    price: quote.price,
    change_pct: quote.changesPercentage,
    market_cap: quote.marketCap,
    volume: quote.volume,
    avg_volume: quote.avgVolume,
    volume_ratio: quote.avgVolume ? Math.round((quote.volume / quote.avgVolume) * 100) / 100 : null,

    // Fundamentals
    pe_trailing: ratios?.peRatioTTM ? Math.round(ratios.peRatioTTM * 10) / 10 : profile?.pe,
    pe_forward: quote.pe,
    ps_ratio: ratios?.priceToSalesRatioTTM ? Math.round(ratios.priceToSalesRatioTTM * 10) / 10 : null,
    ev_ebitda: ratios?.enterpriseValueOverEBITDATTM ? Math.round(ratios.enterpriseValueOverEBITDATTM * 10) / 10 : null,
    roe: ratios?.returnOnEquityTTM ? Math.round(ratios.returnOnEquityTTM * 1000) / 10 : null,
    debt_equity: ratios?.debtEquityRatioTTM ? Math.round(ratios.debtEquityRatioTTM * 100) / 100 : null,
    revenue_growth: profile?.revenueGrowth,
    eps: quote.eps,

    // Technicals
    high_52w: quote.yearHigh,
    low_52w: quote.yearLow,
    pct_from_52w_high: quote.yearHigh ? Math.round(((quote.price / quote.yearHigh) - 1) * 10000) / 100 : null,
    sma_50: sma(closes, 50),
    sma_200: closes.length >= 200 ? sma(closes, 200) : null,
    above_sma50: sma(closes, 50) ? quote.price > sma(closes, 50) : null,
    rsi_14: calcRSI(closes),

    // Context
    sector: profile?.sector,
    industry: profile?.industry,
    _timestamp: new Date().toISOString(),
  };
}


// ===== TOOL 3: get_options_chain =====
async function toolGetOptionsChain({ ticker, expiry_filter }) {
  const apiKey = process.env.EODHD_API_KEY;
  if (!apiKey) throw new Error('EODHD_API_KEY nicht konfiguriert');

  const res = await fetch(
    `https://eodhd.com/api/options/${ticker}.US?api_token=${apiKey}&fmt=json`
  );
  if (!res.ok) throw new Error(`EODHD API Error: ${res.status}`);

  const data = await res.json();
  let expiries = data?.data || [];

  if (expiry_filter) {
    expiries = expiries.filter(e => e.expirationDate === expiry_filter);
  } else {
    expiries = expiries.slice(0, 3); // Next 3 expiries
  }

  // Summarize each expiry
  const summary = expiries.map(exp => {
    const calls = exp.options?.CALL || [];
    const puts = exp.options?.PUT || [];

    const totalCallOI = calls.reduce((s, c) => s + (c.openInterest || 0), 0);
    const totalPutOI = puts.reduce((s, p) => s + (p.openInterest || 0), 0);
    const pcRatio = totalCallOI > 0 ? Math.round((totalPutOI / totalCallOI) * 100) / 100 : null;

    // Highest volume calls and puts
    const topCalls = [...calls].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5);
    const topPuts = [...puts].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5);

    // ATM IV estimate (closest to current price)
    const allOptions = [...calls, ...puts].filter(o => o.impliedVolatility);
    const avgIV = allOptions.length > 0
      ? Math.round((allOptions.reduce((s, o) => s + o.impliedVolatility, 0) / allOptions.length) * 10000) / 100
      : null;

    return {
      expiration: exp.expirationDate,
      calls_count: calls.length,
      puts_count: puts.length,
      total_call_oi: totalCallOI,
      total_put_oi: totalPutOI,
      pc_ratio: pcRatio,
      avg_iv_pct: avgIV,
      top_calls_by_volume: topCalls.map(c => ({
        strike: c.strike,
        iv: c.impliedVolatility ? Math.round(c.impliedVolatility * 10000) / 100 : null,
        delta: c.delta ? Math.round(c.delta * 100) / 100 : null,
        oi: c.openInterest,
        volume: c.volume,
        bid: c.bid,
        ask: c.ask,
      })),
      top_puts_by_volume: topPuts.map(p => ({
        strike: p.strike,
        iv: p.impliedVolatility ? Math.round(p.impliedVolatility * 10000) / 100 : null,
        delta: p.delta ? Math.round(p.delta * 100) / 100 : null,
        oi: p.openInterest,
        volume: p.volume,
        bid: p.bid,
        ask: p.ask,
      })),
    };
  });

  return {
    ticker,
    underlying_price: data?.lastTradePrice || null,
    expiries_returned: summary.length,
    data: summary,
    _timestamp: new Date().toISOString(),
  };
}


// ===== TOOL 4: get_fred_data =====
async function toolGetFredData({ series_id, observation_count }) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new Error('FRED_API_KEY nicht konfiguriert');

  const count = observation_count || 30;
  const res = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=${series_id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${count}`
  );
  if (!res.ok) throw new Error(`FRED API Error: ${res.status}`);

  const data = await res.json();
  const observations = (data.observations || [])
    .filter(o => o.value !== '.')
    .map(o => ({
      date: o.date,
      value: parseFloat(o.value),
    }))
    .reverse(); // Chronological order

  // Series metadata
  const metaRes = await fetch(
    `https://api.stlouisfed.org/fred/series?series_id=${series_id}&api_key=${apiKey}&file_type=json`
  );
  const metaData = await metaRes.json();
  const series = metaData?.seriess?.[0];

  return {
    series_id,
    title: series?.title || series_id,
    frequency: series?.frequency || '?',
    units: series?.units || '?',
    last_updated: series?.last_updated || '?',
    observations,
    latest_value: observations.length > 0 ? observations[observations.length - 1].value : null,
    _timestamp: new Date().toISOString(),
  };
}


// ===== TOOL 5: get_live_snapshot =====
async function toolGetLiveSnapshot({ additional_tickers }, dashboard) {
  const fmpKey = process.env.FMP_API_KEY;
  if (!fmpKey) throw new Error('FMP_API_KEY nicht konfiguriert');

  const coreTickers = ['SPY', 'VIX', 'DXY', 'TLT', 'HYG'];
  // DXY is not on FMP, use UUP as proxy
  const fmpTickers = ['SPY', 'VIXY', 'UUP', 'TLT', 'HYG'];
  const extra = additional_tickers || [];
  const allTickers = [...fmpTickers, ...extra];

  const tickerStr = allTickers.join(',');
  const res = await fetch(
    `https://financialmodelingprep.com/api/v3/quote/${tickerStr}?apikey=${fmpKey}`
  );
  if (!res.ok) throw new Error(`FMP API Error: ${res.status}`);

  const quotes = await res.json();

  const snapshot = quotes.map(q => ({
    ticker: q.symbol === 'text-page-title text-center' ? 'VIX' : q.symbol === 'UUP' ? 'DXY(UUP)' : q.symbol,
    price: q.price,
    change_pct: q.changesPercentage ? Math.round(q.changesPercentage * 100) / 100 : null,
    volume: q.volume,
  }));

  // Dashboard age for context
  const dashboardAge = dashboard?.generated_at
    ? ((Date.now() - new Date(dashboard.generated_at).getTime()) / 3600000).toFixed(1)
    : '?';

  return {
    snapshot,
    dashboard_age_hours: parseFloat(dashboardAge),
    note: `Live-Kurse von FMP. Dashboard ist ${dashboardAge}h alt.`,
    _timestamp: new Date().toISOString(),
  };
}


// ===== TOOL 6: web_search =====
// Note: In production, this uses Claude's built-in web_search via tool_use.
// Since we're calling Claude API ourselves, we use a search API as fallback.
// For V1, we return a note that web search requires the Anthropic web_search tool.
async function toolWebSearch({ query }) {
  // Brave Search API (free tier: 2000 queries/month)
  // If BRAVE_SEARCH_KEY is not set, return graceful fallback
  const braveKey = process.env.BRAVE_SEARCH_KEY;
  if (!braveKey) {
    return {
      query,
      results: [],
      note: 'Web Search nicht konfiguriert. Setze BRAVE_SEARCH_KEY in Vercel Environment Variables für Live-Suche.',
      _timestamp: new Date().toISOString(),
    };
  }

  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
    { headers: { 'X-Subscription-Token': braveKey, Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`Brave Search Error: ${res.status}`);

  const data = await res.json();
  const results = (data.web?.results || []).slice(0, 5).map(r => ({
    title: r.title,
    snippet: r.description,
    url: r.url,
  }));

  return {
    query,
    results,
    result_count: results.length,
    _timestamp: new Date().toISOString(),
  };
}


// ===== TOOL 7: calculate_position_impact =====
// Deterministic calculation — no LLM, pure math
// Based on Spec Teil 7 §7.2
async function toolCalculatePositionImpact({ ticker, size_pct, direction }, dashboard) {
  const fmpKey = process.env.FMP_API_KEY;

  // 1. Current weights from dashboard
  const currentWeights = [];
  const v16Weights = dashboard?.v16?.current_weights || {};
  for (const [t, w] of Object.entries(v16Weights)) {
    if (w > 0.5) currentWeights.push({ ticker: t, weight: w });
  }

  // 2. Build new weights
  const newWeights = currentWeights
    .filter(w => w.ticker !== ticker)
    .map(w => ({ ...w }));

  if (direction === 'LONG' || direction === 'INCREASE') {
    const existing = currentWeights.find(w => w.ticker === ticker);
    newWeights.push({ ticker, weight: (existing?.weight || 0) + size_pct });
  } else if (direction === 'SHORT') {
    newWeights.push({ ticker, weight: -size_pct });
  } else if (direction === 'REDUCE') {
    const existing = currentWeights.find(w => w.ticker === ticker);
    if (existing) newWeights.push({ ticker, weight: Math.max(0, existing.weight - size_pct) });
  }
  // CLOSE = ticker removed, already filtered out

  // 3. Fetch historical returns for correlation (30d, via FMP)
  const allTickers = [...new Set([...currentWeights.map(w => w.ticker), ticker])];
  const returns = {};

  if (fmpKey) {
    await Promise.all(allTickers.map(async (t) => {
      try {
        const histRes = await fetch(
          `https://financialmodelingprep.com/api/v3/historical-price-full/${t}?timeseries=35&apikey=${fmpKey}`
        );
        const histData = await histRes.json();
        const closes = (histData?.historical || []).map(d => d.close).reverse();
        returns[t] = [];
        for (let i = 1; i < closes.length; i++) {
          returns[t].push((closes[i] / closes[i - 1]) - 1);
        }
      } catch {
        returns[t] = null;
      }
    }));
  }

  // 4. Pearson correlation
  const pearson = (x, y) => {
    const n = Math.min(x.length, y.length);
    if (n < 5) return 0.3; // Default
    const xSlice = x.slice(-n), ySlice = y.slice(-n);
    const meanX = xSlice.reduce((s, v) => s + v, 0) / n;
    const meanY = ySlice.reduce((s, v) => s + v, 0) / n;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xSlice[i] - meanX, dy = ySlice[i] - meanY;
      num += dx * dy; denX += dx * dx; denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
  };

  // 5. ENB calculation
  const calcENB = (weights) => {
    const active = weights.filter(w => Math.abs(w.weight) > 0.5);
    if (active.length === 0) return 0;
    const totalW = active.reduce((s, w) => s + Math.abs(w.weight), 0);
    let denom = 0;
    for (const w1 of active) {
      for (const w2 of active) {
        const corr = (returns[w1.ticker] && returns[w2.ticker])
          ? Math.abs(pearson(returns[w1.ticker], returns[w2.ticker]))
          : 0.3;
        denom += (Math.abs(w1.weight) / totalW) * (Math.abs(w2.weight) / totalW) * corr;
      }
    }
    return denom > 0 ? Math.round((1 / denom) * 10) / 10 : active.length;
  };

  const currentENB = calcENB(currentWeights);
  const newENB = calcENB(newWeights);

  // 6. Concentration Top-3
  const sortByWeight = arr => [...arr].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  const currentTop3 = sortByWeight(currentWeights).slice(0, 3).reduce((s, w) => s + Math.abs(w.weight), 0);
  const newTop3 = sortByWeight(newWeights).slice(0, 3).reduce((s, w) => s + Math.abs(w.weight), 0);

  // 7. Net Long
  const currentNetLong = currentWeights.filter(w => w.weight > 0).reduce((s, w) => s + w.weight, 0);
  const newNetLong = newWeights.filter(w => w.weight > 0).reduce((s, w) => s + w.weight, 0);

  // 8. Correlation with existing positions
  const corrWithExisting = currentWeights
    .filter(w => w.ticker !== ticker && returns[ticker] && returns[w.ticker])
    .map(w => ({
      ticker: w.ticker,
      weight: w.weight,
      correlation: Math.round(pearson(returns[ticker], returns[w.ticker]) * 100) / 100,
    }))
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // 9. Kelly (simplified)
  const tickerReturns = returns[ticker];
  let kelly = { kelly_full: null, kelly_half: null, note: 'Keine historischen Daten' };
  if (tickerReturns && tickerReturns.length >= 10) {
    const wins = tickerReturns.filter(r => r > 0);
    const losses = tickerReturns.filter(r => r <= 0);
    const winRate = wins.length / tickerReturns.length;
    const avgWin = wins.length > 0 ? wins.reduce((s, r) => s + r, 0) / wins.length : 0.01;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, r) => s + r, 0) / losses.length) : 0.01;
    const k = (winRate / avgLoss) - ((1 - winRate) / avgWin);
    const kellyPct = Math.max(0, Math.min(25, k * 100));
    kelly = {
      kelly_full: Math.round(kellyPct * 10) / 10,
      kelly_half: Math.round(kellyPct * 5) / 10,
      win_rate: Math.round(winRate * 100),
    };
  }

  // 10. Axiom flags
  const axiomFlags = [];
  if (newENB < currentENB - 0.5) {
    axiomFlags.push(`Axiom 4: ENB sinkt um ${(currentENB - newENB).toFixed(1)} — Portfolio wird konzentrierter`);
  }
  if (newTop3 > 40) {
    axiomFlags.push(`Axiom 4: Top-3 Konzentration bei ${newTop3.toFixed(1)}% — über 40% Schwelle`);
  }
  const maxLoss = size_pct * 0.5;
  axiomFlags.push(`Axiom 6: Max Loss bei -50% ${ticker} = -${maxLoss.toFixed(1)}% Portfolio${maxLoss > 2.5 ? ' — HOCH' : ' — akzeptabel'}`);
  if (corrWithExisting.length > 0 && corrWithExisting[0].correlation > 0.7) {
    axiomFlags.push(`Axiom 4: Hohe Korrelation mit ${corrWithExisting[0].ticker} (${corrWithExisting[0].correlation}) — Cluster-Risiko`);
  }
  if (kelly.kelly_full && size_pct > kelly.kelly_full) {
    axiomFlags.push(`Axiom 5: Sizing ${size_pct}% ÜBER Full-Kelly (${kelly.kelly_full}%) — zu aggressiv`);
  }

  return {
    ticker,
    proposed_size_pct: size_pct,
    direction,
    portfolio_impact: {
      current_enb: currentENB,
      new_enb: newENB,
      enb_change: Math.round((newENB - currentENB) * 10) / 10,
      current_concentration_top3: Math.round(currentTop3 * 10) / 10,
      new_concentration_top3: Math.round(newTop3 * 10) / 10,
      current_net_long: Math.round(currentNetLong * 10) / 10,
      new_net_long: Math.round(newNetLong * 10) / 10,
    },
    correlation_with_existing: {
      top_5: corrWithExisting.slice(0, 5),
    },
    kelly,
    axiom_flags: axiomFlags,
    _data_gaps: allTickers.filter(t => !returns[t]).map(t => `${t}: keine historischen Returns`),
    _timestamp: new Date().toISOString(),
  };
}


// ===== TOOL 8: run_what_if =====
// Based on Spec Teil 7 §7.3
const STRESS_SCENARIOS = {
  COVID_2020: {
    name: 'COVID-19 Crash März 2020',
    description: 'Pandemie-Crash: SPY -34%, VIX 82, Credit Spreads +600bps',
    asset_shocks: {
      SPY: -34, QQQ: -28, IWM: -40, TLT: 15, GLD: 3, SLV: -20,
      HYG: -12, LQD: -8, TIP: -3, UUP: 5, FXI: -12, EEM: -30,
      XLK: -30, XLF: -38, XLE: -55, XLU: -20, XLP: -15, XLV: -20,
      DBC: -40, BTC: -38, ETH: -45,
      DEFAULT_EQUITY: -34, DEFAULT_BOND: 10, DEFAULT_COMMODITY: -30,
    },
    vix_peak: 82, duration_days: 23, recovery_days: 148,
  },
  GFC_2008: {
    name: 'Global Financial Crisis 2008',
    description: 'Lehman-Kollaps: SPY -57%, VIX 80, kompletter Credit Freeze',
    asset_shocks: {
      SPY: -57, QQQ: -50, IWM: -60, TLT: 30, GLD: 25, SLV: -25,
      HYG: -35, LQD: -15, TIP: -5, UUP: 15, FXI: -65, EEM: -55,
      XLK: -45, XLF: -80, XLE: -55, XLU: -30, XLP: -20,
      DBC: -50, BTC: 0,
      DEFAULT_EQUITY: -55, DEFAULT_BOND: 20, DEFAULT_COMMODITY: -40,
    },
    vix_peak: 80, duration_days: 355, recovery_days: 1400,
  },
  TAPER_TANTRUM_2013: {
    name: 'Taper Tantrum 2013',
    description: 'Bernanke signalisiert QE-Ende: EM-Crash, Bond-Sell-Off',
    asset_shocks: {
      SPY: -8, QQQ: -7, IWM: -10, TLT: -13, GLD: -15, SLV: -25,
      HYG: -5, LQD: -6, TIP: -8, UUP: 5, FXI: -15, EEM: -18,
      DEFAULT_EQUITY: -10, DEFAULT_BOND: -10, DEFAULT_COMMODITY: -15,
    },
    vix_peak: 21, duration_days: 33, recovery_days: 55,
  },
  CHINA_DEVAL_2015: {
    name: 'China Devaluation 2015',
    description: 'PBoC Yuan-Abwertung, China-Sorgen, EM-Krise',
    asset_shocks: {
      SPY: -12, QQQ: -14, IWM: -16, TLT: 5, GLD: 4, SLV: -5,
      HYG: -6, LQD: -2, TIP: 1, UUP: 2, FXI: -28, EEM: -22,
      DEFAULT_EQUITY: -15, DEFAULT_BOND: 3, DEFAULT_COMMODITY: -10,
    },
    vix_peak: 40, duration_days: 15, recovery_days: 75,
  },
  SVB_2023: {
    name: 'SVB / Regional Banking Crisis 2023',
    description: 'Silicon Valley Bank Kollaps, Ansteckung Regionalbanken',
    asset_shocks: {
      SPY: -12, QQQ: -10, IWM: -18, TLT: 10, GLD: 8, SLV: 5,
      HYG: -5, LQD: -3, TIP: 2, UUP: -3, FXI: -5, EEM: -8,
      XLF: -22, XLK: -8, BTC: 15, ETH: 10,
      DEFAULT_EQUITY: -12, DEFAULT_BOND: 8, DEFAULT_COMMODITY: 3,
    },
    vix_peak: 30, duration_days: 7, recovery_days: 40,
  },
  YEN_CARRY_2024: {
    name: 'Yen Carry Trade Unwind August 2024',
    description: 'BOJ Rate Hike → Yen stärkt → Carry Trade Liquidation',
    asset_shocks: {
      SPY: -6, QQQ: -8, IWM: -7, TLT: 4, GLD: 2, SLV: -3,
      HYG: -3, LQD: -1, TIP: 1, UUP: -5, FXI: -8, EEM: -10,
      BTC: -15, ETH: -20, NVDA: -12, AAPL: -5,
      DEFAULT_EQUITY: -8, DEFAULT_BOND: 3, DEFAULT_COMMODITY: -5,
    },
    vix_peak: 38, duration_days: 5, recovery_days: 15,
  },
};

async function toolRunWhatIf({ scenario, custom_shocks }, dashboard) {
  const currentWeights = [];
  const v16Weights = dashboard?.v16?.current_weights || {};
  for (const [t, w] of Object.entries(v16Weights)) {
    if (w > 0.5) currentWeights.push({ ticker: t, weight: w });
  }

  let scenarioData;
  if (scenario === 'CUSTOM') {
    scenarioData = {
      name: 'Custom Scenario',
      description: 'Benutzerdefinierte Shocks',
      asset_shocks: custom_shocks || {},
      vix_peak: null, duration_days: null, recovery_days: null,
    };
  } else {
    scenarioData = STRESS_SCENARIOS[scenario];
    if (!scenarioData) throw new Error(`Unbekanntes Szenario: ${scenario}`);
  }

  const getShock = (ticker) => {
    if (scenarioData.asset_shocks[ticker] !== undefined) return scenarioData.asset_shocks[ticker];
    // Heuristic: default by asset class
    return scenarioData.asset_shocks.DEFAULT_EQUITY || -15;
  };

  const positionDetail = currentWeights.map(pos => {
    const shock = getShock(pos.ticker);
    const contribution = (pos.weight / 100) * shock;
    return {
      ticker: pos.ticker,
      weight: pos.weight,
      shock_pct: shock,
      contribution_pct: Math.round(contribution * 100) / 100,
    };
  });

  const totalDD = positionDetail.reduce((sum, p) => sum + p.contribution_pct, 0);
  const ks5Trigger = totalDD < -5;
  const stressENB = Math.round(currentWeights.filter(w => Math.abs(w.weight) > 1).length * 0.35 * 10) / 10;
  const ks1Trigger = stressENB < 4;

  positionDetail.sort((a, b) => a.contribution_pct - b.contribution_pct);

  return {
    scenario,
    scenario_name: scenarioData.name,
    scenario_description: scenarioData.description,
    portfolio_impact: {
      estimated_dd_pct: Math.round(totalDD * 100) / 100,
      worst_position: positionDetail[0] || null,
      best_position: positionDetail[positionDetail.length - 1] || null,
      positions_negative: positionDetail.filter(p => p.contribution_pct < 0).length,
      positions_positive: positionDetail.filter(p => p.contribution_pct > 0).length,
    },
    kill_switch_analysis: {
      ks1_correlation_collapse: {
        trigger: ks1Trigger,
        stress_enb: stressENB,
        note: ks1Trigger ? `TRIGGER — Stress-ENB ${stressENB} < Threshold 4` : 'NO TRIGGER',
      },
      ks5_drawdown_velocity: {
        trigger: ks5Trigger,
        note: ks5Trigger ? `TRIGGER — ${totalDD.toFixed(1)}% DD` : 'NO TRIGGER',
      },
    },
    recovery: {
      estimated_days: scenarioData.recovery_days,
      note: scenarioData.recovery_days
        ? `Historische Recovery: ~${scenarioData.recovery_days} Tage`
        : 'Custom Scenario — Recovery nicht schätzbar',
    },
    position_detail: positionDetail,
    _note: 'Simulation basiert auf historischen Asset-Returns. Tatsächliche Returns können abweichen.',
    _timestamp: new Date().toISOString(),
  };
}


// ===== TOOL 9: save_decision =====
async function toolSaveDecision(input, dashboard) {
  // Generate decision ID
  const year = new Date().getFullYear();
  // Read current journal to find next number
  let nextNum = 1;
  try {
    const existing = await readSheet(DW_SHEET_ID, 'DECISION_JOURNAL!A:A');
    const ids = existing.slice(1).map(r => r[0]).filter(id => id && id.startsWith(`D-${year}-`));
    if (ids.length > 0) {
      const maxNum = Math.max(...ids.map(id => parseInt(id.split('-')[2]) || 0));
      nextNum = maxNum + 1;
    }
  } catch {
    // Tab might not exist yet — will be created on first write
  }

  const decisionId = `D-${year}-${String(nextNum).padStart(3, '0')}`;
  const regimeState = input.regime_state || dashboard?.v16?.regime || dashboard?.header?.v16_regime || '';

  const row = [
    decisionId,
    new Date().toISOString(),
    input.decision_type,
    input.ticker,
    input.direction,
    input.size_pct || '',
    input.thesis,
    input.kill_shot,
    input.exit_criteria,
    regimeState,
    input.agent_r_assessment,
    input.confidence,
    input.bias_check || 'Keine erkannt',
    PROMPT_VERSION,
    '', // outcome_5d
    '', // outcome_21d
    '', // process_score
    '', // learning
  ];

  await appendToSheet(DW_SHEET_ID, 'DECISION_JOURNAL!A:R', [row]);

  return {
    decision_id: decisionId,
    status: 'SAVED',
    message: `Entscheidung ${decisionId} im Decision Journal gespeichert.`,
  };
}


// ===== TOOL 10: update_decision =====
async function toolUpdateDecision({ target, entry_id, updates }) {
  const tabName = target === 'DECISION_JOURNAL' ? 'DECISION_JOURNAL' : 'THESIS_TRACKER';

  const data = await readSheet(DW_SHEET_ID, `${tabName}!A:Z`);
  const rowIndex = data.findIndex(row => row[0] === entry_id);

  if (rowIndex === -1) {
    throw new Error(`Entry ${entry_id} nicht gefunden in ${tabName}`);
  }

  const updatedRow = [...data[rowIndex]];

  if (target === 'DECISION_JOURNAL') {
    if (updates.outcome_5d) updatedRow[14] = updates.outcome_5d;
    if (updates.outcome_21d) updatedRow[15] = updates.outcome_21d;
    if (updates.process_score) updatedRow[16] = String(updates.process_score);
    if (updates.learning) updatedRow[17] = updates.learning;
  } else {
    // THESIS_TRACKER
    if (updates.probability !== undefined) updatedRow[9] = String(updates.probability);
    if (updates.status) updatedRow[10] = updates.status;
    updatedRow[11] = new Date().toISOString(); // last_updated
  }

  await updateSheet(DW_SHEET_ID, `${tabName}!A${rowIndex + 1}:Z${rowIndex + 1}`, [updatedRow]);

  return {
    entry_id,
    target,
    status: 'UPDATED',
    updates_applied: Object.keys(updates),
  };
}


// ===== TOOL 11: read_sheet =====
async function toolReadSheet({ sheet, range, max_rows }) {
  const sheetId = SHEET_MAP[sheet];
  if (!sheetId) {
    throw new Error(`Unbekanntes Sheet: ${sheet}. Verfuegbar: ${Object.keys(SHEET_MAP).join(', ')}`);
  }

  const data = await readSheet(sheetId, range);

  if (!data || data.length === 0) {
    return {
      sheet,
      range,
      rows_found: 0,
      data: [],
      _note: 'Keine Daten im angegebenen Bereich gefunden. Pruefe Tab-Name und Range.',
      _timestamp: new Date().toISOString(),
    };
  }

  // Header = erste Zeile, Rest = Daten
  const header = data[0];
  let rows = data.slice(1);
  const totalRows = rows.length;

  // Limit rows to save tokens
  const limit = max_rows || 100;
  if (rows.length > limit) {
    rows = rows.slice(-limit); // Letzte N Zeilen (neueste Daten)
  }

  return {
    sheet,
    range,
    columns: header,
    rows_total: totalRows,
    rows_returned: rows.length,
    truncated: totalRows > limit,
    data: rows,
    _note: totalRows > limit
      ? `${totalRows} Zeilen gefunden, nur die letzten ${limit} zurueckgegeben. Nutze max_rows oder spezifischere Range fuer mehr/weniger.`
      : undefined,
    _timestamp: new Date().toISOString(),
  };
}


// ===== TOOL DISPATCHER =====
// Called by the API route to execute a tool by name

export async function executeTool(name, input, dashboard) {
  const TIMEOUT_MS = 10000; // 10s per tool call

  const toolFn = {
    get_dashboard: () => toolGetDashboard(input, dashboard),
    get_stock_data: () => toolGetStockData(input),
    get_options_chain: () => toolGetOptionsChain(input),
    get_fred_data: () => toolGetFredData(input),
    get_live_snapshot: () => toolGetLiveSnapshot(input, dashboard),
    web_search: () => toolWebSearch(input),
    calculate_position_impact: () => toolCalculatePositionImpact(input, dashboard),
    run_what_if: () => toolRunWhatIf(input, dashboard),
    save_decision: () => toolSaveDecision(input, dashboard),
    update_decision: () => toolUpdateDecision(input),
    read_sheet: () => toolReadSheet(input),
  }[name];

  if (!toolFn) {
    throw new Error(`Unbekanntes Tool: ${name}`);
  }

  // Execute with timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Tool ${name} timeout nach ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS)
  );

  return Promise.race([toolFn(), timeoutPromise]);
}
