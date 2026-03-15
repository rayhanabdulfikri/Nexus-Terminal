import { useState, useEffect, useCallback, useRef } from 'react';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';
import { X } from 'lucide-react';
import './TradeFullScreen.css';

type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'OCO' | 'TRAILING_STOP';
type Side = 'BUY' | 'SELL';
type TIF = 'GTC' | 'DAY' | 'IOC' | 'FOK';

interface Order {
    id: string;
    ticker: string;
    side: Side;
    type: OrderType;
    qty: string;
    price: string;
    stopPrice?: string;
    tif: TIF;
    status: 'WORKING' | 'FILLED' | 'CANCELLED' | 'PARTIAL';
    filled: number;
    timestamp: string;
}

interface DOMLevel { price: number; size: number; bars: number }

function generateDOM(mid: number, spread: number, isBid: boolean): DOMLevel[] {
    const levels: DOMLevel[] = [];
    for (let i = 0; i < 10; i++) {
        const offset = (i + 1) * spread;
        const price = isBid ? mid - offset : mid + offset;
        const size = Math.round(2 + Math.random() * 18) * (isBid ? 1 : 1);
        levels.push({ price, size, bars: size });
    }
    return levels;
}

const INITIAL_ORDERS: Order[] = [
    { id: 'ORD-001', ticker: 'EURUSD', side: 'BUY', type: 'LIMIT', qty: '5,000,000', price: '1.0800', tif: 'GTC', status: 'WORKING', filled: 0, timestamp: '09:14:32' },
    { id: 'ORD-002', ticker: 'XAUUSD', side: 'SELL', type: 'STOP', qty: '50oz', price: '2060.00', tif: 'GTC', status: 'WORKING', filled: 0, timestamp: '08:55:10' },
    { id: 'ORD-003', ticker: 'BTCUSD', side: 'BUY', type: 'MARKET', qty: '0.5', price: 'MKT', tif: 'IOC', status: 'FILLED', filled: 100, timestamp: '07:30:04' },
    { id: 'ORD-004', ticker: 'USDJPY', side: 'SELL', type: 'TRAILING_STOP', qty: '2,000,000', price: '149.50', tif: 'GTC', status: 'PARTIAL', filled: 60, timestamp: '06:45:18' },
];

const TICKER_PRICES: Record<string, { mid: number; spread: number; decimals: number; pip: number }> = {
    EURUSD: { mid: 1.08420, spread: 0.00002, decimals: 5, pip: 0.0001 },
    USDJPY: { mid: 149.380, spread: 0.003, decimals: 3, pip: 0.01 },
    GBPUSD: { mid: 1.26180, spread: 0.00002, decimals: 5, pip: 0.0001 },
    XAUUSD: { mid: 2038.50, spread: 0.20, decimals: 2, pip: 1 },
    BTCUSD: { mid: 64180, spread: 5, decimals: 0, pip: 1 },
    AUDUSD: { mid: 0.65210, spread: 0.00002, decimals: 5, pip: 0.0001 },
    USDCAD: { mid: 1.36950, spread: 0.00002, decimals: 5, pip: 0.0001 },
};

