import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import './AssetsFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

// ── Performance table data ──
const ASSET_DATA = [
    { class:"Eq",     name:"S&P 500",     mark:5123.4, d1:1.2,   w1:2.5,   m1:4.8,   ytd:10.5, vol:15.2 },
    { class:"Eq",     name:"NASDAQ",      mark:16234.1,d1:1.5,   w1:3.1,   m1:6.2,   ytd:12.8, vol:18.5 },
    { class:"Eq",     name:"Euro Stoxx",  mark:4201,   d1:-0.15, w1:-0.8,  m1:2.1,   ytd:5.2,  vol:14.8 },
    { class:"Eq",     name:"Nikkei 225",  mark:39500,  d1:-0.4,  w1:-1.2,  m1:8.5,   ytd:18.2, vol:16.0 },
    { class:"Eq",     name:"FTSE 100",    mark:7820,   d1:0.3,   w1:0.8,   m1:1.2,   ytd:3.1,  vol:12.5 },
    { class:"FX",     name:"EUR/USD",     mark:1.0850, d1:0.2,   w1:-0.5,  m1:-1.2,  ytd:-2.5, vol:6.5 },
    { class:"FX",     name:"USD/JPY",     mark:149.38, d1:0.4,   w1:1.2,   m1:2.5,   ytd:5.8,  vol:8.2 },
    { class:"FX",     name:"GBP/USD",     mark:1.2618, d1:0.13,  w1:0.6,   m1:-0.5,  ytd:1.2,  vol:7.1 },
    { class:"FX",     name:"DXY",         mark:103.45, d1:-0.2,  w1:0.8,   m1:1.5,   ytd:2.8,  vol:6.0 },
    { class:"Cmdty",  name:"WTI Crude",   mark:78.34,  d1:0.8,   w1:4.2,   m1:8.5,   ytd:15.2, vol:24.5 },
    { class:"Cmdty",  name:"Gold",        mark:2038.5, d1:0.3,   w1:2.1,   m1:5.4,   ytd:6.8,  vol:12.0 },
    { class:"Cmdty",  name:"Wheat",       mark:580.5,  d1:-1.2,  w1:-2.5,  m1:-4.1,  ytd:-8.2, vol:22.1 },
    { class:"Cmdty",  name:"Copper",      mark:4.10,   d1:-0.5,  w1:1.8,   m1:6.2,   ytd:8.5,  vol:19.5 },
    { class:"Rates",  name:"US 10Y",      mark:4.248,  d1:-3.0,  w1:8.0,   m1:-10.0, ytd:35.0, vol:25.0 },
    { class:"Rates",  name:"US 2Y",       mark:4.895,  d1:-2.0,  w1:5.0,   m1:-8.0,  ytd:28.0, vol:20.0 },
    { class:"Crypto", name:"Bitcoin",     mark:64180,  d1:2.5,   w1:12.4,  m1:45.2,  ytd:65.8, vol:55.0 },
    { class:"Crypto", name:"Ethereum",    mark:3281,   d1:2.2,   w1:9.8,   m1:38.4,  ytd:52.4, vol:62.0 },
];

// ── Equity Sector Heatmap data ──
const SECTORS = [
    { name:"Technology",    ytd:18.4, d1:1.8,  mktCap:"$15.2T", leader:"NVDA +210%" },
    { name:"Healthcare",    ytd:5.2,  d1:0.4,  mktCap:"$8.1T",  leader:"LLY +68%" },
    { name:"Financials",    ytd:12.1, d1:1.1,  mktCap:"$9.8T",  leader:"JPM +24%" },
    { name:"Energy",        ytd:14.8, d1:0.9,  mktCap:"$4.2T",  leader:"XOM +18%" },
    { name:"Consumer Disc", ytd:8.6,  d1:0.7,  mktCap:"$6.4T",  leader:"AMZN +22%" },
    { name:"Industrials",   ytd:11.2, d1:0.6,  mktCap:"$5.1T",  leader:"GE +88%" },
    { name:"Materials",     ytd:7.4,  d1:0.3,  mktCap:"$2.4T",  leader:"NEM +15%" },
    { name:"Utilities",     ytd:-4.2, d1:-0.3, mktCap:"$1.6T",  leader:"NEE -8%" },
    { name:"Real Estate",   ytd:-6.8, d1:-0.5, mktCap:"$1.2T",  leader:"AMT -12%" },
    { name:"Comm Services", ytd:16.2, d1:1.4,  mktCap:"$5.8T",  leader:"META +48%" },
    { name:"Consumer Stap", ytd:2.1,  d1:0.1,  mktCap:"$4.2T",  leader:"PG +4%" },
];

