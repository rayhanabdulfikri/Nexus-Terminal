import { useState, useEffect } from 'react';
import { useTerminal } from '../../context/TerminalContext';
import { X } from 'lucide-react';
import ResearchFullScreen from './ResearchFullScreen';
import TradeIdeaFullScreen from './TradeIdeaFullScreen';
import LeadLagScannerFullScreen from './LeadLagScannerFullScreen';

type ResearchTab = 'reports' | 'playbook' | 'scanner';

export default function ResearchTerminal({ defaultTab = 'reports' }: { defaultTab?: ResearchTab }) {
    const { setActiveView } = useTerminal();
    const [activeTab, setActiveTab] = useState<ResearchTab>(defaultTab);
    
    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveView('DASHBOARD'); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [setActiveView]);

    return (
        <div className="macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">NEXUS RESEARCH TERMINAL</h1>
                    <div className="macro-fs-subtitle">INSTITUTIONAL REPORTS · STRATEGIC PLAYBOOK · ALPHA SCANNER · {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView('DASHBOARD')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <X size={14} /> CLOSE
                </button>
            </div>

            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--bb-teal-border)', background: 'rgba(2,8,14,0.8)', flexShrink: 0 }}>
                {[
                    { id: 'reports',  label: 'RESEARCH REPORTS' },
                    { id: 'playbook', label: 'THESIS PLAYBOOK' },
                    { id: 'scanner',  label: 'LEAD/LAG SCANNER' },
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
                        padding: '9px 18px', background: 'transparent', border: 'none',
                        borderBottom: activeTab === t.id ? '2px solid var(--bb-amber)' : '2px solid transparent',
                        color: activeTab === t.id ? 'var(--bb-amber)' : 'var(--bb-text-dim)',
                        fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.15s',
                    }}>{t.label}</button>
                ))}
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'reports' && <ResearchFullScreen embedded />}
                {activeTab === 'playbook' && <TradeIdeaFullScreen embedded />}
                {activeTab === 'scanner' && <LeadLagScannerFullScreen embedded />}
            </div>
        </div>
    );
}
