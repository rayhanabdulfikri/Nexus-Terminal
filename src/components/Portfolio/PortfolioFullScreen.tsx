import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import './PortfolioFullScreen.css';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

const POSITIONS = [
    { ticker: "AAPL", asset: "Equity", dir: "LONG", size: "15,000", entry: 165.40, mark: 173.50, pnl: "+$121,500", pnlPct: "+4.89%", risk: "Med" },
    { ticker: "BTCUSD", asset: "Crypto", dir: "LONG", size: "25.5", entry: 61500, mark: 68500, pnl: "+$178,500", pnlPct: "+11.38%", risk: "High" },
    { ticker: "EURUSD", asset: "FX", dir: "SHORT", size: "5M", entry: 1.0950, mark: 1.0850, pnl: "+$50,000", pnlPct: "+0.91%", risk: "Low" },
    { ticker: "TSLA", asset: "Equity", dir: "SHORT", size: "5,000", entry: 195.00, mark: 175.20, pnl: "+$99,000", pnlPct: "+10.15%", risk: "High" },
    { ticker: "US10Y", asset: "Rates", dir: "LONG", size: "10M", entry: 98.50, mark: 97.20, pnl: "-$130,000", pnlPct: "-1.31%", risk: "Low" },
    { ticker: "NVDA", asset: "Equity", dir: "LONG", size: "2,000", entry: 750.00, mark: 890.00, pnl: "+$280,000", pnlPct: "+18.66%", risk: "High" }
];

const HISTORICAL_PNL = Array.from({ length: 30 }, (_, i) => {
    return 1000000 + (Math.sin(i / 3) * 50000) + (i * 15000) + (Math.random() * 20000);
});
const DATES = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
});

export default function PortfolioFullScreen() {
    const { setActiveView } = useTerminal();
    const chartRefCurve = useRef<HTMLDivElement>(null);
    const chartRefDonut = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartRefCurve.current || !chartRefDonut.current) return;

        const chartCurve = echarts.init(chartRefCurve.current);
        const chartDonut = echarts.init(chartRefDonut.current);

        const optionCurve = {
            backgroundColor: 'transparent',
            title: { text: "Equity Curve (30D)", textStyle: { color: '#00b4dc', fontSize: 13 }, left: '3%' },
            tooltip: { 
                trigger: 'axis', 
                backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' },
                formatter: function (params: any) {
                    return `${params[0].name}<br/>$${params[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                }
            },
            grid: { left: '8%', right: '5%', bottom: '15%', top: '20%' },
            xAxis: { type: 'category', data: DATES, axisLine: { lineStyle: { color: '#1a3a4a' } }, axisLabel: { color: '#5c8397' } },
            yAxis: { type: 'value', min: 'dataMin', splitLine: { lineStyle: { color: '#1a3a4a', type: 'dashed' } }, axisLabel: { color: '#5c8397', formatter: (val: number) => `$${(val / 1000).toFixed(0)}k` } },
            series: [{
                data: HISTORICAL_PNL,
                type: 'line',
                smooth: true,
                symbol: 'none',
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
            series: [
                {
                    name: 'Allocation',
                    type: 'pie',
                    radius: ['45%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderColor: '#051418', borderWidth: 2 },
                    label: { show: false, position: 'center' },
                    labelLine: { show: false },
                    data: [
                        { value: 45, name: 'Equities', itemStyle: { color: '#00b4dc' } },
                        { value: 25, name: 'Fixed Income', itemStyle: { color: '#ff9f1c' } },
                        { value: 20, name: 'Crypto', itemStyle: { color: '#ff4d4d' } },
                        { value: 10, name: 'Cash/FX', itemStyle: { color: '#00ff8f' } }
                    ]
                }
            ]
        };

        chartCurve.setOption(optionCurve);
        chartDonut.setOption(optionDonut);

        const resize = () => { chartCurve.resize(); chartDonut.resize(); };
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <div className="port-fs-container macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">PORTFOLIO & RISK MANAGEMENT</h1>
                    <div className="macro-fs-subtitle">REAL-TIME P&L AND EXPOSURE TRACKER • {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE DASHBOARD</button>
            </div>

            <div className="port-fs-content">
                {/* Metrics Row */}
                <div className="p-metrics-row">
                    <div className="p-metric-card">
                        <div className="p-mc-title">TOTAL EQUITY</div>
                        <div className="p-mc-val">$1,543,820.50</div>
                        <div className="p-mc-sub" style={{ color: 'var(--bb-green)' }}>+$14,210.00 (Today)</div>
                    </div>
                    <div className="p-metric-card">
                        <div className="p-mc-title">YTD RETURN</div>
                        <div className="p-mc-val text-pos">+22.4%</div>
                        <div className="p-mc-sub text-dim">Vs Benchmark: +8.5%</div>
                    </div>
                    <div className="p-metric-card">
                        <div className="p-mc-title">MAX DRAWDOWN</div>
                        <div className="p-mc-val text-amber">-8.5%</div>
                        <div className="p-mc-sub text-dim">Recovery: 14 Days</div>
                    </div>
                    <div className="p-metric-card">
                        <div className="p-mc-title">SHARPE RATIO</div>
                        <div className="p-mc-val text-pos">2.45</div>
                        <div className="p-mc-sub text-dim">Risk-Adjusted (Ann.)</div>
                    </div>
                    <div className="p-metric-card">
                        <div className="p-mc-title">MARGIN UTILIZATION</div>
                        <div className="p-mc-val text-amber">42.5%</div>
                        <div className="p-mc-sub text-dim">Available: $887k</div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="p-charts-row">
                    <div className="p-chart-box" style={{ flex: 2 }}>
                        <div ref={chartRefCurve} style={{ width: '100%', height: '100%' }}></div>
                    </div>
                    <div className="p-chart-box" style={{ flex: 1 }}>
                        <div ref={chartRefDonut} style={{ width: '100%', height: '100%' }}></div>
                    </div>
                </div>

                {/* Table Row */}
                <div className="p-table-container">
                    <div className="a-table-header">
                        <div className="a-table-title">OPEN POSITIONS ({POSITIONS.length})</div>
                        <div style={{ color: 'var(--bb-text-dim)', fontSize: '11px' }}>Sorted by: Unrealized P&L</div>
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
                                {POSITIONS.map((p, i) => (
                                    <tr key={i}>
                                        <td className="p-name">{p.ticker}</td>
                                        <td style={{ color: 'var(--bb-text-dim)' }}>{p.asset}</td>
                                        <td style={{ color: p.dir === 'LONG' ? 'var(--bb-green)' : 'var(--bb-red)', fontWeight: 'bold' }}>{p.dir}</td>
                                        <td>{p.size}</td>
                                        <td>{p.entry.toLocaleString(undefined, { minimumFractionDigits: p.asset === 'FX' ? 4 : 2 })}</td>
                                        <td>{p.mark.toLocaleString(undefined, { minimumFractionDigits: p.asset === 'FX' ? 4 : 2 })}</td>
                                        <td style={{ color: p.pnl.startsWith('+') ? 'var(--bb-green)' : 'var(--bb-red)', fontWeight: 'bold' }}>{p.pnl}</td>
                                        <td style={{ color: p.pnlPct.startsWith('+') ? 'var(--bb-green)' : 'var(--bb-red)' }}>{p.pnlPct}</td>
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
