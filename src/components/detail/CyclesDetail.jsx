'use client';

import { useState } from 'react';
import GlassCard from '@/components/shared/GlassCard';
import {
  COLORS,
  CYCLE_ALIGNMENT_COLORS,
  CYCLE_PHASE_COLORS,
  CYCLE_TIER_COLORS,
  CYCLE_DATA_QUALITY_COLORS,
  DANGER_ZONE_COLORS,
} from '@/lib/constants';

// ===== HELPERS =====

const CYCLE_META = {
  LIQUIDITY:    { name: 'Global Liquidity',         icon: '💧', tier: 1, unit: '$', indicator: 'Fed Net Liq' },
  CREDIT:       { name: 'Credit Cycle',             icon: '💳', tier: 1, unit: 'bps', indicator: 'HY OAS' },
  COMMODITY:    { name: 'Commodity Supercycle',      icon: '🛢️', tier: 1, unit: '', indicator: 'CRB Real' },
  CHINA_CREDIT: { name: 'China Credit Impulse',     icon: '🇨🇳', tier: 1, unit: '', indicator: 'Cu/Au Ratio' },
  DOLLAR:       { name: 'US Dollar Cycle',           icon: '💵', tier: 2, unit: '', indicator: 'DXY (DTWEXBGS)' },
  BUSINESS:     { name: 'Business Cycle',            icon: '🏭', tier: 2, unit: '%', indicator: 'INDPRO YoY' },
  FED_RATES:    { name: 'Fed / Interest Rate',       icon: '🏦', tier: 2, unit: '%', indicator: 'Real FFR' },
  EARNINGS:     { name: 'Earnings / Profit',         icon: '📊', tier: 2, unit: '%', indicator: 'Corp Profits YoY' },
  TRADE:        { name: 'Global Trade / Shipping',   icon: '🚢', tier: 3, unit: '%', indicator: 'CASS Freight YoY' },
  POLITICAL:    { name: 'Political / Presidential',  icon: '🗳️', tier: 3, unit: '', indicator: 'Calendar Year' },
};

const CYCLE_ORDER = [
  'LIQUIDITY', 'CREDIT', 'COMMODITY', 'CHINA_CREDIT',
  'DOLLAR', 'BUSINESS', 'FED_RATES', 'EARNINGS',
  'TRADE', 'POLITICAL',
];

function phaseLabel(phase) {
  if (!phase || phase === 'UNKNOWN') return '—';
  return phase.replace(/_/g, ' ');
}

function fmtVal(val, unit) {
  if (val == null || val === '') return '—';
  if (unit === '$') return `$${Number(val).toLocaleString('en-US')}`;
  if (unit === 'bps') return `${Number(val).toFixed(0)} bps`;
  if (unit === '%') return `${Number(val).toFixed(2)}%`;
  return String(val);
}

function velArrow(v) {
  if (v == null) return '';
  return v > 0 ? ' ▲' : v < 0 ? ' ▼' : ' →';
}

function velColor(v) {
  if (v == null) return COLORS.mutedBlue;
  return v > 0 ? COLORS.signalGreen : v < 0 ? COLORS.signalRed : COLORS.mutedBlue;
}

function alignIcon(a) {
  if (a === 'ALIGNED') return '✅';
  if (a === 'DIVERGED') return '❌';
  return '➖';
}

// ===== COLLAPSIBLE SECTION =====

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 border-b border-white/10"
      >
        <span className="text-label uppercase tracking-wider text-muted-blue">{title}</span>
        <span className="text-caption text-muted-blue">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}

// ===== CYCLE CARD =====

