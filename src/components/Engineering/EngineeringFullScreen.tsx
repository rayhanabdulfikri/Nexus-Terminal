import { useEffect, useRef, useState, useCallback } from 'react';
import * as echarts from 'echarts';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

// ── Strategy definitions ──
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

// ── Backtest dummy trade log ──
const BACKTEST_TRADES = [
    { date: '2024-01-05', ticker: 'EURUSD', side: 'LONG', entry: '1.0722', exit: '1.0850', pnl: '+$1,280', pips: '+128', duration: '3d', result: 'WIN' },
    { date: '2024-01-12', ticker: 'USDJPY', side: 'SHORT', entry: '145.80', exit: '143.20', pnl: '+$2,600', pips: '+260', duration: '5d', result: 'WIN' },
    { date: '2024-01-19', ticker: 'XAUUSD', side: 'LONG', entry: '2022.50', exit: '2009.00', pnl: '-$1,350', pips: '-135', duration: '2d', result: 'LOSS' },
    { date: '2024-01-26', ticker: 'GBPUSD', side: 'LONG', entry: '1.2680', exit: '1.2742', pnl: '+$620', pips: '+62', duration: '1d', result: 'WIN' },
    { date: '2024-02-02', ticker: 'BTCUSD', side: 'LONG', entry: '42100', exit: '45800', pnl: '+$3,700', pips: '+3700', duration: '8d', result: 'WIN' },
    { date: '2024-02-09', ticker: 'EURUSD', side: 'SHORT', entry: '1.0790', exit: '1.0820', pnl: '-$300', pips: '-30', duration: '1d', result: 'LOSS' },
    { date: '2024-02-16', ticker: 'USDJPY', side: 'LONG', entry: '149.20', exit: '150.85', pnl: '+$1,650', pips: '+165', duration: '4d', result: 'WIN' },
    { date: '2024-02-23', ticker: 'XAUUSD', side: 'LONG', entry: '2030.00', exit: '2064.50', pnl: '+$3,450', pips: '+345', duration: '6d', result: 'WIN' },
];

// ── Animated equity curve for backtest ──
function generateBacktestEquity(numPoints: number) {
    const data: { x: string; strategy: number; benchmark: number }[] = [];
    let strat = 100, bench = 100;
    const startDate = new Date('2023-01-01');
    for (let i = 0; i < numPoints; i++) {
        const date = new Date(startDate.getTime() + i * 7 * 86400000);
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        strat = strat * (1 + (Math.random() - 0.37) * 0.025);
        bench = bench * (1 + (Math.random() - 0.46) * 0.018);
        data.push({ x: label, strategy: parseFloat(strat.toFixed(2)), benchmark: parseFloat(bench.toFixed(2)) });
    }
    return data;
}

const FULL_BACKTEST_DATA = generateBacktestEquity(60);

