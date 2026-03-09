'use client';

import { useState } from 'react';
import { Shield, Check, RefreshCw, Zap, AlertTriangle, ChevronDown, ChevronRight, Calculator } from 'lucide-react';
import {
  COLORS,
  CLUSTER_MAP,
  CLUSTER_COLORS,
  EXECUTION_LEVEL_COLORS,
  ROTATION_STATUS_COLORS,
  getMaterialityColor,
  getAssetLabel,
} from '@/lib/constants';

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function RotationDetail({ dashboard, onNavigate }) {
  const rotation = dashboard?.rotation || {};
  const v16 = dashboard?.v16 || {};
  const execution = dashboard?.execution || {};

  const status = rotation.status || 'ALIGNED';
  const mode = rotation.mode || 'STABLE';

  return (
    <div className="space-y-4 pt-2">
      {/* Sektion 0: DD-Protect Banner */}
      <DDProtectBanner ddProtect={rotation.dd_protect} />

      {/* Sektion 1: Kontext-Zeile */}
      <ContextLine rotation={rotation} v16={v16} execution={execution} />

      {/* Sektion 2: Rotation-Status Badge + Treiber */}
      <StatusBadge rotation={rotation} />

      {/* Sektion 3: Cluster-Balken */}
      <ClusterBars rotation={rotation} execution={execution} />

      {/* Sektion 4: Cluster-Tabelle mit Sparklines */}
      <ClusterTable rotation={rotation} />

      {/* Sektion 5: AUM-Rechner */}
      <AUMCalculator rotation={rotation} />

      {/* Sektion 6: State-History Timeline */}
      <StateHistory rotation={rotation} />

      {/* Sektion 7: Meta-Zeile */}
      <MetaLine rotation={rotation} v16={v16} dashboard={dashboard} />
    </div>
  );
}

// ============================================================
// SEKTION 0: DD-PROTECT BANNER
// ============================================================

function DDProtectBanner({ ddProtect }) {
  if (!ddProtect?.active) return null;

  return (
    <div className="rounded-lg border-l-4 px-4 py-3"
      style={{ backgroundColor: `${COLORS.signalRed}20`, borderLeftColor: COLORS.signalRed }}>
      <div className="flex items-center gap-2">
        <Shield size={18} style={{ color: COLORS.signalRed }} />
        <span className="font-bold text-sm" style={{ color: COLORS.signalRed }}>
          ⚠ DRAWDOWN PROTECT AKTIV — Defensiv-Shift bei {ddProtect.current_drawdown?.toFixed(1)}% (Threshold: {ddProtect.threshold}%)
        </span>
      </div>
    </div>
  );
}

// ============================================================
// SEKTION 1: KONTEXT-ZEILE
// ============================================================

function ContextLine({ rotation, v16, execution }) {
  const routerState = v16.router_state || rotation.comparison_snapshots?.['1d']?.router_state || '—';
  const daysInState = rotation.days_since_state_change || v16.router_days_in_state || '—';
  const stateNum = v16.macro_state_num || '—';
  const stateName = v16.macro_state_name || '—';
  const execLevel = execution.execution_level || 'UNKNOWN';
  const execColor = EXECUTION_LEVEL_COLORS[execLevel] || COLORS.mutedBlue;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs px-1"
      style={{ color: COLORS.fadedBlue, borderBottom: `1px solid ${COLORS.fadedBlue}30` }}>
      <span>{routerState} ({daysInState}d)</span>
      <span>•</span>
      <span>State {stateNum} — {stateName}</span>
      <span>•</span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: execColor }} />
        <span style={{ color: execColor }}>{execLevel}</span>
      </span>
    </div>
  );
}

// ============================================================
// SEKTION 2: STATUS BADGE + TREIBER
// ============================================================

function StatusBadge({ rotation }) {
  const status = rotation.status || 'ALIGNED';
  const mode = rotation.mode || 'STABLE';
  const trigger = rotation.trigger || {};

  if (status === 'BIG_ROTATION' && mode === 'STATE_TRANSITION') {
    return <BigRotationStateChange rotation={rotation} />;
  }

  if (status === 'BIG_ROTATION') {
    return <BigRotationDrift rotation={rotation} />;
  }

  if (status === 'SHIFTING') {
    return <ShiftingBadge rotation={rotation} />;
  }

  return <AlignedBadge rotation={rotation} />;
}

