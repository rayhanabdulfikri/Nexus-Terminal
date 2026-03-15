import { useEffect } from 'react';
import NewsFeed from './NewsFeed';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

export default function NewsFullScreen() {
    const { setActiveView } = useTerminal();

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveView("DASHBOARD");
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setActiveView]);

    return (
        <div className="macro-fs-container" style={{ background: '#02090b' }}>
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">MACRO NEWS TERMINAL</h1>
                    <div className="macro-fs-subtitle">REAL-TIME GLOBAL NEWS FEED · IMPACT ANALYSIS · ASSET REACTIONS</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE</button>
            </div>
            
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <NewsFeed />
            </div>
        </div>
    );
}
