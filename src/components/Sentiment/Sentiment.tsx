import { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import "./Sentiment.css";
import { useTerminal } from "../../context/TerminalContext";

type MainTab = 'COT' | 'RETAIL';
type ActionTab = 'OVERVIEW' | 'EXPLORER' | 'COMPARE' | 'TABLE';

interface COTData {
    instrument: string;
    ccy: string;
    oi: number;
    lev: { net: number, chg: number };
    am: { net: number, chg: number };
    dlr: { net: number };
    netPct: number;
    zScore: number;
    pct52w: number;
}

const cotTableData: COTData[] = [
    { instrument: 'EUR', ccy: 'Euro FX', oi: 588432, lev: { net: 14200, chg: -4100 }, am: { net: 48200, chg: 2100 }, dlr: { net: -62400 }, netPct: 10.4, zScore: 0.8, pct52w: 68 },
    { instrument: 'JPY', ccy: 'Japanese Yen', oi: 242190, lev: { net: -112400, chg: -12400 }, am: { net: 84100, chg: 5400 }, dlr: { net: 28300 }, netPct: -46.4, zScore: -2.4, pct52w: 4 },
    { instrument: 'GBP', ccy: 'British Pound', oi: 215400, lev: { net: 42100, chg: 8200 }, am: { net: -18400, chg: -1100 }, dlr: { net: -23700 }, netPct: 19.5, zScore: 1.6, pct52w: 82 },
    { instrument: 'AUD', ccy: 'Australian Dollar', oi: 184500, lev: { net: -74200, chg: -3100 }, am: { net: 32400, chg: 1200 }, dlr: { net: 41800 }, netPct: -40.2, zScore: -1.8, pct52w: 12 },
    { instrument: 'CAD', ccy: 'Canadian Dollar', oi: 162100, lev: { net: -48200, chg: 1400 }, am: { net: 21400, chg: 800 }, dlr: { net: 26800 }, netPct: -29.7, zScore: -1.2, pct52w: 24 },
    { instrument: 'CHF', ccy: 'Swiss Franc', oi: 88400, lev: { net: -22100, chg: -2400 }, am: { net: 8400, chg: 200 }, dlr: { net: 13700 }, netPct: -25.0, zScore: -0.9, pct52w: 31 },
    { instrument: 'MXN', ccy: 'Mexican Peso', oi: 142000, lev: { net: 82400, chg: 5200 }, am: { net: -21400, chg: -400 }, dlr: { net: -61000 }, netPct: 58.0, zScore: 2.1, pct52w: 94 },
];

interface SentimentProps {
    defaultView?: string;
}

const Sentiment = ({ defaultView = 'COT' }: SentimentProps) => {
    const { setActiveTicker } = useTerminal();
    const [mainTab, setMainTab] = useState<MainTab>('COT');
    const [actionTab, setActionTab] = useState<ActionTab>('OVERVIEW');
    const chartRef = useRef<HTMLDivElement>(null);
    const [selectedAsset, setSelectedAsset] = useState('Euro FX');
    const [explorerType, setExplorerType] = useState<'NET' | 'LS' | 'OI'>('NET');

    // Retail mock data with state for live updates
    const [retailData, setRetailData] = useState([
        { pair: 'EUR/USD', long_pct: 38, short_pct: 62, net_vol: -14201 },
        { pair: 'USD/JPY', long_pct: 64, short_pct: 36, net_vol: 8241 },
        { pair: 'GBP/USD', long_pct: 33, short_pct: 67, net_vol: -11029 },
        { pair: 'AUD/USD', long_pct: 74, short_pct: 26, net_vol: 5422 },
        { pair: 'USD/CHF', long_pct: 55, short_pct: 45, net_vol: 2101 },
        { pair: 'NZD/USD', long_pct: 58, short_pct: 42, net_vol: 1401 },
        { pair: 'XAU/USD', long_pct: 82, short_pct: 18, net_vol: 22401 },
    ]);

    // Overview gauges state
    const [gauges, setGauges] = useState([
        { label: 'OVERALL BIAS', val: 'BULLISH', score: 72, color: 'var(--bb-green)', sub: 'Based on top primary assets' },
        { label: 'EXTREMITY', val: 'LOW', score: 28, color: 'var(--bb-blue)', sub: 'Pairs exceeding 2.0σ or 70%' },
        { label: 'CROWD POWER', val: 'STRONG', score: 84, color: 'var(--bb-blue)', sub: 'Volume weighted momentum' },
        { label: 'SIGNAL COUNT', val: '4 ACTIVE', score: 40, color: 'var(--bb-blue)', sub: 'Divergence and contra setups' },
    ]);

    // Live sentiment updates
    useEffect(() => {
        const timer = setInterval(() => {
            // Update retail
            setRetailData(prev => prev.map(p => {
                if (Math.random() > 0.7) {
                    const shift = Math.random() > 0.5 ? 1 : -1;
                    const newLong = Math.max(10, Math.min(90, p.long_pct + shift));
                    return { ...p, long_pct: newLong, short_pct: 100 - newLong, net_vol: p.net_vol + (Math.random() - 0.5) * 100 };
                }
                return p;
            }));

            // Update gauges
            setGauges(prev => prev.map(g => ({
                ...g,
                score: Math.max(5, Math.min(95, g.score + (Math.random() - 0.5) * 3))
            })));
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (defaultView === 'COT' || defaultView === 'RETAIL') {
            setMainTab(defaultView as MainTab);
        } else if (defaultView === 'EXPLORER') {
            setActionTab('EXPLORER');
        }
    }, [defaultView]);

    useEffect(() => {
        if (actionTab === 'EXPLORER' && chartRef.current) {
            const chart = echarts.init(chartRef.current, 'dark');
            const data = explorerType === 'NET' 
                ? [10, 22, 18, 35, 42, 38, 44, 42, 55, 48, 52, 60]
                : explorerType === 'LS' 
                ? [60, 62, 58, 65, 72, 68, 74, 72, 85, 78, 82, 90]
                : [500, 520, 510, 530, 550, 540, 560, 555, 580, 570, 585, 600];

            chart.setOption({
                backgroundColor: 'transparent',
                tooltip: { trigger: 'axis' },
                grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
                xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], axisLine: { lineStyle: { color: '#1a3a4a' } } },
                yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1a3a4a' } }, splitLine: { lineStyle: { color: '#0f3b45', type: 'dashed' } } },
                series: [{
                    name: selectedAsset,
                    type: 'line',
                    smooth: true,
                    data: data,
                    lineStyle: { color: '#00b4dc', width: 3 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(0,180,220,0.3)' },
                            { offset: 1, color: 'rgba(0,180,220,0.05)' }
                        ])
                    },
                    itemStyle: { color: '#00b4dc' }
                }]
            });
            return () => chart.dispose();
        }
    }, [actionTab, explorerType, selectedAsset]);

    const renderGauge = (label: string, value: string, color: string, sub: string, score: number) => (
        <div className="tp-gauge-box animate-fade">
            <div className="tp-gauge-label">{label}</div>
            <div className="tp-gauge-main">
                <span className="tp-gauge-val" style={{ color }}>{value}</span>
                <div className="tp-gauge-track">
                    <div className="tp-gauge-fill" style={{ background: color, width: `${score}%`, boxShadow: `0 0 10px ${color}`, transition: 'width 0.8s ease-out' }}></div>
                </div>
            </div>
            <div className="tp-gauge-sub">{sub}</div>
        </div>
    );

    return (
        <div className="tp-container animate-fade">
            {/* Sub Nav */}
            <div className="tp-sub-nav glass">
                <div className={`tp-nav-item ${mainTab === 'COT' ? 'active' : ''}`} onClick={() => setMainTab('COT')}>
                    <span className="tp-nav-icon">▥</span> COMMITMENT OF TRADERS
                </div>
                <div className={`tp-nav-item ${mainTab === 'RETAIL' ? 'active' : ''}`} onClick={() => setMainTab('RETAIL')}>
                    <span className="tp-nav-icon">⊟</span> RETAIL SENTIMENT
                </div>
                <div style={{ flex: 1 }}></div>
                <div className="tp-connection-status">
                    <span className="pulse-dot"></span>
                    TERMINAL PRO L1.5 CONNECTED
                </div>
            </div>

            {/* Action Bar */}
            <div className="tp-action-bar">
                {(['OVERVIEW', 'EXPLORER', 'COMPARE', 'TABLE'] as ActionTab[]).map(tab => (
                    <button 
                        key={tab} 
                        className={`tp-btn-tab ${actionTab === tab ? 'active' : ''}`} 
                        onClick={() => setActionTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {actionTab === 'TABLE' && (
                <div className="tp-table-container animate-fade">
                    <div className={`tp-banner ${mainTab === 'COT' ? 'cot-banner' : 'retail-banner'}`}>
                        <span className="tp-badge">{mainTab === 'COT' ? 'INSTITUTIONAL' : 'RETAIL'}</span>
                        <span className="tp-banner-title">{mainTab === 'COT' ? 'COMMITMENT OF TRADERS ANALYSIS' : 'BROKER SENTIMENT FEED'}</span>
                        <span className="tp-banner-meta">{mainTab === 'COT' ? 'Source: CFTC Weekly' : 'Source: Multi-Broker Live'}</span>
                    </div>

                    {mainTab === 'COT' ? (
                        <table className="tp-table-premium">
                            <thead>
                                <tr>
                                    <th>Instrument</th>
                                    <th>OI (K)</th>
                                    <th className="border-l">LEV Net</th>
                                    <th>Wkly Δ</th>
                                    <th className="border-l">AM Net</th>
                                    <th>Wkly Δ</th>
                                    <th className="border-l">Net%OI</th>
                                    <th>Z-Score</th>
                                    <th style={{ width: '100px' }}>52w Pct</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cotTableData.map((row, i) => (
                                    <tr key={i} className="tp-row-premium">
                                        <td>{row.instrument} <span className="fs-9 text-dim">{row.ccy}</span></td>
                                        <td className="text-bright">{(row.oi / 1000).toFixed(0)}K</td>
                                        <td className={`border-l fw-800 ${row.lev.net >= 0 ? 'text-pos' : 'text-neg'}`}>{row.lev.net >= 0 ? '+' : ''}{(row.lev.net / 1000).toFixed(1)}K</td>
                                        <td className={`fs-10 ${row.lev.chg >= 0 ? 'text-pos' : 'text-neg'}`}>{row.lev.chg >= 0 ? '+' : ''}{(row.lev.chg / 1000).toFixed(1)}K</td>
                                        <td className={`border-l fw-800 ${row.am.net >= 0 ? 'text-pos' : 'text-neg'}`}>{row.am.net >= 0 ? '+' : ''}{(row.am.net / 1000).toFixed(1)}K</td>
                                        <td className={`fs-10 ${row.am.chg >= 0 ? 'text-pos' : 'text-neg'}`}>{row.am.chg >= 0 ? '+' : ''}{(row.am.chg / 1000).toFixed(1)}K</td>
                                        <td className={`border-l fw-800 ${row.netPct >= 0 ? 'text-blue' : 'text-amber'}`}>{row.netPct}%</td>
                                        <td style={{ color: row.zScore > 1.5 ? 'var(--bb-green)' : row.zScore < -1.5 ? 'var(--bb-red)' : 'var(--bb-blue)' }}>{row.zScore.toFixed(1)}σ</td>
                                        <td>
                                            <div className="tp-pct-wrap">
                                                <div className="tp-pct-track"><div className="tp-pct-fill" style={{ width: `${row.pct52w}%`, background: row.pct52w > 80 ? 'var(--bb-green)' : row.pct52w < 20 ? 'var(--bb-red)' : 'var(--bb-amber)' }} /></div>
                                                <span className="fs-9">{row.pct52w}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="tp-table-premium">
                            <thead>
                                <tr>
                                    <th>Pair</th>
                                    <th>Long %</th>
                                    <th>Short %</th>
                                    <th>Net Vol</th>
                                    <th style={{ width: '150px' }}>Visual</th>
                                    <th>Bias</th>
                                    <th>Contra</th>
                                </tr>
                            </thead>
                            <tbody>
                                {retailData.map((pair, idx) => (
                                    <tr key={idx} className="tp-row-premium" onClick={() => setActiveTicker(pair.pair.replace('/',''))}>
                                        <td className="text-amber fw-800">{pair.pair}</td>
                                        <td className="text-pos">{pair.long_pct}%</td>
                                        <td className="text-neg">{pair.short_pct}%</td>
                                        <td className={pair.net_vol > 0 ? 'text-pos' : 'text-neg'}>{pair.net_vol > 0 ? '+' : ''}{Math.round(pair.net_vol).toLocaleString()}</td>
                                        <td>
                                            <div className="tp-sent-track">
                                                <div style={{ width: `${pair.long_pct}%`, background: 'var(--bb-green)', transition: 'width 0.5s ease' }} />
                                                <div style={{ width: `${pair.short_pct}%`, background: 'var(--bb-red)', transition: 'width 0.5s ease' }} />
                                            </div>
                                        </td>
                                        <td className={pair.long_pct > pair.short_pct ? 'text-pos' : 'text-neg'}>{pair.long_pct > pair.short_pct ? 'BULL' : 'BEAR'}</td>
                                        <td className="fs-10 fw-800" style={{ color: pair.long_pct > 60 ? 'var(--bb-red)' : pair.short_pct > 60 ? 'var(--bb-green)' : 'var(--bb-text-dim)' }}>{pair.long_pct > 60 ? '▼ SELL' : pair.short_pct > 60 ? '▲ BUY' : 'HOLD'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {actionTab === 'OVERVIEW' && (
                <div className="tp-overview-view animate-fade">
                    <div className="tp-banner cot-banner">
                        <span className="tp-badge">SCORECARD</span>
                        <span className="tp-banner-title">{mainTab} MARKET-WIDE SENTIMENT SCORECARD</span>
                    </div>
                    <div className="tp-gauge-grid">
                        {gauges.map(g => renderGauge(g.label, g.val, g.color, g.sub, g.score))}
                    </div>

                    <div className="tp-overview-details mt-12 glass p-4">
                        <h4 className="text-blue fs-12 mb-2">KEY DEVELOPMENTS</h4>
                        <ul className="fs-11 text-dim">
                            <li>• {mainTab === 'COT' ? 'Leveraged funds adding long exposure in JPY for 3rd week.' : 'Gold retail positioning hit 82% long, signaling major exhaustion risk.'}</li>
                            <li>• {mainTab === 'COT' ? 'Dealer hedging indicates anticipation of volatility spike in equities.' : 'Retail traders caught short in USD/JPY rally; liquidation imminent.'}</li>
                        </ul>
                    </div>
                </div>
            )}

            {actionTab === 'COMPARE' && (
                <div className="tp-table-container animate-fade">
                    <div className="tp-banner divergence-banner">
                        <span className="tp-badge">DIVERGENCE</span>
                        <span className="tp-banner-title">COT vs RETAIL DIVERGENCE ANALYSIS</span>
                    </div>
                    <table className="tp-table-premium">
                        <thead>
                            <tr>
                                <th>Pair</th>
                                <th>Institutional</th>
                                <th>Retail L/S</th>
                                <th>Signal</th>
                                <th>Confidence</th>
                                <th>Reaction</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { pair: 'EUR/USD', inst: '+44K LONG', retail: '38/62', sig: 'Divergent (Bull)', conf: 88, react: 'Accumulating' },
                                { pair: 'GBP/USD', inst: '+42K LONG', retail: '33/67', sig: 'Divergent (Bull)', conf: 85, react: 'Breakout' },
                                { pair: 'USD/JPY', inst: '-112K SHORT', retail: '64/36', sig: 'Divergent (Bear)', conf: 92, react: 'Rejection' },
                                { pair: 'AUD/USD', inst: '-74K SHORT', retail: '74/26', sig: 'Aligned (Bear)', conf: 55, react: 'Crowded' },
                            ].map((row, i) => (
                                <tr key={i} className="tp-row-premium">
                                    <td className="text-amber fw-800">{row.pair}</td>
                                    <td className={row.inst.includes('LONG') ? 'text-pos' : 'text-neg'}>{row.inst}</td>
                                    <td>
                                        <div className="tp-pct-wrap">
                                            <div className="tp-pct-track-sm">
                                                <div style={{ width: row.retail.split('/')[0] + '%', background: 'var(--bb-green)' }} />
                                                <div style={{ width: row.retail.split('/')[1] + '%', background: 'var(--bb-red)' }} />
                                            </div>
                                            <span className="fs-10">{row.retail}</span>
                                        </div>
                                    </td>
                                    <td className={row.sig.includes('Bull') ? 'text-pos' : 'text-neg'}>{row.sig}</td>
                                    <td>
                                        <div className="tp-conf-wrap">
                                            <div className="tp-conf-track"><div className="tp-conf-fill" style={{ width: `${row.conf}%`, background: row.conf > 80 ? 'var(--bb-green)' : 'var(--bb-amber)' }} /></div>
                                            <span className="fs-10">{row.conf}%</span>
                                        </div>
                                    </td>
                                    <td className="text-dim fs-10">{row.react}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {actionTab === 'EXPLORER' && (
                <div className="tp-explorer-view animate-fade">
                    <div className="tp-filter-bar-premium">
                        <span className="tp-filter-label">CFTC DATA EXPLORER</span>
                        <select className="tp-select-premium" value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}>
                            {cotTableData.map(d => <option key={d.ccy}>{d.ccy}</option>)}
                        </select>
                        <div className="tp-nav-group-premium">
                            <button className={`tp-btn-chip ${explorerType === 'NET' ? 'active' : ''}`} onClick={() => setExplorerType('NET')}>NET Position</button>
                            <button className={`tp-btn-chip ${explorerType === 'LS' ? 'active' : ''}`} onClick={() => setExplorerType('LS')}>L/S Units</button>
                            <button className={`tp-btn-chip ${explorerType === 'OI' ? 'active' : ''}`} onClick={() => setExplorerType('OI')}>Open Interest</button>
                        </div>
                    </div>
                    <div className="tp-chart-container" ref={chartRef}></div>
                </div>
            )}
        </div>
    );
};

export default Sentiment;
