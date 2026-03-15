import { useEffect, useState } from 'react';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';
import { ChevronRight, Shield, Target, Zap, AlertCircle, Layers } from 'lucide-react';

const MOCK_IDEAS = [
    {
        id: 'THESIS-001',
        asset: 'EURUSD / G10 FX',
        side: 'SHORT',
        hypothesis: 'Late-cycle slowdown in Eurozone vs. resilient US exceptionalism driving yield spread widening.',
        drivers: 'Monetary Policy Divergence & Fiscal Impulse',
        liquidity: 'USD Net Liquidity Drain expected via TGA build.',
        scenarios: [
            { case: 'Base', prob: '60%', catalyst: 'Sticky US CPI + ECB June Cut Signal' },
            { case: 'Bull', prob: '15%', catalyst: 'US Recession fears spark Fed pivot' },
            { case: 'Bear', prob: '25%', catalyst: 'Eurozone growth surprise' }
        ],
        riskReward: '1:3.5',
        horizon: 'SWING (2-6 Weeks)',
        execution: 'Sell rallies to 1.0880, SL 1.0950, TP 1.0650',
        state: 'ACTIVE',
        conviction: 'HIGH'
    },
    {
        id: 'THESIS-002',
        asset: 'XAUUSD / GOLD',
        side: 'LONG',
        hypothesis: 'Deglobalization & Central Bank diversification overriding real rate headwinds.',
        drivers: 'Geopolitical Risk & Monetary Debasement',
        liquidity: 'Global Liquidity Bottoming; China stimulus tailwinds.',
        scenarios: [
            { case: 'Base', prob: '50%', catalyst: 'Middle East escalation + RRP exhaustion' },
            { case: 'Alt', prob: '30%', catalyst: 'Dollar weakness on fiscal concerns' }
        ],
        riskReward: '1:4.2',
        horizon: 'MACRO (3M+)',
        execution: 'Accumulate $2010-$2030, SL $1980, TP $2150',
        state: 'WATCHING',
        conviction: 'MED'
    }
];