function CycleCard({ cycleId, phaseData }) {
  const meta = CYCLE_META[cycleId] || {};
  const phase = phaseData?.phase || 'UNKNOWN';
  const confidence = phaseData?.confidence;
  const alignment = phaseData?.v16_alignment || 'NEUTRAL';
  const inDanger = phaseData?.in_danger_zone;
  const phaseColor = CYCLE_PHASE_COLORS[phase] || COLORS.fadedBlue;
  const tierColor = CYCLE_TIER_COLORS[meta.tier] || COLORS.mutedBlue;

  return (
    <div
      className="rounded-lg p-3 mb-2"
      style={{
        backgroundColor: `${phaseColor}10`,
        borderLeft: `3px solid ${phaseColor}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '16px' }}>{meta.icon}</span>
          <span className="text-sm font-semibold text-ice-white">{meta.name}</span>
          <span
            className="text-caption px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: `${tierColor}20`, color: tierColor, fontSize: '10px' }}
          >
            T{meta.tier}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption" title="V16 Alignment">{alignIcon(alignment)}</span>
          {inDanger && <span className="text-caption" title="In Danger Zone">⚠️</span>}
        </div>
      </div>

      {/* Phase + Confidence */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono font-bold text-sm" style={{ color: phaseColor }}>
          {phaseLabel(phase)}
        </span>
        {confidence != null && (
          <span className="text-caption text-muted-blue font-mono">{confidence}% conf</span>
        )}
      </div>

      {/* Indicator + Alignment */}
      <div className="text-caption text-muted-blue">
        {meta.indicator}: {fmtVal(phaseData?.indicator_value, meta.unit)}
        {phaseData?.velocity != null && (
          <span style={{ color: velColor(phaseData.velocity) }}>
            {velArrow(phaseData.velocity)} vel: {Number(phaseData.velocity).toFixed(4)}
          </span>
        )}
      </div>

      {/* MA if available */}
      {phaseData?.indicator_12m_ma != null && (
        <div className="text-caption text-muted-blue">
          12M MA: {fmtVal(phaseData.indicator_12m_ma, meta.unit)}
        </div>
      )}

      {/* Percentile if available */}
      {phaseData?.percentile != null && (
        <div className="text-caption text-muted-blue">
          Percentile: {phaseData.percentile}%
        </div>
      )}

      {/* Danger Zone */}
      {phaseData?.danger_zone?.zone_name && (
        <div
          className="text-caption mt-1 px-2 py-1 rounded"
          style={{
            backgroundColor: inDanger ? `${COLORS.signalRed}15` : `${COLORS.signalOrange}10`,
            color: inDanger ? COLORS.signalRed : COLORS.signalOrange,
          }}
        >
          {inDanger ? '⚠ IN ZONE: ' : '→ '}{phaseData.danger_zone.zone_name}
          {phaseData.danger_zone.distance_absolute != null && !inDanger && (
            <span> (Dist: {phaseData.danger_zone.distance_absolute})</span>
          )}
        </div>
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====

export default function CyclesDetail({ dashboard }) {
  const cy = dashboard?.cycles;

  if (!cy || !cy.cycle_phases) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <p className="text-lg text-muted-blue">Cycles Engine noch nicht gelaufen.</p>
          <p className="text-caption text-muted-blue mt-2">
            Workflow: step0v_cycles.yml (Sonntag 02:00 UTC)
          </p>
        </div>
      </GlassCard>
    );
  }

  const score = cy.alignment_score ?? 0;
  const label = cy.alignment_label || 'UNKNOWN';
  const labelColor = CYCLE_ALIGNMENT_COLORS[label] || COLORS.mutedBlue;
  const phases = cy.cycle_phases || {};
  const dzCount = cy.in_danger_zone || 0;

  // Build full cycle data from latest.json cycle_phases
  // cycle_phases has: { LIQUIDITY: { phase, confidence, tier, v16_alignment, in_danger_zone } }
  // The detail page needs these + indicator values from the phases themselves

  return (
    <div className="space-y-4">
      {/* ═══ ALIGNMENT HEADER ═══ */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <span className="text-label uppercase tracking-wider text-muted-blue">
            🔄 Cycle Alignment Dashboard
          </span>
          <span className="text-caption text-muted-blue">{cy.date}</span>
        </div>

        {/* Big Score */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-4xl font-mono font-bold" style={{ color: labelColor }}>
              {score}
            </span>
            <span className="text-xl text-muted-blue font-mono">/10</span>
            <span
              className="ml-3 px-2 py-1 rounded text-sm font-semibold"
              style={{ backgroundColor: `${labelColor}20`, color: labelColor }}
            >
              {label}
            </span>
          </div>
          <div className="text-right">
            <div className="text-caption text-muted-blue">V16 Regime</div>
            <div className="text-sm font-mono text-ice-white">{cy.current_regime || '—'}</div>
          </div>
        </div>

        {/* Bull / Bear / Neutral Bar */}
        <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
          {cy.bullish > 0 && (
            <div
              style={{ flex: cy.bullish, backgroundColor: COLORS.signalGreen }}
              title={`${cy.bullish} Bullish`}
            />
          )}
          {cy.neutral > 0 && (
            <div
              style={{ flex: cy.neutral, backgroundColor: COLORS.fadedBlue }}
              title={`${cy.neutral} Neutral`}
            />
          )}
          {cy.bearish > 0 && (
            <div
              style={{ flex: cy.bearish, backgroundColor: COLORS.signalRed }}
              title={`${cy.bearish} Bearish`}
            />
          )}
        </div>
        <div className="flex justify-between text-caption">
          <span style={{ color: COLORS.signalGreen }}>● {cy.bullish || 0} Bullish</span>
          <span style={{ color: COLORS.fadedBlue }}>● {cy.neutral || 0} Neutral</span>
          <span style={{ color: COLORS.signalRed }}>● {cy.bearish || 0} Bearish</span>
        </div>

        {/* Danger Zone Alert */}
        {dzCount > 0 && (
          <div
            className="mt-3 px-3 py-2 rounded text-sm"
            style={{ backgroundColor: `${COLORS.signalOrange}15`, color: COLORS.signalOrange }}
          >
            ⚠ {dzCount} Danger Zone{dzCount > 1 ? 's' : ''} aktiv — erhoehte Vorsicht
          </div>
        )}

        {/* One-Liner */}
        {cy.one_liner && (
          <div className="mt-3 text-caption text-muted-blue font-mono">{cy.one_liner}</div>
        )}
      </GlassCard>

      {/* ═══ TIER 1: STRUCTURAL ═══ */}
      <GlassCard>
        <Section title="Tier 1 — Structural Cycles" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 1).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* ═══ TIER 2: CYCLICAL ═══ */}
      <GlassCard>
        <Section title="Tier 2 — Cyclical Indicators" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 2).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* ═══ TIER 3: SUPPLEMENTARY ═══ */}
      <GlassCard>
        <Section title="Tier 3 — Supplementary" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 3).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* ═══ ALIGNMENT MATRIX ═══ */}
      <GlassCard>
        <Section title="V16 Alignment Matrix" defaultOpen={false}>
          <div className="space-y-1">
            {CYCLE_ORDER.map(id => {
              const cp = phases[id] || {};
              const al = cp.v16_alignment || 'NEUTRAL';
              const ph = cp.phase || 'UNKNOWN';
              const phColor = CYCLE_PHASE_COLORS[ph] || COLORS.fadedBlue;
              return (
                <div key={id} className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-caption text-ice-white font-mono w-28">
                    {CYCLE_META[id]?.name?.split(' ')[0] || id}
                  </span>
                  <span className="text-caption font-mono" style={{ color: phColor }}>
                    {phaseLabel(ph)}
                  </span>
                  <span className="text-caption">
                    {alignIcon(al)}{' '}
                    <span style={{
                      color: al === 'ALIGNED' ? COLORS.signalGreen :
                             al === 'DIVERGED' ? COLORS.signalRed : COLORS.mutedBlue
                    }}>
                      {al}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      </GlassCard>
    </div>
  );
}
