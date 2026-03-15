import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import './MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCommandBarStats } from '../../hooks/useCommandBarStats';

const MACRO_COUNTRIES: Record<string, any> = {
    "USD": {
        name: "United States",
        gdpHistory:  [2.1, 2.4, 4.9, 3.4, 3.2],
        cpiHistory:  [3.7, 3.2, 3.1, 3.4, 3.1],
        rateHistory: [5.0, 5.25, 5.5, 5.5, 5.5],
        m2History:   [20.8, 20.6, 20.7, 20.9, 21.0],
        labels: ["Q2 23","Q3 23","Q4 23","Q1 24","Q2 24"],
        analysis: "The US economy shows remarkable resilience with 3.2% GDP growth, defying recession expectations. Core PCE remains sticky at 2.8%, complicating the Fed's path to rate cuts. Markets have priced out aggressive cuts, keeping DXY well-bid near-term.",
    },
    "EUR": {
        name: "Eurozone",
        gdpHistory:  [0.1, -0.1, 0.0, -0.1, 0.0],
        cpiHistory:  [5.3, 4.3, 2.9, 2.8, 2.6],
        rateHistory: [3.75, 4.0, 4.5, 4.5, 4.5],
        m2History:   [14.9, 14.7, 14.6, 14.5, 14.5],
        labels: ["Q2 23","Q3 23","Q4 23","Q1 24","Q2 24"],
        analysis: "The Eurozone narrowly avoided technical recession. Inflation has cooled significantly to 2.6%, allowing the ECB to potentially front-run the Fed with a June rate cut. Weak German manufacturing PMIs continue to drag overall growth.",
    },
    "GBP": {
        name: "United Kingdom",
        gdpHistory:  [0.2, -0.1, -0.3, -0.3, -0.3],
        cpiHistory:  [6.8, 4.6, 3.9, 4.0, 3.4],
        rateHistory: [5.0, 5.25, 5.25, 5.25, 5.25],
        m2History:   [3.3, 3.2, 3.1, 3.1, 3.1],
        labels: ["Q2 23","Q3 23","Q4 23","Q1 24","Q2 24"],
        analysis: "UK fell into shallow technical recession. Despite contraction, wage growth above 6% forces BoE to maintain restrictive rates (5.25%) longer than peers to combat embedded inflation.",
    },
    "JPY": {
        name: "Japan",
        gdpHistory:  [1.2, -0.7, 0.1, 0.1, 0.1],
        cpiHistory:  [3.3, 3.0, 2.6, 2.2, 2.8],
        rateHistory: [-0.1, -0.1, -0.1, -0.1, 0.1],
        m2History:   [8.7, 8.7, 8.8, 8.8, 8.9],
        labels: ["Q2 23","Q3 23","Q4 23","Q1 24","Q2 24"],
        analysis: "Japan made a historic pivot from NIRP following 5.28% Shunto wage gains — highest in decades. Despite the hike, JPY remains weak as rate differentials vs US remain vast. BoJ YCC exit is the structural driver.",
    },
    "AUD": {
        name: "Australia",
        gdpHistory:  [0.4, 0.2, 0.2, 0.3, 0.2],
        cpiHistory:  [6.0, 5.4, 4.1, 3.6, 3.4],
        rateHistory: [3.85, 4.1, 4.35, 4.35, 4.35],
        m2History:   [2.7, 2.7, 2.7, 2.7, 2.8],
        labels: ["Q2 23","Q3 23","Q4 23","Q1 24","Q2 24"],
        analysis: "Australia balancing slowing consumption with resilient commodity exports. RBA maintains data-dependent stance. China property market developments are key tail risk for iron ore demand.",
    },
    "CAD": {
        name: "Canada",
        gdpHistory:  [0.3, -0.1, 0.2, 0.2, 0.2],
        cpiHistory:  [3.3, 3.8, 3.4, 2.9, 2.8],
        rateHistory: [4.75, 5.0, 5.0, 5.0, 5.0],
        m2History:   [2.4, 2.4, 2.4, 2.5, 2.5],
        labels: ["Q2 23","Q3 23","Q4 23","Q1 24","Q2 24"],
        analysis: "Canada's outlook reflects strain of high household debt and mortgage renewals. BoC remains cautious. Energy exports provide a buffer but domestic manufacturing shows stagnation signs.",
    },
};

