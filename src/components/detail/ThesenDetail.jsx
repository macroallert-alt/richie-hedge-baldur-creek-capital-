'use client';

import { useState, useEffect, useMemo } from 'react';
import GlassCard from '@/components/shared/GlassCard';
import { COLORS } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const THESES_URL = process.env.NEXT_PUBLIC_THESES_URL;

const LIFECYCLE_COLORS = {
  SEED: '#78909C',
  EMERGING: '#42A5F5',
  ACTIVE: '#66BB6A',
  MATURE: '#FFD54F',
  CHALLENGED: '#FF7043',
  DEAD: '#EF5350',
};

const LIFECYCLE_LABELS = {
  SEED: 'Seed',
  EMERGING: 'Emerging',
  ACTIVE: 'Aktiv',
  MATURE: 'Reif',
  CHALLENGED: 'Angefochten',
  DEAD: 'Tot',
};

const HORIZON_LABELS = {
  TAKTISCH: 'Taktisch (1-3 Mo)',
  ZYKLISCH: 'Zyklisch (3-18 Mo)',
  STRUKTURELL: 'Strukturell (2-10+ J)',
};

const HEALTH_CONFIG = {
  HIGH: { color: COLORS.signalGreen || '#00E676', label: 'Hohe Konfidenz' },
  MEDIUM: { color: COLORS.signalOrange || '#FFB300', label: 'Mittlere Konfidenz' },
  LOW: { color: COLORS.signalRed || '#FF5252', label: 'Niedrige Konfidenz' },
};

const EPISTEMIC_COLORS = {
  FACT: '#E0E0E0',
  INFERENCE: '#64B5F6',
  SPECULATION: '#FFD54F',
};

const STATUS_ICONS = {
  BESTÄTIGT: '✅',
  OFFEN: '○',
  WIDERLEGT: '❌',
};

const KILL_COLORS = {
  LOW: COLORS.signalGreen || '#66BB6A',
  MEDIUM: COLORS.signalOrange || '#FFB300',
  HIGH: COLORS.signalRed || '#FF5252',
};