// ── Correlation matrix ──
const CORR_ASSETS = ['SPX','DXY','GOLD','OIL','BTC','US10Y','EUR'];
const CORR_MATRIX = [
// SPX   DXY    GOLD  OIL   BTC   US10Y  EUR
  [1.00, -0.65, -0.12, 0.42,  0.68, -0.58,  0.55],  // SPX
  [-0.65, 1.00, -0.52,-0.38, -0.48,  0.45, -0.88],  // DXY
  [-0.12,-0.52,  1.00, 0.28,  0.22, -0.15,  0.42],  // GOLD
  [0.42, -0.38,  0.28, 1.00,  0.35, -0.28,  0.30],  // OIL
  [0.68, -0.48,  0.22, 0.35,  1.00, -0.44,  0.40],  // BTC
  [-0.58, 0.45, -0.15,-0.28, -0.44,  1.00, -0.40],  // US10Y
  [0.55, -0.88,  0.42, 0.30,  0.40, -0.40,  1.00],  // EUR
];

const ColorMap = (val: number) => {
    if (val >  5) return { bg: 'rgba(0,230,118,0.2)', color: '#00e676' };
    if (val >  0) return { bg: 'transparent',          color: '#00e676' };
    if (val < -5) return { bg: 'rgba(255,61,87,0.2)',  color: '#ff3d57' };
    if (val <  0) return { bg: 'transparent',          color: '#ff3d57' };
    return { bg: 'transparent', color: 'var(--bb-text-dim)' };
};

