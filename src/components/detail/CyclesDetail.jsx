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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONSTANTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const CHART_URL = process.env.NEXT_PUBLIC_CYCLES_CHART_URL;
const COND_RETURNS_URL = process.env.NEXT_PUBLIC_CYCLES_COND_RETURNS_URL;
const REGIME_URL = process.env.NEXT_PUBLIC_CYCLES_REGIME_URL;
const TRANSITION_URL = process.env.NEXT_PUBLIC_CYCLES_TRANSITION_URL;

const CYCLE_META = {
  LIQUIDITY:    { name: 'Global Liquidity',     icon: 'ðŸ’§', tier: 1, unit: '$T',  indicator: 'Fed Net Liq',
    desc: 'Misst die globale LiquiditÃ¤t â€” wie viel Geld die Fed ins System pumpt. Wenn LiquiditÃ¤t kippt, folgen Credit und Business.' },
  CREDIT:       { name: 'Credit Cycle',         icon: 'ðŸ’³', tier: 1, unit: 'bps', indicator: 'HY OAS',
    desc: 'Misst wie leicht Unternehmen an Geld kommen (High-Yield Spreads). Der hÃ¤rteste Einzelindikator â€” wenn Credit kippt, folgt der Rest.' },
  COMMODITY:    { name: 'Commodity Supercycle',  icon: 'ðŸ›¢ï¸', tier: 1, unit: '',    indicator: 'CRB Real',
    desc: 'Misst den Rohstoff-Superzyklus (inflationsbereinigter CRB Index). Getrieben von China-Nachfrage und globaler IndustrieaktivitÃ¤t.' },
  CHINA_CREDIT: { name: 'China Credit Impulse',  icon: 'ðŸ‡¨ðŸ‡³', tier: 1, unit: '',   indicator: 'Cu/Au Ratio',
    desc: 'Misst Chinas Kreditimpuls Ã¼ber das Kupfer/Gold-VerhÃ¤ltnis. Kupfer steigt wenn China investiert, Gold steigt bei Unsicherheit.' },
  DOLLAR:       { name: 'US Dollar Cycle',      icon: 'ðŸ’µ', tier: 2, unit: '',    indicator: 'DXY (Trade-Weighted)',
    desc: 'Misst die StÃ¤rke des US-Dollars. Starker Dollar = schlecht fÃ¼r Commodities, SchwellenlÃ¤nder, Gold. Schwacher Dollar = Risk-On.' },
  BUSINESS:     { name: 'Business Cycle',       icon: 'ðŸ­', tier: 2, unit: '%',   indicator: 'INDPRO YoY',
    desc: 'Misst die Industrieproduktion (YoY). Entscheidet zusammen mit Credit ob ein RÃ¼cksetzer eine Korrektur oder ein Crash wird.' },
  FED_RATES:    { name: 'Fed / Interest Rate',  icon: 'ðŸ¦', tier: 2, unit: '%',   indicator: 'Real FFR',
    desc: 'Misst wie restriktiv die Fed ist (Leitzins minus Inflation). Ein Fed-Pivot ist das stÃ¤rkste Einzelsignal im Markt.' },
  EARNINGS:     { name: 'Earnings / Profit',    icon: 'ðŸ“Š', tier: 2, unit: '%',   indicator: 'Corp Profits YoY',
    desc: 'Misst Unternehmensgewinne (YoY). Nachlaufender Indikator â€” bestÃ¤tigt was Credit und Business bereits anzeigen.' },
  TRADE:        { name: 'Global Trade',         icon: 'ðŸš¢', tier: 3, unit: '%',   indicator: 'CASS YoY',
    desc: 'Misst das nordamerikanische Frachtvolumen (CASS Freight Index). Vorlaufindikator fÃ¼r die Realwirtschaft â€” weniger Fracht = weniger WirtschaftsaktivitÃ¤t.' },
  POLITICAL:    { name: 'Political Cycle',      icon: 'ðŸ—³ï¸', tier: 3, unit: '',    indicator: 'Calendar',
    desc: 'Der 4-Jahres-Wahlzyklus. Jahr 3 (Vorwahljahr) hat historisch die stÃ¤rksten Aktienrenditen. Deterministisch, nicht stochastisch.' },
};

const CYCLE_ORDER = ['LIQUIDITY','CREDIT','COMMODITY','CHINA_CREDIT','DOLLAR','BUSINESS','FED_RATES','EARNINGS','TRADE','POLITICAL'];
const CLUSTER_LABELS = { CREDIT_CLUSTER:'Credit', REAL_ECONOMY_CLUSTER:'Real Economy', MONETARY_POLICY_CLUSTER:'Monetary Policy', CURRENCY_CLUSTER:'Currency' };
const CLUSTER_ORDER = ['CREDIT_CLUSTER','REAL_ECONOMY_CLUSTER','MONETARY_POLICY_CLUSTER','CURRENCY_CLUSTER'];

const CLUSTER_EXPLANATIONS = {
  CREDIT_CLUSTER: { short:'Kreditbedingungen', what:'Misst wie leicht Unternehmen an Geld kommen â€” HY Spreads, LiquiditÃ¤t, Unternehmensgewinne.', why:'Credit ist der hÃ¤rteste FrÃ¼hindikator. Wenn Credit kippt, folgt historisch der Rest.' },
  REAL_ECONOMY_CLUSTER: { short:'Realwirtschaft', what:'Misst ob Fabriken produzieren, GÃ¼ter verschifft werden, China investiert.', why:'Entscheidet ob ein RÃ¼cksetzer eine Korrektur (-10%) oder ein Crash (-30%) wird.' },
  MONETARY_POLICY_CLUSTER: { short:'Geldpolitik', what:'Misst wie restriktiv die Fed ist â€” Real Fed Funds Rate.', why:'Ein Fed-Pivot (restriktiv â†’ locker) ist das stÃ¤rkste Einzelsignal. Wenn die Fed dreht, dreht alles.' },
  CURRENCY_CLUSTER: { short:'US-Dollar', what:'Misst die StÃ¤rke des US-Dollars (DXY Trade-Weighted Index).', why:'Starker Dollar = schlecht fÃ¼r Commodities, SchwellenlÃ¤nder, Gold. Schwacher Dollar = Risk-On.' },
};

