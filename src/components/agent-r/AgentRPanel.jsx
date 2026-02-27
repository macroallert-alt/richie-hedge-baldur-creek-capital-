'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useNudges } from '@/hooks/useNudges';
import { COLORS } from '@/lib/constants';

export default function AgentRPanel({ dashboard, onClose }) {
  const nudges = useNudges(dashboard);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const agentCtx = dashboard?.agent_r_context || {};

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `[Dummy-App] Agent R ist im Produktionsmodus nicht verfügbar. Dein Input war: "${input}". Im Live-System würde Claude hier antworten.`,
      }]);
    }, 500);
    setInput('');
  };

  return (
    <>
      {/* Mobile: Dimmed Background */}
      <div className="fixed inset-0 bg-black/50 z-panel lg:hidden" onClick={onClose} />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 h-[80vh] z-panel
                      lg:top-0 lg:right-0 lg:left-auto lg:w-[38%] lg:h-full
                      bg-navy-deep border-t lg:border-t-0 lg:border-l border-white/10
                      animate-slide-up lg:animate-slide-right
                      flex flex-col rounded-t-2xl lg:rounded-none">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-section-title text-ice-white">Agent R</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-signal-yellow/20 text-signal-yellow">
              DUMMY
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-blue hover:text-ice-white">
            <X size={18} />
          </button>
        </div>

        {/* Compact Statusbar (Spec §6.7) */}
        <div className="px-4 py-2 border-b border-white/3 text-caption text-muted-blue flex-shrink-0">
          <p>V16: {agentCtx.regime || '—'} | DD: {dashboard?.v16?.current_drawdown ?? '—'}% | KS: {
            Object.values(dashboard?.risk?.emergency_triggers || {}).some(v => v) ? '⚠️' : '✅'
          } | Conv: {agentCtx.conviction || '—'}</p>
          <p>ENB: {dashboard?.v16?.regime_confidence ? (dashboard.v16.regime_confidence * 10).toFixed(1) : '—'} | Stand: {
            new Date(dashboard?.generated_at).toISOString().slice(11, 16)
          } UTC</p>
        </div>

        {/* Nudges */}
        {nudges.length > 0 && messages.length === 0 && (
          <div className="px-4 py-3 space-y-2 border-b border-white/5 flex-shrink-0">
            <p className="text-caption text-muted-blue">PRIORITÄRE HINWEISE</p>
            {nudges.map((n, i) => (
              <button key={i}
                className="w-full text-left glass-card p-3 hover:bg-white/8 transition-colors"
                onClick={() => {
                  setMessages([{ role: 'user', text: `Erkläre mir: ${n.title}` }, {
                    role: 'assistant',
                    text: `[Dummy-App] ${n.title}: ${n.text}. Im Live-System würde Agent R hier eine detaillierte Analyse mit Tool-Calls liefern.`,
                  }]);
                }}>
                <p className="text-body text-ice-white">{n.title}</p>
                <p className="text-caption text-muted-blue">{n.text}</p>
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && nudges.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-blue text-center">
              <p className="text-body mb-2">Agent R (Dummy-Modus)</p>
              <p className="text-caption">Im Produktionsmodus antwortet hier Claude.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'message-user' : 'message-assistant'}>
              <p className="text-body">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 safe-area-bottom flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Frage an Agent R..."
              className="flex-1 bg-white/5 border border-white/10 rounded-input px-3 py-2
                         text-body text-ice-white placeholder:text-faded-blue outline-none
                         focus:border-baldur-blue transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-full bg-baldur-blue flex items-center justify-center
                         disabled:opacity-30 hover:bg-blue-500 transition-colors"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