export default function AssetsFullScreen() {
    const { setActiveView } = useTerminal();
    const [filter, setFilter] = useState("ALL");
    const [activeTab, setActiveTab] = useState<"performance" | "correlation" | "sectors">("performance");
    const chartRefBar     = useRef<HTMLDivElement>(null);
    const chartRefScatter = useRef<HTMLDivElement>(null);
    const chartRefCorr    = useRef<HTMLDivElement>(null);

    const filteredData = filter === "ALL" ? ASSET_DATA : ASSET_DATA.filter(d => d.class === filter);

    // ── Performance charts ──
    useEffect(() => {
        if (activeTab !== 'performance' || !chartRefBar.current || !chartRefScatter.current) return;
        const chartBar     = echarts.init(chartRefBar.current);
        const chartScatter = echarts.init(chartRefScatter.current);
        const sorted = [...filteredData].sort((a, b) => a.ytd - b.ytd);

        chartBar.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            grid: { left: '3%', right: '12%', bottom: '5%', top: '8%', containLabel: true },
            xAxis: { type: 'value', axisLine: { lineStyle: { color: '#163344' } }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } }, axisLabel: { color: '#5c8397', formatter: '{value}%' } },
            yAxis: { type: 'category', data: sorted.map(d => d.name), axisLine: { lineStyle: { color: '#163344' } }, axisLabel: { color: '#5c8397', fontWeight: 700, fontSize: 10 } },
            series: [{ type: 'bar', barMaxWidth: 18,
                data: sorted.map(d => ({ value: d.ytd, itemStyle: { color: d.ytd > 0 ? '#00e676' : '#ff3d57', borderRadius: d.ytd > 0 ? [0,3,3,0] : [3,0,0,3] } })),
                label: { show: true, position: 'right', color: '#8caebf', formatter: (p: any) => `${p.value > 0 ? '+' : ''}${p.value}%`, fontSize: 10 } }],
        });

        chartScatter.setOption({
            backgroundColor: 'transparent',
            tooltip: { formatter: (p: any) => `<b>${p.data.name}</b><br>Vol: ${p.data.value[0]}%<br>YTD: ${p.data.value[1]}%`, backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            grid: { left: '12%', right: '8%', bottom: '18%', top: '12%' },
            xAxis: { type: 'value', name: 'Implied Volatility (Ann. %)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: '#5c8397' }, axisLine: { lineStyle: { color: '#163344' } }, splitLine: { show: false }, axisLabel: { color: '#5c8397' } },
            yAxis: { type: 'value', name: 'YTD Return (%)', nameLocation: 'middle', nameGap: 38, nameTextStyle: { color: '#5c8397' }, axisLine: { lineStyle: { color: '#163344' } }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } }, axisLabel: { color: '#5c8397', formatter: '{value}%' } },
            series: [{ type: 'scatter', symbolSize: 14,
                data: filteredData.map(d => ({ name: d.name, value: [d.vol, d.ytd], itemStyle: { color: d.ytd > 0 ? '#00b8e0' : '#ff9f1c', opacity: 0.85, shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.5)' } })),
                label: { show: true, formatter: '{b}', position: 'top', color: '#8caebf', fontSize: 9 } }],
        });

        const resize = () => { chartBar.resize(); chartScatter.resize(); };
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chartBar.dispose(); chartScatter.dispose(); };
    }, [filteredData, activeTab]);

    // ── Correlation Matrix heatmap ──
    useEffect(() => {
        if (activeTab !== 'correlation' || !chartRefCorr.current) return;
        const chart = echarts.init(chartRefCorr.current);
        const flatData: [number, number, number][] = [];
        CORR_MATRIX.forEach((row, r) => row.forEach((val, c) => flatData.push([c, r, val])));

        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { formatter: (p: any) => {
                const val = (p.data[2] as number).toFixed(2);
                return `${CORR_ASSETS[p.data[1]]} ↔ ${CORR_ASSETS[p.data[0]]}: <b>${val}</b>`;
            }, backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            grid: { left: '12%', right: '5%', bottom: '12%', top: '8%' },
            xAxis: { type: 'category', data: CORR_ASSETS, axisLabel: { color: '#5c8397', fontWeight: 700 }, axisLine: { lineStyle: { color: '#163344' } }, splitLine: { show: false } },
            yAxis: { type: 'category', data: CORR_ASSETS, axisLabel: { color: '#5c8397', fontWeight: 700 }, axisLine: { lineStyle: { color: '#163344' } }, splitLine: { show: false } },
            visualMap: { min: -1, max: 1, calculable: false, orient: 'horizontal', left: 'center', bottom: '0%', textStyle: { color: '#5c8397', fontSize: 9 },
                inRange: { color: ['#ff3d57','#0a1e2a','#00e676'] }, itemWidth: 15, itemHeight: 10 },
            series: [{
                type: 'heatmap', data: flatData,
                label: { show: true, color: '#fff', fontSize: 11, fontWeight: 700, formatter: (p: any) => (p.data[2] as number).toFixed(2) },
                emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
            }],
        });

        const resize = () => chart.resize();
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chart.dispose(); };
    }, [activeTab]);

    return (
        <div className="assets-fs-container macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">CROSS-ASSET INTELLIGENCE MATRIX</h1>
                    <div className="macro-fs-subtitle">PERFORMANCE · INTER-ASSET CORRELATIONS · EQUITY SECTORS · {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE</button>
            </div>

            {/* ── Tab Bar ── */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--bb-teal-border)', background: 'rgba(2,8,14,0.8)', flexShrink: 0 }}>
                {[
                    { id: 'performance',  label: 'PERFORMANCE & RISK-RETURN' },
                    { id: 'correlation',  label: 'INTER-ASSET CORRELATIONS' },
                    { id: 'sectors',      label: 'EQUITY SECTOR HEATMAP' },
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
                        padding: '9px 18px', background: 'transparent', border: 'none',
                        borderBottom: activeTab === t.id ? '2px solid var(--bb-amber)' : '2px solid transparent',
                        color: activeTab === t.id ? 'var(--bb-amber)' : 'var(--bb-text-dim)',
                        fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.15s',
                    }}>{t.label}</button>
                ))}
            </div>

            {/* ── TAB 1: Performance ── */}
            {activeTab === 'performance' && (
                <div className="assets-fs-content">
                    <div className="a-col-table">
                        <div className="a-table-header">
                            <div className="a-table-title">ASSET UNIVERSE — BUILDING BLOCKS</div>
                            <div className="a-filters">
                                {['ALL','Eq','FX','Cmdty','Crypto','Rates'].map(f => (
                                    <button key={f} className={`a-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                                        {f === 'Eq' ? 'EQUITIES' : f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="a-table-body">
                            <table className="a-table">
                                <thead>
                                    <tr>
                                        <th>ASSET</th><th>MARK</th>
                                        <th>1D</th><th>1W</th><th>1M</th><th>YTD</th><th>VOL (ann.)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((d, i) => {
                                        const c1=ColorMap(d.d1), cW=ColorMap(d.w1), cM=ColorMap(d.m1), cY=ColorMap(d.ytd);
                                        return (
                                            <tr key={i}>
                                                <td className="asset-name">{d.name} <span style={{ fontSize:'9px', color:'var(--bb-text-dim)', marginLeft:'6px' }}>{d.class}</span></td>
                                                <td style={{ fontFamily:'var(--font-mono)' }}>{d.mark.toLocaleString(undefined,{minimumFractionDigits: d.class==='FX'?4:1})}</td>
                                                <td><div className="a-heat-cell" style={{color:c1.color,background:c1.bg}}>{d.d1>0?'+':''}{d.d1}%</div></td>
                                                <td><div className="a-heat-cell" style={{color:cW.color,background:cW.bg}}>{d.w1>0?'+':''}{d.w1}%</div></td>
                                                <td><div className="a-heat-cell" style={{color:cM.color,background:cM.bg}}>{d.m1>0?'+':''}{d.m1}%</div></td>
                                                <td><div className="a-heat-cell" style={{color:cY.color,background:cY.bg}}>{d.ytd>0?'+':''}{d.ytd}%</div></td>
                                                <td style={{color:'var(--bb-amber)',fontFamily:'var(--font-mono)'}}>{d.vol.toFixed(1)}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="a-col-charts">
                        <div className="a-chart-box">
                            <div style={{ fontSize:'9px', fontWeight:800, color:'var(--bb-blue)', letterSpacing:'0.1em', padding:'6px 8px 2px' }}>YTD PERFORMANCE RANKING</div>
                            <div ref={chartRefBar} style={{ width:'100%', height:'calc(100% - 26px)' }} />
                        </div>
                        <div className="a-chart-box">
                            <div style={{ fontSize:'9px', fontWeight:800, color:'var(--bb-blue)', letterSpacing:'0.1em', padding:'6px 8px 2px' }}>RISK vs RETURN (VOL vs YTD)</div>
                            <div ref={chartRefScatter} style={{ width:'100%', height:'calc(100% - 26px)' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 2: Correlation Matrix ── */}
            {activeTab === 'correlation' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '12px', gap: '10px' }}>
                    {/* Legend row */}
                    <div style={{ display:'flex', gap:'16px', flexShrink:0 }}>
                        {[
                            { label:'Strong +Corr (>0.6)',  color:'#00e676', bg:'rgba(0,230,118,0.1)' },
                            { label:'Weak Corr (0 to 0.3)', color:'#5c8397', bg:'transparent' },
                            { label:'Strong -Corr (<-0.6)', color:'#ff3d57', bg:'rgba(255,61,87,0.1)' },
                        ].map(l => (
                            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'4px 10px', border:`1px solid ${l.color}33`, borderRadius:'3px', background:l.bg }}>
                                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:l.color }} />
                                <span style={{ fontSize:'9px', color:'var(--bb-text-dim)', letterSpacing:'0.06em' }}>{l.label}</span>
                            </div>
                        ))}
                        <div style={{ marginLeft:'auto', fontSize:'9px', color:'var(--bb-text-dim)', display:'flex', alignItems:'center', gap:'6px' }}>
                            <span>KEY INSIGHT:</span>
                            <span style={{ color:'var(--bb-amber)', fontWeight:800 }}>USD ↔ EUR: -0.88</span>
                            <span style={{ color:'var(--bb-text-dim)' }}>|</span>
                            <span style={{ color:'var(--bb-blue)', fontWeight:800 }}>SPX ↔ BTC: +0.68</span>
                        </div>
                    </div>
                    {/* Main correlation heatmap */}
                    <div style={{ flex:1, minHeight:0, background:'rgba(8,22,30,0.6)', border:'1px solid var(--bb-teal-border)', borderRadius:'3px', padding:'8px' }}>
                        <div style={{ fontSize:'9px', fontWeight:800, color:'var(--bb-blue)', letterSpacing:'0.1em', marginBottom:'4px' }}>
                            INTER-ASSET CORRELATION MATRIX — 90D ROLLING
                        </div>
                        <div ref={chartRefCorr} style={{ width:'100%', height:'calc(100% - 24px)' }} />
                    </div>
                    {/* Interpretation */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', flexShrink:0 }}>
                        {[
                            { title:'RISK-ON BASKET', items:['SPX + BTC: +0.68 (strong co-move)', 'EUR + SPX: +0.55 (pro-cyclical EUR)', 'OIL + SPX: +0.42 (growth proxy)'] },
                            { title:'SAFE HAVEN BASKET', items:['GOLD ↔ DXY: -0.52 (inverse)', 'US10Y ↔ SPX: -0.58 (flight-to-quality)', 'GOLD ↔ EUR: +0.42 (both vs USD)'] },
                            { title:'TRADING IMPLICATIONS', items:['USD strength → Risk-Off everywhere', 'BTC leads Equity risk appetite', 'Gold = partial SPX hedge only'] },
                        ].map(b => (
                            <div key={b.title} style={{ padding:'10px 12px', background:'rgba(8,22,30,0.6)', border:'1px solid var(--bb-teal-border)', borderRadius:'3px', borderLeft:'3px solid var(--bb-blue)' }}>
                                <div style={{ fontSize:'8px', fontWeight:800, color:'var(--bb-blue)', letterSpacing:'0.1em', marginBottom:'6px' }}>{b.title}</div>
                                {b.items.map((it,i) => <div key={i} style={{ fontSize:'10px', color:'var(--bb-text-dim)', marginBottom:'3px', lineHeight:1.4 }}>• {it}</div>)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TAB 3: Equity Sector Heatmap ── */}
            {activeTab === 'sectors' && (
                <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'12px', gap:'10px', overflow:'hidden' }}>
                    <div style={{ fontSize:'9px', fontWeight:800, color:'var(--bb-text-dim)', letterSpacing:'0.1em', flexShrink:0, display:'flex', alignItems:'center', gap:'12px' }}>
                        <span>S&P 500 SECTOR WEIGHTS — YTD vs 1D PERFORMANCE</span>
                        <span style={{ color:'var(--bb-green)', borderLeft:'3px solid var(--bb-green)', paddingLeft:'8px' }}>GREEN = OUTPERFORM</span>
                        <span style={{ color:'var(--bb-red)', borderLeft:'3px solid var(--bb-red)', paddingLeft:'8px' }}>RED = UNDERPERFORM</span>
                    </div>
                    <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gridTemplateRows:'repeat(3,1fr)', gap:'6px', minHeight:0 }}>
                        {SECTORS.map((s) => {
                            const isPos = s.ytd >= 0;
                            const intensity = Math.min(Math.abs(s.ytd) / 20, 1);
                            const bg = isPos
                                ? `rgba(0,230,118,${0.05 + intensity * 0.2})`
                                : `rgba(255,61,87,${0.05 + intensity * 0.2})`;
                            const border = isPos ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,87,0.3)';
                            return (
                                <div key={s.name} style={{ background:bg, border:`1px solid ${border}`, borderRadius:'3px', padding:'12px', display:'flex', flexDirection:'column', justifyContent:'space-between', cursor:'pointer', transition:'all 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                >
                                    <div style={{ fontSize:'10px', fontWeight:800, color:'var(--bb-text)', marginBottom:'4px' }}>{s.name}</div>
                                    <div style={{ fontSize:'22px', fontWeight:900, fontFamily:'var(--font-mono)', color: isPos ? '#00e676' : '#ff3d57', lineHeight:1 }}>
                                        {s.ytd > 0 ? '+' : ''}{s.ytd}%
                                    </div>
                                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                                        <span style={{ fontSize:'9px', color: s.d1 >= 0 ? '#00e676' : '#ff3d57', fontFamily:'var(--font-mono)' }}>
                                            1D: {s.d1 > 0 ? '+' : ''}{s.d1}%
                                        </span>
                                        <span style={{ fontSize:'8px', color:'var(--bb-text-dim)' }}>{s.mktCap}</span>
                                    </div>
                                    <div style={{ fontSize:'8px', color:'var(--bb-amber)', marginTop:'3px', letterSpacing:'0.04em' }}>↑ {s.leader}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