// ── Yield Curve Data (US Treasuries) ──
const YIELD_CURVES: Record<string, { current: number[]; prev3m: number[]; prev1y: number[] }> = {
    USD: { current: [5.32, 5.15, 4.95, 4.72, 4.60, 4.42, 4.25, 4.30, 4.48], prev3m: [5.45, 5.30, 5.10, 4.90, 4.75, 4.60, 4.40, 4.45, 4.60], prev1y: [4.85, 4.80, 4.65, 4.40, 4.20, 4.00, 3.90, 4.00, 4.25] },
    EUR: { current: [3.90, 3.88, 3.85, 3.75, 3.62, 3.45, 3.20, 3.10, 3.05], prev3m: [4.05, 4.00, 3.95, 3.85, 3.72, 3.55, 3.30, 3.20, 3.18], prev1y: [3.50, 3.55, 3.60, 3.55, 3.40, 3.20, 2.95, 2.85, 2.75] },
    GBP: { current: [5.20, 5.10, 5.00, 4.88, 4.72, 4.55, 4.35, 4.38, 4.45], prev3m: [5.35, 5.25, 5.15, 5.00, 4.85, 4.70, 4.50, 4.52, 4.58], prev1y: [4.90, 4.88, 4.80, 4.65, 4.48, 4.28, 4.08, 4.12, 4.20] },
    JPY: { current: [0.08, 0.18, 0.28, 0.45, 0.62, 0.78, 0.92, 1.05, 1.10], prev3m: [0.02, 0.08, 0.15, 0.32, 0.48, 0.62, 0.78, 0.90, 0.96], prev1y: [-0.10, -0.08, -0.05, 0.05, 0.18, 0.35, 0.52, 0.60, 0.72] },
    AUD: { current: [4.38, 4.28, 4.20, 4.10, 4.05, 3.98, 3.92, 4.05, 4.18], prev3m: [4.52, 4.42, 4.35, 4.25, 4.18, 4.10, 4.04, 4.15, 4.28], prev1y: [4.05, 4.00, 3.95, 3.90, 3.85, 3.80, 3.78, 3.88, 4.02] },
    CAD: { current: [4.85, 4.72, 4.58, 4.42, 4.28, 4.15, 4.02, 4.10, 4.22], prev3m: [5.00, 4.88, 4.75, 4.58, 4.45, 4.30, 4.18, 4.25, 4.38], prev1y: [4.50, 4.42, 4.32, 4.18, 4.05, 3.95, 3.85, 3.92, 4.05] },
};

const YIELD_TENORS = ['1M','3M','6M','1Y','2Y','3Y','5Y','10Y','30Y'];

const MOMENTUM_DATA = [
    { country: 'USA', index: 42.5,  trend: 'UP',   surprise: 'BEAT',    recent: 'NFP, CPI, Retail Sales' },
    { country: 'EUR', index: -12.8, trend: 'DOWN', surprise: 'MISS',    recent: 'PMI, GDP, ZEW' },
    { country: 'GBP', index: 5.2,   trend: 'SIDE', surprise: 'NEUTRAL', recent: 'Wages, CPI, GDP' },
    { country: 'JPY', index: -8.4,  trend: 'UP',   surprise: 'MISS',    recent: 'CPI, Tankan, Industrial Prod' },
    { country: 'AUD', index: 18.9,  trend: 'UP',   surprise: 'BEAT',    recent: 'Employment, Retail Sales' },
    { country: 'CAD', index: -2.1,  trend: 'DOWN', surprise: 'MISS',    recent: 'GDP, Unemployment' },
];

const LIQUIDITY_PILLARS = [
    { label: 'Fed Balance Sheet', val: '$7.58T', chg: '-$95B/mo', color: '#ff4d4d' },
    { label: 'TGA Balance',       val: '$742B',  chg: 'Filling',   color: '#00b8e0' },
    { label: 'Reverse Repo (RRP)',val: '$440B',  chg: 'Draining',  color: '#00e676' },
];

