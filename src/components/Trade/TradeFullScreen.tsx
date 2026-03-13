import { useState } from 'react';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

export default function TradeFullScreen() {
    const { setActiveView, activeTicker } = useTerminal();
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState('LMT');

    return (
        <div className="macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">ADVANCED TRADING TERMINAL</h1>
                    <div className="macro-fs-subtitle">MULTI-ASSET ORDER EXECUTION DESK • {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE DASHBOARD</button>
            </div>

            <div className="port-fs-content" style={{ flexDirection: 'row', gap: '20px' }}>
                {/* Order Entry */}
                <div className="p-metric-card" style={{ flex: 1, borderTopColor: side === 'BUY' ? '#00ff8f' : '#ff4d4d' }}>
                    <div className="a-table-title">ORDER ENTRY: {activeTicker || 'NONE'}</div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button className={`a-filter-btn ${side === 'BUY' ? 'active' : ''}`} style={{ flex: 1, background: side === 'BUY' ? '#00ff8f' : 'transparent', color: side === 'BUY' ? 'black' : '#00ff8f' }} onClick={() => setSide('BUY')}>BUY</button>
                        <button className={`a-filter-btn ${side === 'SELL' ? 'active' : ''}`} style={{ flex: 1, background: side === 'SELL' ? '#ff4d4d' : 'transparent', color: side === 'SELL' ? 'white' : '#ff4d4d' }} onClick={() => setSide('SELL')}>SELL</button>
                    </div>
                    
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ fontSize: '10px', color: '#5c8397' }}>ORDER TYPE</label>
                            <select className="tp-select" style={{ width: '100%', marginTop: '5px' }} value={orderType} onChange={e => setOrderType(e.target.value)}>
                                <option value="LMT">LIMIT</option>
                                <option value="MKT">MARKET</option>
                                <option value="STP">STOP</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#5c8397' }}>QUANTITY</label>
                            <input type="text" className="tp-select" style={{ width: '100%', marginTop: '5px' }} defaultValue="10,000" />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#5c8397' }}>PRICE</label>
                            <input type="text" className="tp-select" style={{ width: '100%', marginTop: '5px' }} defaultValue="1.0850" />
                        </div>
                        <button className="a-filter-btn active" style={{ marginTop: '10px', height: '40px', fontSize: '14px' }}>PLACE {side} ORDER</button>
                    </div>
                </div>

                {/* Depth of Market / Level 2 */}
                <div className="p-table-container" style={{ flex: 1.5 }}>
                    <div className="a-table-header">
                        <div className="a-table-title">DEPTH OF MARKET (L2)</div>
                        <div style={{ color: '#00ff8f' }}>SPREAD: 0.2 pips</div>
                    </div>
                    <div className="p-table-body">
                        <table className="p-table">
                            <thead>
                                <tr>
                                    <th>SIZE</th>
                                    <th>BID</th>
                                    <th>ASK</th>
                                    <th>SIZE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                    <tr key={i}>
                                        <td style={{ color: '#5c8397' }}>{10 - i + 5}M</td>
                                        <td style={{ color: '#00ff8f', fontWeight: 'bold' }}>1.084{10-i}</td>
                                        <td style={{ color: '#ff4d4d', fontWeight: 'bold' }}>1.085{i}</td>
                                        <td style={{ color: '#5c8397' }}>{i + 5}M</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Fills */}
                <div className="p-table-container" style={{ flex: 1 }}>
                    <div className="a-table-header">
                        <div className="a-table-title">RECENT FILLS</div>
                    </div>
                    <div className="p-table-body">
                        <table className="p-table" style={{ fontSize: '10px' }}>
                            <thead>
                                <tr>
                                    <th>TICKER</th>
                                    <th>SIDE</th>
                                    <th>PRICE</th>
                                    <th>QTY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { t: 'EURUSD', s: 'BUY', p: '1.0850', q: '1M' },
                                    { t: 'BTCUSD', s: 'SELL', p: '68420', q: '0.5' },
                                    { t: 'AAPL', s: 'BUY', p: '172.50', q: '500' },
                                    { t: 'GOLD', s: 'BUY', p: '2165.2', q: '100oz' }
                                ].map((f, i) => (
                                    <tr key={i}>
                                        <td>{f.t}</td>
                                        <td style={{ color: f.s === 'BUY' ? '#00ff8f' : '#ff4d4d' }}>{f.s}</td>
                                        <td>{f.p}</td>
                                        <td style={{ color: '#5c8397' }}>{f.q}</td>
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
