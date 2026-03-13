import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

export default function RiskFullScreen() {
    const { setActiveView } = useTerminal();
    const chartRefVaR = useRef<HTMLDivElement>(null);
    const chartRefExposure = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartRefVaR.current || !chartRefExposure.current) return;

        const chartVaR = echarts.init(chartRefVaR.current);
        const chartExposure = echarts.init(chartRefExposure.current);

        const optionVaR = {
            backgroundColor: 'transparent',
            title: { text: "99% Parametric VaR Distribution", textStyle: { color: '#00b4dc', fontSize: 13 }, left: 'center' },
            tooltip: { trigger: 'axis', backgroundColor: '#0b2730', borderColor: '#1a3a4a', textStyle: { color: '#cbd5e1' } },
            grid: { left: '10%', right: '10%', bottom: '15%', top: '20%' },
            xAxis: { type: 'category', data: ['-3%', '-2%', '-1%', '0%', '1%', '2%', '3%'], axisLine: { lineStyle: { color: '#1a3a4a' } }, axisLabel: { color: '#5c8397' } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: '#1a3a4a', type: 'dashed' } }, axisLabel: { color: '#5c8397' } },
            series: [{
                data: [120, 200, 450, 900, 420, 210, 110],
                type: 'bar',
                itemStyle: {
                    color: function (params: any) {
                        return params.dataIndex < 2 ? '#ff4d4d' : '#00b4dc';
                    }
                },
                markArea: {
                    data: [[{ name: 'Tail Risk', xAxis: '-3%' }, { xAxis: '-2%' }]]
                }
            }]
        };

        const optionExposure = {
            backgroundColor: 'transparent',
            title: { text: "Net Exposure by Sector / Asset Class", textStyle: { color: '#00b4dc', fontSize: 13 }, left: 'center' },
            radar: {
                indicator: [
                    { name: 'Tech', max: 100 },
                    { name: 'Finance', max: 100 },
                    { name: 'Energy', max: 100 },
                    { name: 'Crypto', max: 100 },
                    { name: 'FX', max: 100 },
                    { name: 'Commodities', max: 100 }
                ],
                splitArea: { show: false },
                splitLine: { lineStyle: { color: '#1a3a4a' } },
                axisLine: { lineStyle: { color: '#1a3a4a' } },
                name: { textStyle: { color: '#5c8397' } }
            },
            series: [{
                type: 'radar',
                data: [
                    { value: [80, 40, 60, 90, 30, 50], name: 'Current Allocation', itemStyle: { color: '#ff9f1c' }, areaStyle: { color: 'rgba(255,159,28,0.2)' } }
                ]
            }]
        };

        chartVaR.setOption(optionVaR);
        chartExposure.setOption(optionExposure);

        const resize = () => { chartVaR.resize(); chartExposure.resize(); };
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <div className="macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">RISK ANALYTICS & MONITORING</h1>
                    <div className="macro-fs-subtitle">MULTI-FACTOR RISK & EXPOSURE ENGINE • {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE DASHBOARD</button>
            </div>

            <div className="port-fs-content">
                <div className="p-metrics-row">
                    <div className="p-metric-card" style={{ borderTopColor: '#ff4d4d' }}>
                        <div className="p-mc-title">1D VaR (99%)</div>
                        <div className="p-mc-val">-$32,450</div>
                        <div className="p-mc-sub">2.1% of Equity</div>
                    </div>
                    <div className="p-metric-card">
                        <div className="p-mc-title">NET EXPOSURE</div>
                        <div className="p-mc-val">$1.24M</div>
                        <div className="p-mc-sub">Beta-Adjusted: $1.1M</div>
                    </div>
                    <div className="p-metric-card" style={{ borderTopColor: '#00ff8f' }}>
                        <div className="p-mc-title">VOLATILITY (ANN.)</div>
                        <div className="p-mc-val">14.8%</div>
                        <div className="p-mc-sub">Target: 15.0%</div>
                    </div>
                </div>

                <div className="m-chart-row">
                    <div className="m-chart-box">
                        <div ref={chartRefVaR} style={{ width: '100%', height: '100%' }}></div>
                    </div>
                    <div className="m-chart-box">
                        <div ref={chartRefExposure} style={{ width: '100%', height: '100%' }}></div>
                    </div>
                </div>

                <div className="m-analysis-box">
                    <div className="m-ab-title">STRESS TEST: MONTE CARLO SIMULATION (10,000 PATHS)</div>
                    <div className="m-ab-text" style={{ fontSize: '12px' }}>
                        Current portfolio shows heightened sensitivity to Tech sector pullbacks. 
                        <strong> Scenario: Dot-Com Style Crash (-20%)</strong> would result in estimated loss of $245,000 (15.8% drawdown). 
                        <strong> Scenario: Global Inflation Spike (+2%)</strong> would be partially hedged by current Commodities and Gold exposure, limiting loss to $45,000.
                        Diversification score: 82/100 (Optimal).
                    </div>
                </div>
            </div>
        </div>
    );
}