const INDICES = [
    { name:"S&P 500", val:"5,123.4", chg:"+1.2%" },
    { name:"NASDAQ",  val:"16,234.1",chg:"+1.5%" },
    { name:"DXY",     val:"103.45",  chg:"-0.4%" },
    { name:"US 10Y",  val:"4.25%",   chg:"-3bps" },
    { name:"WTI",     val:"$82.3",   chg:"+0.8%" },
    { name:"Gold",    val:"$2,165",  chg:"+0.3%" },
    { name:"2s10s",   val:"-41bps",  chg:"+2bps" },
    { name:"VIX",     val:"13.42",   chg:"-0.8" },
];

interface MacroFullScreenProps {
    defaultTab?: "regime" | "macro" | "cbpolicy" | "liquidity" | "momentum" | "yieldcurve";
}

export default function MacroFullScreen({ defaultTab = "regime" }: MacroFullScreenProps) {
    const { setActiveView } = useTerminal();
    useCommandBarStats();
    const [selectedCountry, setSelectedCountry] = useState("USD");
    
    const initialTab = defaultTab;
    const [activeTab, setActiveTab] = useState<"regime" | "macro" | "cbpolicy" | "liquidity" | "momentum" | "yieldcurve">(initialTab as any);

    useEffect(() => {
        setActiveTab(defaultTab as any);
    }, [defaultTab]);

    const chartRefGDP = useRef<HTMLDivElement>(null);
    const chartRefCPI = useRef<HTMLDivElement>(null);
    const chartRefYC  = useRef<HTMLDivElement>(null);
    const chartRefM2  = useRef<HTMLDivElement>(null);
    const chartRefMom = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveView("DASHBOARD");
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setActiveView]);

    // ── Macro data charts ──
    useEffect(() => {
        if (!chartRefGDP.current || !chartRefCPI.current || activeTab !== 'macro') return;
        const data = MACRO_COUNTRIES[selectedCountry];

        const chartGDP = echarts.init(chartRefGDP.current);
        chartGDP.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            grid: { left: '8%', right: '4%', bottom: '15%', top: '10%' },
            xAxis: { type: 'category', data: data.labels, axisLabel: { color: '#5c8397', fontSize: 10 } },
            yAxis: { type: 'value', axisLabel: { color: '#5c8397', fontSize: 10 }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } } },
            series: [{ name: 'GDP Growth', type: 'bar', data: data.gdpHistory, itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0, color:'#00b8e0'}, {offset:1, color:'#004c6d'}]) }, barWidth: '40%', label: { show: true, position: 'top', color: '#00b8e0', fontSize: 10, formatter: '{c}%' } }]
        });

        const chartCPI = echarts.init(chartRefCPI.current);
        chartCPI.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            grid: { left: '8%', right: '4%', bottom: '15%', top: '10%' },
            xAxis: { type: 'category', data: data.labels, axisLabel: { color: '#5c8397', fontSize: 10 } },
            yAxis: { type: 'value', axisLabel: { color: '#5c8397', fontSize: 10 }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } } },
            series: [{ name: 'Inflation (CPI)', type: 'line', data: data.cpiHistory, smooth: true, lineStyle: { width: 3, color: '#ff4d4d' }, itemStyle: { color: '#ff4d4d' }, areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0, color:'rgba(255,77,77,0.2)'}, {offset:1, color:'transparent'}]) }, symbolSize: 8 }]
        });

        const resize = () => { chartGDP.resize(); chartCPI.resize(); };
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chartGDP.dispose(); chartCPI.dispose(); };
    }, [selectedCountry, activeTab]);

    // ── Yield curve chart ──
    useEffect(() => {
        if (!chartRefYC.current || activeTab !== 'yieldcurve') return;
        const yc = YIELD_CURVES[selectedCountry];
        const chart = echarts.init(chartRefYC.current);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            legend: { data: ['Current', '3M Ago', '1Y Ago'], textStyle: { color: '#5c8397' }, right: 10, top: 0, itemWidth: 10 },
            grid: { left: '6%', right: '4%', bottom: '15%', top: '15%' },
            xAxis: { type: 'category', data: YIELD_TENORS, axisLabel: { color: '#5c8397', fontSize: 10 } },
            yAxis: { type: 'value', axisLabel: { color: '#5c8397', fontSize: 10 }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } } },
            series: [
                { name: 'Current', type: 'line', data: yc.current, itemStyle: { color: '#00e676' }, lineStyle: { width: 4 }, symbolSize: 10, smooth: true },
                { name: '3M Ago',  type: 'line', data: yc.prev3m,  itemStyle: { color: '#ffaa00' }, lineStyle: { color: '#ffaa00', width: 2, type: 'dashed' }, symbolSize: 5, smooth: true },
                { name: '1Y Ago',  type: 'line', data: yc.prev1y,  itemStyle: { color: '#5c8397' }, lineStyle: { color: '#5c8397', width: 1.5, type: 'dotted' }, symbolSize: 4, smooth: true },
            ]
        });
        const resize = () => chart.resize();
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chart.dispose(); };
    }, [selectedCountry, activeTab]);

    // ── M2 chart ──
    useEffect(() => {
        if (!chartRefM2.current || activeTab !== 'cbpolicy') return;
        const data = MACRO_COUNTRIES[selectedCountry];
        const chart = echarts.init(chartRefM2.current);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            grid: { left: '8%', right: '4%', bottom: '15%', top: '10%' },
            xAxis: { type: 'category', data: data.labels, axisLabel: { color: '#5c8397', fontSize: 10 } },
            yAxis: [{ type: 'value', name: 'Money Supply (T)', nameTextStyle: { color: '#5c8397' }, axisLabel: { color: '#5c8397' }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } } }, { type: 'value', name: 'Policy Rate %', nameTextStyle: { color: '#5c8397' }, axisLabel: { color: '#5c8397' }, splitLine: { show: false } }],
            series: [{ name: 'M2 Supply', type: 'bar', data: data.m2History, itemStyle: { color: 'rgba(0,184,224,0.3)' } }, { name: 'Rate History', type: 'line', yAxisIndex: 1, data: data.rateHistory, lineStyle: { color: '#ffaa00', width: 3 }, itemStyle: { color: '#ffaa00' } }]
        });
        const resize = () => chart.resize();
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chart.dispose(); };
    }, [selectedCountry, activeTab]);

    // ── Momentum chart ──
    useEffect(() => {
        if (!chartRefMom.current || activeTab !== 'momentum') return;
        const chart = echarts.init(chartRefMom.current);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            grid: { left: '5%', right: '5%', bottom: '10%', top: '5%', containLabel: true },
            xAxis: { type: 'value', axisLabel: { color: '#5c8397' }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } } },
            yAxis: { type: 'category', data: MOMENTUM_DATA.map(d => d.country), axisLabel: { color: '#cbd5e1', fontWeight: 800 } },
            series: [{ name: 'ESI Momentum', type: 'bar', data: MOMENTUM_DATA.map(d => ({ value: d.index, itemStyle: { color: d.index >= 0 ? '#00e676' : '#ff4d4d' } })), barWidth: '60%', label: { show: true, position: 'right', color: '#cbd5e1', formatter: '{c}' } }]
        });
        const resize = () => chart.resize();
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chart.dispose(); };
    }, [activeTab]);

    const data = MACRO_COUNTRIES[selectedCountry];

    return (
        <div className="macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">GLOBAL MACROMETRICS TERMINAL</h1>
                    <div className="macro-fs-subtitle">ECONOMIC DATA · YIELD CURVES · CENTRAL BANK POLICY · {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <X size={14} /> CLOSE
                </button>
            </div>

            {/* ── Live Ticker ── */}
            <div className="macro-fs-ticker">
                {INDICES.map(i => (
                    <div className="m-ticker-item" key={i.name}>
                        <span className="m-t-name">{i.name}</span>
                        <span className="m-t-val">{i.val}</span>
                        <span className={i.chg.startsWith('+') ? "m-t-pos" : "m-t-neg"}>{i.chg}</span>
                    </div>
                ))}
            </div>

            {/* ── Tab Bar ── */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--bb-teal-border)', background: 'rgba(2,8,14,0.8)', flexShrink: 0 }}>
                {[
                    { id: 'regime',     label: 'REGIME NAVIGATOR' },
                    { id: 'macro',      label: 'ECONOMIC DATA' },
                    { id: 'yieldcurve', label: 'YIELD CURVES' },
                    { id: 'cbpolicy',   label: 'MONETARY POLICY' },
                    { id: 'liquidity',  label: 'NET LIQUIDITY' },
                    { id: 'momentum',   label: 'MACRO MOMENTUM' },
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
                        padding: '12px 20px', background: 'transparent', border: 'none',
                        borderBottom: activeTab === t.id ? '2px solid var(--bb-amber)' : '2px solid transparent',
                        color: activeTab === t.id ? 'var(--bb-amber)' : 'var(--bb-text-dim)',
                        fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="port-fs-content">
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    {/* Country Selector for Macro/Yield Curve */}
                    {(activeTab === 'macro' || activeTab === 'yieldcurve') && (
                        <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'rgba(8,22,30,0.5)', borderBottom: '1px solid var(--bb-teal-border)', flexShrink: 0 }}>
                            {Object.keys(MACRO_COUNTRIES).map(c => (
                                <button key={c} onClick={() => setSelectedCountry(c)} style={{
                                    padding: '8px 14px', background: selectedCountry === c ? 'var(--bb-blue)' : 'rgba(22,51,68,0.3)',
                                    border: '1px solid var(--bb-teal-border)', color: selectedCountry === c ? '#fff' : 'var(--bb-text-dim)',
                                    borderRadius: '3px', fontSize: '10px', fontWeight: 800, cursor: 'pointer'
                                }}>{c}</button>
                            ))}
                        </div>
                    )}

                    {/* TAB 1: Regime Navigator */}
                    {activeTab === 'regime' && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
                            <div style={{ flex: 1, background: 'rgba(8, 22, 30, 0.4)', border: '1px solid var(--bb-teal-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', padding: '1px' }}>
                                {[
                                    { title: 'GOLDILOCKS', desc: 'Growth Up / Inflation Down', pos: 'TOP-RIGHT', color: '#00e676' },
                                    { title: 'STAGFLATION', desc: 'Growth Down / Inflation Up', pos: 'TOP-LEFT', color: '#ff4d4d' },
                                    { title: 'REFLATION', desc: 'Growth Up / Inflation Up', pos: 'BOTTOM-RIGHT', color: '#00b8e0' },
                                    { title: 'DEFLATION', desc: 'Growth Down / Inflation Down', pos: 'BOTTOM-LEFT', color: '#ffaa00' }
                                ].map(q => (
                                    <div key={q.title} style={{ padding: '40px', background: '#020c12', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--bb-text-dim)', marginBottom: '8px' }}>{q.pos}</div>
                                        <h2 style={{ fontSize: '28px', color: q.color, fontWeight: 900, letterSpacing: '0.1em', marginBottom: '12px' }}>{q.title}</h2>
                                        <p style={{ fontSize: '12px', color: 'var(--bb-text-bright)', opacity: 0.7 }}>{q.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,184,224,0.1)', border: '1px solid var(--bb-blue)', borderRadius: '4px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--bb-blue-bright)', marginBottom: '6px' }}>CURRENT REGIME SIGNAL: <span style={{ color: '#00e676' }}>GOLDILOCKS (TRANSITIONING TO REFLATION)</span></div>
                                <div style={{ fontSize: '12px', color: 'var(--bb-text-dim)' }}>Asset Preference: Equities+, Crypto+, Commodities+, Bonds-</div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Macro Data */}
                    {activeTab === 'macro' && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', flexShrink: 0 }}>
                                {[
                                    { label: 'GDP GROWTH', val: `${data.gdpHistory[data.gdpHistory.length - 1]}%`, ref: chartRefGDP },
                                    { label: 'INFLATION (CPI)', val: `${data.cpiHistory[data.cpiHistory.length - 1]}%`, ref: chartRefCPI },
                                ].map(chart => (
                                    <div key={chart.label} style={{ background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', height: '220px', padding: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em' }}>{chart.label} HISTORY</div>
                                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{chart.val}</div>
                                        </div>
                                        <div ref={chart.ref} style={{ width: '100%', height: 'calc(100% - 30px)' }} />
                                    </div>
                                ))}
                            </div>
                            <div className="m-analysis-box" style={{ flex: 1, margin: '0 12px 12px' }}>
                                <div className="m-ab-title">ECONOMIC ANALYSIS: {MACRO_COUNTRIES[selectedCountry].name}</div>
                                <div className="m-ab-text" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                                    {MACRO_COUNTRIES[selectedCountry].analysis}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: Yield Curve (New Dedicated Tab) */}
                    {activeTab === 'yieldcurve' && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px', minHeight: 0 }}>
                            <div style={{ flex: 1, padding: '12px' }}>
                                <div style={{ height: '100%', background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', padding: '12px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', marginBottom: '12px' }}>
                                        {selectedCountry} SOVEREIGN YIELD CURVE — CURRENT vs 3M vs 1Y AGO
                                    </div>
                                    <div ref={chartRefYC} style={{ width: '100%', height: 'calc(100% - 30px)' }} />
                                </div>
                            </div>
                            <div style={{ padding: '0 12px 12px' }}>
                                <div style={{ background: 'rgba(0,184,224,0.05)', border: '1px solid var(--bb-blue)', padding: '12px', borderRadius: '4px', fontSize: '11px', color: 'var(--bb-text-dim)' }}>
                                    <strong>Term Structure Insight:</strong> The yield curve illustrates the relationship between interest rates and time to maturity. 
                                    An <strong>inverted curve</strong> (short-term rates {'>'} long-term rates) is a historically reliable recession signal, 
                                    while a <strong>steepening curve</strong> often indicates expectations of economic growth and rising inflation.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: CB & Money Supply */}
                    {activeTab === 'cbpolicy' && (
                        <>
                            <div style={{ display: 'flex', gap: '10px', padding: '10px 12px', flexShrink: 0 }}>
                                {[
                                    { label: 'POLICY RATE',      val: `${data.rateHistory[data.rateHistory.length - 1]}%`,   color: 'var(--bb-amber)' },
                                    { label: 'M2 MONEY SUPPLY',  val: `$${data.m2History[data.m2History.length - 1]}T`,     color: 'var(--bb-blue)' },
                                    { label: 'QE/QT STATUS',     val: selectedCountry === 'USD' ? 'QT' : selectedCountry === 'JPY' ? 'QE→EXIT' : 'QT', color: 'var(--bb-red)' },
                                    { label: 'ZERO LOWER BOUND', val: data.rateHistory[data.rateHistory.length - 1] <= 0.25 ? 'NEAR-ZLB' : 'ABOVE ZLB', color: data.rateHistory[data.rateHistory.length - 1] <= 0.25 ? 'var(--bb-amber)' : 'var(--bb-green)' },
                                ].map(m => (
                                    <div key={m.label} style={{ flex: 1, padding: '10px 12px', background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', borderTop: `3px solid ${m.color}` }}>
                                        <div style={{ fontSize: '8px', color: 'var(--bb-text-dim)', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '4px' }}>{m.label}</div>
                                        <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: m.color }}>{m.val}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, minHeight: 0, padding: '0 12px 12px' }}>
                                <div style={{ height: '100%', background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', padding: '8px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', marginBottom: '4px' }}>
                                        M2 MONEY SUPPLY vs POLICY RATE — {MACRO_COUNTRIES[selectedCountry].name}
                                    </div>
                                    <div ref={chartRefM2} style={{ width: '100%', height: 'calc(100% - 24px)' }} />
                                </div>
                            </div>
                            <div className="m-analysis-box" style={{ flexShrink: 0, marginTop: 0 }}>
                                <div className="m-ab-title">CENTRAL BANK FRAMEWORK: Impossible Trinity & Policy Tools</div>
                                <div className="m-ab-text">
                                    <strong>Impossible Trinity:</strong> A central bank cannot simultaneously maintain (1) free capital flow, (2) fixed exchange rate, and (3) independent monetary policy.
                                    Most G10 CBs choose <span style={{ color: 'var(--bb-amber)' }}>free capital + independent policy</span> → floating FX.
                                    QT reduces bank reserves → tightens financial conditions beyond rate hikes.
                                    Current global liquidity trend: <span style={{ color: 'var(--bb-red)' }}>CONTRACTING</span> — watch for credit stress signals.
                                </div>
                            </div>
                        </>
                    )}
                    {/* TAB 4: Liquidity */}
                    {activeTab === 'liquidity' && (
                        <div style={{ flex: 1, display: 'flex', gap: '20px', padding: '20px' }}>
                             <div style={{ flex: 2, background: 'rgba(8, 22, 30, 0.4)', border: '1px solid var(--bb-teal-border)', borderRadius: '4px', padding: '20px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--bb-blue)', fontWeight: 800, marginBottom: '20px' }}>USD NET LIQUIDITY MODEL</div>
                                <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--bb-teal-border)', color: 'var(--bb-text-dim)' }}>
                                    LIQUIDITY FLOW VIZ (FED BS - TGA - RRP)
                                </div>
                             </div>
                             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {LIQUIDITY_PILLARS.map(p => (
                                    <div key={p.label} style={{ background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '4px', padding: '15px', borderLeft: `4px solid ${p.color}` }}>
                                        <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)', fontWeight: 800 }}>{p.label}</div>
                                        <div style={{ fontSize: '20px', color: '#fff', fontWeight: 900, marginTop: '4px' }}>{p.val}</div>
                                        <div style={{ fontSize: '10px', color: p.color, marginTop: '2px' }}>{p.chg}</div>
                                    </div>
                                ))}
                                <div style={{ flex: 1, background: 'rgba(0,184,224,0.05)', padding: '15px', border: '1px solid var(--bb-blue)', borderRadius: '4px' }}>
                                    <h4 style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', marginBottom: '12px' }}>MACRO OVERLAY</h4>
                                    <p style={{ fontSize: '11px', color: 'var(--bb-text-dim)', lineHeight: 1.6 }}>
                                        Despite ongoing QT, Net Liquidity has actually been expanding as the RRP drains faster than the Balance Sheet shrinks. 
                                        <br/><br/>
                                        <span style={{ color: 'var(--bb-green)', fontWeight: 800 }}>IMPACT:</span> Support for Equities and Risk assets remains high as long as RRP levels are above zero.
                                    </p>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* TAB 5: Momentum (ESI) */}
                    {activeTab === 'momentum' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', height: '100%', padding: '0 12px 12px' }}>
                             <div style={{ background: 'rgba(8, 22, 30, 0.4)', border: '1px solid var(--bb-teal-border)', borderRadius: '4px', padding: '20px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--bb-blue)', fontWeight: 800, marginBottom: '20px' }}>REGIONAL SURPRISE VELOCITY (30D)</div>
                                <div ref={chartRefMom} style={{ height: 'calc(100% - 30px)' }}></div>
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ background: 'rgba(2, 10, 16, 0.6)', border: '1px solid var(--bb-teal-border)', padding: '20px', borderRadius: '4px' }}>
                                    <h3 style={{ fontSize: '10px', color: 'var(--bb-amber)', fontWeight: 800, marginBottom: '15px' }}>DATA WATCHLIST</h3>
                                    {MOMENTUM_DATA.map((d, i) => (
                                        <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(22,51,68,0.3)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>{d.country}</span>
                                                    {d.trend === 'UP' ? <TrendingUp size={12} color="var(--bb-green)" /> : d.trend === 'DOWN' ? <TrendingDown size={12} color="#ff4d4d" /> : <Minus size={12} color="var(--bb-text-dim)" />}
                                                </div>
                                                <span style={{ fontSize: '10px', fontWeight: 800, color: d.index >= 0 ? 'var(--bb-green)' : '#ff4d4d' }}>{d.surprise}</span>
                                            </div>
                                            <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)' }}>Recent: {d.recent}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ padding: '20px', border: '1px solid var(--bb-teal-border)', background: 'rgba(0, 184, 224, 0.03)', borderRadius: '4px', flex: 1 }}>
                                    <h4 style={{ color: 'var(--bb-blue-bright)', fontSize: '10px', fontWeight: 800, marginBottom: '10px' }}>MACRO ALPHA INSIGHT</h4>
                                    <p style={{ fontSize: '11px', color: 'var(--bb-text-dim)', lineHeight: 1.6 }}>
                                        US economy consistently beating manufacturing estimates while services softening slightly. Positive for USD duration.
                                    </p>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