const PRIMARY_CHAIN = ['LIQUIDITY','CREDIT','BUSINESS'];
const CASCADE_CHAINS = [
  {from:'LIQUIDITY',to:'CREDIT',label:'LiquiditÃ¤t warnt Credit'},{from:'LIQUIDITY',to:'BUSINESS',label:'LiquiditÃ¤t warnt Realwirtschaft'},
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
const SEVERITY_LABELS = { CALM:'Ruhig â€” kein Handlungsbedarf', MODERATE:'ErhÃ¶hte Wachsamkeit â€” einzelne Zyklen drehen', CASCADE:'Defensiv positionieren â€” schnelle Kaskade', CRISIS:'Krisenmodus â€” maximale Vorsicht' };

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HELPERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function phaseLabel(p){if(!p||p==='UNKNOWN')return 'â€”';return p.replace(/_/g,' ');}
function fmtPct(v,d=1){if(v==null)return 'â€”';return `${(Number(v)*100).toFixed(d)}%`;}
function fmtVal(v,u){if(v==null||v==='')return 'â€”';if(u==='$T')return `$${(Number(v)/1e6).toFixed(2)}T`;if(u==='bps')return `${Number(v).toFixed(0)} bps`;if(u==='%')return `${Number(v).toFixed(2)}%`;return String(Number(v).toFixed(4));}
function velArrow(v){if(v==null||v==='')return '';return Number(v)>0?' â–²':Number(v)<0?' â–¼':' â†’';}
function velColor(v){if(v==null||v==='')return COLORS.mutedBlue;return Number(v)>0?COLORS.signalGreen:Number(v)<0?COLORS.signalRed:COLORS.mutedBlue;}
function excessColor(v){if(v==null)return COLORS.fadedBlue;return v>0.001?COLORS.signalGreen:v<-0.001?COLORS.signalRed:COLORS.fadedBlue;}
function cycleName(id){return CYCLE_META[id]?.name||id;}
function statusLabel(s){return {EARLY_PHASE:'FrÃ¼h',MID_PHASE:'Mitte',LATE_PHASE:'SpÃ¤t',EXTENDED:'ÃœberfÃ¤llig',NO_HISTORY:'â€”'}[s]||s||'â€”';}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SHARED UI
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function Section({title,children,defaultOpen=true}){
  const[open,setOpen]=useState(defaultOpen);
  return(<div className="mb-4"><button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between py-2 border-b border-white/10"><span className="text-label uppercase tracking-wider text-muted-blue">{title}</span><span className="text-caption text-muted-blue">{open?'â–¾':'â–¸'}</span></button>{open&&<div className="pt-3">{children}</div>}</div>);
}

function InfoToggle({children}){
  const[open,setOpen]=useState(false);
  return(<div className="mb-3"><button onClick={()=>setOpen(!open)} style={{backgroundColor:open?'#1a3050':'transparent',border:'1px solid #4A5A7A',borderRadius:'12px',padding:'2px 8px',color:COLORS.mutedBlue,fontSize:'10px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'4px'}}>â“˜ {open?'Ausblenden':'Was bedeutet das?'}</button>{open&&<div className="text-caption px-3 py-2 rounded mt-2" style={{backgroundColor:'#0d1f38',color:COLORS.mutedBlue,fontSize:'11px',lineHeight:'1.5'}}>{children}</div>}</div>);
}

function ChartTooltip({active,payload,label}){
  if(!active||!payload||payload.length===0)return null;
  return(<div style={{backgroundColor:'#0A1628',border:'1px solid #4A5A7A',borderRadius:'6px',padding:'8px 12px',fontSize:'11px'}}><div style={{color:COLORS.mutedBlue,marginBottom:'4px',fontWeight:600}}>{label}</div>{payload.map((e,i)=>e.value!=null?<div key={i} style={{color:e.color,fontSize:'10px'}}>{e.name}: {typeof e.value==='number'?e.value.toFixed(3):e.value}</div>:null)}</div>);
}

function ClusterInfo({clusterId}){
  const[open,setOpen]=useState(false);const info=CLUSTER_EXPLANATIONS[clusterId];if(!info)return null;
  return(<><button onClick={()=>setOpen(!open)} style={{backgroundColor:open?'#1a3050':'transparent',border:'1px solid #4A5A7A',borderRadius:'50%',width:'20px',height:'20px',display:'inline-flex',alignItems:'center',justifyContent:'center',color:COLORS.mutedBlue,fontSize:'11px',cursor:'pointer',marginLeft:'6px',flexShrink:0}}>â“˜</button>{open&&<div className="rounded px-3 py-2 mb-2 mt-1" style={{backgroundColor:'#0d1f38',border:'1px solid #1a3050',fontSize:'11px',lineHeight:'1.5'}}><div style={{color:COLORS.iceWhite,fontWeight:600,marginBottom:'4px'}}>{CLUSTER_LABELS[clusterId]} â€” {info.short}</div><div style={{color:COLORS.mutedBlue,marginBottom:'3px'}}><strong style={{color:COLORS.fadedBlue}}>Was:</strong> {info.what}</div><div style={{color:COLORS.mutedBlue}}><strong style={{color:COLORS.fadedBlue}}>Warum:</strong> {info.why}</div></div>}</>);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXECUTIVE SUMMARY (V5.2 â€” Klartext)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
          {v16Growth!=null&&<div className="mb-2">{v16Growth>0.7?<>Handelssystem bleibt mit <strong style={{color:COLORS.signalGreen}}>{(v16Growth*100).toFixed(0)}%</strong> Wahrscheinlichkeit im Normalmodus.</>:v16Growth>0.4?<>Handelssystem bleibt mit <strong style={{color:COLORS.signalYellow}}>{(v16Growth*100).toFixed(0)}%</strong> im Normalmodus â€” erhÃ¶hte Wachsamkeit.</>:<>Handelssystem wechselt mit <strong style={{color:COLORS.signalRed}}>{((1-v16Growth)*100).toFixed(0)}%</strong> Wahrscheinlichkeit in den defensiven Modus.</>}</div>}
          {extendedIds.length>0&&<div className="mb-2"><strong style={{color:COLORS.signalOrange}}>{extendedIds.length} Zykl{extendedIds.length===1?'us':'en'} Ã¼berfÃ¤llig:</strong> {extendedIds.map(id=>cycleName(id)).join(', ')} â€” Phasenwechsel wird wahrscheinlicher.</div>}
          {criticalCycle&&<div className="mb-2">Am nÃ¤chsten am Kipppunkt: <strong style={{color:COLORS.signalRed}}>{cycleName(criticalCycle)}</strong> â€” noch ~{criticalRemaining} Monate.</div>}
          {topAssets.length>0&&<div>StÃ¤rkste historische Signale (6M): {topAssets.map((a,i)=><span key={i}>{i>0?', ':''}<strong style={{color:(a.totalReturn||0)>=0?COLORS.signalGreen:COLORS.signalRed}}>{a.ticker} {fmtPct(a.totalReturn)}</strong></span>)}.</div>}
        </div>
      </div>
    </GlassCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CASCADE CHAIN (V5.2 â€” Ã¼berarbeitet, vertikal, Mobile-freundlich)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CascadeChain({transData}){
  const cascade=transData?.cascade_speed?.current||{};const positions=transData?.phase_positions||{};const condDurations=transData?.conditional_remaining_durations||{};
  const tippedMap={};(cascade.transitioned_cycles||[]).forEach(t=>{tippedMap[t.cycle||t]=t.month||'?';});
  function chainMedian(f,t){return condDurations[`${f}_warns_${t}`]?.remaining_months_stats?.median??'?';}
  const statusCol=cid=>tippedMap[cid]?COLORS.signalRed:STATUS_COLORS[positions[cid]?.status]||COLORS.fadedBlue;

  return(
    <GlassCard><Section title="Kausalkette â€” Kipp-Sequenz" defaultOpen={true}>
      <InfoToggle>Zeigt wie Zyklen einander beeinflussen. Von oben nach unten: LiquiditÃ¤t kippt zuerst, dann Credit, dann Realwirtschaft. "Noch ~X Mo" = historischer Median zwischen dem Kippen des einen und des anderen.</InfoToggle>
      <div className="space-y-0">{PRIMARY_CHAIN.map((cid,i)=>{const pp=positions[cid]||{};const tipped=!!tippedMap[cid];
        return(<div key={cid}>
          <div className="flex items-center gap-2 px-3 py-2 rounded" style={{backgroundColor:tipped?`${COLORS.signalRed}10`:'transparent',borderLeft:`3px solid ${statusCol(cid)}`}}>
            <span style={{fontSize:'16px'}}>{CYCLE_META[cid]?.icon}</span>
            <div className="flex-1"><div className="text-sm font-mono" style={{color:COLORS.iceWhite}}>{cycleName(cid)}</div><div className="text-caption" style={{color:statusCol(cid)}}>{phaseLabel(pp.current_phase)} Â· {statusLabel(pp.status)} {pp.phase_position_pct!=null?Math.min(pp.phase_position_pct,200)+'%':''}{pp.remaining_median!=null?` Â· ~${pp.remaining_median}Mo`:''}</div></div>
            {tipped&&<span style={{color:COLORS.signalRed,fontSize:'12px'}}>âš  gekippt {tippedMap[cid]}</span>}
          </div>
          {i<PRIMARY_CHAIN.length-1&&<div className="flex items-center gap-2 pl-6 py-1"><span style={{color:COLORS.fadedBlue,fontSize:'14px'}}>â†“</span><span className="text-caption font-mono" style={{color:COLORS.fadedBlue,fontSize:'9px'}}>Noch ~{chainMedian(PRIMARY_CHAIN[i],PRIMARY_CHAIN[i+1])} Mo</span></div>}
        </div>);
      })}</div>
      <div className="mt-3 border-t border-white/10 pt-3"><div className="text-caption text-muted-blue mb-2" style={{fontSize:'9px'}}>Weitere Kausalketten:</div><div className="flex flex-wrap gap-1">{CASCADE_CHAINS.filter(c=>!PRIMARY_CHAIN.includes(c.from)||!PRIMARY_CHAIN.includes(c.to)).map((c,i)=><span key={i} className="text-caption px-2 py-0.5 rounded" style={{backgroundColor:'#0d1f38',color:COLORS.fadedBlue,fontSize:'9px'}}>{CYCLE_META[c.from]?.icon}â†’{CYCLE_META[c.to]?.icon} ~{chainMedian(c.from,c.to)}Mo</span>)}</div></div>
    </Section></GlassCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PHASE POSITION BARS (V5.2 â€” visuell, mit Remaining)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function PhasePositionBars({transData}){
  const positions=transData?.phase_positions||{};
  return(
    <GlassCard><Section title="Phase-Fortschritt â€” Wie weit ist jeder Zyklus?" defaultOpen={true}>
      <InfoToggle>0% = Phase hat gerade begonnen. 100% = Median-Dauer erreicht. Ãœber 100% = statistisch Ã¼berfÃ¤llig. Je weiter rechts, desto wahrscheinlicher der Phasenwechsel.</InfoToggle>
      <div className="space-y-2">{CYCLE_ORDER.filter(id=>id!=='POLITICAL').map(id=>{const pp=positions[id]||{};const pct=pp.phase_position_pct!=null?Math.min(pp.phase_position_pct,200):0;const displayPct=pp.phase_position_pct!=null&&pp.phase_position_pct>200?'(>200%)':pct+'%';const col=STATUS_COLORS[pp.status]||COLORS.fadedBlue;const barW=Math.min(pct/2,100);
        return(<div key={id} className="flex items-center gap-2"><span className="text-caption font-mono w-8 text-right" style={{color:COLORS.mutedBlue,fontSize:'9px'}}>{CYCLE_META[id]?.icon}</span><div className="flex-1 h-3 rounded-full overflow-hidden" style={{backgroundColor:'#0d1f38'}}><div style={{width:`${barW}%`,height:'100%',backgroundColor:col,borderRadius:'9999px',transition:'width 0.3s ease'}}/></div><span className="text-caption font-mono w-20 text-right" style={{color:col,fontSize:'9px'}}>{statusLabel(pp.status)} {displayPct}</span><span className="text-caption font-mono w-12 text-right" style={{color:COLORS.fadedBlue,fontSize:'9px'}}>{pp.remaining_median!=null?`~${pp.remaining_median}Mo`:''}</span></div>);
      })}</div>
    </Section></GlassCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CASCADE TIMELINE (V5.2 â€” wann kippte was)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CascadeTimeline({transData}){
  const cascade=transData?.cascade_speed?.current||{};const calibration=transData?.cascade_speed?.calibration||{};
  const transitioned=cascade.transitioned_cycles||[];const notYet=cascade.not_yet_transitioned||[];
  if(!transitioned.length)return null;
  return(
    <GlassCard><Section title="Kipp-Tempo â€” Historisch" defaultOpen={false}>
      <InfoToggle>Zeigt wann welcher Zyklus zuletzt von bullish/neutral nach bearish gewechselt hat. "Kipp-Tempo" misst wie schnell die Zyklen nacheinander kippen. HÃ¶heres Tempo = hÃ¶heres Risiko.</InfoToggle>
      <div className="space-y-1">{transitioned.map((t,i)=><div key={i} className="flex items-center justify-between px-3 py-1.5 rounded" style={{backgroundColor:`${COLORS.signalRed}08`,borderLeft:`2px solid ${COLORS.signalRed}`}}><span className="text-caption text-ice-white font-mono">{CYCLE_META[t.cycle]?.icon} {cycleName(t.cycle)}</span><span className="text-caption font-mono" style={{color:COLORS.signalRed}}>{t.month||'?'}</span></div>)}</div>
      {notYet.length>0&&<div className="mt-2 text-caption text-muted-blue" style={{fontSize:'9px'}}>Noch nicht gekippt: {notYet.map(c=>CYCLE_META[c]?.icon||c).join(' ')}</div>}
      <div className="mt-3 flex items-center gap-2"><span className="text-caption text-muted-blue" style={{fontSize:'9px'}}>Tempo:</span><span className="px-2 py-0.5 rounded text-caption font-mono" style={{backgroundColor:`${SEVERITY_COLORS[cascade.severity]||COLORS.fadedBlue}20`,color:SEVERITY_COLORS[cascade.severity]||COLORS.fadedBlue,fontSize:'10px'}}>{cascade.cascade_speed?.toFixed(2)||'?'} â€” {cascade.severity||'?'}</span></div>
      {Object.keys(calibration).length>0&&<div className="mt-2 space-y-1">{Object.entries(calibration).map(([k,v])=>v&&typeof v==='object'?<div key={k} className="flex items-center justify-between text-caption font-mono" style={{fontSize:'9px',color:COLORS.fadedBlue}}><span>{v.label||k}</span><span>V16 Growth: {v.v16_stays_growth_pct??'?'}% Â· SPY 6M: {v.avg_spy_6m!=null?fmtPct(v.avg_spy_6m):'?'}</span></div>:null)}</div>}
    </Section></GlassCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REGIME HEATMAP (V5.2 â€” Cluster Ã— Buckets, nur Cluster-Level)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function RegimeHeatmap({regimeData,condReturnsData}){
  const marginals=regimeData?.cluster_conditional_returns?.cluster_marginals||{};const baselines=condReturnsData?.baselines||{};
  const hasData=Object.keys(marginals).length>0;if(!hasData)return null;
  return(
    <GlassCard><Section title="Regime Heatmap â€” Was bedeuten die Cluster-Signale?" defaultOpen={true}>
      <InfoToggle>Zeigt die historische 6M-Rendite fÃ¼r jedes Asset wenn ein Cluster in einem bestimmten Zustand war (Bullish/Neutral/Bearish). GrÃ¼n = Ã¼berdurchschnittlich, Rot = unterdurchschnittlich. Nur signifikante Signale farbig.</InfoToggle>
      {CLUSTER_ORDER.map(clusterId=>{const cm=marginals[clusterId];if(!cm)return null;const bucketOrder=['BULLISH','NEUTRAL_MIXED','BEARISH'];
        return(<div key={clusterId} className="mb-4"><div className="flex items-center mb-2"><span className="text-sm font-mono text-ice-white">{CLUSTER_LABELS[clusterId]}</span><ClusterInfo clusterId={clusterId}/></div><div className="overflow-x-auto"><table className="w-full text-caption font-mono" style={{fontSize:'9px'}}><thead><tr><th className="text-left py-1 px-1 text-muted-blue">Asset</th>{bucketOrder.map(b=><th key={b} className="text-center py-1 px-1 text-muted-blue">{b==='BULLISH'?'Bull':b==='BEARISH'?'Bear':'Neutral'}</th>)}</tr></thead><tbody>{ALL_ASSETS_ORDERED.map(ticker=>{const bl6=baselines[ticker]?.baseline_6m;let anySignificant=false;const cells=bucketOrder.map(b=>{const d=cm[b]?.assets?.[ticker]?.['6m'];if(!d)return{val:null,sig:false};if(d.significant)anySignificant=true;return{val:d.avg_excess,sig:d.significant};});if(!anySignificant)return null;const isCrypto=CRYPTO_TICKERS.has(ticker);
          return(<tr key={ticker} className="border-t border-white/5"><td className="py-1 px-1 text-ice-white">{isCrypto?`${ticker} âš `:ticker}</td>{cells.map((c,i)=><td key={i} className="text-center py-1 px-1" style={{color:c.sig?excessColor(c.val):COLORS.fadedBlue,opacity:c.sig?1:0.4}}>{c.val!=null?fmtPct(c.val):'â€”'}</td>)}</tr>);
        })}</tbody></table></div></div>);
      })}
    </Section></GlassCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONDITIONAL RETURNS â€” StÃ¤rkste Signale (V5.2 â€” Top Assets)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function ConditionalReturnsChart({regimeData,condReturnsData}){
  const marginals=regimeData?.cluster_conditional_returns?.cluster_marginals||{};const baselines=condReturnsData?.baselines||{};
  const signals=[];
  for(const ck of CLUSTER_ORDER){const cm=marginals[ck]||{};for(const[bucket,bData]of Object.entries(cm)){if(!bData?.assets)continue;for(const[ticker,horizons]of Object.entries(bData.assets)){if(CRYPTO_TICKERS.has(ticker))continue;const d=horizons?.['6m'];if(!d||!d.significant)continue;const bl=baselines[ticker]?.baseline_6m;signals.push({ticker,cluster:CLUSTER_LABELS[ck],bucket,excess:d.avg_excess,total:bl!=null&&d.avg_excess!=null?bl+d.avg_excess:d.avg,baseline:bl,strength:d.signal_strength||0,n:d.n_independent||d.n||0,hitRate:d.hit_rate});}}}
  signals.sort((a,b)=>b.strength-a.strength);const top=signals.slice(0,10);
  if(top.length===0)return null;
  return(
    <GlassCard><Section title="StÃ¤rkste Signale â€” Top Assets" defaultOpen={true}>
      <InfoToggle>Die 10 stÃ¤rksten signifikanten Cluster-Signale fÃ¼r den 6M-Horizont. "Excess" = Rendite Ã¼ber dem historischen Durchschnitt. "Baseline" = was das Asset normalerweise bringt. Signal = |Excess|/SE â€” je hÃ¶her, desto belastbarer.</InfoToggle>
      <div className="space-y-1.5">{top.map((s,i)=><div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded" style={{backgroundColor:'#0d1f38',borderLeft:`3px solid ${excessColor(s.excess)}`}}><span className="text-sm font-mono font-bold" style={{color:COLORS.iceWhite,width:'40px'}}>{s.ticker}</span><div className="flex-1"><div className="text-caption font-mono" style={{fontSize:'9px',color:COLORS.mutedBlue}}>{s.cluster} Â· {s.bucket}</div></div><div className="text-right"><div className="font-mono text-sm" style={{color:excessColor(s.excess)}}>{fmtPct(s.excess)} <span style={{color:COLORS.fadedBlue,fontSize:'9px'}}>({fmtPct(s.baseline)} Baseline)</span></div><div className="text-caption font-mono" style={{fontSize:'9px',color:COLORS.fadedBlue}}>Signal: {s.strength?.toFixed(1)} Â· HR: {(s.hitRate*100)?.toFixed(0)}% Â· n={s.n}</div></div></div>)}</div>
    </Section></GlassCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// V16 TRANSITION BAR (V5.2 â€” Regime-StabilitÃ¤t)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function V16TransitionBar({regimeData}){
  const dual=regimeData?.v16_transition_probability?.by_dual_cluster||{};const credit=regimeData?.v16_transition_probability?.by_credit_cluster||{};
  const entries=[...Object.entries(dual),...Object.entries(credit)].filter(([,v])=>v&&typeof v==='object'&&v.n_months>0);
  if(entries.length===0)return null;
  return(
    <GlassCard><Section title="Regime-StabilitÃ¤t â€” Wie lange bleibt V16 im Normalmodus?" defaultOpen={false}>
      <InfoToggle>Misst die historische Wahrscheinlichkeit dass das Handelssystem (V16) im aktuellen Modus (GROWTH) bleibt, basierend auf den Cluster-ZustÃ¤nden. HÃ¶her = stabiler.</InfoToggle>
      <div className="space-y-2">{entries.map(([k,v],i)=>{const g3=v.v16_stays_growth_3m;const g6=v.v16_stays_growth_6m;const col=g6!=null?g6>0.7?COLORS.signalGreen:g6>0.4?COLORS.signalYellow:COLORS.signalRed:COLORS.fadedBlue;
        return(<div key={i} className="px-3 py-2 rounded" style={{backgroundColor:'#0d1f38',borderLeft:`3px solid ${col}`}}><div className="text-caption font-mono text-ice-white" style={{fontSize:'10px'}}>{k.replace(/_/g,' ')}</div><div className="flex gap-4 mt-1">{g3!=null&&<span className="text-caption font-mono" style={{color:COLORS.fadedBlue,fontSize:'9px'}}>3M: {(g3*100).toFixed(0)}%</span>}{g6!=null&&<span className="text-caption font-mono" style={{color:col,fontSize:'10px',fontWeight:600}}>6M: {(g6*100).toFixed(0)}%</span>}<span className="text-caption font-mono" style={{color:COLORS.fadedBlue,fontSize:'9px'}}>n={v.n_months}</span></div></div>);
      })}</div>
    </Section></GlassCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HISTORICAL ANALOGUES TIMELINE (V5.2 â€” horizontale Zeitachse)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function AnaloguesTimeline({regimeData}){
  const analogues=regimeData?.historical_analogues?.analogues||[];if(analogues.length===0)return null;
  return(
    <GlassCard><Section title="Historische Vergleiche â€” Wann sah es zuletzt so aus?" defaultOpen={false}>
      <InfoToggle>Findet historische Perioden die dem aktuellen Cluster-Zustand am Ã¤hnlichsten sind. "Was danach passierte" zeigt die 6M-Rendite von SPY, GLD und TLT.</InfoToggle>
      <div className="space-y-2">{analogues.map((a,i)=>{const sim=(a.similarity_score*100).toFixed(0);const whn=a.what_happened_next||{};
        return(<div key={i} className="px-3 py-2 rounded" style={{backgroundColor:'#0d1f38',borderLeft:`3px solid ${COLORS.baldurBlue||'#4A90D9'}`}}><div className="flex items-center justify-between"><span className="text-sm font-mono text-ice-white">{a.period_start}{a.episode_label?` â€” ${a.episode_label}`:''}</span><span className="text-caption font-mono px-1.5 py-0.5 rounded" style={{backgroundColor:'#1a3050',color:COLORS.baldurBlue||'#4A90D9',fontSize:'9px'}}>{sim}% Ã¤hnlich</span></div><div className="flex gap-3 mt-1 text-caption font-mono" style={{fontSize:'9px'}}>{whn.spy_6m_return!=null&&<span style={{color:whn.spy_6m_return>=0?COLORS.signalGreen:COLORS.signalRed}}>SPY: {fmtPct(whn.spy_6m_return)}</span>}{whn.gld_6m_return!=null&&<span style={{color:whn.gld_6m_return>=0?COLORS.signalGreen:COLORS.signalRed}}>GLD: {fmtPct(whn.gld_6m_return)}</span>}{whn.tlt_6m_return!=null&&<span style={{color:whn.tlt_6m_return>=0?COLORS.signalGreen:COLORS.signalRed}}>TLT: {fmtPct(whn.tlt_6m_return)}</span>}</div></div>);
      })}</div>
    </Section></GlassCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CRASH VS CORRECTION (V5.2 â€” Dual-State Analyse)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CrashVsCorrection({regimeData}){
  const cd=regimeData?.crash_vs_correction||{};const dualDD=cd.dual_state_drawdowns||{};const entryRules=cd.entry_rules||{};const cs=cd.current_state||{};
  const entries=Object.entries(dualDD).filter(([,v])=>v&&typeof v==='object'&&(v.n_months||v.n||v.spy_6m));
  if(entries.length===0)return null;
  return(
    <GlassCard><Section title="Crash oder Korrektur?" defaultOpen={true}>
      <InfoToggle>Credit UND Business negativ â†’ Crash (-25% bis -35%). Nur Credit negativ â†’ Korrektur (-8% bis -15%). Entry Zone = historisch gute Einstiegspunkte.</InfoToggle>
      {cs.dual_key&&<div className="text-caption px-3 py-2 rounded mb-3" style={{backgroundColor:'#0d1f38',border:'1px solid #1a3050',fontSize:'11px'}}><strong style={{color:COLORS.iceWhite}}>Aktuell:</strong> <span style={{color:COLORS.mutedBlue}}>{cs.implication||cs.dual_key}</span></div>}
      <div className="space-y-2">{entries.map(([k,v])=>{const r=entryRules[k]||{};const tc=r.type==='CRASH'?COLORS.signalRed:r.type==='CORRECTION'?COLORS.signalYellow:COLORS.signalOrange;const tl=r.type==='CRASH'?'Crash-Risiko':r.type==='CORRECTION'?'Korrektur':r.type==='CRASH_WITH_RECOVERY'?'Crash mit Recovery':r.type||'';
        return(<div key={k} className="px-3 py-2 rounded" style={{backgroundColor:'#0d1f38',borderLeft:`3px solid ${tc}`}}><div className="flex items-center justify-between mb-1"><span className="text-caption" style={{color:COLORS.iceWhite,fontSize:'10px'}}>{k.replace(/CREDIT_/g,'Credit ').replace(/BUSINESS_/g,'Business ').replace(/__/g,' + ')}</span>{r.type&&<span className="text-caption font-mono px-1.5 py-0.5 rounded" style={{backgroundColor:`${tc}20`,color:tc,fontSize:'9px'}}>{tl}</span>}</div><div className="text-caption font-mono" style={{fontSize:'10px',color:COLORS.mutedBlue}}>{v.spy_6m?.avg!=null&&<span>Ã˜ SPY 6M: {fmtPct(v.spy_6m.avg)} </span>}{v.spy_6m?.worst!=null&&<span style={{color:COLORS.signalRed}}>Worst: {fmtPct(v.spy_6m.worst)} </span>}<span style={{color:COLORS.fadedBlue}}>n={v.n_months||v.spy_6m?.n||'?'}</span></div>{r.entry_zone&&<div className="text-caption mt-1" style={{color:COLORS.fadedBlue,fontSize:'9px'}}>Einstieg ab: {r.entry_zone}</div>}</div>);
      })}</div>
    </Section></GlassCard>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CYCLE CARDS (V5.4 â€” Crossover-Filter + neutrale Legende)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

  // V5.4: Crossover points with minimum threshold filter
  // Only show crossovers where |smoothed - ma| exceeds 1% of |ma| after crossing
  const crossovers=[];
  for(let i=1;i<merged.length;i++){
    const prev=merged[i-1];const cur=merged[i];
    if(prev.smoothed!=null&&prev.ma!=null&&cur.smoothed!=null&&cur.ma!=null){
      const prevDiff=prev.smoothed-prev.ma;const curDiff=cur.smoothed-cur.ma;
      if(prevDiff*curDiff<0){
        // Sign changed â€” check minimum distance threshold
        const maAbs=Math.abs(cur.ma);
        const threshold=maAbs>0?maAbs*0.01:0.001; // 1% of MA value, fallback 0.001
        if(Math.abs(curDiff)>=threshold){
          crossovers.push({date:cur.date,value:cur.smoothed,goingUp:curDiff>0});
        }
      }
    }
  }

  // Direction arrow: smoothed velocity over last 3 months
  const smVals=merged.filter(d=>d.smoothed!=null);
  let dirLabel='â†’';let dirColor=COLORS.mutedBlue;
  if(smVals.length>=4){
    const last=smVals[smVals.length-1].smoothed;
    const prev3=smVals[smVals.length-4].smoothed;
    if(prev3&&prev3!==0){
      const vel=(last-prev3)/Math.abs(prev3);
      if(vel>0.005){dirLabel='â†—';dirColor=COLORS.signalGreen;}
      else if(vel<-0.005){dirLabel='â†˜';dirColor=COLORS.signalRed;}
      else{dirLabel='â†’';dirColor=COLORS.signalYellow;}
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
        {/* V5.4: Crossover dots â€” green=up, red=down (direction-matched) */}
        {crossovers.map((c,i)=><ReferenceDot key={`cx${i}`} x={c.date} y={c.value} r={3} fill={c.goingUp?COLORS.signalGreen:COLORS.signalRed} stroke={c.goingUp?COLORS.signalGreen:COLORS.signalRed} strokeWidth={1} ifOverflow="extendDomain"/>)}
        <Line type="monotone" dataKey="indicator" stroke={COLORS.iceWhite} strokeWidth={1} dot={false} name="Indikator" connectNulls strokeOpacity={0.5}/>
        <Line type="monotone" dataKey="smoothed" stroke={COLORS.baldurBlue||'#4A90D9'} strokeWidth={2} dot={false} name="GeglÃ¤ttet" connectNulls/>
        <Line type="monotone" dataKey="ma" stroke={COLORS.signalYellow} strokeWidth={1} dot={false} name="12M Ã˜" connectNulls strokeOpacity={0.6} strokeDasharray="4 4"/>
      </LineChart>
    </ResponsiveContainer>
    {/* Direction arrow badge */}
    <div className="flex items-center justify-between mt-1">
      <div className="flex gap-3 flex-wrap" style={{fontSize:'9px'}}>
        <span style={{color:COLORS.signalGreen}}>â–  Expansion</span>
        <span style={{color:COLORS.signalYellow}}>â–  Ãœbergang</span>
        <span style={{color:COLORS.signalRed}}>â–  Kontraktion</span>
        <span style={{color:COLORS.iceWhite,opacity:0.5}}>â€” Indikator</span>
        <span style={{color:COLORS.baldurBlue||'#4A90D9'}}>â€” GeglÃ¤ttet</span>
        <span style={{color:COLORS.signalYellow}}>-- 12M Ã˜</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{backgroundColor:`${dirColor}15`,border:`1px solid ${dirColor}30`}}>
        <span style={{color:dirColor,fontSize:'14px',lineHeight:1}}>{dirLabel}</span>
        <span style={{color:dirColor,fontSize:'9px',fontFamily:'monospace'}}>Trend</span>
      </div>
    </div>
    {/* V5.4: Neutral crossover legend â€” "aufwÃ¤rts/abwÃ¤rts" statt "Bullish/Bearish" */}
    {crossovers.length>0&&<div className="flex gap-3 mt-1" style={{fontSize:'9px'}}>
      <span style={{color:COLORS.signalGreen}}>â— Kreuzung aufwÃ¤rts</span>
      <span style={{color:COLORS.signalRed}}>â— Kreuzung abwÃ¤rts</span>
    </div>}
  </div>);
}

function CycleExplanation({cycleId,phaseData,transData}){
  const meta=CYCLE_META[cycleId]||{};const pp=transData?.phase_positions?.[cycleId]||{};const phase=phaseData?.phase||'UNKNOWN';
  const transitions=pp.transitions_ahead||{};let nextPhase=null,nextProb=0;
  for(const[ph,data]of Object.entries(transitions)){const prob=data?.probability||data||0;if(prob>nextProb){nextPhase=ph;nextProb=prob;}}
  const st=pp.status==='EXTENDED'?'Die Phase dauert lÃ¤nger als Ã¼blich â€” ein Wechsel wird zunehmend wahrscheinlich.':pp.status==='LATE_PHASE'?'Die Phase nÃ¤hert sich dem Ende. NÃ¤chste Phase vorbereiten.':pp.status==='MID_PHASE'?'Phase etwa zur HÃ¤lfte durch. Kein unmittelbarer Handlungsbedarf.':pp.status==='EARLY_PHASE'?'Phase hat erst kÃ¼rzlich begonnen. Signal ist frisch.':'';
  return(<div className="mt-3 px-3 py-2 rounded" style={{backgroundColor:'#0d1f38',fontSize:'11px',lineHeight:'1.6',color:COLORS.mutedBlue}}><div className="mb-2">{meta.desc}</div><div className="mb-1"><strong style={{color:COLORS.iceWhite}}>Aktuell:</strong> {phaseLabel(phase)} bei {pp.phase_position_pct!=null?Math.min(pp.phase_position_pct,200):'?'}% Fortschritt{pp.remaining_median!=null&&<> â€” noch ~{pp.remaining_median} Monate bis zum Wechsel</>}.</div>{st&&<div className="mb-1">{st}</div>}{nextPhase&&nextProb>0&&<div><strong style={{color:COLORS.iceWhite}}>NÃ¤chste Phase:</strong> wahrscheinlich {phaseLabel(nextPhase)} ({typeof nextProb==='number'&&nextProb<=1?(nextProb*100).toFixed(0):nextProb}%).</div>}</div>);
}

function CycleCard({cycleId,phaseData,chartData,transData}){
  const[open,setOpen]=useState(false);const meta=CYCLE_META[cycleId]||{};const pp=transData?.phase_positions?.[cycleId]||{};
  const phase=phaseData?.phase||'UNKNOWN';const phaseCol=CYCLE_PHASE_COLORS[phase]||COLORS.fadedBlue;const tierCol=CYCLE_TIER_COLORS[`tier${meta.tier}`]||COLORS.fadedBlue;
  const conf=phaseData?.confidence;const indVal=phaseData?.indicator_value;const vel=phaseData?.velocity;
  const position=pp.phase_position_pct;const displayPos=position!=null?position>200?'(>200%)':Math.min(position,200)+'%':null;
  const inDanger=phaseData?.danger_zone?.currently_in_zone;const alCol=phaseData?.v16_alignment==='ALIGNED'?COLORS.signalGreen:phaseData?.v16_alignment==='DIVERGED'?COLORS.signalRed:COLORS.fadedBlue;

  return(
    <div className="mb-3 rounded-lg overflow-hidden" style={{backgroundColor:'#0d1f38',border:`1px solid ${tierCol}30`}}>
      <button onClick={()=>setOpen(!open)} className="w-full px-3 py-2 flex items-center justify-between" style={{borderLeft:`4px solid ${phaseCol}`}}>
        <div className="flex items-center gap-2"><span style={{fontSize:'18px'}}>{meta.icon}</span><div className="text-left"><div className="text-sm font-mono text-ice-white">{meta.name} <span className="text-caption px-1.5 py-0.5 rounded ml-1" style={{backgroundColor:`${tierCol}20`,color:tierCol,fontSize:'9px'}}>T{meta.tier}</span></div><div className="text-caption font-mono" style={{color:phaseCol}}>{phaseLabel(phase)}</div></div></div>
        <div className="flex items-center gap-2"><span className="text-caption font-mono" style={{color:alCol}}>{phaseData?.v16_alignment==='ALIGNED'?'âœ“':phaseData?.v16_alignment==='DIVERGED'?'âœ—':'Â·'}</span>{pp.status&&<span className="text-caption font-mono" style={{color:STATUS_COLORS[pp.status]||COLORS.fadedBlue,fontSize:'9px'}}>{statusLabel(pp.status)} {displayPos}{pp.remaining_median!=null?` Â· ~${pp.remaining_median}Mo`:''}</span>}<span className="text-caption text-muted-blue">{open?'â–¾':'â–¸'}</span></div>
      </button>
      {open&&<div className="px-3 pb-3">
        {indVal!=null&&<div className="flex items-center justify-between text-caption font-mono mt-2" style={{fontSize:'10px'}}><span style={{color:COLORS.mutedBlue}}>{meta.indicator}: {fmtVal(indVal,meta.unit)}<span style={{color:velColor(vel)}}>{velArrow(vel)}</span></span><span style={{color:COLORS.fadedBlue}}>{conf!=null?`${conf}%`:''}</span></div>}
        {phaseData?.danger_zone?.zone_name&&<div className="text-caption mt-1 px-2 py-1 rounded" style={{backgroundColor:inDanger?`${COLORS.signalRed}15`:`${COLORS.signalOrange}10`,color:inDanger?COLORS.signalRed:COLORS.signalOrange}}>{inDanger?'âš  IN ZONE: ':'â†’ '}{phaseData.danger_zone.zone_name}</div>}
        {cycleId!=='POLITICAL'&&<PhaseLifecycleChart chartData={chartData}/>}
        {cycleId==='POLITICAL'&&<PoliticalChart/>}
        <CycleExplanation cycleId={cycleId} phaseData={phaseData} transData={transData}/>
      </div>}
    </div>
  );
}

function PoliticalChart(){
  const yr=new Date().getFullYear();const data=[];for(let y=yr-12;y<=yr+4;y++){const cy=((y-2025)%4+4)%4+1;data.push({date:String(y),value:{1:6.5,2:4.2,3:16.3,4:7.5}[cy]});}
  return(<div className="mt-3"><ResponsiveContainer width="100%" height={150}><LineChart data={data} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke="#1a2a44"/><XAxis dataKey="date" tick={{fill:COLORS.mutedBlue,fontSize:10}} interval={1}/><YAxis tick={{fill:COLORS.mutedBlue,fontSize:10}} tickFormatter={v=>`${v}%`}/><Tooltip content={<ChartTooltip/>}/><ReferenceLine x={String(yr)} stroke={COLORS.iceWhite} strokeDasharray="4 4" strokeWidth={1.5} label={{value:'JETZT',fill:COLORS.iceWhite,fontSize:10,position:'top'}}/><Line type="monotone" dataKey="value" stroke={COLORS.signalYellow} strokeWidth={2} dot={{r:3,fill:COLORS.signalYellow}} name="Ã˜ Return %"/></LineChart></ResponsiveContainer></div>);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// NARRATIVE (V5.2 â€” kein "KI")
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function CycleNarrative({transData}){
  const n=transData?.cycle_narrative;if(!n?.text)return null;
  return(<GlassCard><Section title="Zyklen-Analyse" defaultOpen={true}><InfoToggle>WÃ¶chentliche Zusammenfassung aller Zyklen-Berechnungen. Destilliert Phase Positions, Cascade Speed, V16 Transition und historische Analogien in eine verstÃ¤ndliche EinschÃ¤tzung.</InfoToggle><div className="px-4 py-3 rounded" style={{backgroundColor:'#0d1f38',borderLeft:`3px solid ${COLORS.baldurBlue||'#4A90D9'}`}}><div className="text-sm text-ice-white" style={{lineHeight:'1.7',whiteSpace:'pre-line'}}>{n.text}</div><div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10"><span className="text-caption text-muted-blue font-mono" style={{fontSize:'9px'}}>{n.word_count} WÃ¶rter</span><span className="text-caption text-muted-blue font-mono" style={{fontSize:'9px'}}>{n.generated_at?new Date(n.generated_at).toLocaleString('de-DE'):''}</span></div></div></Section></GlassCard>);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
        <div className="flex items-center justify-between mb-4"><span className="text-label uppercase tracking-wider text-muted-blue">ðŸ”„ Cycle Alignment Dashboard</span><span className="text-caption text-muted-blue">{cy.date}</span></div>
        <div className="flex items-center justify-between mb-4"><div><span className="text-4xl font-mono font-bold" style={{color:labelColor}}>{score}</span><span className="text-xl text-muted-blue font-mono">/10</span><span className="ml-3 px-2 py-1 rounded text-sm font-semibold" style={{backgroundColor:`${labelColor}20`,color:labelColor}}>{label}</span></div><div className="text-right"><div className="text-caption text-muted-blue">V16 Regime</div><div className="text-sm font-mono text-ice-white">{cy.current_regime||'â€”'}</div></div></div>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">{cy.bullish>0&&<div style={{flex:cy.bullish,backgroundColor:COLORS.signalGreen}}/>}{cy.neutral>0&&<div style={{flex:cy.neutral,backgroundColor:COLORS.fadedBlue}}/>}{cy.bearish>0&&<div style={{flex:cy.bearish,backgroundColor:COLORS.signalRed}}/>}</div>
        <div className="flex justify-between text-caption"><span style={{color:COLORS.signalGreen}}>â— {cy.bullish||0} Bullish</span><span style={{color:COLORS.fadedBlue}}>â— {cy.neutral||0} Neutral</span><span style={{color:COLORS.signalRed}}>â— {cy.bearish||0} Bearish</span></div>
        {dzCount>0&&<div className="mt-3 px-3 py-2 rounded text-sm" style={{backgroundColor:`${COLORS.signalOrange}15`,color:COLORS.signalOrange}}>âš  {dzCount} Danger Zone{dzCount>1?'s':''} aktiv</div>}
        {cy.one_liner&&<div className="mt-3 text-caption text-muted-blue font-mono">{cy.one_liner}</div>}
        {loading&&<div className="mt-2 text-caption text-muted-blue">Lade Daten...</div>}
        {error&&<div className="mt-2 text-caption" style={{color:COLORS.signalOrange}}>Fehler: {error}</div>}
      </GlassCard>

      {transData&&<ExecutiveSummary transData={transData} regimeData={regimeData} condReturnsData={condReturnsData}/>}
            {transData&&<CascadeChain transData={transData}/>}
      {transData&&<PhasePositionBars transData={transData}/>}
      {transData&&<CascadeTimeline transData={transData}/>}
      {regimeData&&<RegimeHeatmap regimeData={regimeData} condReturnsData={condReturnsData}/>}
      {regimeData&&<ConditionalReturnsChart regimeData={regimeData} condReturnsData={condReturnsData}/>}
      {regimeData&&<V16TransitionBar regimeData={regimeData}/>}
      {regimeData&&<AnaloguesTimeline regimeData={regimeData}/>}
      {regimeData&&<CrashVsCorrection regimeData={regimeData}/>}

      <GlassCard><Section title="Tier 1 â€” Strukturelle Zyklen" defaultOpen={true}>{CYCLE_ORDER.filter(id=>CYCLE_META[id]?.tier===1).map(id=><CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} transData={transData}/>)}</Section></GlassCard>
      <GlassCard><Section title="Tier 2 â€” Zyklische Indikatoren" defaultOpen={true}>{CYCLE_ORDER.filter(id=>CYCLE_META[id]?.tier===2).map(id=><CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} transData={transData}/>)}</Section></GlassCard>
      <GlassCard><Section title="Tier 3 â€” ErgÃ¤nzende Indikatoren" defaultOpen={true}>{CYCLE_ORDER.filter(id=>CYCLE_META[id]?.tier===3).map(id=><CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} transData={transData}/>)}</Section></GlassCard>

      {transData&&<CycleNarrative transData={transData}/>}

      <GlassCard><Section title="V16 Alignment â€” Stimmen die Zyklen mit dem Handelssystem Ã¼berein?" defaultOpen={false}>
        <InfoToggle>âœ… = Zyklus bestÃ¤tigt V16. âŒ = Zyklus widerspricht V16. Wenn viele divergieren, steigt das Risiko dass V16 den Modus wechselt.</InfoToggle>
        <div className="space-y-1">{CYCLE_ORDER.map(id=>{const cp=phases[id]||{};const al=cp.v16_alignment||'NEUTRAL';const ph=cp.phase||'UNKNOWN';const pc=CYCLE_PHASE_COLORS[ph]||COLORS.fadedBlue;
          return(<div key={id} className="flex items-center justify-between py-1 border-b border-white/5"><span className="text-caption text-ice-white font-mono">{CYCLE_META[id]?.icon} {cycleName(id).split(' ')[0]}</span><span className="text-caption font-mono" style={{color:pc}}>{phaseLabel(ph)}</span><span className="text-caption" style={{color:al==='ALIGNED'?COLORS.signalGreen:al==='DIVERGED'?COLORS.signalRed:COLORS.mutedBlue}}>{al==='ALIGNED'?'âœ… BestÃ¤tigt':al==='DIVERGED'?'âŒ Widerspricht':'âž– Neutral'}</span></div>);
        })}</div>
      </Section></GlassCard>
    </div>
  );
}