const V16_COMPAT_COLORS = {
  GO: '#66BB6A',
  GO_REDUCED: '#FFD54F',
  WAIT: '#FF7043',
  NO_TRADE: '#EF5350',
  BEST_ENTRY: '#42A5F5',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

function ToggleSection({ title, icon, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <GlassCard className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-sm font-bold text-ice-white font-mono">
          {icon} {title}{count != null ? ` (${count})` : ''}
        </span>
        <span className="text-xs font-mono" style={{ color: COLORS.fadedBlue }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ── Epistemic Health Badge ──
function EpistemicHealthBadge({ health }) {
  const cfg = HEALTH_CONFIG[health] || HEALTH_CONFIG.LOW;
  return (
    <span
      className="text-xs font-mono px-1.5 py-0.5 rounded"
      style={{ color: cfg.color, backgroundColor: `${cfg.color}15`, fontSize: '9px' }}
    >
      {cfg.label}
    </span>
  );
}

// ── Retrospective Bar ──
function RetrospectiveBar({ retro }) {
  if (!retro) return null;
  const moves = retro.top_3_moves || [];
  const batting = retro.batting_average || {};
  if (moves.length === 0 && !batting.hit_rate) return null;

  return (
    <GlassCard className="mb-2">
      <p className="text-xs font-bold font-mono text-ice-white mb-1">📊 Rückblick</p>
      <div className="space-y-0.5">
        {moves.map((m, i) => (
          <p key={i} className="text-xs font-mono" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
            {m.asset}: {typeof m.move === 'string' ? m.move.substring(0, 60) : m.move}
            {m.had_thesis ? ' ✅' : ' ❌'}
            {m.had_thesis && m.thesis_id ? ` (${m.thesis_id})` : m.had_thesis ? '' : ' (Blinder Fleck)'}
          </p>
        ))}
      </div>
      {batting.hit_rate != null && batting.total_moves_tracked > 0 && (
        <p className="text-xs font-mono mt-1" style={{ color: COLORS.mutedBlue, fontSize: '10px' }}>
          Batting: {(batting.hit_rate * 100).toFixed(0)}% ({batting.had_thesis}/{batting.total_moves_tracked})
        </p>
      )}
    </GlassCard>
  );
}

// ── Conviction Changes ──
function ConvictionChanges({ changes }) {
  const flagged = (changes || []).filter(c => c.flagged || Math.abs(c.change || 0) > 20);
  if (flagged.length === 0) return null;

  return (
    <GlassCard className="mb-2">
      <p className="text-xs font-bold font-mono text-ice-white mb-1">⚠ Conviction-Bewegungen</p>
      {flagged.map((cc, i) => {
        const isDown = (cc.change || 0) < 0;
        return (
          <p key={i} className="text-xs font-mono" style={{
            color: isDown ? (COLORS.signalRed || '#FF5252') : (COLORS.signalGreen || '#66BB6A'),
            fontSize: '10px',
          }}>
            {cc.title || cc.thesis_id}: {cc.from}% → {cc.to}%
            {' '}({isDown ? '▼' : '▲'}{Math.abs(cc.change || 0)})
            {cc.reason ? ` — ${cc.reason.substring(0, 80)}` : ''}
          </p>
        );
      })}
    </GlassCard>
  );
}

// ── Relative Value Chain (pro These, kompakt) ──
function RelativeValueChain({ rv }) {
  if (!rv || !rv.chain || rv.chain.length === 0) return null;

  return (
    <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.08)', borderLeft: '2px solid #3B82F6' }}>
      <p className="text-xs font-bold font-mono" style={{ color: '#3B82F6' }}>💰 Relative Value</p>
      <div className="flex flex-wrap items-center gap-0.5 mt-1">
        {rv.chain.map((link, i) => (
          <span key={i} className="inline-flex items-center">
            {i === 0 && (
              <span className="text-xs font-mono" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
                {link.asset}
              </span>
            )}
            <span className="text-xs font-mono mx-0.5" style={{ color: '#3B82F6', fontSize: '9px' }}>→</span>
            <span className="text-xs font-mono" style={{
              color: i === rv.chain.length - 1 ? '#22C55E' : COLORS.fadedBlue,
              fontWeight: i === rv.chain.length - 1 ? 'bold' : 'normal',
              fontSize: '10px',
            }}>
              {link.next}
            </span>
          </span>
        ))}
      </div>
      {rv.cheapest_asset && (
        <p className="text-xs font-mono mt-1" style={{ color: '#22C55E', fontSize: '9px' }}>
          Billigster Hebel: {rv.cheapest_asset_display || rv.cheapest_asset}
        </p>
      )}
      {rv.conviction_note && (
        <p className="text-xs font-mono mt-0.5" style={{ color: '#6B7280', fontSize: '8px' }}>
          {rv.conviction_note.substring(0, 200)}{rv.conviction_note.length > 200 ? '…' : ''}
        </p>
      )}
    </div>
  );
}

// ── Relative Value Chain Detail (expandiert, mit Ratios) ──
function RelativeValueChainDetail({ rv }) {
  if (!rv || !rv.chain || rv.chain.length === 0) return null;

  return (
    <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.08)', borderLeft: '2px solid #3B82F6' }}>
      <p className="text-xs font-bold font-mono mb-1" style={{ color: '#3B82F6' }}>💰 Relative Value Kette (Detail)</p>
      {rv.chain.map((link, i) => (
        <div key={i} className="flex items-start py-0.5">
          <span className="text-xs font-mono shrink-0 mr-1" style={{ color: '#3B82F6', fontSize: '10px' }}>
            {i + 1}.
          </span>
          <div className="min-w-0">
            <p className="text-xs font-mono" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>{link.asset}</span>
              {' → '}
              <span style={{ color: i === rv.chain.length - 1 ? '#22C55E' : COLORS.fadedBlue, fontWeight: i === rv.chain.length - 1 ? 'bold' : 'normal' }}>
                {link.next}
              </span>
            </p>
            {link.ratio_name && (
              <p className="text-xs font-mono" style={{ color: '#6B7280', fontSize: '8px' }}>
                {link.ratio_name}: {link.ratio_value}
                {link.ratio_context ? ` (${link.ratio_context})` : ''}
                {link.source ? ` [${link.source}]` : ''}
              </p>
            )}
          </div>
        </div>
      ))}
      {rv.cheapest_asset && (
        <p className="text-xs font-mono font-bold mt-1.5" style={{ color: '#22C55E', fontSize: '10px' }}>
          → Billigster Hebel: {rv.cheapest_asset_display || rv.cheapest_asset}
        </p>
      )}
    </div>
  );
}

// ── Relative Value Convergence (eigene Sektion) ──
function RelativeValueConvergence({ convergence }) {
  if (!convergence || convergence.length === 0) return null;

  // Nur Assets die in ≥2 Thesen auftauchen
  const meaningful = convergence.filter(c => c.count >= 2);
  if (meaningful.length === 0) return null;

  return (
    <ToggleSection title="Relative Value Convergence" icon="🔗" count={meaningful.length}>
      <div className="space-y-2">
        {meaningful.map((c, i) => (
          <div key={i} className="p-2 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderLeft: i === 0 ? '2px solid #22C55E' : '2px solid rgba(34,197,94,0.3)' }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold font-mono" style={{ color: i === 0 ? '#22C55E' : COLORS.fadedBlue }}>
                {c.display_name || c.asset}
              </p>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{ color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.15)', fontSize: '9px' }}>
                {c.count}× billigster Hebel
              </span>
            </div>
            <p className="text-xs font-mono mt-0.5" style={{ color: '#6B7280', fontSize: '9px' }}>
              In: {c.thesis_titles ? c.thesis_titles.join(' · ') : c.thesis_ids?.join(' · ') || '—'}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs font-mono mt-2" style={{ color: '#6B7280', fontSize: '8px' }}>
        Assets die in mehreren Thesen als billigster Hebel auftauchen — stärkstes Convergence-Signal.
      </p>
    </ToggleSection>
  );
}

// ── Causal Chain Preview (linearisiert, max 5 Glieder) ──
function CausalChainPreview({ chain, progressMarker }) {
  if (!chain || !chain.root) return null;

  // Linearisiere Hauptpfad (erstes Kind jeweils)
  const nodes = [];
  let node = chain.root;
  while (node && nodes.length < 6) {
    nodes.push(node);
    const children = node.children || [];
    node = children.length > 0 ? children[0] : null;
  }

  return (
    <div className="mt-1.5 mb-1">
      <div className="flex flex-wrap items-center gap-1">
        {nodes.map((n, i) => (
          <span key={n.id || i} className="inline-flex items-center">
            {i > 0 && <span className="text-xs font-mono mx-0.5" style={{ color: COLORS.fadedBlue }}>→</span>}
            <span className="text-xs font-mono" style={{
              color: EPISTEMIC_COLORS[n.epistemic_type] || '#999',
              fontSize: '10px',
            }}>
              {(n.claim || '').substring(0, 30)}{(n.claim || '').length > 30 ? '…' : ''}
              {' '}{STATUS_ICONS[n.status] || '○'}
            </span>
          </span>
        ))}
      </div>
      {progressMarker && (
        <p className="text-xs font-mono mt-0.5" style={{ color: COLORS.mutedBlue, fontSize: '9px' }}>
          {progressMarker}
        </p>
      )}
    </div>
  );
}

// ── Full Causal Chain (Baum mit Einrückung) ──
function FullCausalChain({ chain }) {
  if (!chain || !chain.root) return null;

  function renderNode(node, depth = 0) {
    if (!node) return null;
    const indent = depth * 16;
    const children = node.children || [];
    const isFeedback = node.is_feedback_loop;

    return (
      <div key={node.id}>
        <div className="flex items-start py-0.5" style={{ paddingLeft: `${indent}px` }}>
          <span className="text-xs font-mono shrink-0 mr-1" style={{ color: COLORS.fadedBlue }}>
            {depth > 0 ? '├ ' : ''}
          </span>
          <div className="min-w-0">
            <span className="text-xs font-mono" style={{
              color: EPISTEMIC_COLORS[node.epistemic_type] || '#999',
              fontSize: '10px',
            }}>
              {node.claim}
              {' '}<span style={{ fontSize: '9px' }}>[{node.epistemic_type} {STATUS_ICONS[node.status] || '○'}]</span>
              {isFeedback && <span className="ml-1">🔄 Loop → {node.feedback_target_id}</span>}
            </span>
            {node.implicit_assumption && (
              <p className="text-xs font-mono" style={{ color: '#6B7280', fontSize: '8px' }}>
                Annahme: {node.implicit_assumption}
              </p>
            )}
            {node.indicator && (
              <p className="text-xs font-mono" style={{ color: '#6B7280', fontSize: '8px' }}>
                Indikator: {node.indicator}
                {node.indicator_current_value ? ` (${node.indicator_current_value})` : ''}
              </p>
            )}
          </div>
        </div>
        {children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
      <p className="text-xs font-bold font-mono text-ice-white mb-1">Kausalkette (Baumstruktur)</p>
      {renderNode(chain.root)}
    </div>
  );
}

// ── Catalyst Tracker ──
function CatalystTracker({ catalysts }) {
  if (!catalysts || catalysts.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-bold font-mono text-ice-white mb-1">Katalysatoren</p>
      {catalysts.map((c, i) => (
        <p key={i} className="text-xs font-mono" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
          {c.status === 'TRIGGERED' ? '✅' : '○'} {c.event}
          <span style={{ color: '#6B7280' }}> ({c.type})</span>
        </p>
      ))}
    </div>
  );
}

// ── Perspectives Box ──
function PerspectivesBox({ perspectives, alignment, tension }) {
  if (!perspectives) return null;
  const alignColor = alignment === 'ALLE_DREI' ? '#66BB6A'
    : alignment === 'ZWEI_VON_DREI' ? '#FFD54F' : '#FF7043';

  return (
    <div className="mt-2">
      <p className="text-xs font-bold font-mono text-ice-white mb-1">
        Drei Perspektiven:{' '}
        <span style={{ color: alignColor, fontSize: '9px' }}>
          {alignment === 'ALLE_DREI' ? 'ALLE DREI ALIGNED ✅'
            : alignment === 'ZWEI_VON_DREI' ? 'ZWEI VON DREI ⚠'
            : 'WIDERSPRUCH ❌'}
        </span>
      </p>
      {perspectives.regime_cycle && (
        <p className="text-xs font-mono mb-0.5" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
          🔭 Regime/Zyklus: {perspectives.regime_cycle.substring(0, 200)}
          {perspectives.regime_cycle.length > 200 ? '…' : ''}
        </p>
      )}
      {perspectives.data_flows && (
        <p className="text-xs font-mono mb-0.5" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
          📊 Daten/Flows: {perspectives.data_flows.substring(0, 200)}
          {perspectives.data_flows.length > 200 ? '…' : ''}
        </p>
      )}
      {perspectives.historical_analogy && (
        <p className="text-xs font-mono mb-0.5" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
          📜 Historie: {perspectives.historical_analogy.substring(0, 200)}
          {perspectives.historical_analogy.length > 200 ? '…' : ''}
        </p>
      )}
      {tension && (
        <p className="text-xs font-mono mt-1" style={{ color: '#FF7043', fontSize: '9px' }}>
          Spannung: {tension.substring(0, 200)}{tension.length > 200 ? '…' : ''}
        </p>
      )}
    </div>
  );
}

// ── Counter Thesis ──
function CounterThesisBox({ ct }) {
  if (!ct || !ct.title) return null;
  const killColor = KILL_COLORS[ct.kill_probability] || KILL_COLORS.MEDIUM;

  return (
    <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'rgba(239,83,80,0.08)', borderLeft: '2px solid #EF5350' }}>
      <p className="text-xs font-bold font-mono text-ice-white mb-0.5">
        Gegenthese:{' '}
        <span style={{ color: killColor, fontSize: '9px' }}>Kill: {ct.kill_probability}</span>
      </p>
      <p className="text-xs font-mono mb-1" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
        {typeof ct.title === 'string' ? ct.title.substring(0, 200) : ''}
      </p>
      {ct.core_argument && (
        <p className="text-xs font-mono mb-0.5" style={{ color: '#B0BEC5', fontSize: '9px' }}>
          Argument: {ct.core_argument.substring(0, 200)}{ct.core_argument.length > 200 ? '…' : ''}
        </p>
      )}
      {ct.weakest_link_attack && (
        <p className="text-xs font-mono mb-0.5" style={{ color: '#B0BEC5', fontSize: '9px' }}>
          Schwächstes Glied: {ct.weakest_link_attack.substring(0, 150)}{ct.weakest_link_attack.length > 150 ? '…' : ''}
        </p>
      )}
      {ct.kill_description && (
        <p className="text-xs font-mono" style={{ color: '#B0BEC5', fontSize: '9px' }}>
          Falsifizierung: {ct.kill_description.substring(0, 150)}{ct.kill_description.length > 150 ? '…' : ''}
        </p>
      )}
    </div>
  );
}

// ── Counterintuitive Path ──
function CounterIntuitivePath({ ci }) {
  if (!ci || !ci.exists) return null;
  return (
    <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'rgba(255,213,79,0.08)', borderLeft: '2px solid #FFD54F' }}>
      <p className="text-xs font-bold font-mono" style={{ color: '#FFD54F' }}>⚡ Kontraintuitiver Pfad</p>
      {ci.path_description && (
        <p className="text-xs font-mono mt-0.5" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
          {ci.path_description.substring(0, 300)}{ci.path_description.length > 300 ? '…' : ''}
        </p>
      )}
      {ci.implication && (
        <p className="text-xs font-mono mt-0.5" style={{ color: '#B0BEC5', fontSize: '9px' }}>
          Implikation: {ci.implication.substring(0, 200)}{ci.implication.length > 200 ? '…' : ''}
        </p>
      )}
    </div>
  );
}

// ── Secondary Effects ──
function SecondaryEffects({ effects }) {
  if (!effects || effects.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-bold font-mono text-ice-white mb-1">Sekundäreffekte</p>
      {effects.map((e, i) => (
        <p key={i} className="text-xs font-mono mb-0.5" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
          {e.is_counterintuitive ? '⚡ ' : '→ '}{e.effect?.substring(0, 200)}{(e.effect || '').length > 200 ? '…' : ''}
        </p>
      ))}
    </div>
  );
}

// ── V16 Compatibility Badge ──
function V16CompatBadge({ compat, currentState }) {
  if (!compat) return null;

  // Finde aktuellen State Match
  let currentCompat = null;
  if (currentState) {
    for (const state of Object.keys(compat)) {
      if (currentState.toUpperCase().includes(state)) {
        currentCompat = { state, value: compat[state] };
        break;
      }
    }
  }
  // Fallback: LATE_EXPANSION (aktueller V16 State)
  if (!currentCompat && compat.LATE_EXPANSION) {
    currentCompat = { state: 'LATE_EXPANSION', value: compat.LATE_EXPANSION };
  }

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button onClick={() => setExpanded(!expanded)} className="text-left">
        <p className="text-xs font-mono text-ice-white">
          V16: {currentCompat ? `${currentCompat.state} → ` : ''}
          {currentCompat && (
            <span style={{ color: V16_COMPAT_COLORS[currentCompat.value] || '#999' }}>
              {currentCompat.value}
            </span>
          )}
          <span className="ml-1" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
            {expanded ? '▲ weniger' : '▼ alle States'}
          </span>
        </p>
      </button>
      {expanded && (
        <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
          {Object.entries(compat).map(([state, val]) => (
            <p key={state} className="text-xs font-mono" style={{ fontSize: '8px' }}>
              <span style={{ color: COLORS.fadedBlue }}>{state}:</span>{' '}
              <span style={{ color: V16_COMPAT_COLORS[val] || '#999' }}>{val}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cross System Confirmation ──
function CrossSystemBadge({ cs }) {
  if (!cs) return null;
  return (
    <p className="text-xs font-mono mt-1" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
      📊 {cs.count}/7 Systeme bestätigen
      {cs.systems && Array.isArray(cs.systems) && (
        <span style={{ fontSize: '9px', color: '#6B7280' }}>
          {' '}· {cs.systems.map(s => typeof s === 'string' ? s.substring(0, 25) : s).join(' · ')}
        </span>
      )}
    </p>
  );
}

// ── Sources ──
function SourcesList({ sources, independentCount }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-bold font-mono text-ice-white mb-0.5">
        Quellen ({independentCount || sources.length} unabhängig)
      </p>
      {sources.map((s, i) => (
        <p key={i} className="text-xs font-mono" style={{ color: '#6B7280', fontSize: '9px' }}>
          [{s.tier ? `Tier ${s.tier}` : '?'}] {s.publication || 'Unbekannt'} ({s.date || '?'})
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// THESIS CARD (per These)
// ═══════════════════════════════════════════════════════════════

function ThesisCard({ thesis, tier, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false);

  const lcColor = LIFECYCLE_COLORS[thesis.lifecycle] || '#78909C';
  const asymStars = '⚡'.repeat(Math.min(thesis.asymmetry || 0, 5));

  // Tier 3 = minimal
  if (tier === 3) {
    return (
      <div className="flex items-center justify-between py-1 px-2 rounded mb-1"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
        <span className="text-xs font-mono" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
          {thesis.title_short || thesis.title?.substring(0, 40)}
        </span>
        <span className="text-xs font-mono" style={{ color: lcColor, fontSize: '9px' }}>
          {LIFECYCLE_LABELS[thesis.lifecycle] || thesis.lifecycle} · {thesis.conviction}%
        </span>
      </div>
    );
  }

  return (
    <GlassCard className="mb-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ice-white font-mono">
            💡 {thesis.title_short || thesis.title?.substring(0, 50)}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="text-xs font-mono px-1 py-0.5 rounded"
              style={{ color: lcColor, backgroundColor: `${lcColor}20`, fontSize: '9px' }}>
              {LIFECYCLE_LABELS[thesis.lifecycle] || thesis.lifecycle}
            </span>
            <span className="text-xs font-mono" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
              {HORIZON_LABELS[thesis.horizon] || thesis.horizon}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-sm font-bold font-mono text-ice-white">{thesis.conviction}%</p>
          <p className="text-xs font-mono" style={{ color: '#FFD54F', fontSize: '10px' }}>{asymStars}</p>
        </div>
      </div>

      {/* Causal Chain Preview */}
      <CausalChainPreview chain={thesis.causal_chain} progressMarker={thesis.progress_marker} />

      {/* Relative Value Chain (kompakt) */}
      <RelativeValueChain rv={thesis.relative_value_chain} />

      {/* Quick Stats */}
      <div className="flex flex-wrap items-center gap-2 mt-1 mb-1">
        <CrossSystemBadge cs={thesis.cross_system_confirmation} />
      </div>

      {/* V16 Compat (compact) */}
      {thesis.v16_compatibility && (
        <V16CompatBadge compat={thesis.v16_compatibility} />
      )}

      {/* Counter Thesis Preview (compact für Tier 1) */}
      {thesis.counter_thesis && thesis.counter_thesis.kill_probability && (
        <p className="text-xs font-mono mt-1" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
          Gegenthese: {typeof thesis.counter_thesis.title === 'string'
            ? thesis.counter_thesis.title.substring(0, 60) : '—'}
          {' '}(Kill: <span style={{ color: KILL_COLORS[thesis.counter_thesis.kill_probability] }}>
            {thesis.counter_thesis.kill_probability}
          </span>)
        </p>
      )}

      {/* Expand Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-center mt-2 py-1 rounded text-xs font-mono"
        style={{ color: COLORS.mutedBlue, backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        {expanded ? '▲ Weniger' : '▼ Details'}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-2">
          {/* Direction + Assets */}
          {thesis.direction && (
            <p className="text-xs font-mono mb-1" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
              Richtung: {thesis.direction}
            </p>
          )}

          {/* Full Causal Chain */}
          <FullCausalChain chain={thesis.causal_chain} />

          {/* Relative Value Chain Detail (mit Ratios) */}
          <RelativeValueChainDetail rv={thesis.relative_value_chain} />

          {/* Counterintuitive Path */}
          <CounterIntuitivePath ci={thesis.counterintuitive_path} />

          {/* Secondary Effects */}
          <SecondaryEffects effects={thesis.secondary_effects} />

          {/* Catalysts */}
          <CatalystTracker catalysts={thesis.catalysts} />

          {/* Perspectives */}
          <PerspectivesBox
            perspectives={thesis.perspectives}
            alignment={thesis.perspective_alignment}
            tension={thesis.perspective_tension}
          />

          {/* Counter Thesis (full) */}
          <CounterThesisBox ct={thesis.counter_thesis} />

          {/* Sources */}
          <SourcesList
            sources={thesis.sources}
            independentCount={thesis.independent_source_count}
          />
        </div>
      )}
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ThesenDetail() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!THESES_URL) {
      setError('NEXT_PUBLIC_THESES_URL nicht konfiguriert');
      setLoading(false);
      return;
    }
    fetch(THESES_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-mono" style={{ color: COLORS.fadedBlue }}>Lade Thesen…</p>
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard>
        <p className="text-sm font-mono" style={{ color: COLORS.signalRed }}>Fehler: {error}</p>
      </GlassCard>
    );
  }

  if (!data || !data.theses) return null;

  const meta = data.metadata || {};
  const theses = data.theses || [];
  const tier1 = theses.filter(t => t.tier === 1);
  const tier2 = theses.filter(t => t.tier === 2);
  const tier3 = theses.filter(t => t.tier === 3);

  return (
    <div className="space-y-2">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-ice-white font-mono">Thesen</h2>
        <div className="flex items-center gap-2">
          <EpistemicHealthBadge health={meta.epistemic_health} />
          <span className="text-xs font-mono" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
            Stand: {formatDate(meta.generated_at)}
          </span>
        </div>
      </div>

      {/* ── Retrospective Bar ── */}
      <RetrospectiveBar retro={data.retrospective} />

      {/* ── Conviction Changes ── */}
      <ConvictionChanges changes={data.conviction_changes} />

      {/* ── Relative Value Convergence ── */}
      <RelativeValueConvergence convergence={data.relative_value_convergence} />

      {/* ── Tier 1: Immer offen ── */}
      {tier1.length > 0 && (
        <div>
          <p className="text-xs font-bold font-mono mb-1" style={{ color: COLORS.mutedBlue }}>
            KERNTHESEN ({tier1.length})
          </p>
          {tier1.map(t => (
            <ThesisCard key={t.id} thesis={t} tier={1} defaultExpanded={false} />
          ))}
        </div>
      )}

      {/* ── Tier 2: Eingeklappt ── */}
      {tier2.length > 0 && (
        <ToggleSection title="Emerging" icon="📋" count={tier2.length}>
          {tier2.map(t => (
            <ThesisCard key={t.id} thesis={t} tier={2} defaultExpanded={false} />
          ))}
        </ToggleSection>
      )}

      {/* ── Tier 3: Archiv ── */}
      {tier3.length > 0 && (
        <ToggleSection title="Archiv" icon="📦" count={tier3.length}>
          {tier3.map(t => (
            <ThesisCard key={t.id} thesis={t} tier={3} />
          ))}
        </ToggleSection>
      )}

      {/* ── Adversarial Summary ── */}
      {data.adversarial_summary && (data.adversarial_summary.worst_case?.description || data.adversarial_summary.premortem) && (
        <ToggleSection title="Red Team Analyse" icon="🔴">
          {data.adversarial_summary.worst_case?.description && (
            <div className="mb-2">
              <p className="text-xs font-bold font-mono text-ice-white mb-0.5">Worst Case</p>
              <p className="text-xs font-mono" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
                {data.adversarial_summary.worst_case.description}
              </p>
              {data.adversarial_summary.worst_case.probability_estimate && (
                <p className="text-xs font-mono mt-0.5" style={{ color: '#6B7280', fontSize: '9px' }}>
                  Wahrscheinlichkeit: {data.adversarial_summary.worst_case.probability_estimate}
                  {data.adversarial_summary.worst_case.time_horizon
                    ? ` · Horizont: ${data.adversarial_summary.worst_case.time_horizon}` : ''}
                </p>
              )}
            </div>
          )}
          {data.adversarial_summary.premortem && (
            <div>
              <p className="text-xs font-bold font-mono text-ice-white mb-0.5">Pre-Mortem</p>
              <p className="text-xs font-mono" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
                {data.adversarial_summary.premortem.substring(0, 500)}
                {data.adversarial_summary.premortem.length > 500 ? '…' : ''}
              </p>
            </div>
          )}
        </ToggleSection>
      )}

      {/* ── Open Questions ── */}
      {data.open_questions && data.open_questions.length > 0 && (
        <ToggleSection title="Offene Fragen" icon="❓" count={data.open_questions.length}>
          {data.open_questions.map((q, i) => (
            <div key={i} className="mb-2">
              <p className="text-xs font-mono text-ice-white" style={{ fontSize: '10px' }}>
                {q.question}
              </p>
              {q.why_unanswerable && (
                <p className="text-xs font-mono" style={{ color: '#6B7280', fontSize: '9px' }}>
                  → {q.why_unanswerable}
                </p>
              )}
              {q.suggested_research && (
                <p className="text-xs font-mono" style={{ color: COLORS.mutedBlue, fontSize: '9px' }}>
                  Forschungsansatz: {q.suggested_research}
                </p>
              )}
            </div>
          ))}
        </ToggleSection>
      )}

      {/* ── Silence Alerts ── */}
      {data.silence_alerts && data.silence_alerts.length > 0 && (
        <ToggleSection title="Verschwundene Themen" icon="🔇" count={data.silence_alerts.length}>
          {data.silence_alerts.map((sa, i) => (
            <p key={i} className="text-xs font-mono mb-1" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
              {sa.topic} — {sa.finding || sa.status || 'UNKLAR'}
              {sa.evidence ? `: ${sa.evidence.substring(0, 100)}` : ''}
            </p>
          ))}
        </ToggleSection>
      )}

      {/* ── Watchlist ── */}
      {data.watchlist && data.watchlist.length > 0 && (
        <ToggleSection title="Aktive Watchlist" icon="👁" count={data.watchlist.length}>
          <div className="flex flex-wrap gap-1">
            {data.watchlist.map((w, i) => (
              <span key={i} className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{ color: COLORS.fadedBlue, backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '9px' }}>
                {w}
              </span>
            ))}
          </div>
        </ToggleSection>
      )}

      {/* ── Epistemic Health ── */}
      {data.epistemic_health && (
        <ToggleSection title="Epistemische Gesundheit" icon="🧠">
          <div className="space-y-1">
            <p className="text-xs font-mono" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
              Gesamt: <span style={{ color: HEALTH_CONFIG[data.epistemic_health.overall]?.color }}>
                {data.epistemic_health.overall}
              </span>
            </p>
            {data.epistemic_health.web_search_quality && (
              <p className="text-xs font-mono" style={{ color: '#6B7280', fontSize: '9px' }}>
                Web Search: {data.epistemic_health.web_search_quality}
              </p>
            )}
            {data.epistemic_health.data_gaps?.length > 0 && (
              <p className="text-xs font-mono" style={{ color: '#6B7280', fontSize: '9px' }}>
                Daten-Gaps: {data.epistemic_health.data_gaps.join(', ')}
              </p>
            )}
            {data.epistemic_health.confidence_notes && (
              <p className="text-xs font-mono" style={{ color: '#6B7280', fontSize: '9px' }}>
                {data.epistemic_health.confidence_notes.substring(0, 300)}
              </p>
            )}
          </div>
        </ToggleSection>
      )}

      {/* ── Disclaimer ── */}
      <p className="text-xs font-mono text-center py-2" style={{ color: '#4A5568', fontSize: '8px' }}>
        Thesen basieren auf öffentlich verfügbaren Informationen und Outputs interner Systeme.
        Keine Anlageempfehlung. Kausalketten sind Denk-Werkzeuge, keine Prognosen.
      </p>
    </div>
  );
}
