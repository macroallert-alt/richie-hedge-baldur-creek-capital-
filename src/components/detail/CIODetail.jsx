'use client';

import { useState } from 'react';
import { COLORS } from '@/lib/constants';

const SECTION_TITLES = {
  S1_delta: '§1 — Delta & Regime',
  S2_catalysts: '§2 — Katalysatoren',
  S3_risk: '§3 — Risiko-Assessment',
  S4_patterns: '§4 — Pattern & Kontext',
  S5_intelligence: '§5 — Intelligence',
  S6_portfolio: '§6 — Portfolio',
  S7_actions: '§7 — Aktionen',
};

const DA_COLORS = { ACCEPTED: COLORS.signalGreen, NOTED: COLORS.signalYellow, REJECTED: COLORS.signalRed };

export default function CIODetail({ dashboard }) {
  const briefing = dashboard?.briefing || {};
  const sections = briefing.sections || {};
  const daMarkers = briefing.da_markers || [];
  const keyAssumptions = briefing.key_assumptions || [];
  const daResolution = briefing.da_resolution_summary || {};
  const [openSections, setOpenSections] = useState(['S1_delta']);

  const toggle = (key) => {
    setOpenSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Find DA markers for a given section
  const getDAForSection = (sectionKey) => {
    const sKey = sectionKey.replace('_delta', '').replace('_catalysts', '').replace('_risk', '')
      .replace('_patterns', '').replace('_intelligence', '').replace('_portfolio', '').replace('_actions', '');
    return daMarkers.filter(m => m.section === sKey);
  };

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title text-center-desktop">CIO Memo</h1>

      {/* Digest Summary */}
      <div className="glass-card p-4">
        <p className="text-body text-ice-white">{dashboard?.digest?.line_1_type_and_delta}</p>
      </div>

      {/* Sections as Accordions */}
      <div className="space-y-2">
        {Object.entries(sections).map(([key, text]) => {
          const isOpen = openSections.includes(key);
          const sectionId = key.split('_')[0]; // S1, S2, etc.
          const sectionDA = daMarkers.filter(m => m.section === sectionId);

          return (
            <div key={key} className="glass-card overflow-hidden">
              <button
                onClick={() => toggle(key)}
                className="w-full text-left p-4 flex items-center justify-between"
              >
                <span className="text-section-title text-ice-white">
                  {SECTION_TITLES[key] || key}
                </span>
                <span className="text-muted-blue text-body transition-transform duration-200"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-body text-ice-white leading-relaxed whitespace-pre-line">{text}</p>

                  {/* DA Markers inline */}
                  {sectionDA.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {sectionDA.map((da, i) => (
                        <div key={i} className="border-l-2 pl-3 py-1"
                          style={{ borderColor: DA_COLORS[da.marker_type] || COLORS.mutedBlue }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${DA_COLORS[da.marker_type]}20`,
                                color: DA_COLORS[da.marker_type],
                              }}>
                              DA: {da.marker_type}
                            </span>
                          </div>
                          <p className="text-caption text-muted-blue">{da.challenge_summary}</p>
                          <p className="text-caption text-ice-white mt-1">↳ {da.cio_response}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Key Assumptions */}
      {keyAssumptions.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">Schlüssel-Annahmen</h2>
          <div className="space-y-3">
            {keyAssumptions.map((a, i) => (
              <div key={i} className="border-l-2 border-baldur-blue/30 pl-3">
                <p className="text-body text-ice-white font-medium">{a.assumption}</p>
                <p className="text-caption text-muted-blue">Basis: {a.basis}</p>
                <p className="text-caption text-signal-yellow">Vulnerabel: {a.vulnerability}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DA Resolution Summary */}
      {daResolution.total > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">DA Resolution</h2>
          <div className="flex gap-4 mb-3">
            <span className="text-data-small tabular-nums text-signal-green">{daResolution.accepted} ✓</span>
            <span className="text-data-small tabular-nums text-signal-yellow">{daResolution.noted} ~</span>
            <span className="text-data-small tabular-nums text-signal-red">{daResolution.rejected} ✗</span>
          </div>
          <div className="space-y-2">
            {(daResolution.details || []).map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-caption">
                <span style={{ color: DA_COLORS[d.resolution] }}>●</span>
                <span className="text-muted-blue">{d.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