function AlignedBadge({ rotation }) {
  const trigger = rotation.trigger || {};
  return (
    <div className="rounded-lg border px-6 py-5 text-center"
      style={{ backgroundColor: `${COLORS.signalGreen}10`, borderColor: `${COLORS.signalGreen}30` }}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Check size={24} style={{ color: COLORS.signalGreen }} />
        <span className="text-2xl font-bold" style={{ color: COLORS.signalGreen }}>ALIGNED</span>
      </div>
      <p className="text-sm" style={{ color: COLORS.mutedBlue }}>
        {trigger.label || 'Keine materielle Rotation'}
      </p>
      {rotation.days_since_material_rotation > 0 && (
        <p className="text-xs mt-1" style={{ color: COLORS.fadedBlue }}>
          Letzte materielle Rotation: vor {rotation.days_since_material_rotation}d
        </p>
      )}
    </div>
  );
}

function ShiftingBadge({ rotation }) {
  const trigger = rotation.trigger || {};
  const materialCount = rotation.material_shifts_count || 0;
  const clusterDeltas = rotation.cluster_deltas || {};

  // Build summary of material shifts
  const shiftSummary = Object.entries(clusterDeltas)
    .filter(([, cd]) => cd.materiality !== 'GREEN')
    .map(([ck, cd]) => {
      const name = CLUSTER_MAP[ck]?.name || ck;
      const arrow = cd.direction === 'RISING' ? '↑' : '↓';
      const pp = (cd.delta_1d * 100).toFixed(1);
      return `${name} ${arrow} ${cd.delta_1d > 0 ? '+' : ''}${pp}pp`;
    })
    .join(', ');

  return (
    <div className="rounded-lg border px-6 py-5 text-center"
      style={{ backgroundColor: `${COLORS.signalYellow}10`, borderColor: `${COLORS.signalYellow}30` }}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <RefreshCw size={24} style={{ color: COLORS.signalYellow }} />
        <span className="text-2xl font-bold" style={{ color: COLORS.signalYellow }}>
          {materialCount} SHIFT{materialCount !== 1 ? 'S' : ''}
        </span>
      </div>
      {shiftSummary && (
        <p className="text-sm" style={{ color: COLORS.iceWhite }}>{shiftSummary}</p>
      )}
      <p className="text-xs mt-1" style={{ color: COLORS.mutedBlue }}>
        {trigger.label || 'Kursbedingte Gewichtsanpassung'}
      </p>
    </div>
  );
}

function BigRotationStateChange({ rotation }) {
  const trigger = rotation.trigger || {};
  const stateHistory = rotation.state_history || [];
  const latestChange = stateHistory[0];
  const newPositions = rotation.new_positions || [];
  const exitedPositions = rotation.exited_positions || [];

  return (
    <div className="rounded-lg border px-6 py-5"
      style={{ backgroundColor: `${COLORS.signalRed}10`, borderColor: `${COLORS.signalRed}30` }}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <Zap size={24} style={{ color: COLORS.signalRed }} className="animate-pulse" />
        <span className="text-2xl font-bold" style={{ color: COLORS.signalRed }}>STATE CHANGE</span>
      </div>

      {trigger.label && (
        <p className="text-sm text-center mb-3" style={{ color: COLORS.iceWhite }}>{trigger.label}</p>
      )}
      {trigger.detail && (
        <p className="text-xs text-center mb-4" style={{ color: COLORS.mutedBlue }}>{trigger.detail}</p>
      )}

      {/* VORHER / NACHHER Mini-Balken */}
      {latestChange && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: COLORS.fadedBlue }}>VORHER</p>
            <MiniClusterBar weights={latestChange.snapshot_before} />
          </div>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: COLORS.fadedBlue }}>NACHHER</p>
            <MiniClusterBar weights={latestChange.snapshot_after} />
          </div>
        </div>
      )}

      {/* NEU / EXIT */}
      {newPositions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {newPositions.map(p => (
            <span key={p.asset} className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: `${COLORS.signalGreen}20`, color: COLORS.signalGreen }}>
              NEU: {p.asset} — {p.cluster_name} ({(p.weight * 100).toFixed(1)}%)
            </span>
          ))}
        </div>
      )}
      {exitedPositions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {exitedPositions.map(p => (
            <span key={p.asset} className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: `${COLORS.signalRed}20`, color: COLORS.signalRed }}>
              EXIT: {p.asset} — {p.cluster_name} (war {(p.prev_weight * 100).toFixed(1)}%)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BigRotationDrift({ rotation }) {
  const trigger = rotation.trigger || {};
  return (
    <div className="rounded-lg border px-6 py-5 text-center"
      style={{ backgroundColor: `${COLORS.signalOrange}10`, borderColor: `${COLORS.signalOrange}30` }}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <AlertTriangle size={24} style={{ color: COLORS.signalOrange }} />
        <span className="text-2xl font-bold" style={{ color: COLORS.signalOrange }}>GROSSE ROTATION</span>
      </div>
      <p className="text-sm" style={{ color: COLORS.iceWhite }}>
        Gesamt-Delta: {rotation.total_absolute_delta_pp?.toFixed(1)}pp
      </p>
      <p className="text-xs mt-1" style={{ color: COLORS.mutedBlue }}>
        {trigger.label || 'Kursbedingte Gewichtsanpassung'}
      </p>
    </div>
  );
}

// ============================================================
// SEKTION 3: CLUSTER-BALKEN
// ============================================================

function ClusterBars({ rotation, execution }) {
  const clusterCurrent = rotation.cluster_current || {};
  const snapshot1d = rotation.comparison_snapshots?.['1d'];
  const prevClusters = snapshot1d?.cluster_weights || {};
  const execLevel = execution.execution_level || 'EXECUTE';

  const opacityMap = { EXECUTE: 1, CAUTION: 0.75, WAIT: 0.5, HOLD: 0.3 };
  const opacity = opacityMap[execLevel] || 1;

  const isStateTransition = rotation.mode === 'STATE_TRANSITION';
  const topLabel = isStateTransition ? 'NACHHER' : 'HEUTE';
  const bottomLabel = isStateTransition ? 'VORHER' : 'GESTERN';

  // Build current weights
  const currentWeights = {};
  Object.entries(clusterCurrent).forEach(([ck, data]) => {
    if (data.weight > 0) currentWeights[ck] = data.weight;
  });

  // Build previous weights
  const prevWeights = {};
  Object.entries(prevClusters).forEach(([ck, w]) => {
    if (w > 0) prevWeights[ck] = w;
  });

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: `${COLORS.fadedBlue}30` }}>
      <div className="space-y-3">
        <BarRow label={topLabel} weights={currentWeights} opacity={opacity} />
        {Object.keys(prevWeights).length > 0 ? (
          <BarRow label={bottomLabel} weights={prevWeights} opacity={opacity * 0.6} />
        ) : (
          <p className="text-xs text-center" style={{ color: COLORS.fadedBlue }}>
            Vergleichsdaten ab morgen verfügbar
          </p>
        )}
      </div>
    </div>
  );
}

