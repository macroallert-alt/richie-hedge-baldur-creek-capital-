'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, ReferenceArea, ReferenceDot,
} from 'recharts';
import GlassCard from '@/components/shared/GlassCard';
import {
  COLORS,
  CYCLE_ALIGNMENT_COLORS,
  CYCLE_PHASE_COLORS,
  CYCLE_TIER_COLORS,
} from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CHART_URL = process.env.NEXT_PUBLIC_CYCLES_CHART_URL;
const COND_RETURNS_URL = process.env.NEXT_PUBLIC_CYCLES_COND_RETURNS_URL;
const REGIME_URL = process.env.NEXT_PUBLIC_CYCLES_REGIME_URL;
const TRANSITION_URL = process.env.NEXT_PUBLIC_CYCLES_TRANSITION_URL;

const CYCLE_META = {
  LIQUIDITY:    { name: 'Global Liquidity',     icon: '💧', tier: 1, unit: '$T',  indicator: 'Fed Net Liq',
    desc: 'Misst die globale Liquidität — wie viel Geld die Fed ins System pumpt. Wenn Liquidität kippt, folgen Credit und Business.' },
  CREDIT:       { name: 'Credit Cycle',         icon: '💳', tier: 1, unit: 'bps', indicator: 'HY OAS',
    desc: 'Misst wie leicht Unternehmen an Geld kommen (High-Yield Spreads). Der härteste Einzelindikator — wenn Credit kippt, folgt der Rest.' },
  COMMODITY:    { name: 'Commodity Supercycle',  icon: '🛢️', tier: 1, unit: '',    indicator: 'CRB Real',
    desc: 'Misst den Rohstoff-Superzyklus (inflationsbereinigter CRB Index). Getrieben von China-Nachfrage und globaler Industrieaktivität.' },
  CHINA_CREDIT: { name: 'China Credit Impulse',  icon: '🇨🇳', tier: 1, unit: '',   indicator: 'Cu/Au Ratio',
    desc: 'Misst Chinas Kreditimpuls über das Kupfer/Gold-Verhältnis. Kupfer steigt wenn China investiert, Gold steigt bei Unsicherheit.' },
  DOLLAR:       { name: 'US Dollar Cycle',      icon: '💵', tier: 2, unit: '',    indicator: 'DXY (Trade-Weighted)',
    desc: 'Misst die Stärke des US-Dollars. Starker Dollar = schlecht für Commodities, Schwellenländer, Gold. Schwacher Dollar = Risk-On.' },
  BUSINESS:     { name: 'Business Cycle',       icon: '🏭', tier: 2, unit: '%',   indicator: 'INDPRO YoY',
    desc: 'Misst die Industrieproduktion (YoY). Entscheidet zusammen mit Credit ob ein Rücksetzer eine Korrektur oder ein Crash wird.' },
  FED_RATES:    { name: 'Fed / Interest Rate',  icon: '🏦', tier: 2, unit: '%',   indicator: 'Real FFR',
    desc: 'Misst wie restriktiv die Fed ist (Leitzins minus Inflation). Ein Fed-Pivot ist das stärkste Einzelsignal im Markt.' },
  EARNINGS:     { name: 'Earnings / Profit',    icon: '📊', tier: 2, unit: '%',   indicator: 'Corp Profits YoY',
    desc: 'Misst Unternehmensgewinne (YoY). Nachlaufender Indikator — bestätigt was Credit und Business bereits anzeigen.' },
  TRADE:        { name: 'Global Trade',         icon: '🚢', tier: 3, unit: '%',   indicator: 'CASS YoY',
    desc: 'Misst das nordamerikanische Frachtvolumen (CASS Freight Index). Vorlaufindikator für die Realwirtschaft — weniger Fracht = weniger Wirtschaftsaktivität.' },
  POLITICAL:    { name: 'Political Cycle',      icon: '🗳️', tier: 3, unit: '',    indicator: 'Calendar',
    desc: 'Der 4-Jahres-Wahlzyklus. Jahr 3 (Vorwahljahr) hat historisch die stärksten Aktienrenditen. Deterministisch, nicht stochastisch.' },
};

const CYCLE_ORDER = ['LIQUIDITY','CREDIT','COMMODITY','CHINA_CREDIT','DOLLAR','BUSINESS','FED_RATES','EARNINGS','TRADE','POLITICAL'];
const CLUSTER_LABELS = { CREDIT_CLUSTER:'Credit', REAL_ECONOMY_CLUSTER:'Real Economy', MONETARY_POLICY_CLUSTER:'Monetary Policy', CURRENCY_CLUSTER:'Currency' };
const CLUSTER_ORDER = ['CREDIT_CLUSTER','REAL_ECONOMY_CLUSTER','MONETARY_POLICY_CLUSTER','CURRENCY_CLUSTER'];

const CLUSTER_EXPLANATIONS = {
  CREDIT_CLUSTER: { short:'Kreditbedingungen', what:'Misst wie leicht Unternehmen an Geld kommen — HY Spreads, Liquidität, Unternehmensgewinne.', why:'Credit ist der härteste Frühindikator. Wenn Credit kippt, folgt historisch der Rest.' },
  REAL_ECONOMY_CLUSTER: { short:'Realwirtschaft', what:'Misst ob Fabriken produzieren, Güter verschifft werden, China investiert.', why:'Entscheidet ob ein Rücksetzer eine Korrektur (-10%) oder ein Crash (-30%) wird.' },
  MONETARY_POLICY_CLUSTER: { short:'Geldpolitik', what:'Misst wie restriktiv die Fed ist — Real Fed Funds Rate.', why:'Ein Fed-Pivot (restriktiv → locker) ist das stärkste Einzelsignal. Wenn die Fed dreht, dreht alles.' },
  CURRENCY_CLUSTER: { short:'US-Dollar', what:'Misst die Stärke des US-Dollars (DXY Trade-Weighted Index).', why:'Starker Dollar = schlecht für Commodities, Schwellenländer, Gold. Schwacher Dollar = Risk-On.' },
};

const PRIMARY_CHAIN = ['LIQUIDITY','CREDIT','BUSINESS'];
const CASCADE_CHAINS = [
  {from:'LIQUIDITY',to:'CREDIT',label:'Liquidität warnt Credit'},{from:'LIQUIDITY',to:'BUSINESS',label:'Liquidität warnt Realwirtschaft'},
  {from:'CREDIT',to:'BUSINESS',label:'Credit warnt Realwirtschaft'},{from:'CHINA_CREDIT',to:'COMMODITY',label:'China warnt Rohstoffe'},
  {from:'CHINA_CREDIT',to:'BUSINESS',label:'China warnt Realwirtschaft'},{from:'FED_RATES',to:'DOLLAR',label:'Fed-Politik bewegt Dollar'},
  {from:'DOLLAR',to:'COMMODITY',label:'Dollar bewegt Rohstoffe'},{from:'BUSINESS',to:'EARNINGS',label:'Wirtschaft treibt Gewinne'},
  {from:'EARNINGS',to:'FED_RATES',label:'Gewinne beeinflussen Fed'},{from:'COMMODITY',to:'FED_RATES',label:'Rohstoffe beeinflussen Fed'},
];

const ASSET_CATEGORIES = [
  {label:'Edelmetalle',tickers:['GLD','SLV','GDX','GDXJ','SIL','PLATINUM']},{label:'Equity',tickers:['SPY','IWM','EEM','VGK']},
  {label:'Sektoren',tickers:['XLY','XLI','XLF','XLE','XLV','XLP','XLU','VNQ','XLK']},{label:'Bonds',tickers:['TLT','TIP','LQD','HYG']},
  {label:'Commodities',tickers:['DBC','COPPER']},{label:'Crypto',tickers:['BTC','ETH']},
];
const ALL_ASSETS_ORDERED = ASSET_CATEGORIES.flatMap(c => c.tickers);
const CRYPTO_TICKERS = new Set(['BTC','ETH']);

