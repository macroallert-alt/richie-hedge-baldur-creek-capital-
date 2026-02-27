'use client';

import { COLORS } from '@/lib/constants';

const SCORE_COLOR = (s) => s > 0 ? COLORS.signalGreen : s < 0 ? COLORS.signalRed : COLORS.mutedBlue;

export default function IntelDetail({ dashboard }) {
  const intel = dashboard?.intelligence || {};
  const consensus = intel.consensus || {};
  const divergences = intel.divergences || [];
  const claims = intel.high_novelty_claims || [];
  const catalysts = intel.catalyst_timeline || [];

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title text-center-desktop">Intelligence Center</h1>

      {/* Consensus Overview */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">IC Konsens</h2>
        <div className="space-y-2">
          {Object.entries(consensus).map(([theme, data]) => (
            <div key={theme} className="flex items-center gap-2">
              <span className="text-data-small text-ice-white w-32 truncate">{theme.replace(/_/g, ' ')}</span>
              <span className="text-data-small tabular-nums w-10 text-right" style={{ color: SCORE_COLOR(data.score) }}>
                {data.score > 0 ? '+' : ''}{data.score.toFixed(1)}
              </span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden relative">
                <div className="absolute top-0 h-full w-px bg-white/10" style={{ left: '50%' }} />
                {data.score > 0 ? (
                  <div className="absolute top-0 h-full bg-signal-green/40 rounded-full"
                    style={{ left: '50%', width: `${Math.min(data.score * 10, 50)}%` }} />
                ) : (
                  <div className="absolute top-0 h-full bg-signal-red/40 rounded-full"
                    style={{ right: '50%', width: `${Math.min(Math.abs(data.score) * 10, 50)}%` }} />
                )}
              </div>
              <span className="text-caption text-muted-blue w-8 text-right">{data.sources}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divergences */}
      {divergences.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">Divergenzen ({divergences.length})</h2>
          <div className="space-y-4">
            {divergences.map((div, i) => (
              <div key={i} className="border-l-2 border-signal-yellow/50 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-data-small font-medium text-signal-yellow">{div.theme}</span>
                  <span className="text-caption text-muted-blue">Magnitude: {div.magnitude.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-2">
                  <div className="bg-white/3 rounded-lg p-2 text-center">
                    <span className="text-caption text-muted-blue block">IC Signal</span>
                    <span className="text-data-medium tabular-nums" style={{ color: SCORE_COLOR(div.ic_signal) }}>
                      {div.ic_signal > 0 ? '+' : ''}{div.ic_signal}
                    </span>
                    <span className="text-caption text-muted-blue block">
                      {div.ic_top_contributors?.join(', ')}
                    </span>
                  </div>
                  <div className="bg-white/3 rounded-lg p-2 text-center">
                    <span className="text-caption text-muted-blue block">DC Signal</span>
                    <span className="text-data-medium tabular-nums" style={{ color: SCORE_COLOR(div.dc_signal) }}>
                      {div.dc_signal > 0 ? '+' : ''}{div.dc_signal}
                    </span>
                    <span className="text-caption text-muted-blue block">{div.dc_source_field}</span>
                  </div>
                </div>

                <p className="text-caption text-muted-blue italic">{div.interpretation_hint}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Novelty Claims */}
      {claims.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">High Novelty Claims</h2>
          <div className="space-y-3">
            {claims.map((c, i) => (
              <div key={i} className="border-l-2 border-baldur-blue/50 pl-3">
                <p className="text-body text-ice-white">{c.claim}</p>
                <div className="flex items-center gap-3 mt-1 text-caption text-muted-blue">
                  <span>{c.source}</span>
                  <span>Novelty: {c.novelty}</span>
                  <span>Signal: {c.signal > 0 ? '+' : ''}{c.signal}</span>
                  <span>{c.theme}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalyst Timeline */}
      {catalysts.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">Catalyst Timeline</h2>
          <div className="space-y-2">
            {catalysts.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-data-small tabular-nums w-6 text-right ${
                  c.days_until <= 1 ? 'text-signal-red' : c.days_until <= 3 ? 'text-signal-yellow' : 'text-muted-blue'
                }`}>
                  {c.days_until}d
                </span>
                <div className="flex-1">
                  <span className="text-body text-ice-white">{c.event}</span>
                  <span className="text-caption text-muted-blue ml-2">{c.date}</span>
                </div>
                <span className={`text-caption px-1.5 py-0.5 rounded ${
                  c.impact === 'HIGH' ? 'bg-signal-red/20 text-signal-red' : 'bg-signal-yellow/20 text-signal-yellow'
                }`}>{c.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
