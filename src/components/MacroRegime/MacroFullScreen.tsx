import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import './MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

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

export default function MacroFullScreen() {
    const { setActiveView } = useTerminal();
    const [selectedCountry, setSelectedCountry] = useState("USD");
    const [activeTab, setActiveTab] = useState<"macro" | "yieldcurve" | "cbpolicy">("macro");
    const chartRef1 = useRef<HTMLDivElement>(null);
    const chartRef2 = useRef<HTMLDivElement>(null);
    const chartRefYC = useRef<HTMLDivElement>(null);
    const chartRefM2 = useRef<HTMLDivElement>(null);

    const data = MACRO_COUNTRIES[selectedCountry];

    // ── GDP / CPI + Rate history charts ──
    useEffect(() => {
        if (activeTab !== 'macro') return;
        if (!chartRef1.current || !chartRef2.current) return;
        const c1 = echarts.init(chartRef1.current);
        const c2 = echarts.init(chartRef2.current);

        c1.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            legend: { data: ['GDP QoQ %', 'CPI YoY %'], bottom: 0, textStyle: { color: '#5c8397' }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
            grid: { left: '10%', right: '5%', bottom: '18%', top: '10%' },
            xAxis: { type: 'category', data: data.labels, axisLabel: { color: '#5c8397' }, axisLine: { lineStyle: { color: '#163344' } } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: '#163344', type: 'dashed' } }, axisLabel: { color: '#5c8397' } },
            series: [
                { name: 'GDP QoQ %', type: 'bar', data: data.gdpHistory, itemStyle: { color: (p: any) => p.data >= 0 ? '#00e676' : '#ff3d57', borderRadius: [2,2,0,0] } },
                { name: 'CPI YoY %', type: 'line', data: data.cpiHistory, itemStyle: { color: '#ff3d57' }, lineStyle: { width: 2.5 }, symbolSize: 7, smooth: true },
            ],
        });

        c2.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            grid: { left: '10%', right: '5%', bottom: '18%', top: '10%' },
            xAxis: { type: 'category', data: data.labels, axisLabel: { color: '#5c8397' }, axisLine: { lineStyle: { color: '#163344' } } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: '#163344', type: 'dashed' } }, axisLabel: { color: '#5c8397', formatter: '{value}%' } },
            series: [{ name: 'Policy Rate', type: 'line', step: 'end', data: data.rateHistory, itemStyle: { color: '#ffaa00' }, lineStyle: { width: 3 }, areaStyle: { color: 'rgba(255,170,0,0.08)' }, symbolSize: 8 }],
        });

        const resize = () => { c1.resize(); c2.resize(); };
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); c1.dispose(); c2.dispose(); };
    }, [selectedCountry, activeTab, data]);

    // ── Yield Curve chart ──
    useEffect(() => {
        if (activeTab !== 'yieldcurve' || !chartRefYC.current) return;
        const chart = echarts.init(chartRefYC.current);
        const yc = YIELD_CURVES[selectedCountry] || YIELD_CURVES.USD;

        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' }, formatter: (params: any) => {
                return params.map((p: any) => `<span style="color:${p.color}">●</span> ${p.seriesName}: ${p.data.toFixed(2)}%`).join('<br/>');
            }},
            legend: { data: ['Current','3M Ago','1Y Ago'], bottom: 0, textStyle: { color: '#5c8397' }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
            grid: { left: '8%', right: '5%', bottom: '15%', top: '8%' },
            xAxis: { type: 'category', data: YIELD_TENORS, axisLabel: { color: '#5c8397', fontWeight: 700 }, axisLine: { lineStyle: { color: '#163344' } } },
            yAxis: { type: 'value', axisLabel: { color: '#5c8397', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } } },
            series: [
                { name: 'Current', type: 'line', data: yc.current, itemStyle: { color: '#00e676' }, lineStyle: { color: '#00e676', width: 3 }, areaStyle: { color: 'rgba(0,230,118,0.06)' }, symbolSize: 7, smooth: true },
                { name: '3M Ago',  type: 'line', data: yc.prev3m,  itemStyle: { color: '#ffaa00' }, lineStyle: { color: '#ffaa00', width: 2, type: 'dashed' }, symbolSize: 5, smooth: true },
                { name: '1Y Ago',  type: 'line', data: yc.prev1y,  itemStyle: { color: '#5c8397' }, lineStyle: { color: '#5c8397', width: 1.5, type: 'dotted' }, symbolSize: 4, smooth: true },
            ],
        });

        const resize = () => chart.resize();
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chart.dispose(); };
    }, [selectedCountry, activeTab]);

    // ── M2 Money Supply chart ──
    useEffect(() => {
        if (activeTab !== 'cbpolicy' || !chartRefM2.current) return;
        const chart = echarts.init(chartRefM2.current);
        const d = MACRO_COUNTRIES[selectedCountry];

        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            legend: { data: ['M2 Money Supply ($T)','Policy Rate %'], bottom: 0, textStyle: { color: '#5c8397' }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
            grid: { left: '10%', right: '10%', bottom: '18%', top: '10%' },
            xAxis: { type: 'category', data: d.labels, axisLabel: { color: '#5c8397' }, axisLine: { lineStyle: { color: '#163344' } } },
            yAxis: [
                { type: 'value', name: 'M2 ($T)', nameTextStyle: { color: '#5c8397' }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } }, axisLabel: { color: '#5c8397' } },
                { type: 'value', name: 'Rate %', nameTextStyle: { color: '#5c8397' }, axisLabel: { color: '#5c8397' }, splitLine: { show: false } },
            ],
            series: [
                { name: 'M2 Money Supply ($T)', type: 'bar', data: d.m2History, itemStyle: { color: 'rgba(0,184,224,0.7)', borderRadius: [2,2,0,0] }, yAxisIndex: 0 },
                { name: 'Policy Rate %', type: 'line', data: d.rateHistory, itemStyle: { color: '#ffaa00' }, lineStyle: { width: 2.5 }, step: 'end', yAxisIndex: 1, symbolSize: 6 },
            ],
        });

        const resize = () => chart.resize();
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chart.dispose(); };
    }, [selectedCountry, activeTab]);

    // ── Inversion signal for yield curve ──
    const yc = YIELD_CURVES[selectedCountry] || YIELD_CURVES.USD;
    const isInverted2s10s = yc.current[4] > yc.current[7];
    const spread2s10s = (yc.current[7] - yc.current[4]).toFixed(2);

    return (
        <div className="macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">GLOBAL MACROMETRICS TERMINAL</h1>
                    <div className="macro-fs-subtitle">ECONOMIC DATA · YIELD CURVES · CENTRAL BANK POLICY · {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE</button>
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
                    { id: 'macro',      label: 'ECONOMIC DATA & DEMOGRAPHICS' },
                    { id: 'yieldcurve', label: 'YIELD CURVE (FIXED INCOME)' },
                    { id: 'cbpolicy',   label: 'CENTRAL BANKS & MONEY SUPPLY' },
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
                        padding: '9px 18px', background: 'transparent', border: 'none',
                        borderBottom: activeTab === t.id ? '2px solid var(--bb-amber)' : '2px solid transparent',
                        color: activeTab === t.id ? 'var(--bb-amber)' : 'var(--bb-text-dim)',
                        fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.15s',
                    }}>{t.label}</button>
                ))}
            </div>

            <div className="macro-fs-content">
                {/* ── Sidebar ── */}
                <div className="macro-fs-sidebar">
                    <div className="m-side-title">REGIONS</div>
                    {Object.keys(MACRO_COUNTRIES).map(k => (
                        <div key={k} className={`m-side-item ${selectedCountry === k ? 'active' : ''}`} onClick={() => setSelectedCountry(k)}>
                            {MACRO_COUNTRIES[k].name} ({k})
                        </div>
                    ))}

                    <div className="m-side-title" style={{ marginTop: '16px' }}>REGIME INDICATORS</div>
                    {[
                        { label: 'Global Growth',    val: 'Decelerating', color: 'var(--bb-amber)' },
                        { label: 'Global Inflation', val: 'Cooling',      color: 'var(--bb-green)'  },
                        { label: 'Liquidity Trend',  val: 'Contracting',  color: 'var(--bb-red)'   },
                        { label: 'Risk Appetite',    val: 'Risk-On',      color: 'var(--bb-green)'  },
                    ].map(s => (
                        <div key={s.label} className="m-side-stat">
                            <div className="m-stat-label">{s.label}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: s.color }}>{s.val}</div>
                        </div>
                    ))}

                    {/* Yield Curve Inversion Signal */}
                    <div className="m-side-title" style={{ marginTop: '16px' }}>YIELD CURVE SIGNAL</div>
                    <div className="m-side-stat">
                        <div className="m-stat-label">2s/10s Spread</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: isInverted2s10s ? 'var(--bb-red)' : 'var(--bb-green)', fontFamily: 'var(--font-mono)' }}>
                            {parseFloat(spread2s10s) > 0 ? '+' : ''}{spread2s10s}%
                        </div>
                        <div style={{ fontSize: '8px', letterSpacing: '0.08em', fontWeight: 800, marginTop: '2px', color: isInverted2s10s ? 'var(--bb-red)' : 'var(--bb-green)' }}>
                            {isInverted2s10s ? '⚠ INVERTED — RECESSION SIGNAL' : '✓ NORMAL (POSITIVE)'}
                        </div>
                    </div>

                    {/* CB QE Status */}
                    <div className="m-side-title" style={{ marginTop: '16px' }}>CB POLICY BIAS</div>
                    {[
                        { cb: 'FED',  bias: 'HOLD', color: 'var(--bb-amber)' },
                        { cb: 'ECB',  bias: 'DOVISH', color: 'var(--bb-green)' },
                        { cb: 'BOJ',  bias: 'HAWKISH', color: 'var(--bb-red)' },
                        { cb: 'BOE',  bias: 'HOLD', color: 'var(--bb-amber)' },
                        { cb: 'RBA',  bias: 'HOLD', color: 'var(--bb-amber)' },
                    ].map(c => (
                        <div key={c.cb} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid rgba(22,51,68,0.3)' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bb-text-dim)' }}>{c.cb}</span>
                            <span style={{ fontSize: '8px', fontWeight: 800, padding: '1px 6px', borderRadius: '2px', background: `${c.color}18`, color: c.color, border: `1px solid ${c.color}33`, letterSpacing: '0.06em' }}>{c.bias}</span>
                        </div>
                    ))}
                </div>

                {/* ── Main Area ── */}
                <div className="macro-fs-main">

                    {/* TAB 1: Economic Data */}
                    {activeTab === 'macro' && (
                        <>
                            <div className="m-chart-row">
                                <div className="m-chart-box">
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', padding: '8px 8px 4px' }}>GDP GROWTH vs INFLATION</div>
                                    <div ref={chartRef1} style={{ width: '100%', height: 'calc(100% - 28px)' }} />
                                </div>
                                <div className="m-chart-box">
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', padding: '8px 8px 4px' }}>CENTRAL BANK POLICY RATE</div>
                                    <div ref={chartRef2} style={{ width: '100%', height: 'calc(100% - 28px)' }} />
                                </div>
                            </div>
                            <div className="m-analysis-box">
                                <div className="m-ab-title">AI MACRO INTELLIGENCE: {MACRO_COUNTRIES[selectedCountry].name}</div>
                                <div className="m-ab-text">{data.analysis}</div>
                            </div>
                        </>
                    )}

                    {/* TAB 2: Yield Curve */}
                    {activeTab === 'yieldcurve' && (
                        <>
                            {/* Spread indicators */}
                            <div style={{ display: 'flex', gap: '10px', padding: '10px 12px', flexShrink: 0 }}>
                                {[
                                    { label: '3M/10Y Spread', val: `${((yc.current[7] - yc.current[0]) * 100).toFixed(0)}bps`, pos: yc.current[7] > yc.current[0] },
                                    { label: '2Y/10Y (2s10s)', val: `${(parseFloat(spread2s10s) * 100).toFixed(0)}bps`, pos: parseFloat(spread2s10s) > 0 },
                                    { label: '5Y/30Y Spread', val: `${((yc.current[8] - yc.current[6]) * 100).toFixed(0)}bps`, pos: yc.current[8] > yc.current[6] },
                                    { label: 'Curve Shape', val: isInverted2s10s ? 'INVERTED' : 'NORMAL', pos: !isInverted2s10s },
                                    { label: 'FI Decision', val: isInverted2s10s ? 'LONG DURATION' : 'NEUTRAL', pos: true },
                                ].map(s => (
                                    <div key={s.label} style={{ flex: 1, padding: '8px 12px', background: 'rgba(8,22,30,0.6)', border: `1px solid ${s.pos ? 'rgba(0,230,118,0.2)' : 'rgba(255,61,87,0.2)'}`, borderRadius: '3px', borderTop: `3px solid ${s.pos ? 'var(--bb-green)' : 'var(--bb-red)'}` }}>
                                        <div style={{ fontSize: '8px', color: 'var(--bb-text-dim)', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '4px' }}>{s.label}</div>
                                        <div style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.pos ? 'var(--bb-green)' : 'var(--bb-red)' }}>{s.val}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, minHeight: 0, padding: '0 12px 12px' }}>
                                <div style={{ height: '100%', background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', padding: '8px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', marginBottom: '4px' }}>
                                        {selectedCountry} SOVEREIGN YIELD CURVE — CURRENT vs 3M vs 1Y AGO
                                    </div>
                                    <div ref={chartRefYC} style={{ width: '100%', height: 'calc(100% - 24px)' }} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* TAB 3: CB & Money Supply */}
                    {activeTab === 'cbpolicy' && (
                        <>
                            <div style={{ display: 'flex', gap: '10px', padding: '10px 12px', flexShrink: 0 }}>
                                {[
                                    { label: 'POLICY RATE',      val: `${data.rateHistory.at(-1)}%`,   color: 'var(--bb-amber)' },
                                    { label: 'M2 MONEY SUPPLY',  val: `$${data.m2History.at(-1)}T`,     color: 'var(--bb-blue)' },
                                    { label: 'QE/QT STATUS',     val: selectedCountry === 'USD' ? 'QT' : selectedCountry === 'JPY' ? 'QE→EXIT' : 'QT', color: 'var(--bb-red)' },
                                    { label: 'ZERO LOWER BOUND', val: data.rateHistory.at(-1) <= 0.25 ? 'NEAR-ZLB' : 'ABOVE ZLB', color: data.rateHistory.at(-1) <= 0.25 ? 'var(--bb-amber)' : 'var(--bb-green)' },
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
                </div>
            </div>
        </div>
    );
}