const SEVERITY_COLORS = { CALM:COLORS.signalGreen, MODERATE:COLORS.signalYellow, CASCADE:COLORS.signalOrange, CRISIS:COLORS.signalRed };
const STATUS_COLORS = { EARLY_PHASE:COLORS.signalGreen, MID_PHASE:COLORS.baldurBlue||'#4A90D9', LATE_PHASE:COLORS.signalYellow, EXTENDED:COLORS.signalRed, NO_HISTORY:COLORS.fadedBlue };
const SEVERITY_LABELS = { CALM:'Ruhig — kein Handlungsbedarf', MODERATE:'Erhöhte Wachsamkeit — einzelne Zyklen drehen', CASCADE:'Defensiv positionieren — schnelle Kaskade', CRISIS:'Krisenmodus — maximale Vorsicht' };

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function phaseLabel(p){if(!p||p==='UNKNOWN')return '—';return p.replace(/_/g,' ');}
function fmtPct(v,d=1){if(v==null)return '—';return `${(Number(v)*100).toFixed(d)}%`;}
function fmtVal(v,u){if(v==null||v==='')return '—';if(u==='$T')return `$${(Number(v)/1e6).toFixed(2)}T`;if(u==='bps')return `${Number(v).toFixed(0)} bps`;if(u==='%')return `${Number(v).toFixed(2)}%`;return String(Number(v).toFixed(4));}
function velArrow(v){if(v==null||v==='')return '';return Number(v)>0?' ▲':Number(v)<0?' ▼':' →';}
function velColor(v){if(v==null||v==='')return COLORS.mutedBlue;return Number(v)>0?COLORS.signalGreen:Number(v)<0?COLORS.signalRed:COLORS.mutedBlue;}
function excessColor(v){if(v==null)return COLORS.fadedBlue;return v>0.001?COLORS.signalGreen:v<-0.001?COLORS.signalRed:COLORS.fadedBlue;}
function cycleName(id){return CYCLE_META[id]?.name||id;}
function statusLabel(s){return {EARLY_PHASE:'Früh',MID_PHASE:'Mitte',LATE_PHASE:'Spät',EXTENDED:'Überfällig',NO_HISTORY:'—'}[s]||s||'—';}

// ═══════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════