export default function TradeFullScreen() {
    const { setActiveView, activeTicker } = useTerminal();
    const resolvedTicker = TICKER_PRICES[activeTicker] ? activeTicker : 'EURUSD';

    const [side, setSide] = useState<Side>('BUY');
    const [orderType, setOrderType] = useState<OrderType>('LIMIT');
    const [qty, setQty] = useState('1,000,000');
    const [limitPrice, setLimitPrice] = useState('');
    const [stopPrice, setStopPrice] = useState('');
    const [trailAmt, setTrailAmt] = useState('20');
    const [tif, setTif] = useState<TIF>('GTC');
    const [slPrice, setSlPrice] = useState('');
    const [tpPrice, setTpPrice] = useState('');
    const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
    const [activeTab, setActiveTab] = useState<'ORDER' | 'ORDERS' | 'FILLS'>('ORDER');
    const [selectedTicker, setSelectedTicker] = useState(resolvedTicker);
    const [midPrice, setMidPrice] = useState(TICKER_PRICES[resolvedTicker].mid);
    const [bids, setBids] = useState<DOMLevel[]>([]);
    const [asks, setAsks] = useState<DOMLevel[]>([]);
    const [flashBid, setFlashBid] = useState(false);
    const [flashAsk, setFlashAsk] = useState(false);
    const [lastFlash, setLastFlash] = useState<'up' | 'down' | null>(null);

    const lastTickTime = useRef(Date.now());

    const tickerInfo = TICKER_PRICES[selectedTicker];

    // Live price simulation
    useEffect(() => {
        const base = TICKER_PRICES[selectedTicker];
        setMidPrice(base.mid);
        setLimitPrice(base.mid.toFixed(base.decimals));
        setStopPrice((base.mid * (side === 'BUY' ? 0.998 : 1.002)).toFixed(base.decimals));
        setSlPrice((base.mid * (side === 'BUY' ? 0.995 : 1.005)).toFixed(base.decimals));
        setTpPrice((base.mid * (side === 'BUY' ? 1.010 : 0.990)).toFixed(base.decimals));
    }, [selectedTicker, side]);

    useEffect(() => {
        const interval = setInterval(() => {
            const volatility = tickerInfo.spread * (6 + Math.random() * 10);
            const drift = (Math.random() - 0.499) * volatility;
            setMidPrice(prev => {
                const next = prev + drift;
                setLastFlash(drift > 0 ? 'up' : 'down');
                return next;
            });
        }, 600 + Math.random() * 400);
        return () => clearInterval(interval);
    }, [selectedTicker, tickerInfo.spread]);

    // Regenerate DOM on price changes
    useEffect(() => {
        const now = Date.now();
        if (now - lastTickTime.current < 300) return;
        lastTickTime.current = now;
        setBids(generateDOM(midPrice, tickerInfo.spread, true));
        setAsks(generateDOM(midPrice, tickerInfo.spread, false).reverse());
        if (lastFlash === 'up') { setFlashAsk(true); setTimeout(() => setFlashAsk(false), 300); }
        else { setFlashBid(true); setTimeout(() => setFlashBid(false), 300); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [midPrice]);

    const bid = midPrice - tickerInfo.spread;
    const ask = midPrice + tickerInfo.spread;
    const spread = tickerInfo.spread * 2;
    const spreadPips = spread / tickerInfo.pip;

    const orderTypeLabels: Record<OrderType, string> = {
        MARKET: 'MARKET', LIMIT: 'LIMIT', STOP: 'STOP MKT',
        STOP_LIMIT: 'STOP LIMIT', OCO: 'OCO', TRAILING_STOP: 'TRAILING STOP',
    };

    const qtyNum = parseFloat(qty.replace(/,/g, '')) || 1000000;
    const lp = parseFloat(limitPrice) || midPrice;
    const entryPrice = orderType === 'MARKET' ? (side === 'BUY' ? ask : bid) : lp;
    const sl = parseFloat(slPrice) || 0;
    const tp = parseFloat(tpPrice) || 0;
    const riskPips = sl ? Math.abs(entryPrice - sl) / tickerInfo.pip : 0;
    const rewardPips = tp ? Math.abs(tp - entryPrice) / tickerInfo.pip : 0;
    const rr = riskPips > 0 && rewardPips > 0 ? (rewardPips / riskPips).toFixed(2) : '—';
    const pipValuePerLot = selectedTicker.includes('JPY') ? 0.065 : 10;
    const lots = qtyNum / 100000;
    const riskUSD = riskPips * pipValuePerLot * lots;
    const rewardUSD = rewardPips * pipValuePerLot * lots;

    const placeOrder = useCallback(() => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const newOrder: Order = {
            id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
            ticker: selectedTicker,
            side,
            type: orderType,
            qty,
            price: orderType === 'MARKET' ? 'MKT' : limitPrice,
            stopPrice: orderType === 'STOP' || orderType === 'STOP_LIMIT' ? stopPrice : undefined,
            tif,
            status: orderType === 'MARKET' ? 'FILLED' : 'WORKING',
            filled: orderType === 'MARKET' ? 100 : 0,
            timestamp: now,
        };
        setOrders(prev => [newOrder, ...prev]);
        setActiveTab('ORDERS');
    }, [orders.length, selectedTicker, side, orderType, qty, limitPrice, stopPrice, tif, setActiveTab]);

    // ESC to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveView('DASHBOARD'); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [setActiveView]);

    const cancelOrder = (id: string) => {
        setOrders(prev => prev.map(o => o.id === id && o.status === 'WORKING' ? { ...o, status: 'CANCELLED' } : o));
    };

    const maxBarSize = Math.max(...[...bids, ...asks].map(l => l.size), 1);

    return (
        <div className="trade-fs-container">
            {/* Header */}
            <div className="macro-fs-header" style={{ flexShrink: 0, padding: '10px 20px' }}>
                <div>
                    <h1 className="macro-fs-title" style={{ fontSize: '14px' }}>ADVANCED TRADING TERMINAL</h1>
                    <div className="macro-fs-subtitle">MULTI-ASSET ORDER EXECUTION DESK · BLOOMBERG-STYLE · {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView('DASHBOARD')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <X size={14} /> CLOSE
                </button>
            </div>

            <div className="trade-fs-body">
                {/* LEFT: Ticker Selector + Price Display */}
                <div className="trade-fs-left">
                    {/* Ticker Selector */}
                    <div className="trade-panel-box" style={{ flexShrink: 0 }}>
                        <div className="trade-panel-title">INSTRUMENT</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                            {Object.keys(TICKER_PRICES).map(t => (
                                <button key={t} onClick={() => setSelectedTicker(t)}
                                    className={`trade-ticker-btn ${selectedTicker === t ? 'active' : ''}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Display */}
                    <div className="trade-panel-box" style={{ flexShrink: 0 }}>
                        <div className="trade-panel-title">{selectedTicker} — LIVE PRICE</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                            <div>
                                <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)', marginBottom: '4px' }}>BID</div>
                                <div className={`trade-price-big ${flashBid ? 'flash-neg' : ''}`} style={{ color: '#ff4d4d' }}>
                                    {bid.toFixed(tickerInfo.decimals)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)', marginBottom: '4px' }}>SPREAD</div>
                                <div style={{ fontSize: '12px', color: 'var(--bb-amber)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                    {spreadPips.toFixed(1)} pips
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)', marginBottom: '4px' }}>ASK</div>
                                <div className={`trade-price-big ${flashAsk ? 'flash-pos' : ''}`} style={{ color: '#00ff8f' }}>
                                    {ask.toFixed(tickerInfo.decimals)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Depth of Market */}
                    <div className="trade-panel-box" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="trade-panel-title">DEPTH OF MARKET (L2)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px', flex: 1, overflow: 'hidden' }}>
                            {/* Bids */}
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '8px', color: 'var(--bb-text-dim)', padding: '2px 4px', borderBottom: '1px solid var(--bb-teal-border)', marginBottom: '2px', fontWeight: 800, letterSpacing: '0.05em' }}>
                                    <span>SIZE</span><span style={{ textAlign: 'right' }}>BID</span>
                                </div>
                                {bids.slice(0, 10).map((l, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '10px', padding: '2px 4px', position: 'relative', cursor: 'pointer' }}
                                        onClick={() => setLimitPrice(l.price.toFixed(tickerInfo.decimals))}>
                                        <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', background: 'rgba(0,255,143,0.07)', width: `${(l.size / maxBarSize) * 100}%` }} />
                                        <span style={{ color: '#5c8397', fontFamily: 'var(--font-mono)', position: 'relative', zIndex: 1 }}>{l.size}M</span>
                                        <span style={{ color: '#00ff8f', fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right', position: 'relative', zIndex: 1 }}>
                                            {l.price.toFixed(tickerInfo.decimals)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {/* Asks */}
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '8px', color: 'var(--bb-text-dim)', padding: '2px 4px', borderBottom: '1px solid var(--bb-teal-border)', marginBottom: '2px', fontWeight: 800, letterSpacing: '0.05em' }}>
                                    <span>ASK</span><span style={{ textAlign: 'right' }}>SIZE</span>
                                </div>
                                {asks.slice(0, 10).map((l, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '10px', padding: '2px 4px', position: 'relative', cursor: 'pointer' }}
                                        onClick={() => setLimitPrice(l.price.toFixed(tickerInfo.decimals))}>
                                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'rgba(255,77,77,0.07)', width: `${(l.size / maxBarSize) * 100}%` }} />
                                        <span style={{ color: '#ff4d4d', fontFamily: 'var(--font-mono)', fontWeight: 700, position: 'relative', zIndex: 1 }}>
                                            {l.price.toFixed(tickerInfo.decimals)}
                                        </span>
                                        <span style={{ color: '#5c8397', fontFamily: 'var(--font-mono)', textAlign: 'right', position: 'relative', zIndex: 1 }}>{l.size}M</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER: Order Entry + Tabs */}
                <div className="trade-fs-center">
                    {/* Tab Bar */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--bb-teal-border)', flexShrink: 0 }}>
                        {(['ORDER', 'ORDERS', 'FILLS'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                padding: '8px 18px', background: 'transparent', border: 'none',
                                borderBottom: activeTab === tab ? '2px solid var(--bb-amber)' : '2px solid transparent',
                                color: activeTab === tab ? 'var(--bb-amber)' : 'var(--bb-text-dim)',
                                fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer',
                            }}>
                                {tab === 'ORDERS' ? `ACTIVE ORDERS (${orders.filter(o => o.status === 'WORKING' || o.status === 'PARTIAL').length})` : tab}
                            </button>
                        ))}
                    </div>

                    {/* ORDER ENTRY TAB */}
                    {activeTab === 'ORDER' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
                            {/* BUY/SELL */}
                            <div style={{ display: 'flex', gap: '0', marginBottom: '14px', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                {(['BUY', 'SELL'] as const).map(s => (
                                    <button key={s} onClick={() => setSide(s)} style={{
                                        flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: 800,
                                        fontSize: '13px', letterSpacing: '0.08em', transition: 'all 0.15s',
                                        background: side === s ? (s === 'BUY' ? '#003a1a' : '#3a0000') : 'rgba(8,22,30,0.8)',
                                        color: side === s ? (s === 'BUY' ? '#00ff8f' : '#ff4d4d') : 'var(--bb-text-dim)',
                                        borderLeft: s === 'SELL' ? '1px solid var(--bb-teal-border)' : 'none',
                                    }}>
                                        {s === 'BUY' ? '▲' : '▼'} {s}
                                    </button>
                                ))}
                            </div>

                            {/* Order Type */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', fontWeight: 800, letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>ORDER TYPE</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px' }}>
                                    {(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'OCO', 'TRAILING_STOP'] as const).map(t => (
                                        <button key={t} onClick={() => setOrderType(t)} style={{
                                            padding: '5px 4px', border: `1px solid ${orderType === t ? 'var(--bb-amber)' : 'var(--bb-teal-border)'}`,
                                            background: orderType === t ? 'var(--bb-amber-dim)' : 'transparent',
                                            color: orderType === t ? 'var(--bb-amber)' : 'var(--bb-text-dim)',
                                            fontSize: '8px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.04em',
                                            borderRadius: '2px', transition: 'all 0.15s',
                                        }}>
                                            {orderTypeLabels[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fields */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', fontWeight: 800, letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>QUANTITY / NOTIONAL</label>
                                    <input value={qty} onChange={e => setQty(e.target.value)} className="trade-input" placeholder="e.g. 1,000,000" />
                                </div>

                                {orderType !== 'MARKET' && orderType !== 'STOP' && orderType !== 'TRAILING_STOP' && (
                                    <div>
                                        <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', fontWeight: 800, letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>LIMIT PRICE</label>
                                        <input value={limitPrice} onChange={e => setLimitPrice(e.target.value)} className="trade-input" />
                                    </div>
                                )}

                                {(orderType === 'STOP' || orderType === 'STOP_LIMIT' || orderType === 'OCO') && (
                                    <div>
                                        <label style={{ fontSize: '9px', color: 'var(--bb-red)', fontWeight: 800, letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>STOP TRIGGER PRICE</label>
                                        <input value={stopPrice} onChange={e => setStopPrice(e.target.value)} className="trade-input" style={{ borderColor: 'rgba(255,77,77,0.3)' }} />
                                    </div>
                                )}

                                {orderType === 'TRAILING_STOP' && (
                                    <div>
                                        <label style={{ fontSize: '9px', color: 'var(--bb-amber)', fontWeight: 800, letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>TRAIL AMOUNT (PIPS)</label>
                                        <input value={trailAmt} onChange={e => setTrailAmt(e.target.value)} className="trade-input" style={{ borderColor: 'rgba(255,170,0,0.3)' }} />
                                    </div>
                                )}

                                {/* SL/TP Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '9px', color: 'var(--bb-red)', fontWeight: 800, letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>STOP LOSS</label>
                                        <input value={slPrice} onChange={e => setSlPrice(e.target.value)} className="trade-input" style={{ borderColor: 'rgba(255,77,77,0.3)' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '9px', color: '#00ff8f', fontWeight: 800, letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>TAKE PROFIT</label>
                                        <input value={tpPrice} onChange={e => setTpPrice(e.target.value)} className="trade-input" style={{ borderColor: 'rgba(0,255,143,0.2)' }} />
                                    </div>
                                </div>

                                {/* TIF */}
                                <div>
                                    <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', fontWeight: 800, letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>TIME IN FORCE</label>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {(['GTC', 'DAY', 'IOC', 'FOK'] as const).map(t => (
                                            <button key={t} onClick={() => setTif(t)} style={{
                                                flex: 1, padding: '4px', border: `1px solid ${tif === t ? 'var(--bb-blue)' : 'var(--bb-teal-border)'}`,
                                                background: tif === t ? 'rgba(0,184,224,0.1)' : 'transparent',
                                                color: tif === t ? 'var(--bb-blue)' : 'var(--bb-text-dim)',
                                                fontSize: '9px', fontWeight: 800, cursor: 'pointer', borderRadius: '2px',
                                            }}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <button onClick={placeOrder} style={{
                                width: '100%', padding: '12px', border: 'none', cursor: 'pointer',
                                fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', borderRadius: '2px',
                                background: side === 'BUY' ? 'linear-gradient(135deg, #004d23, #00802a)' : 'linear-gradient(135deg, #4d0000, #800000)',
                                color: side === 'BUY' ? '#00ff8f' : '#ff6666',
                                boxShadow: side === 'BUY' ? '0 0 15px rgba(0,255,143,0.2)' : '0 0 15px rgba(255,77,77,0.2)',
                                transition: 'all 0.15s',
                            }}>
                                {side === 'BUY' ? '▲' : '▼'} SEND {side} ORDER — {orderTypeLabels[orderType]}
                            </button>
                        </div>
                    )}

                    {/* ACTIVE ORDERS TAB */}
                    {activeTab === 'ORDERS' && (
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(4,12,18,0.9)', borderBottom: '1px solid var(--bb-teal-border)' }}>
                                        {['ID', 'TICKER', 'SIDE', 'TYPE', 'QTY', 'PRICE', 'TIF', 'FILLED%', 'STATUS', ''].map(h => (
                                            <th key={h} style={{ padding: '8px 6px', textAlign: 'left', fontSize: '8px', fontWeight: 800, color: 'var(--bb-text-dim)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(o => (
                                        <tr key={o.id} style={{ borderBottom: '1px solid rgba(22,51,68,0.3)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,184,224,0.04)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                            <td style={{ padding: '7px 6px', color: 'var(--bb-text-dim)', fontFamily: 'var(--font-mono)' }}>{o.id}</td>
                                            <td style={{ padding: '7px 6px', color: 'var(--bb-amber)', fontWeight: 800 }}>{o.ticker}</td>
                                            <td style={{ padding: '7px 6px', color: o.side === 'BUY' ? '#00ff8f' : '#ff4d4d', fontWeight: 800 }}>{o.side}</td>
                                            <td style={{ padding: '7px 6px', color: 'var(--bb-text-dim)', fontSize: '9px' }}>{orderTypeLabels[o.type]}</td>
                                            <td style={{ padding: '7px 6px', fontFamily: 'var(--font-mono)' }}>{o.qty}</td>
                                            <td style={{ padding: '7px 6px', fontFamily: 'var(--font-mono)', color: 'var(--bb-text)' }}>{o.price}</td>
                                            <td style={{ padding: '7px 6px', color: 'var(--bb-text-dim)', fontSize: '9px' }}>{o.tif}</td>
                                            <td style={{ padding: '7px 6px' }}>
                                                <div style={{ background: 'var(--bb-teal-border)', borderRadius: '2px', height: '4px', width: '60px' }}>
                                                    <div style={{ background: o.status === 'FILLED' ? '#00ff8f' : 'var(--bb-blue)', height: '100%', width: `${o.filled}%`, borderRadius: '2px' }} />
                                                </div>
                                                <div style={{ fontSize: '8px', color: 'var(--bb-text-dim)', marginTop: '1px' }}>{o.filled}%</div>
                                            </td>
                                            <td style={{ padding: '7px 6px' }}>
                                                <span style={{
                                                    padding: '2px 5px', borderRadius: '2px', fontSize: '8px', fontWeight: 800,
                                                    background: o.status === 'FILLED' ? 'rgba(0,255,143,0.1)' : o.status === 'CANCELLED' ? 'rgba(255,77,77,0.1)' : o.status === 'PARTIAL' ? 'rgba(255,170,0,0.1)' : 'rgba(0,184,224,0.1)',
                                                    color: o.status === 'FILLED' ? '#00ff8f' : o.status === 'CANCELLED' ? '#ff4d4d' : o.status === 'PARTIAL' ? 'var(--bb-amber)' : 'var(--bb-blue)',
                                                    border: `1px solid ${o.status === 'FILLED' ? 'rgba(0,255,143,0.2)' : o.status === 'CANCELLED' ? 'rgba(255,77,77,0.2)' : o.status === 'PARTIAL' ? 'rgba(255,170,0,0.2)' : 'rgba(0,184,224,0.2)'}`,
                                                }}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '7px 6px' }}>
                                                {(o.status === 'WORKING' || o.status === 'PARTIAL') && (
                                                    <button onClick={() => cancelOrder(o.id)} style={{
                                                        padding: '2px 6px', background: 'transparent', border: '1px solid rgba(255,77,77,0.3)',
                                                        color: '#ff4d4d', fontSize: '8px', cursor: 'pointer', fontWeight: 800, borderRadius: '2px',
                                                    }}>
                                                        CANCEL
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* FILLS TAB */}
                    {activeTab === 'FILLS' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(4,12,18,0.9)', borderBottom: '1px solid var(--bb-teal-border)' }}>
                                        {['TIME', 'TICKER', 'SIDE', 'QTY', 'FILL PRICE', 'COMMISSION', 'P&L'].map(h => (
                                            <th key={h} style={{ padding: '8px 8px', textAlign: 'left', fontSize: '8px', fontWeight: 800, color: 'var(--bb-text-dim)', letterSpacing: '0.1em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { time: '09:14:32', ticker: 'EURUSD', side: 'BUY', qty: '5M', fill: '1.08255', comm: '$125.00', pnl: '+$1,850', pos: true },
                                        { time: '08:32:11', ticker: 'BTCUSD', side: 'SELL', qty: '0.5', fill: '64,420.0', comm: '$32.21', pnl: '-$120', pos: false },
                                        { time: '07:45:04', ticker: 'XAUUSD', side: 'BUY', qty: '100oz', fill: '2035.50', comm: '$20.36', pnl: '+$300', pos: true },
                                        { time: '06:30:18', ticker: 'USDJPY', side: 'SELL', qty: '2M', fill: '149.550', comm: '$200.00', pnl: '+$3,400', pos: true },
                                        { time: '05:12:44', ticker: 'GBPUSD', side: 'BUY', qty: '3M', fill: '1.26225', comm: '$150.00', pnl: '-$450', pos: false },
                                    ].map((f, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(22,51,68,0.3)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,184,224,0.04)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                            <td style={{ padding: '7px 8px', color: 'var(--bb-text-dim)', fontFamily: 'var(--font-mono)' }}>{f.time}</td>
                                            <td style={{ padding: '7px 8px', color: 'var(--bb-amber)', fontWeight: 800 }}>{f.ticker}</td>
                                            <td style={{ padding: '7px 8px', color: f.side === 'BUY' ? '#00ff8f' : '#ff4d4d', fontWeight: 800 }}>{f.side}</td>
                                            <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)' }}>{f.qty}</td>
                                            <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', color: 'var(--bb-text)' }}>{f.fill}</td>
                                            <td style={{ padding: '7px 8px', color: 'var(--bb-text-dim)', fontFamily: 'var(--font-mono)' }}>{f.comm}</td>
                                            <td style={{ padding: '7px 8px', color: f.pos ? '#00ff8f' : '#ff4d4d', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{f.pnl}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* RIGHT: Risk Calculator + Market Context */}
                <div className="trade-fs-right">
                    {/* Risk/Reward Calculator */}
                    <div className="trade-panel-box" style={{ flexShrink: 0 }}>
                        <div className="trade-panel-title">RISK/REWARD CALCULATOR</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '11px', marginTop: '10px' }}>
                            {[
                                { label: 'ENTRY', value: entryPrice.toFixed(tickerInfo.decimals), color: 'var(--bb-text)' },
                                { label: 'STOP LOSS', value: slPrice || '—', color: '#ff4d4d' },
                                { label: 'TAKE PROFIT', value: tpPrice || '—', color: '#00ff8f' },
                                { label: 'RISK (PIPS)', value: riskPips > 0 ? riskPips.toFixed(1) : '—', color: '#ff4d4d' },
                                { label: 'REWARD (PIPS)', value: rewardPips > 0 ? rewardPips.toFixed(1) : '—', color: '#00ff8f' },
                                { label: 'RISK/REWARD', value: rr, color: 'var(--bb-blue)' },
                                { label: 'RISK USD', value: riskUSD > 0 ? `$${riskUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—', color: '#ff4d4d' },
                                { label: 'REWARD USD', value: rewardUSD > 0 ? `$${rewardUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—', color: '#00ff8f' },
                            ].map(r => (
                                <div key={r.label}>
                                    <div style={{ fontSize: '8px', color: 'var(--bb-text-dim)', fontWeight: 800, letterSpacing: '0.08em' }}>{r.label}</div>
                                    <div style={{ color: r.color, fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: '2px' }}>{r.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Turtle Position Sizing */}
                    <div className="trade-panel-box" style={{ flexShrink: 0 }}>
                        <div className="trade-panel-title">POSITION SIZING — TURTLE</div>
                        <div style={{ fontSize: '10px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {[
                                { l: 'ACCOUNT SIZE', v: '$10,000,000', c: 'var(--bb-text)' },
                                { l: 'RISK/TRADE (25bps)', v: '$25,000', c: 'var(--bb-amber)' },
                                { l: `ATR-20 (${selectedTicker})`, v: `${(tickerInfo.spread * 50).toFixed(tickerInfo.decimals)}`, c: 'var(--bb-text)' },
                                { l: 'UNIT SIZE', v: `${lots.toFixed(2)} lots`, c: 'var(--bb-blue)' },
                                { l: 'PORTFOLIO HEAT', v: '31.4%', c: '#ff4d4d' },
                            ].map(r => (
                                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(22,51,68,0.3)', paddingBottom: '4px' }}>
                                    <span style={{ color: 'var(--bb-text-dim)', fontSize: '9px', fontWeight: 800 }}>{r.l}</span>
                                    <span style={{ color: r.c, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '10px' }}>{r.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Market Context / Related News */}
                    <div className="trade-panel-box" style={{ flex: 1, overflowY: 'auto' }}>
                        <div className="trade-panel-title">MARKET CONTEXT</div>
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                                { time: '2h ago', src: 'Reuters', txt: 'Fed speakers lean hawkish, USD strength likely to persist near-term.' },
                                { time: '4h ago', src: 'BBG', txt: 'ECB Lagarde: "Not yet confident inflation is sustainably at target."' },
                                { time: '6h ago', src: 'FT', txt: 'BOJ maintains YCC policy, JPY weak on carry trade flows.' },
                            ].map((n, i) => (
                                <div key={i} style={{ borderLeft: '2px solid var(--bb-teal-border)', paddingLeft: '8px' }}>
                                    <div style={{ fontSize: '8px', color: 'var(--bb-text-dim)', marginBottom: '2px' }}>
                                        <span style={{ color: 'var(--bb-amber)', fontWeight: 800 }}>{n.src}</span> · {n.time}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--bb-text)', lineHeight: 1.4 }}>{n.txt}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