export default function TradeIdeaFullScreen({ embedded = false }: { embedded?: boolean }) {
    const { setActiveView, activeTicker } = useTerminal();
    const [ideas] = useState(MOCK_IDEAS);
    const [, setIsDrafting] = useState(false);

    useEffect(() => {
        if (embedded) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveView("DASHBOARD");
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setActiveView, embedded]);

    const innerContent = (
        <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', gap: '30px', background: '#02090b' }}>
            {/* Left: Active Playbook */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '11px', color: 'var(--bb-amber)', fontWeight: 800, letterSpacing: '0.15em' }}>INSTITUTIONAL PLAYBOOK : GLOBAL MACRO</h2>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--bb-text-dim)' }}>ACTIVE: <span style={{ color: '#fff' }}>6</span></div>
                        <div style={{ fontSize: '10px', color: 'var(--bb-text-dim)' }}>HIT RATE: <span style={{ color: 'var(--bb-green)' }}>68%</span></div>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '25px' }}>
                    {ideas.map((idea) => (
                        <div key={idea.id} style={{ 
                            background: 'rgba(9, 26, 31, 0.4)', 
                            border: '1px solid var(--bb-teal-border)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            {/* Card Header */}
                            <div style={{ 
                                padding: '15px 20px', 
                                background: 'rgba(255,255,255,0.02)', 
                                borderBottom: '1px solid var(--bb-teal-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ background: idea.side === 'LONG' ? 'var(--bb-green)' : 'var(--bb-red)', width: '3px', height: '24px', borderRadius: '4px' }}></div>
                                    <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>{idea.asset}</span>
                                    <span style={{ 
                                        fontSize: '9px', 
                                        fontWeight: 900, 
                                        color: idea.side === 'LONG' ? 'var(--bb-green)' : 'var(--bb-red)',
                                        background: idea.side === 'LONG' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 61, 87, 0.1)',
                                        padding: '2px 8px',
                                        border: `1px solid ${idea.side === 'LONG' ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 87, 0.3)'}`,
                                        borderRadius: '2px'
                                    }}>{idea.side}</span>
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--bb-text-dim)', display: 'flex', gap: '12px' }}>
                                    <span>ID: {idea.id}</span>
                                    <span style={{ color: 'var(--bb-blue)' }}>{idea.state}</span>
                                </div>
                            </div>
                            
                            {/* Card Body */}
                            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                                <div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '9px', color: 'var(--bb-amber)', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Target size={10} /> MACRO HYPOTHESIS & CYCLE
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--bb-text-bright)', lineHeight: 1.5 }}>{idea.hypothesis}</div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'var(--bb-blue)', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Shield size={10} /> POLICY & DRIVERS
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--bb-text-dim)' }}>{idea.drivers}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'var(--bb-blue)', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Zap size={10} /> LIQUIDITY DYNAMICS
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--bb-text-dim)' }}>{idea.liquidity}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderLeft: '1px solid rgba(140, 174, 191, 0.1)', paddingLeft: '20px' }}>
                                    <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)', fontWeight: 800, marginBottom: '10px' }}>PROBABILISTIC SCENARIOS</div>
                                    {idea.scenarios.map((s, idx) => (
                                        <div key={idx} style={{ marginBottom: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '2px', fontSize: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                                <span style={{ fontWeight: 800, color: s.case === 'Base' ? 'var(--bb-blue)' : 'var(--bb-text-dim)' }}>{s.case} CASE</span>
                                                <span style={{ color: 'var(--bb-amber)' }}>{s.prob}</span>
                                            </div>
                                            <div style={{ color: '#fff', fontSize: '9px' }}>{s.catalyst}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Card Footer */}
                            <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--bb-teal-border)', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                                    <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)' }}>
                                        CONVICTION: <span style={{ color: idea.conviction === 'HIGH' ? 'var(--bb-green)' : 'var(--bb-amber)', fontWeight: 900 }}>{idea.conviction}</span>
                                    </div>
                                    <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)' }}>
                                        HORIZON: <span style={{ color: '#fff', fontWeight: 900 }}>{idea.horizon}</span>
                                    </div>
                                    <div style={{ fontSize: '9px', color: 'var(--bb-text-dim)' }}>
                                        RISK/REWARD: <span style={{ color: 'var(--bb-green)', fontWeight: 900 }}>{idea.riskReward}</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--bb-blue)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertCircle size={10} /> {idea.execution}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Thesis Canvas (Planning Engine) */}
            <div style={{ width: '420px', flexShrink: 0 }}>
                <div style={{ 
                    background: 'linear-gradient(135deg, #091a1f 0%, #051418 100%)', 
                    border: '1px solid var(--bb-blue)', 
                    borderRadius: '4px',
                    padding: '24px',
                    height: 'calc(100vh - 180px)',
                    overflowY: 'auto',
                    position: 'sticky',
                    top: 0,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Layers size={16} color="var(--bb-blue)" />
                        <h2 style={{ fontSize: '11px', color: 'var(--bb-blue)', fontWeight: 800, letterSpacing: '0.1em', margin: 0 }}>THESIS PLANNING ENGINE : {activeTicker}</h2>
                    </div>
                    
                    <div style={{ display: 'grid', gap: '18px' }}>
                        <div className="canvas-section">
                            <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', display: 'block', marginBottom: '8px', fontWeight: 800 }}>1. MACRO HYPOTHESIS & CYCLE ANALYSIS</label>
                            <textarea rows={3} placeholder="Formulate your core macro hypothesis based on economic cycle positioning..." style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--bb-teal-border)', color: '#fff', padding: '12px', fontSize: '11px', outline: 'none', resize: 'none', borderRadius: '2px' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', display: 'block', marginBottom: '8px', fontWeight: 800 }}>2. POLICY FRAMEWORK</label>
                                <textarea rows={2} placeholder="Monetary/Fiscal impulse..." style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--bb-teal-border)', color: '#fff', padding: '10px', fontSize: '10px', outline: 'none', resize: 'none' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', display: 'block', marginBottom: '8px', fontWeight: 800 }}>3. LIQUIDITY DYNAMICS</label>
                                <textarea rows={2} placeholder="Global liquidity / TGA / RRP..." style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--bb-teal-border)', color: '#fff', padding: '10px', fontSize: '10px', outline: 'none', resize: 'none' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', display: 'block', marginBottom: '8px', fontWeight: 800 }}>4. IDENTIFIED INSTRUMENTS</label>
                            <input placeholder="e.g. EURUSD, US10Y, XAUUSD..." style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--bb-teal-border)', color: '#fff', padding: '10px', fontSize: '11px', outline: 'none' }} />
                        </div>

                        <div>
                            <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', display: 'block', marginBottom: '8px', fontWeight: 800 }}>5. SCENARIOS & CATALYSTS</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input placeholder="Base Case (+Catalyst)" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,184,224,0.3)', color: '#fff', padding: '8px', fontSize: '10px', outline: 'none' }} />
                                <input placeholder="Alternative Case" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(140, 174, 191, 0.2)', color: '#fff', padding: '8px', fontSize: '10px', outline: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', display: 'block', marginBottom: '8px', fontWeight: 800 }}>6. RISK-REWARD</label>
                                <input placeholder="e.g. 1:3.5" style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--bb-teal-border)', color: 'var(--bb-green)', padding: '10px', fontSize: '11px', fontWeight: 800 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', display: 'block', marginBottom: '8px', fontWeight: 800 }}>7. HORIZON</label>
                                <select style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--bb-teal-border)', color: '#fff', padding: '8px', fontSize: '10px', outline: 'none' }}>
                                    <option>TACTICAL (1-5D)</option>
                                    <option>SWING (1-4W)</option>
                                    <option>MACRO (3M+)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '9px', color: 'var(--bb-text-dim)', display: 'block', marginBottom: '8px', fontWeight: 800 }}>8. EXECUTION & RISK MANAGEMENT</label>
                            <textarea rows={2} placeholder="Entry zones, Stop loss, Invalidation points..." style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--bb-teal-border)', color: '#fff', padding: '10px', fontSize: '10px', outline: 'none', resize: 'none' }} />
                        </div>

                        <button style={{ 
                            marginTop: '10px',
                            padding: '14px',
                            background: 'linear-gradient(135deg, #00b8e0, #0072b2)',
                            border: 'none',
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: '11px',
                            letterSpacing: '0.15em',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 15px rgba(0,184,224,0.3)'
                        }}>
                             COMPOSE TO PLAYBOOK <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (embedded) return innerContent;

    return (
        <div className="macro-fs-container" style={{ background: '#02090b', display: 'flex', flexDirection: 'column' }}>
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">GLOBAL MACRO THESIS PLAYBOOK</h1>
                    <div className="macro-fs-subtitle">STRATEGIC ARCHIVE · PROBABILISTIC MODELS · EXECUTION PARAMS</div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => setIsDrafting(true)}
                        style={{ 
                            background: 'var(--bb-blue)', 
                            border: 'none', 
                            color: '#fff', 
                            padding: '6px 16px', 
                            fontSize: '11px', 
                            fontWeight: 800, 
                            borderRadius: '2px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Layers size={12} /> NEW THESIS
                    </button>
                    <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={12} /> CLOSE
                    </button>
                </div>
            </div>
            {innerContent}
        </div>
    );
}

