import { useState, useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import './PortfolioFullScreen.css';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';
import { X } from 'lucide-react';

const INITIAL_POSITIONS = [
    { ticker: "AAPL", asset: "Equity", dir: "LONG", size: 15000, entry: 165.40, mark: 173.50, risk: "Med" },
    { ticker: "BTCUSD", asset: "Crypto", dir: "LONG", size: 25.5, entry: 61500, mark: 68500, risk: "High" },
    { ticker: "EURUSD", asset: "FX", dir: "SHORT", size: 5000000, entry: 1.0950, mark: 1.0850, risk: "Low" },
    { ticker: "TSLA", asset: "Equity", dir: "SHORT", size: 5000, entry: 195.00, mark: 175.20, risk: "High" },
    { ticker: "US10Y", asset: "Rates", dir: "LONG", size: 10000000, entry: 98.50, mark: 97.20, risk: "Low" },
    { ticker: "NVDA", asset: "Equity", dir: "LONG", size: 2000, entry: 750.00, mark: 890.00, risk: "High" }
];

const DATES = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
});

export default function PortfolioFullScreen() {
    const { setActiveView } = useTerminal();
    const [positions, setPositions] = useState(INITIAL_POSITIONS);
    const [totalEquity, setTotalEquity] = useState(1543820.50);
    const chartRefCurve = useRef<HTMLDivElement>(null);
    const chartRefDonut = useRef<HTMLDivElement>(null);
    const curveInstance = useRef<echarts.ECharts | null>(null);
    const donutInstance = useRef<echarts.ECharts | null>(null);

    // Dynamic HISTORICAL_PNL simulation
    const historicalPnL = useMemo(() => {
        return Array.from({ length: 30 }, (_, i) => {
            return 1000000 + (Math.sin(i / 3) * 50000) + (i * 15000) + (Math.random() * 20000);
        });
    }, []);

    // Price Update Simulation
    useEffect(() => {
        const timer = setInterval(() => {
            setPositions(current => current.map(p => {
                const volatility = p.asset === 'Crypto' ? 0.002 : p.asset === 'FX' ? 0.0001 : 0.0008;
                const change = (Math.random() - 0.5) * p.mark * volatility;
                return { ...p, mark: p.mark + change };
            }));

            setTotalEquity(prev => prev + (Math.random() - 0.48) * 150);
        }, 1500);
        return () => clearInterval(timer);
    }, []);

    // P&L Calculations
    const enhancedPositions = positions.map(p => {
        const diff = p.dir === 'LONG' ? (p.mark - p.entry) : (p.entry - p.mark);
        const pnlValue = diff * p.size;
        const pnlPct = (diff / p.entry) * 100;
        return {
            ...p,
            pnlText: (pnlValue >= 0 ? '+$' : '-$') + Math.abs(pnlValue).toLocaleString(undefined, { maximumFractionDigits: 0 }),
            pnlPctText: (pnlValue >= 0 ? '+' : '') + pnlPct.toFixed(2) + '%',
            isPos: pnlValue >= 0
        };
    });

    // Charts Initialization and Updates
    useEffect(() => {
        if (!chartRefCurve.current || !chartRefDonut.current) return;

        curveInstance.current = echarts.init(chartRefCurve.current);
        donutInstance.current = echarts.init(chartRefDonut.current);

        const optionCurve = {
            backgroundColor: 'transparent',
            title: { text: "Equity Curve (30D)", textStyle: { color: '#00b4dc', fontSize: 13 }, left: '3%' },
            tooltip: { 
                trigger: 'axis', 
                backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' },
                formatter: (params: any) => `${params[0].name}<br/>$${params[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            },
            grid: { left: '8%', right: '5%', bottom: '15%', top: '20%' },
            xAxis: { type: 'category', data: DATES, axisLine: { lineStyle: { color: '#1a3a4a' } }, axisLabel: { color: '#5c8397' } },
            yAxis: { type: 'value', min: 'dataMin', splitLine: { lineStyle: { color: '#1a3a4a', type: 'dashed' } }, axisLabel: { color: '#5c8397', formatter: (val: number) => `$${(val / 1000).toFixed(0)}k` } },
            series: [{
                data: historicalPnL,
                type: 'line', smooth: true, symbol: 'none',
                lineStyle: { width: 3, color: '#00ff8f' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(0, 255, 143, 0.4)' },
                        { offset: 1, color: 'rgba(0, 255, 143, 0.0)' }
                    ])
                }
            }]
        };

        const optionDonut = {
            backgroundColor: 'transparent',
            title: { text: "Asset Allocation", textStyle: { color: '#00b4dc', fontSize: 13 }, left: 'center' },
            tooltip: { trigger: 'item', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            legend: { top: 'bottom', textStyle: { color: '#5c8397' } },
            series: [{
                name: 'Allocation', type: 'pie', radius: ['45%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderColor: '#051418', borderWidth: 2 },
                label: { show: false, position: 'center' },
                data: [
                    { value: 45, name: 'Equities', itemStyle: { color: '#00b4dc' } },
                    { value: 25, name: 'Fixed Income', itemStyle: { color: '#ff9f1c' } },
                    { value: 20, name: 'Crypto', itemStyle: { color: '#ff4d4d' } },
                    { value: 10, name: 'Cash/FX', itemStyle: { color: '#00ff8f' } }
                ]
            }]
        };

        curveInstance.current.setOption(optionCurve);
        donutInstance.current.setOption(optionDonut);

        const resize = () => { curveInstance.current?.resize(); donutInstance.current?.resize(); };
        window.addEventListener('resize', resize);
        return () => { window.removeEventListener('resize', resize); curveInstance.current?.dispose(); donutInstance.current?.dispose(); };
    }, [historicalPnL]);

    // Live Chart Pulse
    useEffect(() => {
        if (!curveInstance.current) return;
        const interval = setInterval(() => {
            const last = historicalPnL[historicalPnL.length - 1];
            const updated = [...historicalPnL.slice(0, -1), last + (Math.random() - 0.5) * 2000];
            curveInstance.current?.setOption({ series: [{ data: updated }] });
        }, 3000);
        return () => clearInterval(interval);
    }, [historicalPnL]);

    // ESC to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveView("DASHBOARD");
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setActiveView]);

    return (
        <div className="port-fs-container macro-fs-container animate-fade">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">PORTFOLIO & RISK MANAGEMENT</h1>
                    <div className="macro-fs-subtitle">REAL-TIME P&L AND EXPOSURE TRACKER • {new Date().toLocaleTimeString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <X size={14} /> CLOSE
                </button>
            </div>

            <div className="port-fs-content">
                <div className="p-metrics-row">
                    <div className="p-metric-card glass">
                        <div className="p-mc-title">TOTAL EQUITY</div>
                        <div className="p-mc-val text-bright">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="p-mc-sub" style={{ color: 'var(--bb-green)' }}>+${(totalEquity - 1529610.5).toLocaleString(undefined, { maximumFractionDigits: 0 })} (Today)</div>
                    </div>
                    <div className="p-metric-card glass">
                        <div className="p-mc-title">YTD RETURN</div>
                        <div className="p-mc-val text-pos">+22.4%</div>
                        <div className="p-mc-sub text-dim">Vs Benchmark: +8.5%</div>
                    </div>
                    <div className="p-metric-card glass">
                        <div className="p-mc-title">MAX DRAWDOWN</div>
                        <div className="p-mc-val text-amber">-8.5%</div>
                        <div className="p-mc-sub text-dim">Recovery: 14 Days</div>
                    </div>
                    <div className="p-metric-card glass">
                        <div className="p-mc-title">SHARPE RATIO</div>
                        <div className="p-mc-val text-pos">2.45</div>
                        <div className="p-mc-sub text-dim">Risk-Adjusted (Ann.)</div>
                    </div>
                    <div className="p-metric-card glass">
                        <div className="p-mc-title">MARGIN UTILIZATION</div>
                        <div className="p-mc-val text-amber">{(42.5 + (Math.random() * 0.2)).toFixed(1)}%</div>
                        <div className="p-mc-sub text-dim">Available: $887k</div>
                    </div>
                </div>

                <div className="p-charts-row">
                    <div className="p-chart-box glass" style={{ flex: 2 }}>
                        <div ref={chartRefCurve} style={{ width: '100%', height: '100%' }}></div>
                    </div>
                    <div className="p-chart-box glass" style={{ flex: 1 }}>
                        <div ref={chartRefDonut} style={{ width: '100%', height: '100%' }}></div>
                    </div>
                </div>

                <div className="p-table-container glass">
                    <div className="a-table-header">
                        <div className="a-table-title">OPEN POSITIONS ({enhancedPositions.length})</div>
                        <div style={{ color: 'var(--bb-text-dim)', fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className="pulse-dot-sm" style={{ background: 'var(--bb-green)' }}></span>
                            LIVE CONNECTED
                        </div>
                    </div>
                    <div className="p-table-body">
                        <table className="p-table">
                            <thead>
                                <tr>
                                    <th>TICKER</th>
                                    <th>ASSET</th>
                                    <th>DIR</th>
                                    <th>SIZE</th>
                                    <th>ENTRY</th>
                                    <th>MARK</th>
                                    <th>P&L ($)</th>
                                    <th>P&L (%)</th>
                                    <th>RISK CAT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enhancedPositions.map((p, i) => (
                                    <tr key={i} className="animate-fade">
                                        <td className="p-name">{p.ticker}</td>
                                        <td style={{ color: 'var(--bb-text-dim)' }}>{p.asset}</td>
                                        <td style={{ color: p.dir === 'LONG' ? 'var(--bb-green)' : 'var(--bb-red)', fontWeight: 'bold' }}>{p.dir}</td>
                                        <td style={{ color: '#fff' }}>{p.size.toLocaleString()}</td>
                                        <td>{p.entry.toLocaleString(undefined, { minimumFractionDigits: p.asset === 'FX' ? 4 : 2 })}</td>
                                        <td className="text-bright fw-800">{p.mark.toLocaleString(undefined, { minimumFractionDigits: p.asset === 'FX' ? 4 : 2 })}</td>
                                        <td style={{ color: p.isPos ? 'var(--bb-green)' : 'var(--bb-red)', fontWeight: 'bold' }}>{p.pnlText}</td>
                                        <td style={{ color: p.isPos ? 'var(--bb-green)' : 'var(--bb-red)' }}>{p.pnlPctText}</td>
                                        <td style={{ color: p.risk === 'High' ? 'var(--bb-red)' : p.risk === 'Med' ? 'var(--bb-amber)' : 'var(--bb-green)' }}>{p.risk}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

