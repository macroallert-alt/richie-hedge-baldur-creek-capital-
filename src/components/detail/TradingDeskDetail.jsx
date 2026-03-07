'use client';

import { useState, useMemo } from 'react';
import {
  COLORS,
  EXECUTION_LEVEL_COLORS,
  EXECUTION_LEVEL_BG,
  EXECUTION_LEVEL_TEXT,
  EVENT_IMPACT_COLORS,
  DIMENSION_SHORT_NAMES,
} from '@/lib/constants';

// ===== Helper: Dimension score → color =====
function dimColor(score) {
  if (score === 0) return COLORS.signalGreen;
  if (score === 1) return COLORS.signalYellow;
  if (score === 2) return COLORS.signalOrange;
  return COLORS.signalRed;
}

// ===== Helper: Build calendar grid for a given month =====
function buildMonthGrid(year, month, events) {
  const firstDay = new Date(year, month, 1);
  // Monday = 0, Sunday = 6 (ISO)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < startDow; i++) {
    cells.push({ day: null });
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === dateStr);
    cells.push({ day: d, date: dateStr, events: dayEvents });
  }
  return cells;
}

// ===== Helper: Month name (German) =====
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export default function TradingDeskDetail({ dashboard }) {
  const exec = dashboard?.execution || {};
  const dims = exec.dimensions || {};
  const eventWindow = exec.event_window || {};
  const calendarUpcoming = exec.calendar_upcoming || [];
  const calendarMonthly = exec.calendar_monthly || [];
  const topConfirming = exec.top_confirming || [];
  const topConflicting = exec.top_conflicting || [];
  const specificActions = exec.specific_actions || [];
  const wouldChange = exec.would_change_my_mind || {};
  const level = exec.execution_level || 'UNKNOWN';
  const levelColor = EXECUTION_LEVEL_COLORS[level] || COLORS.mutedBlue;

  const [scoreOpen, setScoreOpen] = useState(false);

  // No execution data available
  if (!exec.execution_level) {
    return (
      <div className="py-4 space-y-4">
        <h1 className="text-page-title text-center lg:text-page-title-desktop">Trading Desk</h1>
        <div className="glass-card p-6 text-center">
          <p className="text-body text-muted-blue">Keine Execution-Daten verfügbar.</p>
          <p className="text-caption text-faded-blue mt-2">Step 7 Execution Advisor hat noch nicht geschrieben.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title-desktop">Trading Desk</h1>

      {/* ===== CARD 1: EXECUTION SIGNAL (Spec §21.3) ===== */}
      <ExecutionSignalCard exec={exec} level={level} levelColor={levelColor} />

      {/* ===== CARD 1b: EXECUTION BRIEFING ===== */}
      <ExecutionBriefingCard briefingText={exec.briefing_text} />

      {/* ===== CARD 2: EVENT RADAR (Spec §21.4) ===== */}
      <EventRadarCard eventWindow={eventWindow} calendarUpcoming={calendarUpcoming} />

      {/* ===== CARD 3: CONFIRMING / CONFLICTING (Spec §21.5) ===== */}
      <ConfirmingConflictingCard
        topConfirming={topConfirming}
        topConflicting={topConflicting}
        confirmingCount={exec.confirming_count || 0}
        conflictingCount={exec.conflicting_count || 0}
        netAssessment={exec.net_assessment || '—'}
      />

      {/* ===== CARD 4: RECOMMENDATION (Spec §21.6) ===== */}
      <RecommendationCard
        exec={exec}
        specificActions={specificActions}
        wouldChange={wouldChange}
        dashboard={dashboard}
      />

      {/* ===== CARD 5: SCORE BREAKDOWN (Spec §21.7) ===== */}
      <ScoreBreakdownCard
        dims={dims}
        totalScore={exec.total_score}
        maxScore={exec.max_score}
        level={level}
        levelColor={levelColor}
        isOpen={scoreOpen}
        onToggle={() => setScoreOpen(!scoreOpen)}
      />

      {/* ===== CARD 6: CALENDAR OVERVIEW (Spec §21.8) ===== */}
      <CalendarOverviewCard calendarMonthly={calendarMonthly} eventWindow={eventWindow} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// CARD 1: EXECUTION SIGNAL
// ────────────────────────────────────────────────────────────────
function ExecutionSignalCard({ exec, level, levelColor }) {
  const bgClass = EXECUTION_LEVEL_BG[level] || 'bg-white/5 border-white/10';
  const textClass = EXECUTION_LEVEL_TEXT[level] || 'text-muted-blue';

  // Context text: highest scoring dimension
  const dims = exec.dimensions || {};
  let contextText = '';
  let maxDimScore = 0;
  for (const [key, dim] of Object.entries(dims)) {
    if ((dim.score || 0) > maxDimScore) {
      maxDimScore = dim.score;
      contextText = dim.label || '';
    }
  }

  // Level display text per Spec §21.3
  const levelLabels = {
    EXECUTE: 'EXECUTE AS PLANNED',
    CAUTION: 'CAUTION',
    WAIT: 'WAIT — DO NOT REBALANCE TODAY',
    HOLD: 'HOLD — MULTIPLE RISK FACTORS',
  };

  const displayLabel = levelLabels[level] || level;
  const showContext = level !== 'EXECUTE' && contextText;

  return (
    <div className={`rounded-card border p-5 ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-data-large font-bold ${textClass}`}>
            {displayLabel}
          </p>
          {showContext && (
            <p className="text-body text-ice-white mt-1">{contextText}</p>
          )}
        </div>
        <div className="flex flex-col items-center ml-4">
          <span className={`text-data-large tabular-nums font-bold ${textClass}`}>
            {exec.total_score}/{exec.max_score || 18}
          </span>
          {exec.veto_applied && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-signal-red/20 text-signal-red mt-1">
              VETO
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// CARD 1b: EXECUTION BRIEFING
// ────────────────────────────────────────────────────────────────
function ExecutionBriefingCard({ briefingText }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!briefingText) return null;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 flex items-center justify-between"
      >
        <span className="text-section-title text-ice-white">Execution Briefing</span>
        <span className="text-muted-blue text-body transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-body text-ice-white leading-relaxed whitespace-pre-line">
            {briefingText}
          </p>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// CARD 2: EVENT RADAR
// ────────────────────────────────────────────────────────────────
function EventRadarCard({ eventWindow, calendarUpcoming }) {
  const next48h = eventWindow.next_48h_events || [];
  const convergence = eventWindow.convergence_week || false;

  return (
    <div className="glass-card p-4">
      <h2 className="text-section-title text-ice-white mb-3">Event Radar</h2>

      {/* 48h window */}
      {next48h.length > 0 ? (
        <div className="mb-3">
          <p className="text-caption text-signal-red mb-2">⏱ Nächste 48h</p>
          {next48h.map((e, i) => (
            <p key={i} className="text-body text-ice-white ml-2">• {e}</p>
          ))}
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-body text-signal-green">✓ Keine HIGH-Impact Events in 48h</p>
        </div>
      )}

      {/* Convergence alert */}
      {convergence && (
        <div className="bg-signal-orange/10 border border-signal-orange/30 rounded-lg p-3 mb-3">
          <p className="text-body text-signal-orange font-medium">⚠ Convergence Week — Mehrere HIGH-Events in derselben Woche</p>
        </div>
      )}

      {/* Upcoming events timeline */}
      {calendarUpcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-caption text-muted-blue">Nächste Events</p>
          {calendarUpcoming.map((e, i) => {
            const impactColor = EVENT_IMPACT_COLORS[e.impact] || COLORS.mutedBlue;
            const timeLabel = e.hours_until != null
              ? `in ${e.hours_until}h`
              : e.days_until != null
                ? `in ${e.days_until}d`
                : e.date || '';
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: impactColor }} />
                  <span className="text-body text-ice-white">{e.event}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-caption tabular-nums text-muted-blue">{timeLabel}</span>
                  <span className="text-caption font-medium" style={{ color: impactColor }}>{e.impact}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Density summary */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <span className="text-caption text-muted-blue">Events in 14d</span>
        <span className="text-data-small tabular-nums text-ice-white">
          {eventWindow.next_14d_count || 0} ({eventWindow.event_density_label || '—'})
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// CARD 3: CONFIRMING / CONFLICTING
// ────────────────────────────────────────────────────────────────
function ConfirmingConflictingCard({ topConfirming, topConflicting, confirmingCount, conflictingCount, netAssessment }) {
  return (
    <div className="glass-card p-4">
      <h2 className="text-section-title text-ice-white mb-3">Confirming / Conflicting</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Confirming column */}
        <div>
          <p className="text-caption text-signal-green mb-2">✓ CONFIRMING</p>
          <div className="space-y-1.5">
            {topConfirming.length > 0 ? topConfirming.map((c, i) => (
              <p key={i} className="text-body text-ice-white border-l-2 border-signal-green/40 pl-2">{c}</p>
            )) : (
              <p className="text-caption text-faded-blue">—</p>
            )}
          </div>
        </div>

        {/* Conflicting column */}
        <div>
          <p className="text-caption text-signal-red mb-2">✗ CONFLICTING</p>
          <div className="space-y-1.5">
            {topConflicting.length > 0 ? topConflicting.map((c, i) => (
              <p key={i} className="text-body text-ice-white border-l-2 border-signal-red/40 pl-2">{c}</p>
            )) : (
              <p className="text-caption text-faded-blue">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Net assessment */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <span className="text-caption text-muted-blue">
          {confirmingCount} vs {conflictingCount}
        </span>
        <span className="text-data-small text-ice-white">
          {netAssessment.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// CARD 4: RECOMMENDATION
// ────────────────────────────────────────────────────────────────
function RecommendationCard({ exec, specificActions, wouldChange, dashboard }) {
  // V16 weight changes from signals block
  const weightChanges = dashboard?.signals?.v16_weight_changes || [];

  return (
    <div className="glass-card p-4">
      <h2 className="text-section-title text-ice-white mb-3">Recommendation</h2>

      {/* Action badge */}
      <div className="mb-3">
        <span className={`text-label font-medium px-2 py-1 rounded ${
          exec.recommendation_action === 'EXECUTE_AS_PLANNED' ? 'bg-signal-green/20 text-signal-green' :
          exec.recommendation_action === 'EXECUTE_WITH_LIMITS' ? 'bg-signal-yellow/20 text-signal-yellow' :
          exec.recommendation_action === 'DELAY' ? 'bg-signal-orange/20 text-signal-orange' :
          exec.recommendation_action === 'DO_NOT_EXECUTE' ? 'bg-signal-red/20 text-signal-red' :
          'bg-white/10 text-muted-blue'
        }`}>
          {(exec.recommendation_action || '—').replace(/_/g, ' ')}
        </span>
      </div>

      {/* Short recommendation */}
      {exec.recommendation_short && (
        <p className="text-body text-ice-white mb-3">{exec.recommendation_short}</p>
      )}

      {/* Specific actions */}
      {specificActions.length > 0 && (
        <div className="mb-3">
          <p className="text-caption text-muted-blue mb-2">Spezifische Aktionen</p>
          <div className="space-y-1.5">
            {specificActions.map((a, i) => (
              <p key={i} className="text-body text-ice-white">→ {a}</p>
            ))}
          </div>
        </div>
      )}

      {/* Would Change My Mind */}
      {((wouldChange.execute_if || []).length > 0 || (wouldChange.hold_if || []).length > 0) && (
        <div className="border-t border-white/5 pt-3">
          <p className="text-caption text-muted-blue mb-2">Would Change My Mind</p>
          {(wouldChange.execute_if || []).map((t, i) => (
            <p key={`ex-${i}`} className="text-body text-signal-green ml-2">↑ Execute wenn: {t}</p>
          ))}
          {(wouldChange.hold_if || []).map((t, i) => (
            <p key={`ho-${i}`} className="text-body text-signal-red ml-2">↓ Hold wenn: {t}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// CARD 5: SCORE BREAKDOWN
// ────────────────────────────────────────────────────────────────
function ScoreBreakdownCard({ dims, totalScore, maxScore, level, levelColor, isOpen, onToggle }) {
  // Ordered dimension keys
  const dimOrder = [
    'event_risk',
    'positioning_conflict',
    'liquidity_risk',
    'cross_asset_confirmation',
    'gex_regime',
    'sentiment_extreme',
  ];

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center justify-between"
      >
        <span className="text-section-title text-ice-white">Score Breakdown</span>
        <div className="flex items-center gap-3">
          <span className="text-data-small tabular-nums" style={{ color: levelColor }}>
            {totalScore}/{maxScore || 18} — {level}
          </span>
          <span className="text-muted-blue text-body transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {dimOrder.map((key) => {
            const dim = dims[key] || { score: 0, max: 3, label: '' };
            const pct = (dim.score / (dim.max || 3)) * 100;
            const barColor = dimColor(dim.score);
            const name = DIMENSION_SHORT_NAMES[key] || key;

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-body text-ice-white">{name}</span>
                  <span className="text-data-small tabular-nums" style={{ color: barColor }}>
                    {dim.score}/{dim.max || 3}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                {dim.label && (
                  <p className="text-caption text-muted-blue mt-0.5">{dim.label}</p>
                )}
              </div>
            );
          })}

          {/* Total row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-body text-ice-white font-medium">TOTAL</span>
            <span className="text-data-medium tabular-nums font-medium" style={{ color: levelColor }}>
              {totalScore}/{maxScore || 18}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// CARD 6: CALENDAR OVERVIEW
// ────────────────────────────────────────────────────────────────
function CalendarOverviewCard({ calendarMonthly, eventWindow }) {
  const convergenceWeek = eventWindow.convergence_week || false;

  // Determine which 2 months to show
  const now = new Date();
  const month1 = { year: now.getFullYear(), month: now.getMonth() };
  let m2Month = now.getMonth() + 1;
  let m2Year = now.getFullYear();
  if (m2Month > 11) { m2Month = 0; m2Year++; }
  const month2 = { year: m2Year, month: m2Month };

  const grid1 = useMemo(() => buildMonthGrid(month1.year, month1.month, calendarMonthly), [month1.year, month1.month, calendarMonthly]);
  const grid2 = useMemo(() => buildMonthGrid(month2.year, month2.month, calendarMonthly), [month2.year, month2.month, calendarMonthly]);

  return (
    <div className="glass-card p-4">
      <h2 className="text-section-title text-ice-white mb-3">Calendar Overview</h2>

      <MonthGrid
        title={`${MONTH_NAMES[month1.month]} ${month1.year}`}
        cells={grid1}
      />

      <div className="mt-4">
        <MonthGrid
          title={`${MONTH_NAMES[month2.month]} ${month2.year}`}
          cells={grid2}
        />
      </div>
    </div>
  );
}

function MonthGrid({ title, cells }) {
  const dayHeaders = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div>
      <p className="text-data-small text-ice-white font-medium mb-2">{title}</p>
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayHeaders.map(d => (
          <div key={d} className="text-center text-caption text-faded-blue py-1">{d}</div>
        ))}

        {/* Day cells */}
        {cells.map((cell, i) => {
          if (!cell.day) {
            return <div key={`empty-${i}`} className="h-10" />;
          }
          const hasEvents = cell.events && cell.events.length > 0;
          const highEvent = hasEvents && cell.events.some(e => e.impact === 'HIGH');

          return (
            <div key={cell.date} className="h-10 flex flex-col items-center justify-center relative">
              <span className={`text-caption ${hasEvents ? 'text-ice-white font-medium' : 'text-faded-blue'}`}>
                {cell.day}
              </span>
              {hasEvents && (
                <div className="flex gap-0.5 mt-0.5">
                  {cell.events.map((e, ei) => (
                    <span
                      key={ei}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: EVENT_IMPACT_COLORS[e.impact] || COLORS.mutedBlue }}
                      title={`${e.event || e.type} (${e.impact})`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