export default function EngineeringFullScreen() {
    const { setActiveView } = useTerminal();
    const [activeTab, setActiveTab] = useState<"systematic" | "backtest" | "riskparity">("systematic");
    const [activeStrategy, setActiveStrategy] = useState("momentum");
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [visiblePoints, setVisiblePoints] = useState(FULL_BACKTEST_DATA.length);
    const [liveLog, setLiveLog] = useState<string[]>([]);
    const [backtestMetrics, setBacktestMetrics] = useState({ sharpe: 2.84, pf: 1.95, maxDD: -12.4, winRate: 64.2, calmar: 1.48 });

    const chartRefEquity = useRef<HTMLDivElement>(null);
    const chartRefHeat   = useRef<HTMLDivElement>(null);
    const chartRefRP     = useRef<HTMLDivElement>(null);
    const chartRefBT     = useRef<HTMLDivElement>(null);

    // ESC to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveView('DASHBOARD'); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [setActiveView]);

    // ── Real-time fluctuating metrics for sidebar ──
    useEffect(() => {
        const interval = setInterval(() => {
            setBacktestMetrics(prev => ({
                sharpe: parseFloat((prev.sharpe + (Math.random() - 0.5) * 0.04).toFixed(2)),
                pf: parseFloat((prev.pf + (Math.random() - 0.5) * 0.02).toFixed(2)),
                maxDD: parseFloat((prev.maxDD + (Math.random() - 0.5) * 0.15).toFixed(1)),
                winRate: parseFloat((prev.winRate + (Math.random() - 0.5) * 0.2).toFixed(1)),
                calmar: parseFloat((prev.calmar + (Math.random() - 0.5) * 0.02).toFixed(2)),
            }));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // ── Run Backtest animation ──
    const runBacktest = useCallback(() => {
        if (isRunning) return;
        setIsRunning(true);
        setProgress(0);
        setVisiblePoints(0);
        setLiveLog([]);

        const logMessages = [
            '[ENGINE] Initializing Mean Reversion v1.2 strategy...',
            '[DATA] Loading 5-year OHLCV data: EURUSD, USDJPY, XAUUSD, BTCUSD...',
            '[ENGINE] Running 1,200,000 Monte Carlo iterations...',
            '[FILTER] Applying regime filter: Expansion & Risk-On only...',
            '[SIGNAL] Entry criteria: Z-score > 2.0, RSI < 35 or > 65...',
            '[RISK] Position sizing: 25bps risk per trade, max 4 concurrent...',
            '[EXEC] Simulating slippage: 0.5 pips average, 2 pips spike...',
            '[RESULT] NY/LDN overlap alpha identified in JPY pairs...',
            '[RESULT] Historical analog: 2018 Rate Hike Cycle — 78% similarity...',
            '[COMPLETE] ▶ Backtest complete. 1,248 trades simulated.',
            '[SUGGEST] Increase leverage on EUR/USD during LDN open (07:00-10:00 UTC).',
        ];

        let step = 0;
        const total = FULL_BACKTEST_DATA.length;
        const interval = setInterval(() => {
            step++;
            const pct = Math.round((step / total) * 100);
            setProgress(pct);
            setVisiblePoints(step);

            // Add log messages at key steps
            const logIdx = Math.floor((step / total) * logMessages.length);
            setLiveLog(() => logMessages.slice(0, logIdx + 1));

            if (step >= total) {
                clearInterval(interval);
                setIsRunning(false);
            }
        }, 60);
    }, [isRunning]);

    // ── Equity curve chart (strategy comparison tab) ──
    useEffect(() => {
        if (!chartRefEquity.current || activeTab !== 'systematic') return;
        const chart = echarts.init(chartRefEquity.current);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            legend: { data: STRATEGIES.map(s => s.label), bottom: 0, textStyle: { color: '#5c8397' }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
            grid: { left: '6%', right: '3%', bottom: '12%', top: '8%' },
            xAxis: { type: 'category', data: MONTHS, axisLabel: { color: '#5c8397', fontSize: 10 }, axisLine: { lineStyle: { color: '#163344' } } },
            yAxis: { type: 'value', axisLabel: { color: '#5c8397', fontSize: 10 }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } } },
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
    }, [activeStrategy, activeTab]);

    // ── Heatmap chart ──
    useEffect(() => {
        if (!chartRefHeat.current || activeTab !== 'systematic') return;
        const chart = echarts.init(chartRefHeat.current);
        const days = ['Mon','Tue','Wed','Thu','Fri'];
        const hours = Array.from({length: 24}, (_, i) => `${i}h`);
        const data: [number, number, number][] = [];
        for (let d = 0; d < 5; d++) {
            for (let h = 0; h < 24; h++) {
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
    }, [activeTab]);

    // ── Backtest equity chart ── init once, update on each visiblePoints change
    useEffect(() => {
        if (!chartRefBT.current || activeTab !== 'backtest') return;
        // Get existing instance or init new one
        let chart = echarts.getInstanceByDom(chartRefBT.current);
        if (!chart) chart = echarts.init(chartRefBT.current);
        const sliced = FULL_BACKTEST_DATA.slice(0, Math.max(visiblePoints, 1));
        chart.setOption({
            backgroundColor: 'transparent',
            animation: false,
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1', fontSize: 10 } },
            legend: { data: ['STRATEGY', 'BENCHMARK'], bottom: 0, textStyle: { color: '#5c8397', fontSize: 9 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
            grid: { left: '6%', right: '3%', bottom: '12%', top: '8%' },
            xAxis: { type: 'category', data: sliced.map(d => d.x), axisLabel: { color: '#5c8397', fontSize: 8, interval: Math.max(0, Math.floor(sliced.length / 8)) }, axisLine: { lineStyle: { color: '#163344' } }, boundaryGap: false },
            yAxis: { type: 'value', axisLabel: { color: '#5c8397', fontSize: 9, formatter: '{value}' }, splitLine: { lineStyle: { color: '#163344', type: 'dashed' } } },
            series: [
                {
                    name: 'STRATEGY', type: 'line',
                    data: sliced.map(d => d.strategy),
                    itemStyle: { color: '#00e676' },
                    lineStyle: { color: '#00e676', width: 2 },
                    areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0,230,118,0.2)' }, { offset: 1, color: 'rgba(0,230,118,0)' }]) },
                    smooth: true, symbolSize: 0,
                },
                {
                    name: 'BENCHMARK', type: 'line',
                    data: sliced.map(d => d.benchmark),
                    itemStyle: { color: '#5c8397' },
                    lineStyle: { color: '#5c8397', width: 1.5, type: 'dashed' },
                    smooth: true, symbolSize: 0,
                },
            ],
        }, false); // merge=false to replace, no full reinit
        const resize = () => chart && chart.resize();
        window.addEventListener('resize', resize);
        return () => {
            window.removeEventListener('resize', resize);
            // Don't dispose on every tick — only when tab changes
        };
    }, [activeTab, visiblePoints]);

    // Dispose backtest chart when leaving tab
    useEffect(() => {
        if (activeTab !== 'backtest' && chartRefBT.current) {
            const inst = echarts.getInstanceByDom(chartRefBT.current);
            if (inst) inst.dispose();
        }
    }, [activeTab]);

    // ── Risk Premia radar chart ──
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--bb-text-dim)' }}><span className="kbd" style={{ fontSize: '9px' }}>ESC</span> CLOSE</span>
                    <button className="macro-fs-close" onClick={() => setActiveView('DASHBOARD')}>✕ CLOSE</button>
                </div>
            </div>

            {/* Tab Bar */}
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
                    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                        {/* Left Panel: Controls + Metrics */}
                        <div style={{ width: '260px', borderRight: '1px solid var(--bb-teal-border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
                            {/* Config */}
                            <div style={{ padding: '12px', borderBottom: '1px solid var(--bb-teal-border)', flexShrink: 0 }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-amber)', letterSpacing: '0.12em', marginBottom: '10px' }}>BACKTEST CONFIGURATION</div>
                                {[
                                    { label: 'STRATEGY', value: 'Mean Reversion v1.2' },
                                    { label: 'UNIVERSE', value: 'G10 FX + Gold + BTC' },
                                    { label: 'PERIOD', value: 'Jan 2023 – Dec 2024' },
                                    { label: 'INITIAL CAPITAL', value: '$10,000,000' },
                                    { label: 'RISK/TRADE', value: '0.25% (25bps)' },
                                    { label: 'SLIPPAGE', value: '0.5 pips avg' },
                                    { label: 'COMMISSION', value: '$5/100K notional' },
                                ].map(r => (
                                    <div key={r.label} style={{ display: 'flex', flexDirection: 'column', padding: '4px 0', borderBottom: '1px solid rgba(22,51,68,0.3)' }}>
                                        <span style={{ fontSize: '8px', color: 'var(--bb-text-dim)', fontWeight: 800, letterSpacing: '0.08em' }}>{r.label}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--bb-text)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>{r.value}</span>
                                    </div>
                                ))}
                                <button onClick={runBacktest} disabled={isRunning} style={{
                                    width: '100%', marginTop: '12px', padding: '9px', cursor: isRunning ? 'wait' : 'pointer',
                                    background: isRunning ? 'rgba(0,184,224,0.1)' : 'linear-gradient(135deg, #003a1a, #00802a)',
                                    color: isRunning ? 'var(--bb-blue)' : '#00ff8f',
                                    fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', borderRadius: '2px',
                                    border: '1px solid rgba(0,255,143,0.2)',
                                }}>
                                    {isRunning ? `▶ RUNNING... ${progress}%` : '▶ RUN BACKTEST'}
                                </button>
                                {isRunning && (
                                    <div style={{ marginTop: '6px', background: 'rgba(22,51,68,0.5)', borderRadius: '2px', height: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', background: 'linear-gradient(90deg, #00b8e0, #00ff8f)', width: `${progress}%`, transition: 'width 0.1s' }} />
                                    </div>
                                )}
                            </div>

                            {/* Live Metrics */}
                            <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.12em', marginBottom: '10px' }}>LIVE PERFORMANCE METRICS</div>
                                {[
                                    { label: 'SHARPE RATIO', value: backtestMetrics.sharpe.toFixed(2), color: 'var(--bb-green)', sub: 'Risk-Adj Return' },
                                    { label: 'PROFIT FACTOR', value: backtestMetrics.pf.toFixed(2), color: 'var(--bb-blue)', sub: 'Gross Win / Loss' },
                                    { label: 'MAX DRAWDOWN', value: `${backtestMetrics.maxDD.toFixed(1)}%`, color: 'var(--bb-red)', sub: 'Peak-to-Trough' },
                                    { label: 'WIN RATE', value: `${backtestMetrics.winRate.toFixed(1)}%`, color: 'var(--bb-amber)', sub: '1,248 trades' },
                                    { label: 'CALMAR RATIO', value: backtestMetrics.calmar.toFixed(2), color: 'var(--bb-green)', sub: 'CAGR / MaxDD' },
                                ].map(m => (
                                    <div key={m.label} style={{ marginBottom: '10px', padding: '8px 10px', background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderLeft: `3px solid ${m.color}`, borderRadius: '2px' }}>
                                        <div style={{ fontSize: '8px', color: 'var(--bb-text-dim)', fontWeight: 800, letterSpacing: '0.08em' }}>{m.label}</div>
                                        <div style={{ fontSize: '18px', color: m.color, fontFamily: 'var(--font-mono)', fontWeight: 800, marginTop: '2px', transition: 'all 0.3s' }}>{m.value}</div>
                                        <div style={{ fontSize: '8px', color: 'var(--bb-text-dim)', marginTop: '1px' }}>{m.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Chart + Log + Trade Table */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
                            {/* Chart — explicit height so echarts can measure */}
                            <div style={{ padding: '12px', flexShrink: 0 }}>
                                <div style={{ background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', height: '280px', padding: '8px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', marginBottom: '4px' }}>
                                        EQUITY CURVE — STRATEGY vs BENCHMARK (BASE 100)
                                    </div>
                                    <div ref={chartRefBT} style={{ width: '100%', height: 'calc(100% - 24px)' }} />
                                </div>
                            </div>

                            {/* Execution Log */}
                            <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
                                <div style={{ background: 'rgba(2,8,14,0.9)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', padding: '8px 12px', maxHeight: '120px', overflowY: 'auto' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-amber)', letterSpacing: '0.1em', marginBottom: '6px' }}>EXECUTION LOG</div>
                                    {liveLog.length === 0 ? (
                                        <div style={{ fontSize: '10px', color: 'var(--bb-text-dim)', fontFamily: 'var(--font-mono)' }}>Press RUN BACKTEST to begin simulation...</div>
                                    ) : (
                                        liveLog.map((line, i) => (
                                            <div key={i} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: line.includes('RESULT') || line.includes('SUGGEST') || line.includes('COMPLETE') ? 'var(--bb-green)' : 'var(--bb-text-dim)', lineHeight: 1.6 }}>
                                                {line}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Trade Log Table */}
                            <div style={{ padding: '0 12px 12px', flexShrink: 0 }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-amber)', letterSpacing: '0.1em', marginBottom: '6px' }}>SAMPLE TRADE LOG</div>
                                <div style={{ background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(4,12,18,0.9)', borderBottom: '1px solid var(--bb-teal-border)' }}>
                                                {['DATE', 'TICKER', 'SIDE', 'ENTRY', 'EXIT', 'PIPS', 'P&L', 'DURATION', 'RESULT'].map(h => (
                                                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '8px', fontWeight: 800, color: 'var(--bb-text-dim)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {BACKTEST_TRADES.map((t, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(22,51,68,0.3)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,184,224,0.04)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <td style={{ padding: '5px 8px', color: 'var(--bb-text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{t.date}</td>
                                                    <td style={{ padding: '5px 8px', color: 'var(--bb-amber)', fontWeight: 800 }}>{t.ticker}</td>
                                                    <td style={{ padding: '5px 8px', color: t.side === 'LONG' ? '#00ff8f' : '#ff4d4d', fontWeight: 800 }}>{t.side}</td>
                                                    <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)' }}>{t.entry}</td>
                                                    <td style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)' }}>{t.exit}</td>
                                                    <td style={{ padding: '5px 8px', color: t.result === 'WIN' ? '#00ff8f' : '#ff4d4d', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{t.pips}</td>
                                                    <td style={{ padding: '5px 8px', color: t.result === 'WIN' ? '#00ff8f' : '#ff4d4d', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{t.pnl}</td>
                                                    <td style={{ padding: '5px 8px', color: 'var(--bb-text-dim)', fontFamily: 'var(--font-mono)' }}>{t.duration}</td>
                                                    <td style={{ padding: '5px 8px' }}>
                                                        <span style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '8px', fontWeight: 800, background: t.result === 'WIN' ? 'rgba(0,255,143,0.1)' : 'rgba(255,77,77,0.1)', color: t.result === 'WIN' ? '#00ff8f' : '#ff4d4d', border: `1px solid ${t.result === 'WIN' ? 'rgba(0,255,143,0.2)' : 'rgba(255,77,77,0.2)'}` }}>
                                                            {t.result}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ──────────── TAB 3: Factors & Risk Premia ──────────── */}
                {activeTab === 'riskparity' && (
                    <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '12px', padding: '12px', overflow: 'hidden' }}>
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
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
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
                            <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(8,22,30,0.6)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', borderLeft: '3px solid var(--bb-blue)', flexShrink: 0 }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.1em', marginBottom: '4px' }}>RISK PARITY FRAMEWORK</div>
                                <div style={{ fontSize: '10px', color: 'var(--bb-text-dim)', lineHeight: 1.6 }}>
                                    Allocate so each asset contributes <span style={{ color: 'var(--bb-amber)' }}>equal risk</span>, not equal capital.
                                    Bonds are levered 3-4x to match equity volatility. Target portfolio vol: <span style={{ color: 'var(--bb-blue)' }}>12% ann.</span>
                                    Current risk weights: EQ 25% · FI 45% · Cmdty 20% · Crypto 10%
                                </div>
                            </div>
                        </div>
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
