import { useState } from 'react';
import './ResearchFullScreen.css';
import '../MacroRegime/MacroFullScreen.css';
import { useTerminal } from '../../context/TerminalContext';

const RESEARCH_DOCS = [
    {
        id: 1,
        cat: "Global Macro",
        bank: "J.P. Morgan",
        desk: "Global Equities Strategy",
        date: "Apr 15, 2024",
        title: "The Immaculate Disinflation: Are Markets Priced for Perfection?",
        abstract: "Equity markets have aggressively priced in a soft landing scenario. We analyze whether the historical risk premia justify current valuations given sticky core inflation services.",
        content: `
            <p>We maintain an Underweight recommendation on global equities over a 3-month horizon. Our base case suggests that the "immaculate disinflation" narrative currently driving equity multiples to the 90th percentile historical range is increasingly vulnerable to sticky services inflation.</p>
            <h3>Key Takeaways</h3>
            <div class="r-doc-bullet">The last mile of inflation reduction (from 3.5% down to 2.0%) has historically taken twice as long as the drop from peak to 3.5%.</div>
            <div class="r-doc-bullet">Earnings estimates for Q3/Q4 are embedding 12% YoY growth, which contradicts our leading credit impulse indicators.</div>
            <div class="r-doc-bullet">We recommend defensive rotation into Healthcare and Utilities, while taking profits in mega-cap technology names.</div>
            <p>Our proprietary sentiment indicator (JPM-GSI) flashed a cautionary reading of +2.8 standard deviations last week, levels historically followed by a >5% drawdown within 30 days. Volatility (VIX) at 12-13 is mispricing geopolitical tail risks and election uncertainty converging in late Q3.</p>
        `
    },
    {
        id: 2,
        cat: "FX Strategy",
        bank: "Goldman Sachs",
        desk: "G10 FX Desk",
        date: "Apr 14, 2024",
        title: "JPY Intervention Watch: The Line in the Sand at 152",
        abstract: "With USD/JPY pushing against multi-decade highs, MoF intervention risks are escalating. We model the potential timeline and efficacy of direct FX market intervention.",
        content: `
            <p>The Ministry of Finance (MoF) is facing intense political pressure as the rapid depreciation of the Yen exacerbates imported inflation, severely impacting household purchasing power despite recent historic Shunto wage negotiations.</p>
            <h3>Intervention Mechanics</h3>
            <p>Our analysis of BoJ liquidity operations suggests that unsterilized intervention remains unlikely. However, verbal warnings have escalated to "Condition Red" vocabulary. The last time officials used the phrase "will not rule out any options", intervention occurred within 48 hours.</p>
            <div class="r-doc-bullet">Level to watch: 152.00 is widely seen as the technical trigger point.</div>
            <div class="r-doc-bullet">We estimate MoF has approximately $1.15 Trillion in foreign reserves, providing ample firepower for sustained daily interventions of $20-30B if needed.</div>
            <p>We advise clients holding long USD/JPY exposure to purchase short-dated OTM puts for sudden, sharp downside protection. The implied volatility surface is currently underpricing tail events around the 148-150 strikes.</p>
        `
    },
    {
        id: 3,
        cat: "Fixed Income",
        bank: "Morgan Stanley",
        desk: "Rates Strategy",
        date: "Apr 12, 2024",
        title: "Duration Delusion: The Case for a Steeper Curve",
        abstract: "The 2s10s curve inversion has reached record duration. We outline the catalysts for a bull steepener vs a bear steepener over the next 6-9 months.",
        content: `
            <p>The yield curve remains deeply inverted, but the structural forces keeping the back-end anchored are beginning to crack under the weight of unprecedented Treasury issuance.</p>
            <h3>The Supply Problem</h3>
            <p>The US Treasury will need to finance a roughly $1.8T deficit. As the Fed continues Quantitative Tightening (QT), the marginal buyer of US debt is shifting from price-insensitive official institutions to price-sensitive private buyers, requiring a higher term premium.</p>
            <div class="r-doc-bullet">We project the 10-year term premium, currently deeply negative, will normalize to +50bps by year-end.</div>
            <div class="r-doc-bullet">This implies a fair value 10Y yield of 4.75% even if the Fed cuts policy rates by 75bps.</div>
            <p>Our trade recommendation is a 2s10s steepener (paying 10y, receiving 2y). We prefer constructing this via swap markets to isolate the curve dynamic from repo-market funding frictions.</p>
        `
    }
];

export default function ResearchFullScreen() {
    const { setActiveView } = useTerminal();
    const [selectedCat, setSelectedCat] = useState("All");
    const [selectedDocId, setSelectedDocId] = useState(1);

    const categories = ["All", "Global Macro", "FX Strategy", "Fixed Income", "Commodities", "Crypto", "Quantitative"];
    const filteredDocs = selectedCat === "All" ? RESEARCH_DOCS : RESEARCH_DOCS.filter(d => d.cat === selectedCat);
    const activeDoc = RESEARCH_DOCS.find(d => d.id === selectedDocId) || RESEARCH_DOCS[0];

    return (
        <div className="res-fs-container macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">INSTITUTIONAL RESEARCH DESK</h1>
                    <div className="macro-fs-subtitle">PROPRIETARY ANALYSIS, NOTES & STRATEGY • {new Date().toLocaleDateString()}</div>
                </div>
                <button className="macro-fs-close" onClick={() => setActiveView("DASHBOARD")}>✕ CLOSE DASHBOARD</button>
            </div>

            <div className="res-fs-content">
                {/* Sidebar Categories */}
                <div className="r-sidebar">
                    <div className="r-side-title">REPORT CATEGORIES</div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {categories.map(c => (
                            <div key={c} className={`r-side-item ${selectedCat === c ? 'active' : ''}`} onClick={() => setSelectedCat(c)}>
                                {c}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feed / List of Reports */}
                <div className="r-feed">
                    <div className="r-feed-header">
                        <span style={{ color: 'var(--bb-amber)', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.05em' }}>LATEST PUBLICATIONS</span>
                        <span style={{ color: 'var(--bb-text-dim)', fontSize: '11px' }}>{filteredDocs.length} Results</span>
                    </div>
                    {filteredDocs.map(doc => (
                        <div key={doc.id} className={`r-feed-item ${selectedDocId === doc.id ? 'active' : ''}`} onClick={() => setSelectedDocId(doc.id)}>
                            <div className="r-meta">
                                <span>{doc.date}</span>
                                <span>{doc.bank} • {doc.cat}</span>
                            </div>
                            <div className="r-title">{doc.title}</div>
                            <div className="r-desk">{doc.desk}</div>
                        </div>
                    ))}
                </div>

                {/* Simulated PDF Viewer */}
                <div className="r-viewer">
                    <div className="r-doc">
                        <div className="r-doc-head">
                            <div className="r-doc-bank">{activeDoc.bank}</div>
                            <div className="r-doc-title">{activeDoc.title}</div>
                            <div className="r-doc-info">
                                <div><strong>Date:</strong> {activeDoc.date}</div>
                                <div><strong>Analyst/Desk:</strong> {activeDoc.desk}</div>
                                <div><strong>Class:</strong> {activeDoc.cat}</div>
                            </div>
                        </div>
                        <div className="r-doc-body" dangerouslySetInnerHTML={{ __html: activeDoc.content }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