function Section({title,children,defaultOpen=true}){
  const[open,setOpen]=useState(defaultOpen);
  return(<div className="mb-4"><button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between py-2 border-b border-white/10"><span className="text-label uppercase tracking-wider text-muted-blue">{title}</span><span className="text-caption text-muted-blue">{open?'▾':'▸'}</span></button>{open&&<div className="pt-3">{children}</div>}</div>);
}

function InfoToggle({children}){
  const[open,setOpen]=useState(false);
  return(<div className="mb-3"><button onClick={()=>setOpen(!open)} style={{backgroundColor:open?'#1a3050':'transparent',border:'1px solid #4A5A7A',borderRadius:'12px',padding:'2px 8px',color:COLORS.mutedBlue,fontSize:'10px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'4px'}}>ⓘ {open?'Ausblenden':'Was bedeutet das?'}</button>{open&&<div className="text-caption px-3 py-2 rounded mt-2" style={{backgroundColor:'#0d1f38',color:COLORS.mutedBlue,fontSize:'11px',lineHeight:'1.5'}}>{children}</div>}</div>);
}

function ChartTooltip({active,payload,label}){
  if(!active||!payload||payload.length===0)return null;
  return(<div style={{backgroundColor:'#0A1628',border:'1px solid #4A5A7A',borderRadius:'6px',padding:'8px 12px',fontSize:'11px'}}><div style={{color:COLORS.mutedBlue,marginBottom:'4px',fontWeight:600}}>{label}</div>{payload.map((e,i)=>e.value!=null?<div key={i} style={{color:e.color,fontSize:'10px'}}>{e.name}: {typeof e.value==='number'?e.value.toFixed(3):e.value}</div>:null)}</div>);
}

function ClusterInfo({clusterId}){
  const[open,setOpen]=useState(false);const info=CLUSTER_EXPLANATIONS[clusterId];if(!info)return null;
  return(<><button onClick={()=>setOpen(!open)} style={{backgroundColor:open?'#1a3050':'transparent',border:'1px solid #4A5A7A',borderRadius:'50%',width:'20px',height:'20px',display:'inline-flex',alignItems:'center',justifyContent:'center',color:COLORS.mutedBlue,fontSize:'11px',cursor:'pointer',marginLeft:'6px',flexShrink:0}}>ⓘ</button>{open&&<div className="rounded px-3 py-2 mb-2 mt-1" style={{backgroundColor:'#0d1f38',border:'1px solid #1a3050',fontSize:'11px',lineHeight:'1.5'}}><div style={{color:COLORS.iceWhite,fontWeight:600,marginBottom:'4px'}}>{CLUSTER_LABELS[clusterId]} — {info.short}</div><div style={{color:COLORS.mutedBlue,marginBottom:'3px'}}><strong style={{color:COLORS.fadedBlue}}>Was:</strong> {info.what}</div><div style={{color:COLORS.mutedBlue}}><strong style={{color:COLORS.fadedBlue}}>Warum:</strong> {info.why}</div></div>}</>);
}

// ═══════════════════════════════════════════════════════════════
// EXECUTIVE SUMMARY (V5.2 — Klartext)
// ═══════════════════════════════════════════════════════════════

function ExecutiveSummary({transData,regimeData,condReturnsData}){
  const cascade=transData?.cascade_speed?.current||{};const assessment=transData?.overall_assessment||{};const positions=transData?.phase_positions||{};
  const severity=cascade.severity||'CALM';const severityColor=SEVERITY_COLORS[severity]||COLORS.fadedBlue;
  const transitioned=cascade.transitioned_cycles||[];const tippedNames=transitioned.map(t=>cycleName(t.cycle||t));
  let v16Growth=null;const v16Dual=regimeData?.v16_transition_probability?.by_dual_cluster||{};
  for(const[,val]of Object.entries(v16Dual)){if(val&&typeof val==='object'&&val.n_months>0){const g=val.v16_stays_growth_6m;if(typeof g==='number'){v16Growth=g;break;}}}
  const extendedIds=assessment.extended_cycles||[];
  let criticalCycle=null,criticalRemaining=Infinity;
  for(const cid of['CREDIT','LIQUIDITY','COMMODITY','BUSINESS','DOLLAR']){const pp=positions[cid];if(!pp)continue;if((pp.status==='EXTENDED'||pp.status==='LATE_PHASE')&&(pp.remaining_median??Infinity)<criticalRemaining){criticalCycle=cid;criticalRemaining=pp.remaining_median;}}
  const marginals=regimeData?.cluster_conditional_returns?.cluster_marginals||{};const baselines=condReturnsData?.baselines||{};const assetMap={};
  for(const ck of CLUSTER_ORDER){const cm=marginals[ck]||{};for(const[,bData]of Object.entries(cm)){if(!bData?.assets)continue;for(const[ticker,horizons]of Object.entries(bData.assets)){if(CRYPTO_TICKERS.has(ticker))continue;const d=horizons?.['6m'];if(!d||!d.significant)continue;const bl=baselines[ticker]?.baseline_6m;const tr=(bl!=null&&d.avg_excess!=null)?bl+d.avg_excess:d.avg;const str=d.signal_strength||0;if(!assetMap[ticker]||str>assetMap[ticker].strength)assetMap[ticker]={ticker,totalReturn:tr,strength:str};}}}
  const topAssets=Object.values(assetMap).sort((a,b)=>b.strength-a.strength).slice(0,3);

  return(
    <GlassCard>
      <div className="flex items-center justify-between mb-3"><span className="text-label uppercase tracking-wider text-muted-blue">Zusammenfassung</span><span className="px-2 py-1 rounded text-sm font-bold font-mono" style={{backgroundColor:`${severityColor}20`,color:severityColor}}>{severity}</span></div>
      <div className="px-3 py-3 rounded" style={{backgroundColor:`${severityColor}08`,borderLeft:`3px solid ${severityColor}`}}>
        <div className="text-sm text-ice-white" style={{lineHeight:'1.8'}}>
          <div className="mb-2"><strong style={{color:severityColor}}>Gesamtlage: {SEVERITY_LABELS[severity]}.</strong>{tippedNames.length>0?<> {tippedNames.length} von 9 Zyklen {tippedNames.length===1?'hat':'haben'} sich verschlechtert ({tippedNames.join(', ')}).</>:<> Alle Zyklen stabil.</>}</div>
          {v16Growth!=null&&<div className="mb-2">{v16Growth>0.7?<>Handelssystem bleibt mit <strong style={{color:COLORS.signalGreen}}>{(v16Growth*100).toFixed(0)}%</strong> Wahrscheinlichkeit im Normalmodus.</>:v16Growth>0.4?<>Handelssystem bleibt mit <strong style={{color:COLORS.signalYellow}}>{(v16Growth*100).toFixed(0)}%</strong> im Normalmodus — erhöhte Wachsamkeit.</>:<>Handelssystem wechselt mit <strong style={{color:COLORS.signalRed}}>{((1-v16Growth)*100).toFixed(0)}%</strong> Wahrscheinlichkeit in den defensiven Modus.</>}</div>}
          {extendedIds.length>0&&<div className="mb-2"><strong style={{color:COLORS.signalOrange}}>{extendedIds.length} Zykl{extendedIds.length===1?'us':'en'} überfällig:</strong> {extendedIds.map(id=>cycleName(id)).join(', ')} — Phasenwechsel wird wahrscheinlicher.</div>}
          {criticalCycle&&<div className="mb-2">Am nächsten am Kipppunkt: <strong style={{color:COLORS.signalRed}}>{cycleName(criticalCycle)}</strong> — noch ~{criticalRemaining} Monate.</div>}
          {topAssets.length>0&&<div>Stärkste historische Signale (6M): {topAssets.map((a,i)=><span key={i}>{i>0?', ':''}<strong style={{color:(a.totalReturn||0)>=0?COLORS.signalGreen:COLORS.signalRed}}>{a.ticker} {fmtPct(a.totalReturn)}</strong></span>)}.</div>}
        </div>
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// CASCADE CHAIN (V5.2 — überarbeitet, vertikal, Mobile-freundlich)
// ═══════════════════════════════════════════════════════════════

function CascadeChain({transData}){
  const cascade=transData?.cascade_speed?.current||{};const positions=transData?.phase_positions||{};const condDurations=transData?.conditional_remaining_durations||{};
  const tippedMap={};(cascade.transitioned_cycles||[]).forEach(t=>{tippedMap[t.cycle||t]=t.month||'?';});
  function chainMedian(f,t){return condDurations[`${f}_warns_${t}`]?.remaining_months_stats?.median??'?';}
  const statusCol=cid=>tippedMap[cid]?COLORS.signalRed:STATUS_COLORS[positions[cid]?.status]||COLORS.fadedBlue;

  return(
    <GlassCard><Section title="Kausalkette — Welcher Zyklus führt welchen?" defaultOpen={true}>
      <InfoToggle>Zyklen kippen nicht zufällig gleichzeitig — sie folgen einer Hierarchie. Liquidity kippt zuerst, dann Credit, dann Business. Die Zahlen zeigen wie viele Monate typischerweise zwischen den Kipppunkten liegen. &quot;AKTIV&quot; = der führende Zyklus hat bereits gekippt.</InfoToggle>
      <div className="mb-4">
        <div className="text-caption text-muted-blue mb-2" style={{fontSize:'10px',fontWeight:600}}>Hauptkaskade: Liquidität → Credit → Realwirtschaft</div>
        <div className="space-y-1">
          {PRIMARY_CHAIN.map((cid,idx)=>{const meta=CYCLE_META[cid]||{};const pp=positions[cid]||{};const isTipped=!!tippedMap[cid];const sc=statusCol(cid);
            return(<div key={cid}><div className="flex items-center gap-2 px-3 py-2 rounded" style={{backgroundColor:`${sc}10`,borderLeft:`3px solid ${sc}`}}><span style={{fontSize:'14px'}}>{meta.icon}</span><div className="flex-1 min-w-0"><div className="text-caption font-semibold text-ice-white">{cycleName(cid)}</div><div className="text-caption font-mono" style={{color:sc,fontSize:'10px'}}>{isTipped?`Gekippt seit ${tippedMap[cid]}`:`${statusLabel(pp.status)} — ${pp.phase_position_pct!=null?Math.min(pp.phase_position_pct,200):'?'}% durch aktuelle Phase`}</div></div></div>
              {idx<PRIMARY_CHAIN.length-1&&<div className="flex items-center gap-2 pl-6 py-1"><span style={{color:COLORS.fadedBlue,fontSize:'14px'}}>↓</span><span className="text-caption font-mono" style={{color:COLORS.mutedBlue,fontSize:'10px'}}>historisch ~{chainMedian(PRIMARY_CHAIN[idx],PRIMARY_CHAIN[idx+1])} Monate Vorwarnzeit</span></div>}
            </div>);})}
        </div>
      </div>
      <div><div className="text-caption text-muted-blue mb-2" style={{fontSize:'10px',fontWeight:600}}>Alle Kausalketten</div>
        <div className="space-y-1">{CASCADE_CHAINS.map(({from,to,label})=>{const key=`${from}_warns_${to}`;const d=condDurations[key]?.remaining_months_stats||{};const isActive=!!tippedMap[from];
          return(<div key={key} className="flex items-center justify-between px-3 py-1.5 rounded" style={{backgroundColor:isActive?`${COLORS.signalRed}08`:'#0d1f38'}}><div className="flex-1 min-w-0"><span className="text-caption" style={{color:COLORS.iceWhite,fontSize:'10px'}}>{label}</span></div><div className="flex items-center gap-2 shrink-0"><span className="text-caption font-mono" style={{color:COLORS.iceWhite,fontSize:'10px'}}>{d.median!=null?`~${d.median} Mo`:'—'}</span>{isActive&&<span className="px-1.5 py-0.5 rounded" style={{backgroundColor:`${COLORS.signalRed}20`,color:COLORS.signalRed,fontSize:'9px'}}>AKTIV</span>}</div></div>);
        })}</div>
      </div>
    </Section></GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// THREAT LEVEL
// ═══════════════════════════════════════════════════════════════

function ThreatLevelBlock({transData,regimeData}){
  const cascade=transData?.cascade_speed?.current||{};const confirmation=transData?.confirmation_counter||{};const assessment=transData?.overall_assessment||{};
  const severity=cascade.severity||'CALM';const severityColor=SEVERITY_COLORS[severity]||COLORS.fadedBlue;
  let v16Growth=null,v16Stress=null;const v16Dual=regimeData?.v16_transition_probability?.by_dual_cluster||{};
  for(const[,val]of Object.entries(v16Dual)){if(val&&typeof val==='object'&&val.n_months>0){const g=val.v16_stays_growth_6m;if(typeof g==='number'){v16Growth=g;v16Stress=val.v16_to_stress_6m;break;}}}
  const extended=assessment.extended_cycles||[];

  return(
    <GlassCard>
      <div className="flex items-center justify-between mb-3"><span className="text-label uppercase tracking-wider text-muted-blue">Bedrohungslevel</span><span className="px-2 py-1 rounded text-sm font-bold font-mono" style={{backgroundColor:`${severityColor}20`,color:severityColor}}>{severity}</span></div>
      <InfoToggle>Kombiniert drei Signale: Kipp-Tempo (wie schnell kippen Zyklen?), Stimmung (wie viele positiv vs negativ?) und V16 Stabilität (bleibt das Handelssystem im Normalmodus?). Wenn alle drei warnen → maximale Vorsicht.</InfoToggle>
      <div className="px-3 py-3 rounded mb-3" style={{backgroundColor:`${severityColor}10`,borderLeft:`3px solid ${severityColor}`}}>
        <div className="text-sm text-ice-white mb-2" style={{lineHeight:'1.5'}}>{assessment.verdict||'Keine Einschätzung verfügbar'}</div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div><div className="text-caption text-muted-blue">Kipp-Tempo</div><div className="text-lg font-mono font-bold" style={{color:severityColor}}>{cascade.cascade_speed??'—'}</div><div className="text-caption text-muted-blue">{cascade.n_transitions||0} / 6 Mo</div></div>
          <div><div className="text-caption text-muted-blue">Stimmung</div><div className="text-lg font-mono font-bold" style={{color:(confirmation.confirmation_score||0)>0?COLORS.signalGreen:(confirmation.confirmation_score||0)<0?COLORS.signalRed:COLORS.mutedBlue}}>{confirmation.confirmation_score>0?'+':''}{confirmation.confirmation_score??'—'}</div><div className="text-caption text-muted-blue">{confirmation.bullish_count||0}↑ {confirmation.bearish_count||0}↓ {confirmation.neutral_count||0}→</div></div>
          <div><div className="text-caption text-muted-blue">V16 stabil</div><div className="text-lg font-mono font-bold" style={{color:v16Growth!=null&&v16Growth>0.7?COLORS.signalGreen:v16Growth!=null&&v16Growth<0.5?COLORS.signalRed:COLORS.signalYellow}}>{v16Growth!=null?`${(v16Growth*100).toFixed(0)}%`:'—'}</div><div className="text-caption text-muted-blue">{v16Stress!=null?`Stress ${(v16Stress*100).toFixed(0)}%`:''}</div></div>
        </div>
      </div>
      {extended.length>0&&<div className="text-caption px-2 py-1 rounded" style={{backgroundColor:`${COLORS.signalOrange}10`,color:COLORS.signalOrange}}>⚠ Überfällig: {extended.map(id=>cycleName(id)).join(', ')}</div>}
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE POSITION BARS (V5.2 — Mobile fix, 533%+ capped)
// ═══════════════════════════════════════════════════════════════

function PhasePositionBars({transData}){
  const positions=transData?.phase_positions||{};
  return(
    <GlassCard><Section title="Phase-Fortschritt" defaultOpen={true}>
      <InfoToggle>Jeder Zyklus durchläuft Phasen. Der Balken zeigt den Fortschritt: 100% (Mitte) = historische Median-Dauer erreicht. Rechts davon = Phase dauert länger als üblich. &quot;Überfällig&quot; = Phasenwechsel einplanen.</InfoToggle>
      <div className="space-y-2">{CYCLE_ORDER.filter(id=>id!=='POLITICAL').map(cid=>{
        const pp=positions[cid]||{};const meta=CYCLE_META[cid]||{};const rawPct=pp.phase_position_pct;const displayPct=rawPct!=null?Math.min(rawPct,200):0;
        const barWidth=Math.min(displayPct/2,100);const status=pp.status||'NO_HISTORY';const sc=STATUS_COLORS[status]||COLORS.fadedBlue;const isExtreme=rawPct!=null&&rawPct>200;
        return(<div key={cid}>
          <div className="flex items-center justify-between mb-0.5"><span className="text-caption font-mono" style={{color:COLORS.iceWhite,fontSize:'11px'}}>{meta.icon} {cycleName(cid).split(' ')[0]}</span><span className="text-caption font-mono" style={{color:sc,fontSize:'10px'}}>{statusLabel(status)} {rawPct!=null?(isExtreme?'(>200%)':`${rawPct}%`):''} · ~{pp.remaining_median??'?'} Mo</span></div>
          <div className="relative h-3 rounded-full overflow-hidden" style={{backgroundColor:'#1a2a44'}}><div className="h-full rounded-full transition-all" style={{width:`${barWidth}%`,backgroundColor:sc,opacity:0.7}}/><div className="absolute top-0 h-full w-px" style={{left:'50%',backgroundColor:COLORS.iceWhite,opacity:0.4}}/></div>
        </div>);
      })}</div>
      <div className="text-caption mt-2" style={{fontSize:'9px',color:COLORS.fadedBlue}}>Balkenmitte = 100% (Median-Dauer). Rechts = länger als üblich.</div>
    </Section></GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// CASCADE SPEED TIMELINE (V5.2 — Werte erklärt)
// ═══════════════════════════════════════════════════════════════

function CascadeTimeline({transData}){
  const historical=transData?.cascade_speed?.historical_cascade_speeds||[];const current=transData?.cascade_speed?.current||{};
  const chartData=useMemo(()=>historical.length?historical.map(h=>({date:h.month,speed:h.speed})):[], [historical]);
  if(!chartData.length)return null;
  return(
    <GlassCard><Section title="Kipp-Tempo — Historisch" defaultOpen={true}>
      <InfoToggle>Unter 0.2 (grün) = ruhig. 0.2–0.5 (gelb) = mehrere Zyklen drehen — Vorsicht. Über 0.5 (orange) = schnelle Kaskade, Crashs gingen historisch voraus. Je höher, desto schneller kippen die Zyklen.</InfoToggle>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{top:10,right:10,left:0,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44"/>
          <ReferenceArea y1={0} y2={0.2} fill={COLORS.signalGreen} fillOpacity={0.04}/>
          <ReferenceArea y1={0.2} y2={0.5} fill={COLORS.signalYellow} fillOpacity={0.04}/>
          <ReferenceArea y1={0.5} y2={1} fill={COLORS.signalOrange} fillOpacity={0.06}/>
          <ReferenceLine y={0.2} stroke={COLORS.signalYellow} strokeDasharray="4 4" strokeWidth={1} label={{value:'Vorsicht',fill:COLORS.signalYellow,fontSize:9,position:'right'}}/>
          <ReferenceLine y={0.5} stroke={COLORS.signalOrange} strokeDasharray="4 4" strokeWidth={1} label={{value:'Alarm',fill:COLORS.signalOrange,fontSize:9,position:'right'}}/>
          <XAxis dataKey="date" tick={{fill:COLORS.mutedBlue,fontSize:9}} interval={Math.max(1,Math.floor(chartData.length/12))} tickFormatter={d=>d?.slice(0,4)}/>
          <YAxis tick={{fill:COLORS.mutedBlue,fontSize:9}} domain={[0,1]} width={35} tickFormatter={v=>v.toFixed(1)}/>
          <Tooltip content={<ChartTooltip/>}/>
          <Line type="monotone" dataKey="speed" stroke={COLORS.signalOrange} strokeWidth={1.5} dot={false} name="Kipp-Tempo"/>
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-caption mt-1" style={{fontSize:'10px'}}><span style={{color:COLORS.fadedBlue}}>{chartData.length} Monate</span><span style={{color:SEVERITY_COLORS[current.severity]||COLORS.fadedBlue}}>Aktuell: {current.cascade_speed??'—'} — {SEVERITY_LABELS[current.severity]?.split('—')[0]?.trim()||current.severity}</span></div>
    </Section></GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// REGIME HEATMAP
// ═══════════════════════════════════════════════════════════════

function RegimeHeatmap({regimeData,condReturnsData}){
  const[sc,setSc]=useState('CREDIT_CLUSTER');const marginals=regimeData?.cluster_conditional_returns?.cluster_marginals||{};const baselines=condReturnsData?.baselines||{};
  const cm=marginals[sc]||{};const buckets=Object.keys(cm).filter(b=>cm[b]?.n_months>0);const opts=CLUSTER_ORDER.map(c=>({value:c,label:CLUSTER_LABELS[c]}));
  const hd=useMemo(()=>{const rows=[];for(const b of buckets){const assets=cm[b]?.assets||{};for(const t of ALL_ASSETS_ORDERED){const d=assets[t]?.['6m'];if(!d)continue;const bl=baselines[t]?.baseline_6m;const ex=d.avg_excess;rows.push({ticker:t,bucket:b,excess:ex,totalReturn:(bl!=null&&ex!=null)?bl+ex:d.avg,significant:d.significant});}}return rows;},[cm,buckets,baselines]);

  return(
    <GlassCard><Section title="Regime Heatmap — Welche Assets profitieren?" defaultOpen={true}>
      <InfoToggle>Historische 6-Monats-Returns bei aktuellem Cluster-Zustand. Grün = besser als üblich. Rot = schlechter. Nur farbige Zellen sind statistisch belastbar.</InfoToggle>
      <div className="flex items-center gap-2 mb-3"><span className="text-caption text-muted-blue">Cluster:</span><select value={sc} onChange={e=>setSc(e.target.value)} style={{backgroundColor:'#0d1f38',color:COLORS.iceWhite,border:'1px solid #4A5A7A',borderRadius:'4px',padding:'3px 8px',fontSize:'11px',outline:'none'}}>{opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><ClusterInfo clusterId={sc}/></div>
      {buckets.length===0?<div className="text-caption text-muted-blue py-4 text-center">Keine Daten</div>:
      <div className="space-y-1"><div className="flex items-center gap-1 pb-1 border-b border-white/10"><span className="text-caption font-mono w-14 shrink-0" style={{color:COLORS.mutedBlue,fontSize:'9px'}}>Asset</span>{buckets.map(b=><span key={b} className="text-caption font-mono flex-1 text-center" style={{color:COLORS.mutedBlue,fontSize:'9px'}}>{b}</span>)}</div>
        {ASSET_CATEGORIES.map(cat=>{const cr=hd.filter(r=>cat.tickers.includes(r.ticker));if(!cr.length)return null;const tm={};cr.forEach(r=>{tm[r.ticker]=tm[r.ticker]||{};tm[r.ticker][r.bucket]=r;});
          return(<div key={cat.label}><div className="text-caption mt-2 mb-1" style={{color:COLORS.fadedBlue,fontSize:'9px'}}>{cat.label}</div>{cat.tickers.map(t=>{const d=tm[t];if(!d)return null;return(<div key={t} className="flex items-center gap-1 py-0.5"><span className="text-caption font-mono w-14 shrink-0" style={{color:COLORS.iceWhite,fontSize:'10px'}}>{t}</span>{buckets.map(b=>{const c=d[b];if(!c)return<span key={b} className="flex-1 text-center text-caption" style={{color:COLORS.fadedBlue}}>—</span>;const op=c.significant?0.15:0.03;const col=c.significant?excessColor(c.excess):COLORS.fadedBlue;return<span key={b} className="flex-1 text-center text-caption font-mono rounded px-1 py-0.5" style={{backgroundColor:`${col}${Math.round(op*255).toString(16).padStart(2,'0')}`,color:c.significant?col:COLORS.fadedBlue,fontSize:'10px'}}>{c.totalReturn!=null?fmtPct(c.totalReturn):'—'}</span>;})}</div>);})}</div>);
        })}
      </div>}
    </Section></GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONDITIONAL RETURNS
// ═══════════════════════════════════════════════════════════════

function ConditionalReturnsChart({regimeData,condReturnsData}){
  const[sc,setSc]=useState('CREDIT_CLUSTER');const marginals=regimeData?.cluster_conditional_returns?.cluster_marginals||{};const baselines=condReturnsData?.baselines||{};
  const opts=CLUSTER_ORDER.map(c=>({value:c,label:CLUSTER_LABELS[c]}));
  const cd=useMemo(()=>{const cm=marginals[sc]||{};const rows=[];for(const[,bData]of Object.entries(cm)){if(!bData?.assets)continue;for(const t of ALL_ASSETS_ORDERED){const d=bData.assets[t]?.['6m'];if(!d||!d.significant)continue;const bl=baselines[t]?.baseline_6m;rows.push({ticker:t,excess:d.avg_excess||0,totalReturn:(bl!=null&&d.avg_excess!=null)?bl+d.avg_excess:d.avg,isCrypto:CRYPTO_TICKERS.has(t)});}}rows.sort((a,b)=>(b.excess||0)-(a.excess||0));return rows.slice(0,15);},[marginals,sc,baselines]);

  return(
    <GlassCard><Section title="Stärkste Signale — Top Assets" defaultOpen={true}>
      <InfoToggle>Assets mit den stärksten Signalen (6M). Balken = Abweichung vom Durchschnitt. Zahl = erwarteter Gesamt-Return. ⚠ bei Crypto = kurze Historie, weniger verlässlich.</InfoToggle>
      <div className="flex items-center gap-2 mb-3"><span className="text-caption text-muted-blue">Cluster:</span><select value={sc} onChange={e=>setSc(e.target.value)} style={{backgroundColor:'#0d1f38',color:COLORS.iceWhite,border:'1px solid #4A5A7A',borderRadius:'4px',padding:'3px 8px',fontSize:'11px',outline:'none'}}>{opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><ClusterInfo clusterId={sc}/></div>
      {cd.length===0?<div className="text-caption text-muted-blue py-4 text-center">Keine signifikanten Signale</div>:
      <div className="space-y-1">{cd.map((r,i)=>{const mx=Math.max(...cd.map(x=>Math.abs(x.excess||0)),0.01);const bp=Math.abs(r.excess)/mx*45;const pos=r.excess>=0;
        return(<div key={`${r.ticker}-${i}`} className="flex items-center gap-2 py-0.5"><span className="text-caption font-mono w-14 shrink-0" style={{color:COLORS.iceWhite,fontSize:'10px'}}>{r.ticker}{r.isCrypto?' ⚠':''}</span><div className="flex-1 flex items-center" style={{height:'18px'}}><div className="relative w-full h-full flex items-center"><div className="absolute h-full w-px" style={{left:'50%',backgroundColor:COLORS.fadedBlue,opacity:0.5}}/><div className="absolute h-3 rounded-sm" style={{left:pos?'50%':`${50-bp}%`,width:`${bp}%`,backgroundColor:pos?COLORS.signalGreen:COLORS.signalRed,opacity:0.6}}/></div></div><span className="text-caption font-mono w-16 text-right shrink-0" style={{color:pos?COLORS.signalGreen:COLORS.signalRed,fontSize:'10px'}}>{fmtPct(r.totalReturn)}</span></div>);
      })}</div>}
    </Section></GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// V16 TRANSITION (V5.2 — verständlich)
// ═══════════════════════════════════════════════════════════════

function V16TransitionBar({regimeData}){
  const byDual=regimeData?.v16_transition_probability?.by_dual_cluster||{};
  const DL={'BULLISH__BULLISH':'Credit positiv + Wirtschaft positiv','BULLISH__BEARISH':'Credit positiv + Wirtschaft negativ','BULLISH__NEUTRAL_MIXED':'Credit positiv + Wirtschaft neutral','BEARISH__BULLISH':'Credit negativ + Wirtschaft positiv','BEARISH__BEARISH':'Credit negativ + Wirtschaft negativ','BEARISH__NEUTRAL_MIXED':'Credit negativ + Wirtschaft neutral','NEUTRAL_MIXED__BULLISH':'Credit neutral + Wirtschaft positiv','NEUTRAL_MIXED__BEARISH':'Credit neutral + Wirtschaft negativ','NEUTRAL_MIXED__NEUTRAL_MIXED':'Beide neutral'};
  function fl(k){const c=k.replace(/CREDIT_/g,'').replace(/REAL_ECONOMY_/g,'').replace(/REAL_/g,'');return DL[c]||k.replace(/__/g,' + ').replace(/_/g,' ');}
  const bars=useMemo(()=>{const r=[];for(const[k,v]of Object.entries(byDual)){if(!v||typeof v!=='object'||!v.n_months)continue;const g=v.v16_stays_growth_6m;if(typeof g!=='number')continue;r.push({label:fl(k),growth:Math.round(g*100),stress:Math.round((v.v16_to_stress_6m||0)*100),crisis:Math.round((v.v16_to_crisis_6m||0)*100),n:v.n_months});}return r;},[byDual]);

  return(
    <GlassCard><Section title="Regime-Stabilität" defaultOpen={true}>
      <InfoToggle>Unser Handelssystem wechselt zwischen Normal (grün), Stress (gelb) und Krise (rot). Die Balken zeigen: Bei welcher Kombination aus Credit und Wirtschaft blieb es im Normalmodus? Erste Zeile = aktuelle Lage.</InfoToggle>
      {bars.length===0?<div className="text-caption text-muted-blue py-4 text-center">Keine Daten</div>:
      <div className="space-y-2">{bars.map((b,i)=><div key={i}><div className="flex items-center justify-between mb-1"><span className="text-caption" style={{color:COLORS.iceWhite,fontSize:'10px'}}>{i===0?'→ ':''}{b.label}</span><span className="text-caption font-mono" style={{color:COLORS.fadedBlue,fontSize:'9px'}}>n={b.n}</span></div><div className="flex h-5 rounded-full overflow-hidden">{b.growth>0&&<div style={{flex:b.growth,backgroundColor:COLORS.signalGreen,opacity:0.7}} className="flex items-center justify-center"><span style={{fontSize:'9px',color:'#fff',fontWeight:600}}>{b.growth}%</span></div>}{b.stress>0&&<div style={{flex:b.stress,backgroundColor:COLORS.signalYellow,opacity:0.7}} className="flex items-center justify-center"><span style={{fontSize:'9px',color:'#000',fontWeight:600}}>{b.stress}%</span></div>}{b.crisis>0&&<div style={{flex:b.crisis,backgroundColor:COLORS.signalRed,opacity:0.7}} className="flex items-center justify-center"><span style={{fontSize:'9px',color:'#fff',fontWeight:600}}>{b.crisis}%</span></div>}</div></div>)}
        <div className="flex gap-4 text-caption mt-1" style={{fontSize:'9px'}}><span style={{color:COLORS.signalGreen}}>● Normal</span><span style={{color:COLORS.signalYellow}}>● Stress</span><span style={{color:COLORS.signalRed}}>● Krise</span></div>
      </div>}
    </Section></GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// ANALOGUES + CRASH VS CORRECTION
// ═══════════════════════════════════════════════════════════════

function AnaloguesTimeline({regimeData}){
  const analogues=regimeData?.historical_analogues?.analogues||[];if(!analogues.length)return null;
  return(
    <GlassCard><Section title="Historische Vergleiche" defaultOpen={true}>
      <InfoToggle>Perioden mit ähnlicher Zyklen-Konstellation in 20 Jahren Geschichte. Zeigt was danach passierte (6M). Kontext, keine Prognose.</InfoToggle>
      <div className="space-y-2">{analogues.slice(0,5).map((a,i)=>{const w=a.what_happened_next||{};return(<div key={i} className="px-3 py-2 rounded" style={{backgroundColor:'#0d1f38'}}><div className="flex items-center justify-between mb-1"><span className="text-caption font-mono font-semibold" style={{color:COLORS.iceWhite}}>{a.period_start}</span><span className="text-caption font-mono" style={{color:COLORS.mutedBlue}}>Ähnlichkeit: {a.similarity_score}</span></div><div className="flex gap-4">{['spy','gld','tlt'].map(t=>{const v=w[`${t}_6m_return`];return<span key={t} className="text-caption font-mono" style={{color:v!=null&&v>0?COLORS.signalGreen:COLORS.signalRed}}>{t.toUpperCase()} {v!=null?`${(v*100).toFixed(1)}%`:'—'}</span>;})}</div></div>);})}</div>
    </Section></GlassCard>
  );
}

function CrashVsCorrection({regimeData}){
  const cd=regimeData?.crash_vs_correction||{};const dualDD=cd.dual_state_drawdowns||{};const entryRules=cd.entry_rules||{};const cs=cd.current_state||{};
  const entries=Object.entries(dualDD).filter(([,v])=>v&&typeof v==='object'&&(v.n_months||v.n||v.spy_6m));
  if(entries.length===0)return null;
  return(
    <GlassCard><Section title="Crash oder Korrektur?" defaultOpen={true}>
      <InfoToggle>Credit UND Business negativ → Crash (-25% bis -35%). Nur Credit negativ → Korrektur (-8% bis -15%). Entry Zone = historisch gute Einstiegspunkte.</InfoToggle>
      {cs.dual_key&&<div className="text-caption px-3 py-2 rounded mb-3" style={{backgroundColor:'#0d1f38',border:'1px solid #1a3050',fontSize:'11px'}}><strong style={{color:COLORS.iceWhite}}>Aktuell:</strong> <span style={{color:COLORS.mutedBlue}}>{cs.implication||cs.dual_key}</span></div>}
      <div className="space-y-2">{entries.map(([k,v])=>{const r=entryRules[k]||{};const tc=r.type==='CRASH'?COLORS.signalRed:r.type==='CORRECTION'?COLORS.signalYellow:COLORS.signalOrange;const tl=r.type==='CRASH'?'Crash-Risiko':r.type==='CORRECTION'?'Korrektur':r.type==='CRASH_WITH_RECOVERY'?'Crash mit Recovery':r.type||'';
        return(<div key={k} className="px-3 py-2 rounded" style={{backgroundColor:'#0d1f38',borderLeft:`3px solid ${tc}`}}><div className="flex items-center justify-between mb-1"><span className="text-caption" style={{color:COLORS.iceWhite,fontSize:'10px'}}>{k.replace(/CREDIT_/g,'Credit ').replace(/BUSINESS_/g,'Business ').replace(/__/g,' + ')}</span>{r.type&&<span className="text-caption font-mono px-1.5 py-0.5 rounded" style={{backgroundColor:`${tc}20`,color:tc,fontSize:'9px'}}>{tl}</span>}</div><div className="text-caption font-mono" style={{fontSize:'10px',color:COLORS.mutedBlue}}>{v.spy_6m?.avg!=null&&<span>Ø SPY 6M: {fmtPct(v.spy_6m.avg)} </span>}{v.spy_6m?.worst!=null&&<span style={{color:COLORS.signalRed}}>Worst: {fmtPct(v.spy_6m.worst)} </span>}<span style={{color:COLORS.fadedBlue}}>n={v.n_months||v.spy_6m?.n||'?'}</span></div>{r.entry_zone&&<div className="text-caption mt-1" style={{color:COLORS.fadedBlue,fontSize:'9px'}}>Einstieg ab: {r.entry_zone}</div>}</div>);
      })}</div>
    </Section></GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// CYCLE CARDS (V5.2 — klickbar, Fließtext, keine CondReturns)
// ═══════════════════════════════════════════════════════════════

function PhaseLifecycleChart({chartData}){
  if(!chartData)return null;
  const ind=chartData.indicator||[];const sm=chartData.smoothed||[];const ma=chartData.ma_12m||[];const pz=chartData.phase_zones||[];
  if(ind.length<24)return null;
  const smMap={};sm.forEach(p=>{if(p.value!=null)smMap[p.date]=p.value;});
  const maMap={};ma.forEach(p=>{if(p.value!=null)maMap[p.date]=p.value;});
  const merged=ind.map(p=>({date:p.date,indicator:p.value,smoothed:smMap[p.date]??null,ma:maMap[p.date]??null})).filter(d=>d.indicator!=null);
  if(merged.length<24)return null;
  const ti=Math.max(1,Math.floor(merged.length/10));

  // Phase zone backgrounds
  const za=pz.map((z,i)=>({x1:z.start,x2:z.end,color:z.color==='green'?COLORS.signalGreen:z.color==='yellow'?COLORS.signalYellow:z.color==='orange'?COLORS.signalOrange:z.color==='red'?COLORS.signalRed:'#4A5A7A',key:i}));

  // NOW-Marker: last data point date
  const nowDate=merged[merged.length-1]?.date;

  // Crossover points: where smoothed crosses MA (sign change)
  const crossovers=[];
  for(let i=1;i<merged.length;i++){
    const prev=merged[i-1];const cur=merged[i];
    if(prev.smoothed!=null&&prev.ma!=null&&cur.smoothed!=null&&cur.ma!=null){
      const prevDiff=prev.smoothed-prev.ma;const curDiff=cur.smoothed-cur.ma;
      if(prevDiff*curDiff<0){
        // Sign changed — crossover at current point
        crossovers.push({date:cur.date,value:cur.smoothed,bullish:curDiff>0});
      }
    }
  }

  // Direction arrow: smoothed velocity over last 3 months
  const smVals=merged.filter(d=>d.smoothed!=null);
  let dirLabel='→';let dirColor=COLORS.mutedBlue;
  if(smVals.length>=4){
    const last=smVals[smVals.length-1].smoothed;
    const prev3=smVals[smVals.length-4].smoothed;
    if(prev3&&prev3!==0){
      const vel=(last-prev3)/Math.abs(prev3);
      if(vel>0.005){dirLabel='↗';dirColor=COLORS.signalGreen;}
      else if(vel<-0.005){dirLabel='↘';dirColor=COLORS.signalRed;}
      else{dirLabel='→';dirColor=COLORS.signalYellow;}
    }
  }

  return(<div className="mt-3">
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={merged} margin={{top:5,right:10,left:0,bottom:5}}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44"/>
        {za.map(z=><ReferenceArea key={z.key} x1={z.x1} x2={z.x2} fill={z.color} fillOpacity={0.06} ifOverflow="extendDomain"/>)}
        <XAxis dataKey="date" tick={{fill:COLORS.mutedBlue,fontSize:9}} interval={ti} tickFormatter={d=>d?.slice(0,4)}/>
        <YAxis tick={{fill:COLORS.mutedBlue,fontSize:9}} width={45} tickFormatter={v=>typeof v==='number'?v.toFixed(1):''}/>
        <Tooltip content={<ChartTooltip/>}/>
        {/* NOW marker */}
        {nowDate&&<ReferenceLine x={nowDate} stroke={COLORS.iceWhite} strokeDasharray="4 4" strokeWidth={1.5} label={{value:'JETZT',fill:COLORS.iceWhite,fontSize:9,position:'top'}}/>}
        {/* Crossover dots */}
        {crossovers.map((c,i)=><ReferenceDot key={`cx${i}`} x={c.date} y={c.value} r={3} fill={c.bullish?COLORS.signalGreen:COLORS.signalRed} stroke={c.bullish?COLORS.signalGreen:COLORS.signalRed} strokeWidth={1} ifOverflow="extendDomain"/>)}
        <Line type="monotone" dataKey="indicator" stroke={COLORS.iceWhite} strokeWidth={1} dot={false} name="Indikator" connectNulls strokeOpacity={0.5}/>
        <Line type="monotone" dataKey="smoothed" stroke={COLORS.baldurBlue||'#4A90D9'} strokeWidth={2} dot={false} name="Geglättet" connectNulls/>
        <Line type="monotone" dataKey="ma" stroke={COLORS.signalYellow} strokeWidth={1} dot={false} name="12M Ø" connectNulls strokeOpacity={0.6} strokeDasharray="4 4"/>
      </LineChart>
    </ResponsiveContainer>
    {/* Direction arrow badge */}
    <div className="flex items-center justify-between mt-1">
      <div className="flex gap-3 flex-wrap" style={{fontSize:'9px'}}>
        <span style={{color:COLORS.signalGreen}}>■ Expansion</span>
        <span style={{color:COLORS.signalYellow}}>■ Übergang</span>
        <span style={{color:COLORS.signalRed}}>■ Kontraktion</span>
        <span style={{color:COLORS.iceWhite,opacity:0.5}}>— Indikator</span>
        <span style={{color:COLORS.baldurBlue||'#4A90D9'}}>— Geglättet</span>
        <span style={{color:COLORS.signalYellow}}>-- 12M Ø</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{backgroundColor:`${dirColor}15`,border:`1px solid ${dirColor}30`}}>
        <span style={{color:dirColor,fontSize:'14px',lineHeight:1}}>{dirLabel}</span>
        <span style={{color:dirColor,fontSize:'9px',fontFamily:'monospace'}}>Trend</span>
      </div>
    </div>
    {/* Crossover legend */}
    {crossovers.length>0&&<div className="flex gap-3 mt-1" style={{fontSize:'9px'}}>
      <span style={{color:COLORS.signalGreen}}>● Bullish Kreuzung</span>
      <span style={{color:COLORS.signalRed}}>● Bearish Kreuzung</span>
    </div>}
  </div>);
}

function CycleExplanation({cycleId,phaseData,transData}){
  const meta=CYCLE_META[cycleId]||{};const pp=transData?.phase_positions?.[cycleId]||{};const phase=phaseData?.phase||'UNKNOWN';
  const transitions=pp.transitions_ahead||{};let nextPhase=null,nextProb=0;
  for(const[ph,data]of Object.entries(transitions)){const prob=data?.probability||data||0;if(prob>nextProb){nextPhase=ph;nextProb=prob;}}
  const st=pp.status==='EXTENDED'?'Die Phase dauert länger als üblich — ein Wechsel wird zunehmend wahrscheinlich.':pp.status==='LATE_PHASE'?'Die Phase nähert sich dem Ende. Nächste Phase vorbereiten.':pp.status==='MID_PHASE'?'Phase etwa zur Hälfte durch. Kein unmittelbarer Handlungsbedarf.':pp.status==='EARLY_PHASE'?'Phase hat erst kürzlich begonnen. Signal ist frisch.':'';
  return(<div className="mt-3 px-3 py-2 rounded" style={{backgroundColor:'#0d1f38',fontSize:'11px',lineHeight:'1.6',color:COLORS.mutedBlue}}><div className="mb-2">{meta.desc}</div><div className="mb-1"><strong style={{color:COLORS.iceWhite}}>Aktuell:</strong> {phaseLabel(phase)} bei {pp.phase_position_pct!=null?Math.min(pp.phase_position_pct,200):'?'}% Fortschritt{pp.remaining_median!=null&&<> — noch ~{pp.remaining_median} Monate bis zum Wechsel</>}.</div>{st&&<div className="mb-1">{st}</div>}{nextPhase&&nextProb>0&&<div><strong style={{color:COLORS.iceWhite}}>Nächste Phase:</strong> wahrscheinlich {phaseLabel(nextPhase)} ({typeof nextProb==='number'&&nextProb<=1?(nextProb*100).toFixed(0):nextProb}%).</div>}</div>);
}

function CycleCard({cycleId,phaseData,chartData,transData}){
  const[expanded,setExpanded]=useState(false);const meta=CYCLE_META[cycleId]||{};const phase=phaseData?.phase||'UNKNOWN';const confidence=phaseData?.confidence;
  const alignment=phaseData?.v16_alignment||'NEUTRAL';const inDanger=phaseData?.in_danger_zone;const phaseColor=CYCLE_PHASE_COLORS[phase]||COLORS.fadedBlue;
  const tierColor=CYCLE_TIER_COLORS[meta.tier]||COLORS.mutedBlue;const pp=transData?.phase_positions?.[cycleId]||{};const pct=pp.phase_position_pct;
  const status=pp.status;const remaining=pp.remaining_median;const sc=STATUS_COLORS[status]||COLORS.fadedBlue;

  return(
    <div className="rounded-lg mb-3 overflow-hidden" style={{backgroundColor:`${phaseColor}10`,borderLeft:`3px solid ${phaseColor}`}}>
      <button onClick={()=>setExpanded(!expanded)} className="w-full text-left p-3">
        <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span style={{fontSize:'16px'}}>{meta.icon}</span><span className="text-sm font-semibold text-ice-white">{meta.name}</span><span className="text-caption px-1.5 py-0.5 rounded font-mono" style={{backgroundColor:`${tierColor}20`,color:tierColor,fontSize:'10px'}}>T{meta.tier}</span></div><div className="flex items-center gap-2"><span className="text-caption" style={{color:alignment==='ALIGNED'?COLORS.signalGreen:alignment==='DIVERGED'?COLORS.signalRed:COLORS.mutedBlue}}>{alignment==='ALIGNED'?'✅':alignment==='DIVERGED'?'❌':'➖'}</span>{inDanger&&<span className="text-caption">⚠️</span>}<span className="text-caption text-muted-blue">{expanded?'▾':'▸'}</span></div></div>
        <div className="flex items-center justify-between text-caption"><span style={{color:phaseColor,fontWeight:600}}>{phaseLabel(phase)}</span><span className="font-mono" style={{fontSize:'10px',color:sc}}>{statusLabel(status)} {pct!=null?(pct>200?'(>200%)':`${pct}%`):''} · ~{remaining??'?'}Mo</span></div>
      </button>
      {expanded&&<div className="px-3 pb-3">
        <div className="flex items-center justify-between mb-1"><div className="text-caption text-muted-blue">{meta.indicator}: {fmtVal(phaseData?.indicator_value,meta.unit)}{phaseData?.velocity!=null&&phaseData?.velocity!==''&&<span style={{color:velColor(phaseData.velocity)}}>{velArrow(phaseData.velocity)}</span>}</div>{confidence!=null&&<span className="text-caption text-muted-blue font-mono">{confidence}%</span>}</div>
        {phaseData?.danger_zone?.zone_name&&<div className="text-caption mt-1 px-2 py-1 rounded" style={{backgroundColor:inDanger?`${COLORS.signalRed}15`:`${COLORS.signalOrange}10`,color:inDanger?COLORS.signalRed:COLORS.signalOrange}}>{inDanger?'⚠ IN ZONE: ':'→ '}{phaseData.danger_zone.zone_name}</div>}
        {cycleId!=='POLITICAL'&&<PhaseLifecycleChart chartData={chartData}/>}
        {cycleId==='POLITICAL'&&<PoliticalChart/>}
        <CycleExplanation cycleId={cycleId} phaseData={phaseData} transData={transData}/>
      </div>}
    </div>
  );
}

function PoliticalChart(){
  const yr=new Date().getFullYear();const data=[];for(let y=yr-12;y<=yr+4;y++){const cy=((y-2025)%4+4)%4+1;data.push({date:String(y),value:{1:6.5,2:4.2,3:16.3,4:7.5}[cy]});}
  return(<div className="mt-3"><ResponsiveContainer width="100%" height={150}><LineChart data={data} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke="#1a2a44"/><XAxis dataKey="date" tick={{fill:COLORS.mutedBlue,fontSize:10}} interval={1}/><YAxis tick={{fill:COLORS.mutedBlue,fontSize:10}} tickFormatter={v=>`${v}%`}/><Tooltip content={<ChartTooltip/>}/><ReferenceLine x={String(yr)} stroke={COLORS.iceWhite} strokeDasharray="4 4" strokeWidth={1.5} label={{value:'JETZT',fill:COLORS.iceWhite,fontSize:10,position:'top'}}/><Line type="monotone" dataKey="value" stroke={COLORS.signalYellow} strokeWidth={2} dot={{r:3,fill:COLORS.signalYellow}} name="Ø Return %"/></LineChart></ResponsiveContainer></div>);
}

// ═══════════════════════════════════════════════════════════════
// NARRATIVE (V5.2 — kein "KI")
// ═══════════════════════════════════════════════════════════════

function CycleNarrative({transData}){
  const n=transData?.cycle_narrative;if(!n?.text)return null;
  return(<GlassCard><Section title="Zyklen-Analyse" defaultOpen={true}><InfoToggle>Wöchentliche Zusammenfassung aller Zyklen-Berechnungen. Destilliert Phase Positions, Cascade Speed, V16 Transition und historische Analogien in eine verständliche Einschätzung.</InfoToggle><div className="px-4 py-3 rounded" style={{backgroundColor:'#0d1f38',borderLeft:`3px solid ${COLORS.baldurBlue||'#4A90D9'}`}}><div className="text-sm text-ice-white" style={{lineHeight:'1.7',whiteSpace:'pre-line'}}>{n.text}</div><div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10"><span className="text-caption text-muted-blue font-mono" style={{fontSize:'9px'}}>{n.word_count} Wörter</span><span className="text-caption text-muted-blue font-mono" style={{fontSize:'9px'}}>{n.generated_at?new Date(n.generated_at).toLocaleString('de-DE'):''}</span></div></div></Section></GlassCard>);
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

export default function CyclesDetail({dashboard}){
  const cy=dashboard?.cycles;const[chartDataAll,setChartDataAll]=useState(null);const[condReturnsData,setCondReturnsData]=useState(null);
  const[regimeData,setRegimeData]=useState(null);const[transData,setTransData]=useState(null);const[loading,setLoading]=useState(false);const[error,setError]=useState(null);

  useEffect(()=>{
    const urls=[{url:CHART_URL,setter:setChartDataAll,name:'chart'},{url:COND_RETURNS_URL,setter:setCondReturnsData,name:'cond_returns'},{url:REGIME_URL,setter:setRegimeData,name:'regime'},{url:TRANSITION_URL,setter:setTransData,name:'transition'}].filter(u=>u.url);
    if(!urls.length)return;setLoading(true);const errors=[];
    Promise.allSettled(urls.map(u=>fetch(`${u.url}?t=${Date.now()}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`${u.name}: ${r.status}`);return r.json();}).then(data=>u.setter(data)).catch(err=>errors.push(`${u.name}: ${err.message}`)))).finally(()=>{setLoading(false);if(errors.length)setError(errors.join(', '));});
  },[]);

  if(!cy||!cy.cycle_phases)return(<GlassCard><div className="text-center py-12"><p className="text-lg text-muted-blue">Cycles Engine noch nicht gelaufen.</p><p className="text-caption text-muted-blue mt-2">Workflow: step0v_cycles.yml (Sonntag 02:00 UTC)</p></div></GlassCard>);

  const score=cy.alignment_score??0;const label=cy.alignment_label||'UNKNOWN';const labelColor=CYCLE_ALIGNMENT_COLORS[label]||COLORS.mutedBlue;
  const phases=cy.cycle_phases||{};const dzCount=cy.in_danger_zone||0;const chartCycles=chartDataAll?.cycles||{};

  return(
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between mb-4"><span className="text-label uppercase tracking-wider text-muted-blue">🔄 Cycle Alignment Dashboard</span><span className="text-caption text-muted-blue">{cy.date}</span></div>
        <div className="flex items-center justify-between mb-4"><div><span className="text-4xl font-mono font-bold" style={{color:labelColor}}>{score}</span><span className="text-xl text-muted-blue font-mono">/10</span><span className="ml-3 px-2 py-1 rounded text-sm font-semibold" style={{backgroundColor:`${labelColor}20`,color:labelColor}}>{label}</span></div><div className="text-right"><div className="text-caption text-muted-blue">V16 Regime</div><div className="text-sm font-mono text-ice-white">{cy.current_regime||'—'}</div></div></div>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">{cy.bullish>0&&<div style={{flex:cy.bullish,backgroundColor:COLORS.signalGreen}}/>}{cy.neutral>0&&<div style={{flex:cy.neutral,backgroundColor:COLORS.fadedBlue}}/>}{cy.bearish>0&&<div style={{flex:cy.bearish,backgroundColor:COLORS.signalRed}}/>}</div>
        <div className="flex justify-between text-caption"><span style={{color:COLORS.signalGreen}}>● {cy.bullish||0} Bullish</span><span style={{color:COLORS.fadedBlue}}>● {cy.neutral||0} Neutral</span><span style={{color:COLORS.signalRed}}>● {cy.bearish||0} Bearish</span></div>
        {dzCount>0&&<div className="mt-3 px-3 py-2 rounded text-sm" style={{backgroundColor:`${COLORS.signalOrange}15`,color:COLORS.signalOrange}}>⚠ {dzCount} Danger Zone{dzCount>1?'s':''} aktiv</div>}
        {cy.one_liner&&<div className="mt-3 text-caption text-muted-blue font-mono">{cy.one_liner}</div>}
        {loading&&<div className="mt-2 text-caption text-muted-blue">Lade Daten...</div>}
        {error&&<div className="mt-2 text-caption" style={{color:COLORS.signalOrange}}>Fehler: {error}</div>}
      </GlassCard>

      {transData&&<ExecutiveSummary transData={transData} regimeData={regimeData} condReturnsData={condReturnsData}/>}
      {transData&&<ThreatLevelBlock transData={transData} regimeData={regimeData}/>}
      {transData&&<CascadeChain transData={transData}/>}
      {transData&&<PhasePositionBars transData={transData}/>}
      {transData&&<CascadeTimeline transData={transData}/>}
      {regimeData&&<RegimeHeatmap regimeData={regimeData} condReturnsData={condReturnsData}/>}
      {regimeData&&<ConditionalReturnsChart regimeData={regimeData} condReturnsData={condReturnsData}/>}
      {regimeData&&<V16TransitionBar regimeData={regimeData}/>}
      {regimeData&&<AnaloguesTimeline regimeData={regimeData}/>}
      {regimeData&&<CrashVsCorrection regimeData={regimeData}/>}

      <GlassCard><Section title="Tier 1 — Strukturelle Zyklen" defaultOpen={true}>{CYCLE_ORDER.filter(id=>CYCLE_META[id]?.tier===1).map(id=><CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} transData={transData}/>)}</Section></GlassCard>
      <GlassCard><Section title="Tier 2 — Zyklische Indikatoren" defaultOpen={true}>{CYCLE_ORDER.filter(id=>CYCLE_META[id]?.tier===2).map(id=><CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} transData={transData}/>)}</Section></GlassCard>
      <GlassCard><Section title="Tier 3 — Ergänzende Indikatoren" defaultOpen={true}>{CYCLE_ORDER.filter(id=>CYCLE_META[id]?.tier===3).map(id=><CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} transData={transData}/>)}</Section></GlassCard>

      {transData&&<CycleNarrative transData={transData}/>}

      <GlassCard><Section title="V16 Alignment — Stimmen die Zyklen mit dem Handelssystem überein?" defaultOpen={false}>
        <InfoToggle>✅ = Zyklus bestätigt V16. ❌ = Zyklus widerspricht V16. Wenn viele divergieren, steigt das Risiko dass V16 den Modus wechselt.</InfoToggle>
        <div className="space-y-1">{CYCLE_ORDER.map(id=>{const cp=phases[id]||{};const al=cp.v16_alignment||'NEUTRAL';const ph=cp.phase||'UNKNOWN';const pc=CYCLE_PHASE_COLORS[ph]||COLORS.fadedBlue;
          return(<div key={id} className="flex items-center justify-between py-1 border-b border-white/5"><span className="text-caption text-ice-white font-mono">{CYCLE_META[id]?.icon} {cycleName(id).split(' ')[0]}</span><span className="text-caption font-mono" style={{color:pc}}>{phaseLabel(ph)}</span><span className="text-caption" style={{color:al==='ALIGNED'?COLORS.signalGreen:al==='DIVERGED'?COLORS.signalRed:COLORS.mutedBlue}}>{al==='ALIGNED'?'✅ Bestätigt':al==='DIVERGED'?'❌ Widerspricht':'➖ Neutral'}</span></div>);
        })}</div>
      </Section></GlassCard>
    </div>
  );
}
