import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

// ── Strategy definitions matching the Systematic Trading mindmap branch ──
const STRATEGIES = [
    {
        id: "momentum",
        label: "MOMENTUM",
        color: "#00e676",
        desc: "Trend-following: buy assets going up, sell going down. Works best in trending regimes.",
        metrics: { sharpe: 1.42, cagr: 18.4, maxDD: -14.2, winRate: 58.2, trades: 1842 },
        equity: [100, 108, 115, 112, 124, 138, 145, 142, 158, 172, 168, 195],
    },
    {
        id: "carry",
        label: "CARRY",
        color: "#ffaa00",
        desc: "Borrow low-yielding, invest high-yielding. Best in low volatility, risk-on regimes.",
        metrics: { sharpe: 1.18, cagr: 12.8, maxDD: -18.5, winRate: 63.1, trades: 624 },
        equity: [100, 104, 109, 106, 112, 118, 122, 119, 126, 131, 128, 138],
    },
    {
        id: "value",
        label: "VALUE",
        color: "#9c6fff",
        desc: "Mean-reversion: buy undervalued, sell overvalued based on PPP & fair value models.",
        metrics: { sharpe: 0.95, cagr: 9.2, maxDD: -22.1, winRate: 54.8, trades: 420 },
        equity: [100, 102, 98, 103, 108, 105, 111, 115, 112, 118, 122, 127],
    },
    {
        id: "riskparity",
        label: "RISK PARITY",
        color: "#00b8e0",
        desc: "Allocate by risk contribution, not capital. Equal-risk weighting across asset classes.",
        metrics: { sharpe: 1.35, cagr: 11.6, maxDD: -8.4, winRate: 61.5, trades: 280 },
        equity: [100, 105, 102, 108, 111, 114, 118, 116, 121, 125, 123, 130],
    },
];

