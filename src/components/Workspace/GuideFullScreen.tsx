import { useEffect } from 'react';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';
import { X } from 'lucide-react';

export default function GuideFullScreen() {
    const { setActiveView } = useTerminal();

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveView("DASHBOARD");
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setActiveView]);

    const sections = [
        {
            title: "1. MACRO REGIME NAVIGATOR (The Master Compass)",
            content: "Use the QUADRANT (Regime Matrix) to identify the current economic environment: Goldilocks, Stagflation, Reflation, or Deflation. This determines your primary asset allocation. Access ESI MOMENTUM to see where data is surprising the market to the upside."
        },
        {
            title: "2. CROSS-ASSET INTELLIGENCE (Relative Value)",
            content: "The ASSETS terminal now houses the performance heatmaps and the Inter-Asset Correlation Matrix. Use the G10 FX STRENGTH MATRIX to detect currency divergences and identify high-probability mean-reversion or trend-continuation plays."
        },
        {
            title: "3. RESEARCH TERMINAL (Alpha Generation)",
            content: "A unified hub combining: (A) INSTITUTIONAL REPORTS for bank-desk intelligence, (B) THESIS PLAYBOOK for drafting your trade ideas and canvas, and (C) LEAD/LAG SCANNER to find inter-market signals before they hit the mainstream."
        },
        {
            title: "4. SYSTEMATIC ENGINEERING (Backtest & Factors)",
            content: "Move beyond 'discretionary' guesses. Use the ENGINEERING desk to backtest your strategies with 1M+ Monte Carlo iterations. Review RISK PREMIA factors (Momentum, Value, Carry) to see which 'style' is currently favored by the macro regime."
        },
        {
            title: "5. EXECUTION & RISK (Survival Economics)",
            content: "Execute via the ADVANCED TRADING TERMINAL with Level 2 Depth of Market. Use the built-in Risk/Reward Calculator and Turtle-style Position Sizing. Monitor 'Portfolio Heat' in the PORTFOLIO terminal to ensure you aren't over-leveraged to a single macro driver."
        }
    ];

    return (
        <div className="macro-fs-container" style={{ background: '#02090b' }}>
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">NEXUS TERMINAL : ALPHA WORKFLOW</h1>
                    <div className="macro-fs-subtitle">GLOBAL MACRO TRADING SYSTEM · {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <X size={14} /> CLOSE
                </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gap: '30px' }}>
                    {sections.map((s, idx) => (
                        <div key={idx} style={{ 
                            background: 'rgba(8, 22, 30, 0.4)', 
                            border: '1px solid var(--bb-teal-border)',
                            padding: '24px',
                            borderRadius: '4px',
                            borderLeft: '4px solid var(--bb-amber)'
                        }}>
                            <h3 style={{ color: 'var(--bb-amber)', fontSize: '18px', marginBottom: '12px', fontWeight: 800 }}>{s.title}</h3>
                            <p style={{ color: 'var(--bb-text-bright)', fontSize: '14px', lineHeight: '1.6', opacity: 0.9 }}>{s.content}</p>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '40px', padding: '24px', background: 'var(--bb-blue-dim)', border: '1px solid var(--bb-blue)', borderRadius: '4px', textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--bb-blue-bright)', fontWeight: 800, marginBottom: '8px' }}>PRO TIP: COMMAND BAR & SHORTCUTS</h4>
                    <p style={{ fontSize: '12px', color: 'var(--bb-text-dim)' }}>
                        Execute macro commands directly: <span style={{ color: 'var(--bb-amber)' }}>IDEA</span> (Research), <span style={{ color: 'var(--bb-amber)' }}>FXS</span> (FX Strength), <span style={{ color: 'var(--bb-amber)' }}>RES</span> (Reports).
                        Use command strings or <span style={{ color: 'var(--bb-amber)' }}>CTRL + [A, R, E, T, K]</span> for instant terminal switching.
                    </p>
                </div>
            </div>
        </div>
    );
}
