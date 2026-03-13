import Sentiment from './Sentiment';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

export default function SentimentFullScreen() {
    const { setActiveView } = useTerminal();

    return (
        <div className="macro-fs-container" style={{ background: '#02090b' }}>
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">MARKET PARTICIPANT SENTIMENT ENGINE</h1>
                    <div className="macro-fs-subtitle">COT INSTITUTIONAL & RETAIL CROWD ANALYSIS • {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE DASHBOARD</button>
            </div>
            
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Sentiment />
            </div>
        </div>
    );
}