// ── Risk Premia factors ──
const RISK_PREMIA = [
    { factor: "Equity Premium",  ret: 7.2,  vol: 18.5, sharpe: 0.39, regime: "Risk-On" },
    { factor: "Term Premium",    ret: 2.1,  vol: 8.2,  sharpe: 0.26, regime: "Expansion" },
    { factor: "Credit Premium",  ret: 3.4,  vol: 6.8,  sharpe: 0.50, regime: "Risk-On" },
    { factor: "Momentum",        ret: 8.6,  vol: 12.4, sharpe: 0.69, regime: "Trending" },
    { factor: "Carry",           ret: 4.2,  vol: 9.6,  sharpe: 0.44, regime: "Low Vol" },
    { factor: "Value",           ret: 3.1,  vol: 11.2, sharpe: 0.28, regime: "Ranging" },
    { factor: "Low Volatility",  ret: 5.8,  vol: 9.1,  sharpe: 0.64, regime: "Any" },
    { factor: "Size Premium",    ret: 2.9,  vol: 14.2, sharpe: 0.20, regime: "Risk-On" },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function EngineeringFullScreen() {
    const { setActiveView } = useTerminal();
    const [activeTab, setActiveTab] = useState<"systematic" | "backtest" | "riskparity">("systematic");
    const [activeStrategy, setActiveStrategy] = useState("momentum");
    const chartRefEquity = useRef<HTMLDivElement>(null);
    const chartRefHeat   = useRef<HTMLDivElement>(null);
    const chartRefRP     = useRef<HTMLDivElement>(null);



    // ── Equity curve + heatmap charts ──
    useEffect(() => {
        if (!chartRefEquity.current) return;
        const chart = echarts.init(chartRefEquity.current);

        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            legend: { data: STRATEGIES.map(s => s.label), bottom: 0, textStyle: { color: '#5c8397' }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
            grid: { left: '6%', right: '3%', bottom: '12%', top: '8%' },
            xAxis: { type: 'category', data: MONTHS, axisLabel: { color: '#5c8397', fontSize: 10 }, axisLine: { lineStyle: { color: '#163344' } } },
            yAxis: { type: 'value', axisLabel: { color: '#5c8397', fontSize: 10, formatter: '{value}' }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } } },
            series: STRATEGIES.map(s => ({
                name: s.label, type: 'line',
                data: s.equity,
                itemStyle: { color: s.color },
                lineStyle: { color: s.color, width: s.id === activeStrategy ? 3 : 1.5, opacity: s.id === activeStrategy ? 1 : 0.4 },
                symbolSize: s.id === activeStrategy ? 6 : 0,
                smooth: true,
            })),
        });

        const resize = () => chart.resize();
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chart.dispose(); };
    }, [activeStrategy]);

    useEffect(() => {
        if (!chartRefHeat.current) return;
        const chart = echarts.init(chartRefHeat.current);

        const days = ['Mon','Tue','Wed','Thu','Fri'];
        const hours = Array.from({length: 24}, (_, i) => `${i}h`);
        const data: [number, number, number][] = [];
        for (let d = 0; d < 5; d++) {
            for (let h = 0; h < 24; h++) {
                // Simulate realistic profitability pattern: peaks at London/NY open
                const isLDN = h >= 7 && h <= 10;
                const isNY  = h >= 13 && h <= 16;
                const base  = isLDN || isNY ? 6 : (h < 4 || h > 20 ? 2 : 4);
                data.push([h, d, Math.max(0, base + Math.floor((Math.random() - 0.3) * 4))]);
            }
        }

        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { position: 'top', formatter: (p: any) => `${days[p.data[1]]} ${hours[p.data[0]]}: Score ${p.data[2]}/10` },
            grid: { left: '8%', right: '3%', bottom: '15%', top: '10%' },
            xAxis: { type: 'category', data: hours, axisLabel: { color: '#5c8397', fontSize: 8, interval: 2 }, axisLine: { lineStyle: { color: '#163344' } } },
            yAxis: { type: 'category', data: days, axisLabel: { color: '#5c8397', fontSize: 10 }, axisLine: { lineStyle: { color: '#163344' } } },
            visualMap: { min: 0, max: 10, calculable: false, orient: 'horizontal', left: 'center', bottom: '0%', textStyle: { color: '#5c8397', fontSize: 9 }, inRange: { color: ['#020a0e', '#0a2a38', '#00b8e0', '#00e676'] }, itemWidth: 12, itemHeight: 8 },
            series: [{ type: 'heatmap', data, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } } }],
        });

        const resize = () => chart.resize();
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chart.dispose(); };
    }, []);

    // ── Risk Premia chart ──
    useEffect(() => {
        if (!chartRefRP.current || activeTab !== 'riskparity') return;
        const chart = echarts.init(chartRefRP.current);

        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${p.value}%` },
            radar: {
                indicator: RISK_PREMIA.map(r => ({ name: r.factor.split(' ')[0], max: 10 })),
                splitArea: { show: false },
                splitLine: { lineStyle: { color: '#163344' } },
                axisLine: { lineStyle: { color: '#163344' } },
                name: { textStyle: { color: '#5c8397', fontSize: 9 } },
            },
            series: [{
                type: 'radar',
                data: [{
                    value: RISK_PREMIA.map(r => r.sharpe * 10),
                    name: 'Sharpe Ratio (scaled)',
                    itemStyle: { color: '#00b8e0' },
                    areaStyle: { color: 'rgba(0,184,224,0.15)' },
                    lineStyle: { color: '#00b8e0', width: 2 },
                }],
            }],
        });

        const resize = () => chart.resize();
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); chart.dispose(); };
    }, [activeTab]);

    return (
        <div className="macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">SYSTEMATIC TRADING & QUANT ENGINEERING</h1>
                    <div className="macro-fs-subtitle">
                        STRATEGY FRAMEWORK · FACTORS & RISK PREMIA · BACKTESTING · {new Date().toLocaleDateString()}
                    </div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE</button>
            </div>

            {/* ── Tab Bar ── */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--bb-teal-border)', background: 'rgba(2,8,14,0.8)', flexShrink: 0 }}>
                {[
                    { id: 'systematic', label: 'STRATEGY COMPARISON' },
                    { id: 'backtest',   label: 'BACKTEST ENGINE' },
                    { id: 'riskparity', label: 'FACTORS & RISK PREMIA' },
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
                        padding: '10px 20px', background: 'transparent', border: 'none',
                        borderBottom: activeTab === t.id ? '2px solid var(--bb-amber)' : '2px solid transparent',
                        color: activeTab === t.id ? 'var(--bb-amber)' : 'var(--bb-text-dim)',
                        fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="port-fs-content" style={{ overflow: 'hidden' }}>

                {/* ──────────── TAB 1: Strategy Comparison ──────────── */}
                {activeTab === 'systematic' && (
                    <>
                        {/* Strategy Selector + Metrics */}
                        <div style={{ display: 'flex', gap: '12px', padding: '12px', flexShrink: 0 }}>
                            {STRATEGIES.map(s => (
                                <div key={s.id}
                                    onClick={() => setActiveStrategy(s.id)}
                                    style={{
                                        flex: 1, padding: '10px 14px', borderRadius: '3px', cursor: 'pointer',
                                        border: `1px solid ${activeStrategy === s.id ? s.color : 'var(--bb-teal-border)'}`,
                                        background: activeStrategy === s.id ? `rgba(0,0,0,0.4)` : 'rgba(8,22,30,0.5)',
                                        transition: 'all 0.15s',
                                        borderTop: `3px solid ${s.color}`,
                                    }}>
                                    <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', color: s.color, marginBottom: '4px' }}>{s.label}</div>
                                    <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)', lineHeight: 1.5, marginBottom: '8px' }}>{s.desc}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: '10px' }}>
                                        <div style={{ color: 'var(--bb-text-dim)', fontSize: '8px' }}>CAGR</div>
                                        <div style={{ color: 'var(--bb-green)', fontWeight: 700 }}>+{s.metrics.cagr}%</div>
                                        <div style={{ color: 'var(--bb-text-dim)', fontSize: '8px' }}>SHARPE</div>
                                        <div style={{ color: 'var(--bb-blue)', fontWeight: 700 }}>{s.metrics.sharpe}</div>
                                        <div style={{ color: 'var(--bb-text-dim)', fontSize: '8px' }}>MAX DD</div>
                                        <div style={{ color: 'var(--bb-red)', fontWeight: 700 }}>{s.metrics.maxDD}%</div>
                                        <div style={{ color: 'var(--bb-text-dim)', fontSize: '8px' }}>WIN%</div>
                                        <div style={{ color: 'var(--bb-amber)', fontWeight: 700 }}>{s.metrics.winRate}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Equity Curve */}
                        <div style={{ flex: 1, padding: '0 12px 12px', minHeight: 0 }}>
                            <div style={{ background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', height: '100%', padding: '8px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', marginBottom: '4px' }}>
                                    EQUITY CURVE COMPARISON — NORMALIZED (BASE 100)
                                </div>
                                <div ref={chartRefEquity} style={{ width: '100%', height: 'calc(100% - 24px)' }} />
                            </div>
                        </div>
                    </>
                )}

                {/* ──────────── TAB 2: Backtest Engine ──────────── */}
                {activeTab === 'backtest' && (
                    <>
                        <div className="p-metrics-row" style={{ padding: '12px' }}>
                            {[
                                { label: 'SHARPE RATIO',   val: '2.84',  sub: 'Excessive Alpha',       color: 'var(--bb-green)' },
                                { label: 'PROFIT FACTOR',  val: '1.95',  sub: 'Gross Win / Loss',      color: 'var(--bb-blue)' },
                                { label: 'MAX DRAWDOWN',   val: '-12.4%',sub: 'Recovery: 22 days',     color: 'var(--bb-red)' },
                                { label: 'WIN RATE',       val: '64.2%', sub: 'Trades: 1,248',         color: 'var(--bb-amber)' },
                                { label: 'CALMAR RATIO',   val: '1.48',  sub: 'CAGR / MaxDD',          color: 'var(--bb-green)' },
                            ].map(m => (
                                <div key={m.label} className="p-metric-card" style={{ borderTopColor: m.color }}>
                                    <div className="p-mc-title">{m.label}</div>
                                    <div className="p-mc-val" style={{ color: m.color }}>{m.val}</div>
                                    <div className="p-mc-sub">{m.sub}</div>
                                </div>
                            ))}
                        </div>

                        <div className="m-chart-row" style={{ flex: 1, minHeight: 0, padding: '0 12px' }}>
                            <div className="m-chart-box" style={{ flex: 2 }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', marginBottom: '4px', padding: '8px 8px 0' }}>
                                    STRATEGY VS BENCHMARK (Mean Reversion v1.2)
                                </div>
                                <div ref={chartRefEquity} style={{ width: '100%', height: 'calc(100% - 28px)' }} />
                            </div>
                            <div className="m-chart-box" style={{ flex: 1 }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', marginBottom: '4px', padding: '8px 8px 0' }}>
                                    PROFITABILITY HEATMAP (DAY × HOUR)
                                </div>
                                <div ref={chartRefHeat} style={{ width: '100%', height: 'calc(100% - 28px)' }} />
                            </div>
                        </div>

                        <div className="m-analysis-box" style={{ margin: '12px', flexShrink: 0 }}>
                            <div className="m-ab-title">EXECUTION LOG & QUERY BUILDER — Simple Back-Test</div>
                            <div className="m-ab-text" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                                <span style={{ color: 'var(--bb-text-dim)' }}>[QUERY]</span> SELECT * FROM trades WHERE strategy='mean_reversion' AND pnl &gt; 0 ORDER BY entry_date<br />
                                <span style={{ color: 'var(--bb-text-dim)' }}>[ENGINE]</span> Simulation: 1.2M iterations. NY/LDN overlap alpha identified in JPY pairs.<br />
                                <span style={{ color: 'var(--bb-text-dim)' }}>[RESULT]</span> Historical analog: 2018 Rate Hike Cycle — 78% similarity score.<br />
                                <span style={{ color: 'var(--bb-green)' }}>▶ Suggestion: Increase leverage on EUR/USD during LDN open (07:00-10:00 UTC).</span>
                            </div>
                        </div>
                    </>
                )}

                {/* ──────────── TAB 3: Factors & Risk Premia ──────────── */}
                {activeTab === 'riskparity' && (
                    <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '12px', padding: '12px', overflow: 'hidden' }}>
                        {/* Factor Table */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-amber)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                                RISK PREMIA FACTOR DECOMPOSITION
                            </div>
                            <div style={{ background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', overflow: 'hidden', flex: 1 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(4,12,18,0.8)', borderBottom: '1px solid var(--bb-teal-border)' }}>
                                            {['FACTOR','EST. RET','VOL (ANN)','SHARPE','BEST REGIME'].map(h => (
                                                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '8px', fontWeight: 800, color: 'var(--bb-text-dim)', letterSpacing: '0.1em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {RISK_PREMIA.map((r, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(22,51,68,0.3)' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,184,224,0.04)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <td style={{ padding: '7px 10px', color: 'var(--bb-text)', fontWeight: 700 }}>{r.factor}</td>
                                                <td style={{ padding: '7px 10px', color: 'var(--bb-green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>+{r.ret}%</td>
                                                <td style={{ padding: '7px 10px', color: 'var(--bb-amber)', fontFamily: 'var(--font-mono)' }}>{r.vol}%</td>
                                                <td style={{ padding: '7px 10px', color: r.sharpe > 0.5 ? 'var(--bb-green)' : r.sharpe > 0.3 ? 'var(--bb-amber)' : 'var(--bb-red)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.sharpe.toFixed(2)}</td>
                                                <td style={{ padding: '7px 10px' }}>
                                                    <span style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '8px', fontWeight: 800, letterSpacing: '0.06em', background: 'var(--bb-blue-dim)', color: 'var(--bb-blue)', border: '1px solid rgba(0,184,224,0.2)' }}>
                                                        {r.regime}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Risk Parity explanation */}
                            <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', borderLeft: '3px solid var(--bb-blue)', flexShrink: 0 }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', marginBottom: '4px' }}>RISK PARITY FRAMEWORK</div>
                                <div style={{ fontSize: '10px', color: 'var(--bb-text-dim)', lineHeight: 1.6 }}>
                                    Allocate so each asset contributes <span style={{ color: 'var(--bb-amber)' }}>equal risk</span>, not equal capital.
                                    Bonds are levered 3-4x to match equity volatility. Target portfolio vol: <span style={{ color: 'var(--bb-blue)' }}>12% ann.</span>
                                    Current risk weights: EQ 25% · FI 45% · Cmdty 20% · Crypto 10%
                                </div>
                            </div>
                        </div>

                        {/* Radar Chart */}
                        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                            <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-amber)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                                SHARPE RATIO BY FACTOR (RADAR)
                            </div>
                            <div style={{ flex: 1, background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', minHeight: 0 }}>
                                <div ref={chartRefRP} style={{ width: '100%', height: '100%' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
