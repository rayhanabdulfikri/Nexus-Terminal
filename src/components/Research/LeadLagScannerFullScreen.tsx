import { useEffect } from 'react';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

const SCANNER_DATA = [
    { pair: 'GOLD vs REAL YIELD', corr: -0.92, status: 'ALIGNED', lead: 'Yield Leads', signal: 'Watch for Gold reversal if Yields stay high' },
    { pair: 'BTC vs NDX', corr: 0.84, status: 'DECOUPLING', lead: 'BTC Leads', signal: 'NDX showing lag to BTC bounce' },
    { pair: 'AUD vs COPPER', corr: 0.78, status: 'ALIGNED', lead: 'Copper Leads', signal: 'Commodity demand supports AUD' },
    { pair: 'SPX vs VIX', corr: -0.88, status: 'ANOMALY', lead: 'VIX Leads', signal: 'VIX rising with SPX - Warning signal' },
    { pair: 'DXY vs OIL', corr: -0.65, status: 'ALIGNED', lead: 'DXY Leads', signal: 'Dollar strength capping oil rally' },
];

export default function LeadLagScannerFullScreen({ embedded = false }: { embedded?: boolean }) {
    const { setActiveView } = useTerminal();

    useEffect(() => {
        if (embedded) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveView("DASHBOARD");
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setActiveView, embedded]);

    const innerContent = (
        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                {SCANNER_DATA.map((item, idx) => (
                    <div key={idx} style={{ 
                        background: 'rgba(8, 22, 30, 0.6)', 
                        border: '1px solid var(--bb-teal-border)',
                        borderRadius: '4px',
                        padding: '20px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            position: 'absolute', 
                            top: 0, 
                            right: 0, 
                            background: item.status === 'DECOUPLING' || item.status === 'ANOMALY' ? 'var(--bb-red)' : 'var(--bb-blue)',
                            color: '#fff',
                            padding: '3px 12px',
                            fontSize: '9px',
                            fontWeight: 900,
                            letterSpacing: '0.1em'
                        }}>{item.status}</div>
                        
                        <h3 style={{ fontSize: '14px', color: 'var(--bb-text-bright)', marginBottom: '8px' }}>{item.pair}</h3>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                            <div>
                                <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)', marginBottom: '2px' }}>CORR (90D)</div>
                                <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--bb-blue-bright)' }}>{item.corr}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)', marginBottom: '2px' }}>LEADER</div>
                                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--bb-amber)' }}>{item.lead}</div>
                            </div>
                        </div>
                        
                        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '2px', borderLeft: '3px solid var(--bb-amber)' }}>
                            <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-amber)', marginBottom: '4px' }}>INSIGHT:</div>
                            <div style={{ fontSize: '11px', color: 'var(--bb-text-dim)', lineHeight: '1.5' }}>{item.signal}</div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div style={{ marginTop: '30px', padding: '20px', border: '1px solid var(--bb-teal-border)', background: 'rgba(0, 184, 224, 0.03)', borderRadius: '4px' }}>
                <h4 style={{ color: 'var(--bb-blue-bright)', fontSize: '10px', fontWeight: 800, marginBottom: '10px' }}>SYSTEM LOGIC</h4>
                <p style={{ fontSize: '11px', color: 'var(--bb-text-dim)', lineHeight: 1.6 }}>
                    This scanner monitors 90-day Pearson correlations across non-obvious asset pairs. When correlations deviate by more than 2.0 standard deviations from their historical mean, a 'DECOUPLING' or 'ANOMALY' alert is triggered. Traders should use these to identify potential market tops, bottoms, or trend exhaustion.
                </p>
            </div>
        </div>
    );

    if (embedded) return innerContent;

    return (
        <div className="macro-fs-container" style={{ background: '#02090b' }}>
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">INTER-MARKET LEAD/LAG SCANNER</h1>
                    <div className="macro-fs-subtitle">CROSS-ASSET DIVERGENCE · CORRELATION ANOMALIES · MARKET TIMING ALPHA</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE</button>
            </div>
            {innerContent}
        </div>
    );
}
