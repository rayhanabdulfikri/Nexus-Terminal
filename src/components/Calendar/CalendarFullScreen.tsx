import { useMemo, useState, useEffect } from 'react';
import calendarData from '../../data/major_currencies_calendar.json';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

export default function CalendarFullScreen() {
    const { setActiveView } = useTerminal();
    const [filter, setFilter] = useState("ALL");
    const [impact, setImpact] = useState("ALL");

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveView("DASHBOARD");
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setActiveView]);

    const events = useMemo(() => {
        let data = calendarData.events;
        if (filter !== "ALL") data = data.filter((e: any) => e.ccy === filter);
        if (impact !== "ALL") data = data.filter((e: any) => e.eco_level === impact);
        return data;
    }, [filter, impact]);

    return (
        <div className="macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">GLOBAL ECONOMIC CALENDAR</h1>
                    <div className="macro-fs-subtitle">CENTRAL BANK & MACRO DATA RELEASES • {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE DASHBOARD</button>
            </div>

            <div className="port-fs-content">
                <div className="p-metrics-row">
                    <div className="p-metric-card">
                        <div className="p-mc-title">UPCOMING RELEASES</div>
                        <div className="p-mc-val">{events.length}</div>
                        <div className="p-mc-sub">Filtered View</div>
                    </div>
                    <div className="p-metric-card" style={{ borderTopColor: '#ff4d4d' }}>
                        <div className="p-mc-title">HIGH IMPACT</div>
                        <div className="p-mc-val text-neg">{events.filter((e:any) => e.eco_level === 'HIGH').length}</div>
                        <div className="p-mc-sub">Critical Volatility Potential</div>
                    </div>
                    <div className="p-metric-card" style={{ borderTopColor: '#00b4dc' }}>
                        <div className="p-mc-title">CPI & GDP WATCH</div>
                        <div className="p-mc-val">12</div>
                        <div className="p-mc-sub">Major Indicators Next 7D</div>
                    </div>
                </div>

                <div className="a-col-table" style={{ flex: 1 }}>
                    <div className="a-table-header">
                        <div className="a-table-title">ECONOMIC SCHEDULE</div>
                        <div className="a-filters">
                            <select className="tp-select" value={filter} onChange={e => setFilter(e.target.value)}>
                                <option value="ALL">ALL CURRENCIES</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - Pound Sterling</option>
                                <option value="JPY">JPY - Yen</option>
                            </select>
                            <select className="tp-select" value={impact} onChange={e => setImpact(e.target.value)}>
                                <option value="ALL">ALL IMPACT</option>
                                <option value="HIGH">HIGH IMPACT</option>
                                <option value="MED">MEDIUM IMPACT</option>
                                <option value="LOW">LOW IMPACT</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-table-body">
                        <table className="p-table">
                            <thead>
                                <tr>
                                    <th>TIME (LOCAL)</th>
                                    <th>CCY</th>
                                    <th style={{ textAlign: 'left' }}>EVENT</th>
                                    <th>IMPACT</th>
                                    <th>ACTUAL</th>
                                    <th>FORECAST</th>
                                    <th>PREVIOUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((e: any, i: number) => (
                                    <tr key={i}>
                                        <td>{new Date(e.date_local).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td style={{ fontWeight: 'bold', color: '#8caebf' }}>{e.ccy}</td>
                                        <td style={{ textAlign: 'left', color: 'var(--bb-text)' }}>{e.event}</td>
                                        <td>
                                            <span style={{ 
                                                fontSize: '9px', 
                                                padding: '2px 8px', 
                                                borderRadius: '10px',
                                                background: e.eco_level === 'HIGH' ? 'rgba(255, 77, 77, 0.2)' : e.eco_level === 'MED' ? 'rgba(255, 159, 28, 0.2)' : 'rgba(92, 131, 151, 0.2)',
                                                color: e.eco_level === 'HIGH' ? '#ff4d4d' : e.eco_level === 'MED' ? '#ff9f1c' : '#5c8397',
                                                border: `1px solid ${e.eco_level === 'HIGH' ? '#ff4d4d' : e.eco_level === 'MED' ? '#ff9f1c' : '#5c8397'}`
                                            }}>
                                                {e.eco_level}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 'bold' }}>{e.actual || '--'}</td>
                                        <td style={{ color: '#5c8397' }}>{e.forecast || '--'}</td>
                                        <td style={{ color: '#5c8397' }}>{e.previous || '--'}</td>
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
