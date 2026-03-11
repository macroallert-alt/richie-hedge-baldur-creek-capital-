'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, AlertTriangle, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNudges } from '@/hooks/useNudges';
import { TOOL_LABELS } from '@/lib/constants';

// ===== localStorage Helpers =====
const STORAGE_KEY = 'agent_r_tabs';
const ACTIVE_TAB_KEY = 'agent_r_active_tab';
const MAX_TABS = 20;

function generateId() {
  return 'ar-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

function loadTabs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const tabs = JSON.parse(raw);
    return Array.isArray(tabs) ? tabs : [];
  } catch {
    return [];
  }
}

function saveTabs(tabs) {
  try {
    const trimmed = tabs.slice(-MAX_TABS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    try {
      const trimmed = tabs.slice(-5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Give up silently
    }
  }
}

function loadActiveTabId() {
  try {
    return localStorage.getItem(ACTIVE_TAB_KEY) || null;
  } catch {
    return null;
  }
}

function saveActiveTabId(id) {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, id);
  } catch {
    // Ignore
  }
}

function getTabTitle(messages) {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'Neuer Chat';
  const text = firstUser.text || '';
  return text.length > 30 ? text.slice(0, 30) + '\u2026' : text;
}


export default function AgentRPanel({ dashboard, onClose }) {
  const nudges = useNudges(dashboard);
  const [input, setInput] = useState('');
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const tabsContainerRef = useRef(null);
  const panelRef = useRef(null);
  const inputAreaRef = useRef(null);
  const agentCtx = dashboard?.agent_r_context || {};

  // Current tab's messages
  const activeTab = tabs.find(t => t.id === activeTabId);
  const messages = activeTab?.messages || [];

  // ===== Init: Load tabs from localStorage =====
  useEffect(() => {
    const savedTabs = loadTabs();
    const savedActiveId = loadActiveTabId();

    if (savedTabs.length > 0) {
      setTabs(savedTabs);
      const validActive = savedTabs.find(t => t.id === savedActiveId);
      setActiveTabId(validActive ? validActive.id : savedTabs[savedTabs.length - 1].id);
    } else {
      const newTab = { id: generateId(), title: 'Neuer Chat', messages: [], created: new Date().toISOString() };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    }
  }, []);

  // ===== Persist tabs to localStorage on every change =====
  useEffect(() => {
    if (tabs.length > 0) {
      saveTabs(tabs);
    }
  }, [tabs]);

  // ===== Persist active tab ID =====
  useEffect(() => {
    if (activeTabId) {
      saveActiveTabId(activeTabId);
    }
  }, [activeTabId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTools]);

  // Focus input on tab switch
  useEffect(() => {
    if (!isStreaming) inputRef.current?.focus();
  }, [isStreaming, activeTabId]);

  // ===== Mobile Keyboard Fix: visualViewport listener =====
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;

    const handleResize = () => {
      const panel = panelRef.current;
      if (!panel) return;

      if (window.innerWidth < 1024) {
        const keyboardVisible = window.innerHeight - vv.height > 100;

        if (keyboardVisible) {
          panel.style.height = vv.height + 'px';
          panel.style.bottom = 'auto';
          panel.style.top = vv.offsetTop + 'px';
        } else {
          panel.style.height = '80vh';
          panel.style.bottom = '0px';
          panel.style.top = 'auto';
        }
      }
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, []);

  // ===== Auto-resize textarea =====
  const resizeTextarea = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  // ===== Scroll input into view on focus (mobile keyboard fallback) =====
  const handleInputFocus = useCallback(() => {
    // Delay to let keyboard animation finish
    setTimeout(() => {
      inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 300);
    // Second attempt after keyboard fully open
    setTimeout(() => {
      inputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 600);
  }, []);

  // ===== Update messages in active tab =====
  const updateActiveMessages = useCallback((updater) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;
      const newMessages = typeof updater === 'function' ? updater(tab.messages) : updater;
      return {
        ...tab,
        messages: newMessages,
        title: getTabTitle(newMessages),
      };
    }));
  }, [activeTabId]);

  // ===== Send message to Agent R API =====
  const handleSend = useCallback(async (overrideText) => {
    const text = overrideText || input.trim();
    if (!text || isStreaming) return;

    setInput('');
    setError(null);
    setActiveTools([]);

    const userMsg = { role: 'user', text };
    const updatedMessages = [...messages, userMsg];
    updateActiveMessages(updatedMessages);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/agent-r', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          dashboard,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';
      let currentTools = [];

      updateActiveMessages(prev => [...prev, { role: 'assistant', text: '', toolCalls: [] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'text_delta') {
              assistantText += data.text;
              updateActiveMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], text: assistantText };
                }
                return updated;
              });
            }

            if (data.type === 'tool_call') {
              currentTools = [...currentTools, data.tool];
              setActiveTools([...currentTools]);
              updateActiveMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], toolCalls: [...currentTools] };
                }
                return updated;
              });
            }

            if (data.type === 'error') {
              setError(data.error);
            }

            if (data.type === 'done') {
              setIsStreaming(false);
              setActiveTools([]);
            }
          } catch {
            // Skip
          }
        }
      }

      setIsStreaming(false);
      setActiveTools([]);

    } catch (err) {
      if (err.name === 'AbortError') {
        updateActiveMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant' && !updated[lastIdx].text) updated.pop();
          return updated;
        });
      } else {
        setError(err.message);
        updateActiveMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant' && !updated[lastIdx].text) updated.pop();
          return updated;
        });
      }
      setIsStreaming(false);
      setActiveTools([]);
    }
  }, [input, isStreaming, messages, dashboard, updateActiveMessages]);

  // ===== Tab Management =====
  const handleNewTab = () => {
    if (isStreaming) return;
    const newTab = { id: generateId(), title: 'Neuer Chat', messages: [], created: new Date().toISOString() };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setError(null);
    setActiveTools([]);
    setInput('');
    setTimeout(() => {
      tabsContainerRef.current?.scrollTo({ left: tabsContainerRef.current.scrollWidth, behavior: 'smooth' });
    }, 50);
  };

  const handleDeleteTab = (tabId, e) => {
    e.stopPropagation();
    if (isStreaming) return;

    const remaining = tabs.filter(t => t.id !== tabId);

    if (remaining.length === 0) {
      const newTab = { id: generateId(), title: 'Neuer Chat', messages: [], created: new Date().toISOString() };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    } else {
      setTabs(remaining);
      if (activeTabId === tabId) {
        setActiveTabId(remaining[remaining.length - 1].id);
      }
    }
    setError(null);
  };

  const handleSwitchTab = (tabId) => {
    if (isStreaming || tabId === activeTabId) return;
    setActiveTabId(tabId);
    setError(null);
    setActiveTools([]);
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const handleNudgeClick = (nudge) => {
    handleSend(`Erkl\u00e4re mir: ${nudge.title}`);
  };

  return (
    <>
      {/* Mobile: Dimmed Background */}
      <div className="fixed inset-0 bg-black/50 z-panel lg:hidden" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed bottom-0 left-0 right-0 h-[80vh] z-panel
                      lg:top-0 lg:right-0 lg:left-auto lg:w-[38%] lg:h-full
                      bg-navy-deep border-t lg:border-t-0 lg:border-l border-white/10
                      animate-slide-up lg:animate-slide-right
                      flex flex-col rounded-t-2xl lg:rounded-none"
      >

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-section-title text-ice-white">Agent R</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-baldur-blue/20 text-baldur-blue">
              V1.0
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted-blue hover:text-ice-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center border-b border-white/5 flex-shrink-0">
          <div
            ref={tabsContainerRef}
            className="flex-1 flex items-center overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleSwitchTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-2 text-caption whitespace-nowrap
                           border-b-2 transition-colors flex-shrink-0 group
                           ${tab.id === activeTabId
                             ? 'border-baldur-blue text-ice-white'
                             : 'border-transparent text-muted-blue hover:text-ice-white hover:border-white/20'
                           }`}
              >
                <span className="max-w-[120px] truncate">{tab.title}</span>
                {tabs.length > 1 && (
                  <span
                    onClick={(e) => handleDeleteTab(tab.id, e)}
                    className="ml-1 w-4 h-4 flex items-center justify-center rounded
                               opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity"
                  >
                    <X size={10} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={handleNewTab}
            disabled={isStreaming}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center
                       text-muted-blue hover:text-ice-white disabled:opacity-30
                       border-l border-white/5"
            title="Neuer Chat"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Compact Statusbar */}
        <div className="px-4 py-2 border-b border-white/5 text-caption text-muted-blue flex-shrink-0">
          <p>
            V16: {agentCtx.regime || dashboard?.v16?.regime || '\u2014'} | DD: {dashboard?.v16?.current_drawdown ?? '\u2014'}% | KS: {
              Object.values(dashboard?.risk?.emergency_triggers || {}).some(v => v) ? '\u26a0\ufe0f' : '\u2705'
            } | Conv: {agentCtx.conviction || dashboard?.header?.system_conviction || '\u2014'}
          </p>
          <p>
            Exec: {dashboard?.execution?.execution_level || '\u2014'} ({dashboard?.execution?.total_score ?? '\u2014'}/{dashboard?.execution?.max_score ?? '\u2014'}) | Stand: {
              dashboard?.generated_at
                ? new Date(dashboard.generated_at).toISOString().slice(11, 16)
                : '\u2014'
            } UTC
          </p>
        </div>

        {/* Nudges \u2014 only show when no messages in active tab */}
        {nudges.length > 0 && messages.length === 0 && (
          <div className="px-4 py-3 space-y-2 border-b border-white/5 flex-shrink-0 overflow-y-auto max-h-[30vh]">
            <p className="text-caption text-muted-blue">PRIORIT{'\u00c4'}RE HINWEISE</p>
            {nudges.map((n, i) => (
              <button
                key={i}
                className="w-full text-left bg-white/5 border border-white/10 rounded-card p-3
                           hover:bg-white/8 transition-colors"
                onClick={() => handleNudgeClick(n)}
                disabled={isStreaming}
              >
                <p className="text-body text-ice-white">{n.title}</p>
                <p className="text-caption text-muted-blue mt-1">{n.text}</p>
              </button>
            ))}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && nudges.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-blue text-center px-4">
              <p className="text-body mb-2">Agent R {'\u2014'} Research Terminal</p>
              <p className="text-caption">
                Frag mich zu Regime, Portfolio, Risiko, Einzelaktien, Options, Makro.
                Bei Trade-Entscheidungen erzwinge ich das Decision Protocol.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] ${
                msg.role === 'user'
                  ? 'bg-baldur-blue/20 border border-baldur-blue/30 rounded-2xl rounded-br-md px-4 py-2.5'
                  : 'bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-2.5'
              }`}>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {msg.toolCalls.map((tool, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-caption text-muted-blue">
                        <span className={`${i === messages.length - 1 && isStreaming ? 'animate-pulse' : ''}`}>
                          {'\ud83d\udd27'}
                        </span>
                        <span>{TOOL_LABELS[tool.name] || tool.name}</span>
                        {tool.input?.ticker && (
                          <span className="text-faded-blue">({tool.input.ticker})</span>
                        )}
                        {tool.input?.series_id && (
                          <span className="text-faded-blue">({tool.input.series_id})</span>
                        )}
                        {tool.input?.scenario && (
                          <span className="text-faded-blue">({tool.input.scenario})</span>
                        )}
                        {tool.input?.query && (
                          <span className="text-faded-blue truncate max-w-[150px]">({tool.input.query})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {msg.role === 'user' ? (
                  <p className="text-body text-ice-white whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="text-body text-ice-white agent-r-markdown">
                    {msg.text ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="text-ice-white font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="text-muted-blue">{children}</em>,
                          h1: ({ children }) => <h3 className="text-section-title text-ice-white mt-3 mb-1">{children}</h3>,
                          h2: ({ children }) => <h3 className="text-section-title text-ice-white mt-3 mb-1">{children}</h3>,
                          h3: ({ children }) => <h4 className="text-body font-semibold text-ice-white mt-2 mb-1">{children}</h4>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="text-body">{children}</li>,
                          code: ({ inline, children }) => inline
                            ? <code className="bg-white/10 px-1 py-0.5 rounded text-caption font-mono text-baldur-blue">{children}</code>
                            : <pre className="bg-white/5 border border-white/10 rounded-lg p-3 my-2 overflow-x-auto"><code className="text-caption font-mono">{children}</code></pre>,
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-2">
                              <table className="text-caption border-collapse w-full">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="border-b border-white/10">{children}</thead>,
                          th: ({ children }) => <th className="text-left px-2 py-1 text-muted-blue font-medium">{children}</th>,
                          td: ({ children }) => <td className="px-2 py-1 text-ice-white border-b border-white/5">{children}</td>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-signal-yellow/50 pl-3 my-2 text-muted-blue italic">
                              {children}
                            </blockquote>
                          ),
                          hr: () => <hr className="border-white/10 my-3" />,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : isStreaming && i === messages.length - 1 ? (
                      <span className="inline-flex items-center gap-1 text-muted-blue">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-caption">Agent R denkt nach...</span>
                      </span>
                    ) : null}

                    {isStreaming && i === messages.length - 1 && msg.text && (
                      <span className="inline-block w-1.5 h-4 bg-baldur-blue animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isStreaming && activeTools.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-2.5 space-y-1">
                {activeTools.map((tool, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-caption text-muted-blue">
                    <Loader2 size={12} className="animate-spin" />
                    <span>{TOOL_LABELS[tool.name] || tool.name}</span>
                    {tool.input?.ticker && <span className="text-faded-blue">({tool.input.ticker})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="bg-signal-red/10 border border-signal-red/30 rounded-2xl px-4 py-2.5
                             flex items-start gap-2 max-w-[90%]">
                <AlertTriangle size={16} className="text-signal-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-caption text-signal-red font-medium">Fehler</p>
                  <p className="text-caption text-ice-white mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div ref={inputAreaRef} className="p-4 border-t border-white/5 safe-area-bottom flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isStreaming ? 'Agent R antwortet...' : 'Frage an Agent R...'}
              disabled={isStreaming}
              className="flex-1 bg-white/5 border border-white/10 rounded-input px-3 py-2
                         text-ice-white placeholder:text-faded-blue outline-none
                         focus:border-baldur-blue transition-colors resize-none
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: '16px', maxHeight: '120px', overflowY: 'auto' }}
            />
            {isStreaming ? (
              <button
                onClick={handleCancel}
                className="w-10 h-10 rounded-full bg-signal-red/20 border border-signal-red/40
                           flex items-center justify-center hover:bg-signal-red/30 transition-colors
                           flex-shrink-0"
                title="Abbrechen"
              >
                <X size={16} className="text-signal-red" />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-full bg-baldur-blue flex items-center justify-center
                           disabled:opacity-30 hover:bg-blue-500 transition-colors
                           flex-shrink-0"
              >
                <Send size={16} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