function BarRow({ label, weights, opacity }) {
  const total = Object.values(weights).reduce((s, v) => s + v, 0) || 1;
  const sorted = Object.entries(weights).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <p className="text-xs font-bold mb-1" style={{ color: COLORS.fadedBlue }}>{label}</p>
      <div className="flex h-8 rounded overflow-hidden">
        {sorted.map(([ck, w]) => {
          const pct = (w / total) * 100;
          const color = CLUSTER_COLORS[ck] || COLORS.mutedBlue;
          const name = CLUSTER_MAP[ck]?.name || ck;
          return (
            <div
              key={ck}
              className="flex items-center justify-center text-xs font-medium overflow-hidden"
              style={{
                width: `${Math.max(pct, 3)}%`,
                backgroundColor: color,
                opacity,
                color: '#0A1628',
                minWidth: '20px',
              }}
              title={`${name}: ${(w * 100).toFixed(1)}%`}
            >
              {pct > 10 && <span>{(w * 100).toFixed(0)}%</span>}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
        {sorted.map(([ck, w]) => (
          <span key={ck} className="flex items-center gap-1 text-xs" style={{ color: COLORS.mutedBlue }}>
            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: CLUSTER_COLORS[ck] }} />
            {CLUSTER_MAP[ck]?.name?.split(' ').pop() || ck} {(w * 100).toFixed(1)}%
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniClusterBar({ weights }) {
  if (!weights || Object.keys(weights).length === 0) return null;
  const total = Object.values(weights).reduce((s, v) => s + v, 0) || 1;
  const sorted = Object.entries(weights).filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex h-4 rounded overflow-hidden">
      {sorted.map(([ck, w]) => {
        const pct = (w / total) * 100;
        return (
          <div
            key={ck}
            style={{
              width: `${Math.max(pct, 3)}%`,
              backgroundColor: CLUSTER_COLORS[ck] || COLORS.mutedBlue,
              minWidth: '8px',
            }}
            title={`${CLUSTER_MAP[ck]?.name || ck}: ${(w * 100).toFixed(1)}%`}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// SEKTION 4: CLUSTER-TABELLE
// ============================================================

function ClusterTable({ rotation }) {
  const status = rotation.status || 'ALIGNED';
  const [expanded, setExpanded] = useState(status !== 'ALIGNED');
  const [openClusters, setOpenClusters] = useState({});
  const clusterCurrent = rotation.cluster_current || {};
  const clusterDeltas = rotation.cluster_deltas || {};
  const assetDetails = rotation.asset_details || {};
  const sparklineData = rotation.sparkline_data || {};

  // Sort by weight descending
  const sortedClusters = Object.entries(clusterCurrent)
    .sort((a, b) => b[1].weight - a[1].weight);

  const toggleCluster = (ck) => {
    setOpenClusters(prev => ({ ...prev, [ck]: !prev[ck] }));
  };

  return (
    <div className="rounded-lg border" style={{ borderColor: `${COLORS.fadedBlue}30` }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold"
        style={{ color: COLORS.iceWhite }}
      >
        <span>Cluster-Details</span>
        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          style={{ color: COLORS.mutedBlue }} />
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-1 text-xs font-bold mb-2 pb-1"
            style={{ color: COLORS.fadedBlue, borderBottom: `1px solid ${COLORS.fadedBlue}20` }}>
            <span className="col-span-4">Cluster</span>
            <span className="col-span-2 text-right">Jetzt</span>
            <span className="col-span-2 text-right">Δ 1d</span>
            <span className="col-span-2 text-right hidden sm:block">Δ 1W</span>
            <span className="col-span-2 text-right">Trend</span>
          </div>

          {sortedClusters.map(([ck, data]) => {
            const cd = clusterDeltas[ck] || {};
            const materialBg = cd.materiality === 'YELLOW' ? `${COLORS.signalYellow}10`
              : cd.materiality === 'ORANGE' ? `${COLORS.signalOrange}10`
              : cd.materiality === 'RED' ? `${COLORS.signalRed}10`
              : 'transparent';
            const materialBorder = cd.materiality === 'RED' ? `3px solid ${COLORS.signalRed}30` : 'none';

            // Assets in this cluster
            const clusterAssets = Object.entries(assetDetails)
              .filter(([, ad]) => ad.cluster === ck)
              .sort((a, b) => b[1].weight - a[1].weight);

            const isOpen = openClusters[ck] || false;

            return (
              <div key={ck}>
                {/* Cluster row */}
                <button
                  onClick={() => toggleCluster(ck)}
                  className="w-full grid grid-cols-12 gap-1 items-center py-2 text-xs rounded"
                  style={{ backgroundColor: materialBg, borderLeft: materialBorder }}
                >
                  <span className="col-span-4 flex items-center gap-1 text-left" style={{ color: COLORS.iceWhite }}>
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: CLUSTER_COLORS[ck] }} />
                    <span className="truncate">{data.display_name}</span>
                  </span>
                  <span className="col-span-2 text-right font-medium" style={{ color: COLORS.iceWhite }}>
                    {(data.weight * 100).toFixed(1)}%
                  </span>
                  <span className="col-span-2 text-right" style={{ color: getMaterialityColor(cd.delta_1d || 0) }}>
                    <DeltaDisplay value={cd.delta_1d} />
                  </span>
                  <span className="col-span-2 text-right hidden sm:block"
                    style={{ color: cd.delta_1w != null ? getMaterialityColor(cd.delta_1w) : COLORS.fadedBlue }}>
                    <DeltaDisplay value={cd.delta_1w} />
                  </span>
                  <span className="col-span-2 flex justify-end">
                    <MiniSparkline data={sparklineData[ck]} color={CLUSTER_COLORS[ck]} />
                  </span>
                </button>

                {/* Expanded assets */}
                {isOpen && clusterAssets.map(([ticker, ad]) => (
                  <div key={ticker}
                    className="grid grid-cols-12 gap-1 items-center py-1.5 pl-8 text-xs"
                    style={{ color: COLORS.mutedBlue }}>
                    <span className="col-span-4 truncate">{getAssetLabel(ticker)}</span>
                    <span className="col-span-2 text-right">{(ad.weight * 100).toFixed(1)}%</span>
                    <span className="col-span-2 text-right" style={{ color: getMaterialityColor(ad.delta_1d || 0) }}>
                      <DeltaDisplay value={ad.delta_1d} />
                    </span>
                    <span className="col-span-2 text-right hidden sm:block"
                      style={{ color: ad.delta_1w != null ? getMaterialityColor(ad.delta_1w) : COLORS.fadedBlue }}>
                      <DeltaDisplay value={ad.delta_1w} />
                    </span>
                    <span className="col-span-2 flex justify-end">
                      <AssetLabelBadge label={ad.label} />
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeltaDisplay({ value }) {
  if (value == null) return <span style={{ color: COLORS.fadedBlue }}>—</span>;
  const arrow = value > 0.001 ? '↑' : value < -0.001 ? '↓' : '→';
  const pp = (value * 100).toFixed(1);
  const sign = value > 0 ? '+' : '';
  return <span>{arrow} {sign}{pp}pp</span>;
}

function AssetLabelBadge({ label }) {
  const styles = {
    NEW: { bg: `${COLORS.signalGreen}20`, color: COLORS.signalGreen },
    EXIT: { bg: `${COLORS.signalRed}20`, color: COLORS.signalRed },
    SHIFT: { bg: `${COLORS.fadedBlue}30`, color: COLORS.mutedBlue },
    HOLD: { bg: `${COLORS.baldurBlue}20`, color: COLORS.baldurBlue },
  };
  const s = styles[label] || styles.SHIFT;
  return (
    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: s.bg, color: s.color }}>
      {label}
    </span>
  );
}

function MiniSparkline({ data, color }) {
  if (!data || !data.values || data.values.length < 2) {
    return <span className="text-xs" style={{ color: COLORS.fadedBlue }}>—</span>;
  }

  const values = data.values;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 60;
  const h = 24;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color || COLORS.mutedBlue}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// SEKTION 5: PORTFOLIO REBALANCER
// ============================================================

// localStorage helpers — silent fail wenn nicht verfuegbar
function loadSaved(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function savePersistent(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

function getHoldingValueFrom(holdings, inputMode, ticker) {
  const h = holdings[ticker] || {};
  if (inputMode === 'eur') return parseFloat(h.eur) || 0;
  return (parseFloat(h.units) || 0) * (parseFloat(h.price) || 0);
}

function AUMCalculator({ rotation }) {
  const [aumExpanded, setAumExpanded] = useState(false);

  // Saved = was in localStorage steht (uebernommen)
  const [savedAum, setSavedAum] = useState(() => loadSaved('bcc_rebalancer_aum', ''));
  const [savedMode, setSavedMode] = useState(() => loadSaved('bcc_rebalancer_mode', 'target'));
  const [savedInputMode, setSavedInputMode] = useState(() => loadSaved('bcc_rebalancer_inputmode', 'eur'));
  const [savedHoldings, setSavedHoldings] = useState(() => loadSaved('bcc_rebalancer_holdings', {}));

  // Draft = was der User gerade eingibt (noch nicht uebernommen)
  const [draftAum, setDraftAum] = useState(savedAum);
  const [draftMode, setDraftMode] = useState(savedMode);
  const [draftInputMode, setDraftInputMode] = useState(savedInputMode);
  const [draftHoldings, setDraftHoldings] = useState(savedHoldings);
  const [isDirty, setIsDirty] = useState(false);

  const assetDetails = rotation.asset_details || {};
  const draftAumNum = parseFloat(draftAum) || 0;
  const savedAumNum = parseFloat(savedAum) || 0;

  const sortedAssets = Object.entries(assetDetails)
    .filter(([, ad]) => ad.weight > 0)
    .sort((a, b) => b[1].weight - a[1].weight);

  // Draft updaters — markieren als dirty, speichern NICHT
  const updateDraftAum = (val) => { setDraftAum(val); setIsDirty(true); };
  const updateDraftMode = (val) => { setDraftMode(val); setIsDirty(true); };
  const updateDraftInputMode = (val) => { setDraftInputMode(val); setIsDirty(true); };
  const updateDraftHolding = (ticker, field, val) => {
    setDraftHoldings(prev => ({ ...prev, [ticker]: { ...(prev[ticker] || {}), [field]: val } }));
    setIsDirty(true);
  };

  // Uebernehmen — speichert alles in localStorage
  const handleSubmit = () => {
    savePersistent('bcc_rebalancer_aum', draftAum);
    savePersistent('bcc_rebalancer_mode', draftMode);
    savePersistent('bcc_rebalancer_inputmode', draftInputMode);
    savePersistent('bcc_rebalancer_holdings', draftHoldings);
    setSavedAum(draftAum);
    setSavedMode(draftMode);
    setSavedInputMode(draftInputMode);
    setSavedHoldings(draftHoldings);
    setIsDirty(false);
  };

  const resetAll = () => {
    setDraftAum(''); setDraftHoldings({}); setDraftMode('target'); setDraftInputMode('eur');
    setSavedAum(''); setSavedHoldings({}); setSavedMode('target'); setSavedInputMode('eur');
    savePersistent('bcc_rebalancer_aum', '');
    savePersistent('bcc_rebalancer_holdings', {});
    savePersistent('bcc_rebalancer_mode', 'target');
    savePersistent('bcc_rebalancer_inputmode', 'eur');
    setIsDirty(false);
  };

  // Fuer Anzeige: immer saved Daten verwenden, fuer Eingabe: draft
  const displayAumNum = savedAumNum;
  const displayHoldings = savedHoldings;
  const displayInputMode = savedInputMode;
  const getDisplayHoldingValue = (ticker) => getHoldingValueFrom(displayHoldings, displayInputMode, ticker);
  const totalDisplayHoldings = sortedAssets.reduce((sum, [t]) => sum + getDisplayHoldingValue(t), 0);
  const hasAnySavedHoldings = sortedAssets.some(([t]) => getDisplayHoldingValue(t) > 0);

  // Materiality threshold: 0.5% of AUM
  const materialThreshold = displayAumNum * 0.005;

  const fmtEur = (val) => val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const fmtEurSigned = (val) => `${val >= 0 ? '+' : ''}${fmtEur(val)}`;

  return (
    <div className="rounded-lg border" style={{ borderColor: `${COLORS.fadedBlue}30` }}>
      <button
        onClick={() => setAumExpanded(!aumExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm"
        style={{ color: COLORS.mutedBlue }}
      >
        <span className="flex items-center gap-2">
          <Calculator size={14} />
          <span>Portfolio Rebalancer</span>
          {displayAumNum > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS.baldurBlue}20`, color: COLORS.baldurBlue }}>
              {fmtEur(displayAumNum)}
            </span>
          )}
        </span>
        <ChevronDown size={16} className={`transition-transform ${aumExpanded ? 'rotate-180' : ''}`} />
      </button>

      {aumExpanded && (
        <div className="px-4 pb-4 space-y-3">

          {/* Modus-Toggle: Target vs Rebalance */}
          <div className="flex rounded overflow-hidden text-xs" style={{ border: `1px solid ${COLORS.fadedBlue}40` }}>
            <button
              onClick={() => updateDraftMode('target')}
              className="flex-1 py-1.5 px-3 transition-colors"
              style={{
                backgroundColor: draftMode === 'target' ? COLORS.baldurBlue : 'transparent',
                color: draftMode === 'target' ? '#fff' : COLORS.mutedBlue,
              }}
            >
              Neues Portfolio
            </button>
            <button
              onClick={() => updateDraftMode('rebalance')}
              className="flex-1 py-1.5 px-3 transition-colors"
              style={{
                backgroundColor: draftMode === 'rebalance' ? COLORS.baldurBlue : 'transparent',
                color: draftMode === 'rebalance' ? '#fff' : COLORS.mutedBlue,
              }}
            >
              Rebalancing
            </button>
          </div>

          {/* AUM Eingabe */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: COLORS.fadedBlue }}>
              {draftMode === 'target' ? 'Portfolio-Wert (AUM)' : 'Ziel-Portfoliowert (AUM)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="z.B. 100000"
                value={draftAum}
                onChange={(e) => updateDraftAum(e.target.value)}
                className="flex-1 rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: `${COLORS.fadedBlue}20`,
                  color: COLORS.iceWhite,
                  border: `1px solid ${COLORS.fadedBlue}40`,
                }}
              />
              <span className="text-sm" style={{ color: COLORS.mutedBlue }}>EUR</span>
            </div>
          </div>

          {/* Rebalance-Modus: Eingabe-Toggle + Bestands-Eingabe */}
          {draftMode === 'rebalance' && draftAumNum > 0 && (
            <>
              {/* Input-Mode Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs" style={{ color: COLORS.fadedBlue }}>Bestände eingeben als:</label>
                <div className="flex rounded overflow-hidden text-xs" style={{ border: `1px solid ${COLORS.fadedBlue}40` }}>
                  <button
                    onClick={() => updateDraftInputMode('eur')}
                    className="py-1 px-3 transition-colors"
                    style={{
                      backgroundColor: draftInputMode === 'eur' ? COLORS.baldurBlue : 'transparent',
                      color: draftInputMode === 'eur' ? '#fff' : COLORS.mutedBlue,
                    }}
                  >
                    € Beträge
                  </button>
                  <button
                    onClick={() => updateDraftInputMode('units')}
                    className="py-1 px-3 transition-colors"
                    style={{
                      backgroundColor: draftInputMode === 'units' ? COLORS.baldurBlue : 'transparent',
                      color: draftInputMode === 'units' ? '#fff' : COLORS.mutedBlue,
                    }}
                  >
                    Stück × Kurs
                  </button>
                </div>
              </div>

              {/* Bestaende-Tabelle */}
              <div className="space-y-1.5">
                {sortedAssets.map(([ticker, ad]) => {
                  const h = draftHoldings[ticker] || {};
                  const targetVal = ad.weight * draftAumNum;

                  return (
                    <div key={ticker} className="rounded p-2" style={{ backgroundColor: `${COLORS.fadedBlue}10` }}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium" style={{ color: COLORS.iceWhite }}>
                          {getAssetLabel(ticker)}
                        </span>
                        <span className="text-xs" style={{ color: COLORS.fadedBlue }}>
                          Ziel: {(ad.weight * 100).toFixed(1)}% = {fmtEur(targetVal)}
                        </span>
                      </div>

                      {draftInputMode === 'eur' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: COLORS.fadedBlue }}>Ist:</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={h.eur || ''}
                            onChange={(e) => updateDraftHolding(ticker, 'eur', e.target.value)}
                            className="flex-1 rounded px-2 py-1 text-xs outline-none"
                            style={{
                              backgroundColor: `${COLORS.fadedBlue}20`,
                              color: COLORS.iceWhite,
                              border: `1px solid ${COLORS.fadedBlue}30`,
                            }}
                          />
                          <span className="text-xs" style={{ color: COLORS.fadedBlue }}>€</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: COLORS.fadedBlue }}>Stk:</span>
                          <input type="number" placeholder="0" value={h.units || ''}
                            onChange={(e) => updateDraftHolding(ticker, 'units', e.target.value)}
                            className="w-20 rounded px-2 py-1 text-xs outline-none"
                            style={{ backgroundColor: `${COLORS.fadedBlue}20`, color: COLORS.iceWhite, border: `1px solid ${COLORS.fadedBlue}30` }}
                          />
                          <span className="text-xs" style={{ color: COLORS.fadedBlue }}>×</span>
                          <input type="number" step="0.01" placeholder="Kurs" value={h.price || ''}
                            onChange={(e) => updateDraftHolding(ticker, 'price', e.target.value)}
                            className="w-20 rounded px-2 py-1 text-xs outline-none"
                            style={{ backgroundColor: `${COLORS.fadedBlue}20`, color: COLORS.iceWhite, border: `1px solid ${COLORS.fadedBlue}30` }}
                          />
                          <span className="text-xs" style={{ color: COLORS.fadedBlue }}>€</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Uebernehmen + Reset Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2 rounded text-xs font-bold transition-colors"
                  style={{
                    backgroundColor: isDirty ? COLORS.baldurBlue : `${COLORS.fadedBlue}30`,
                    color: isDirty ? '#fff' : COLORS.fadedBlue,
                  }}
                >
                  {isDirty ? '✓ Übernehmen' : 'Gespeichert'}
                </button>
                <button
                  onClick={resetAll}
                  className="text-xs px-3 py-2 rounded transition-colors"
                  style={{ color: COLORS.fadedBlue, border: `1px solid ${COLORS.fadedBlue}30` }}
                >
                  Reset
                </button>
              </div>
            </>
          )}

          {/* Ergebnis-Anzeige: basiert auf SAVED Daten */}
          {savedMode === 'rebalance' && displayAumNum > 0 && hasAnySavedHoldings && (
            <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: `${COLORS.fadedBlue}15`, border: `1px solid ${COLORS.fadedBlue}30` }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: COLORS.fadedBlue }}>Ist-Portfolio:</span>
                <span style={{ color: COLORS.iceWhite }}>{fmtEur(totalDisplayHoldings)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: COLORS.fadedBlue }}>Ziel-Portfolio:</span>
                <span style={{ color: COLORS.iceWhite }}>{fmtEur(displayAumNum)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium" style={{ borderTop: `1px solid ${COLORS.fadedBlue}30`, paddingTop: '6px' }}>
                <span style={{ color: COLORS.fadedBlue }}>Differenz:</span>
                <span style={{ color: displayAumNum - totalDisplayHoldings > 0 ? COLORS.signalGreen : displayAumNum - totalDisplayHoldings < 0 ? COLORS.signalRed : COLORS.fadedBlue }}>
                  {fmtEurSigned(displayAumNum - totalDisplayHoldings)}
                </span>
              </div>

              {/* Rebalancing Trades — nur echte Trades */}
              <div style={{ borderTop: `1px solid ${COLORS.fadedBlue}30`, paddingTop: '6px' }}>
                <p className="text-xs font-bold mb-2" style={{ color: COLORS.iceWhite }}>Rebalancing-Trades:</p>
                {(() => {
                  const trades = sortedAssets
                    .map(([ticker, ad]) => {
                      const holdVal = getDisplayHoldingValue(ticker);
                      const targetVal = ad.weight * displayAumNum;
                      const delta = targetVal - holdVal;
                      return { ticker, delta, holdVal, targetVal };
                    })
                    .filter(t => Math.abs(t.delta) > materialThreshold);

                  if (trades.length === 0) {
                    return (
                      <p className="text-xs" style={{ color: COLORS.signalGreen }}>
                        ✓ Portfolio ist im Ziel — kein Rebalancing nötig
                      </p>
                    );
                  }

                  return trades.map(t => {
                    const isBuy = t.delta > 0;
                    const absDelta = Math.abs(t.delta);
                    return (
                      <div key={t.ticker} className="flex justify-between items-center text-xs py-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-4 text-center font-bold" style={{
                            color: isBuy ? COLORS.signalGreen : COLORS.signalRed
                          }}>
                            {isBuy ? '▲' : '▼'}
                          </span>
                          <span style={{ color: COLORS.iceWhite }}>{t.ticker}</span>
                        </span>
                        <span style={{ color: isBuy ? COLORS.signalGreen : COLORS.signalRed }}>
                          {isBuy ? 'KAUFEN' : 'VERKAUFEN'} {fmtEur(absDelta)}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Target-Modus: nur Zielbetraege (wie bisher) */}
          {draftMode === 'target' && draftAumNum > 0 && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: COLORS.fadedBlue }}>
                Ziel-Allokation für {fmtEur(draftAumNum)}:
              </p>
              {sortedAssets.map(([ticker, ad]) => {
                const euroAmount = ad.weight * draftAumNum;
                const euroDelta = (ad.delta_1d || 0) * draftAumNum;
                return (
                  <div key={ticker} className="flex justify-between items-center text-xs">
                    <span style={{ color: COLORS.iceWhite }}>{getAssetLabel(ticker)}</span>
                    <div className="text-right">
                      <span style={{ color: COLORS.iceWhite }}>{fmtEur(euroAmount)}</span>
                      <span className="ml-2" style={{ color: COLORS.fadedBlue }}>({(ad.weight * 100).toFixed(1)}%)</span>
                      {euroDelta !== 0 && (
                        <span className="ml-2" style={{ color: getMaterialityColor(ad.delta_1d || 0) }}>
                          {euroDelta > 0 ? '+' : ''}{fmtEur(euroDelta)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SEKTION 6: STATE-HISTORY TIMELINE
// ============================================================

function StateHistory({ rotation }) {
  const stateHistory = rotation.state_history || [];
  const daysSinceChange = rotation.days_since_state_change;

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: `${COLORS.fadedBlue}30` }}>
      <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.iceWhite }}>State-History</h3>

      {stateHistory.length === 0 ? (
        <p className="text-xs" style={{ color: COLORS.fadedBlue }}>
          Kein State-Wechsel in der verfügbaren Historie.
          {daysSinceChange != null && ` Aktueller State seit ${daysSinceChange} Tagen.`}
        </p>
      ) : (
        <div className="space-y-4">
          {stateHistory.map((sc, i) => {
            const dateStr = formatDateDE(sc.date);
            return (
              <div key={i} className="relative pl-6"
                style={{ borderLeft: `2px solid ${i === 0 ? COLORS.baldurBlue : COLORS.fadedBlue}30` }}>
                {/* Dot */}
                <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: i === 0 ? COLORS.baldurBlue : COLORS.fadedBlue }} />

                <p className="text-xs font-bold" style={{ color: COLORS.iceWhite }}>{dateStr}</p>
                <p className="text-xs" style={{ color: COLORS.mutedBlue }}>
                  State {sc.from_state} → State {sc.to_state}
                </p>
                <p className="text-xs" style={{ color: COLORS.fadedBlue }}>
                  {sc.from_name} → {sc.to_name}
                </p>
                {sc.trigger_reason && (
                  <p className="text-xs mt-0.5" style={{ color: COLORS.signalYellow }}>
                    {sc.trigger_reason}
                  </p>
                )}

                {/* Mini bars */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: COLORS.fadedBlue }}>Vorher</p>
                    <MiniClusterBar weights={sc.snapshot_before} />
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: COLORS.fadedBlue }}>Nachher</p>
                    <MiniClusterBar weights={sc.snapshot_after} />
                  </div>
                </div>

                {/* NEU / EXIT */}
                {sc.new_clusters?.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: COLORS.signalGreen }}>
                    NEU: {sc.new_clusters.join(', ')}
                  </p>
                )}
                {sc.exited_clusters?.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: COLORS.signalRed }}>
                    EXIT: {sc.exited_clusters.join(', ')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SEKTION 7: META-ZEILE
// ============================================================

function MetaLine({ rotation, v16, dashboard }) {
  const dateStr = rotation.date || dashboard?.date || '—';
  const regime = v16.regime || '—';
  const quality = dashboard?.header?.data_quality || 'FULL';

  return (
    <div className="text-xs text-center py-2" style={{ color: COLORS.fadedBlue }}>
      Letzter V16-Lauf: {dateStr} • Regime: {regime} • Datenqualität: {quality}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatDateDE(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
