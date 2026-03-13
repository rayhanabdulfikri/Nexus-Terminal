import { useState, useEffect } from 'react';
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
        rating: "UNDERWEIGHT",
        ratingColor: "#ff4d4d",
        summary: "Equity markets have aggressively priced in a soft-landing scenario, pushing multiples to the 90th percentile of historical range. Our analysis suggests current valuations cannot withstand persistent services inflation. We anticipate a 10–15% correction probability within 60 days.",
        keyPoints: [
            "The final mile of inflation reduction (3.5% → 2.0%) historically takes 2× longer than the initial drop.",
            "Q3/Q4 earnings embed 12% YoY growth — contradicts leading credit impulse indicators.",
            "JPM Sentiment Indicator (GSI) at +2.8 std dev — historically precedes >5% drawdown within 30 days.",
            "VIX at 12–13 significantly underprices election and geopolitical tail risks converging in Q3.",
            "Recommend defensive rotation: Healthcare, Utilities. Reduce mega-cap tech exposure.",
        ],
        trades: [
            { action: "REDUCE", asset: "SPX (Mega-cap tech)", note: "Take profit above 5,200" },
            { action: "ADD", asset: "Healthcare (XLV)", note: "Defensive quality, cheap vs history" },
            { action: "HEDGE", asset: "Buy VIX calls", note: "Strike 20-25, 3M expiry" },
        ],
        title: "The Immaculate Disinflation: Are Markets Priced for Perfection?",
        abstract: "Equity markets have aggressively priced in a soft landing scenario. We analyze whether the historical risk premia justify current valuations given sticky core inflation services.",
        content: `
            <p>We maintain an Underweight recommendation on global equities over a 3-month horizon. Our base case suggests that the "immaculate disinflation" narrative currently driving equity multiples to the 90th percentile historical range is increasingly vulnerable to sticky services inflation.</p>
            <h3>Key Takeaways</h3>
            <div class="r-doc-bullet">The last mile of inflation reduction (from 3.5% down to 2.0%) has historically taken twice as long as the drop from peak to 3.5%.</div>
            <div class="r-doc-bullet">Earnings estimates for Q3/Q4 are embedding 12% YoY growth, which contradicts our leading credit impulse indicators.</div>
            <div class="r-doc-bullet">We recommend defensive rotation into Healthcare and Utilities, while taking profits in mega-cap technology names.</div>
            <p>Our proprietary sentiment indicator (JPM-GSI) flashed a cautionary reading of +2.8 standard deviations last week, levels historically followed by a >5% drawdown within 30 days. Volatility (VIX) at 12-13 is mispricing geopolitical tail risks and election uncertainty converging in late Q3.</p>
            <h3>Valuation Framework</h3>
            <p>Based on our earnings yield model adjusted for the risk-free rate, the equity risk premium for the S&P 500 has compressed to just 1.8%, versus a 30-year average of 3.5%. This represents the most stretched valuation environment since the dot-com era. Under our bear case scenario (recession within 12 months), fair value for SPX reverts to 4,200–4,400.</p>
        `
    },
    {
        id: 2,
        cat: "FX Strategy",
        bank: "Goldman Sachs",
        desk: "G10 FX Desk",
        date: "Apr 14, 2024",
        rating: "SELL USD/JPY",
        ratingColor: "#ff4d4d",
        summary: "The Ministry of Finance faces escalating political pressure as yen depreciation drives imported inflation to multi-decade highs. Goldman models the probability of direct market intervention at 65% within 30 days should USD/JPY hold above 152.00.",
        keyPoints: [
            "MoF has ~$1.15T in foreign reserves — sufficient for $20–30B daily interventions for weeks.",
            "\"Will not rule out any options\" — MoF language now at Condition RED; historically precedes action within 48h.",
            "152.00 seen as the technical trigger; 155.00 described as absolute line in sand by senior MoF official.",
            "Unsterilized intervention unlikely; verbal jawboning will escalate first before reserves deployed.",
            "Recommend long USD/JPY OTM puts (148–150 strike, 4–6 week expiry) as asymmetric hedge.",
        ],
        trades: [
            { action: "BUY", asset: "USD/JPY 148 Put", note: "4-6W expiry, size 5% of book" },
            { action: "REDUCE", asset: "Long USD/JPY spot", note: "Trim to 50% above 151.50" },
            { action: "WATCH", asset: "MoF Statements", note: "Alert on any verbal intervention shift" },
        ],
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
        rating: "STEEPENER",
        ratingColor: "#00b8e0",
        summary: "The historic 2s10s yield curve inversion has persisted for record duration, but structural cracks are forming under immense Treasury supply pressure. MS projects the term premium to normalize to +50bps by year-end, implying 10Y yields of 4.75% even with rate cuts.",
        keyPoints: [
            "US Treasury financing a $1.8T deficit while Fed runs QT — a historically unprecedented supply shock.",
            "Marginal buyer shifting from price-insensitive sovereigns to price-sensitive private sector.",
            "Term premium, currently deeply negative, projected to normalize to +50bps by end-2024.",
            "Fair value 10Y at 4.75% even with 75bps of rate cuts — curve steepening is inevitable.",
            "Preferred expression: 2s10s steepener via swaps to avoid repo-market friction.",
        ],
        trades: [
            { action: "ENTER", asset: "2s10s Steepener (swaps)", note: "Pay 10Y, receive 2Y" },
            { action: "AVOID", asset: "Long Duration Bonds", note: "Supply headwinds persist" },
            { action: "REDUCE", asset: "TLT / Long 30Y", note: "Term premium re-rating risk" },
        ],
        title: "Duration Delusion: The Case for a Steeper Curve",
        abstract: "The 2s10s curve inversion has reached record duration. We outline the catalysts for a bull steepener vs a bear steepener over the next 6-9 months.",
        content: `
            <p>The yield curve remains deeply inverted, but the structural forces keeping the back-end anchored are beginning to crack under the weight of unprecedented Treasury issuance.</p>
            <h3>The Supply Problem</h3>
            <p>The US Treasury will need to finance a roughly $1.8T deficit. As the Fed continues Quantitative Tightening (QT), the marginal buyer of US debt is shifting from price-insensitive official institutions to price-sensitive private buyers, requiring a higher term premium.</p>
            <div class="r-doc-bullet">We project the 10-year term premium, currently deeply negative, will normalize to +50bps by year-end.</div>
            <div class="r-doc-bullet">This implies a fair value 10Y yield of 4.75% even if the Fed cuts policy rates by 75bps.</div>
            <p>Our trade recommendation is a 2s10s steepener (paying 10y, receiving 2y). We prefer constructing this via swap markets to isolate the curve dynamic from repo-market funding frictions.</p>
            <h3>Bull vs Bear Steepener</h3>
            <p>A bull steepener (front-end falls faster than back-end) requires a hard landing or rapid credit deterioration — a tail risk, not base case. Our primary scenario is a bear steepener: long-end yields rise on supply pressure while the Fed cuts only modestly, leaving the front-end partially anchored.</p>
        `
    }
];

export default function ResearchFullScreen() {
    const { setActiveView } = useTerminal();
    const [selectedCat, setSelectedCat] = useState("All");
    const [selectedDocId, setSelectedDocId] = useState(1);
    const [activeView, setView] = useState<'summary' | 'full'>('summary');
    const [ticker, setTicker] = useState('');

    const categories = ["All", "Global Macro", "FX Strategy", "Fixed Income", "Commodities", "Crypto", "Quantitative"];
    const filteredDocs = selectedCat === "All" ? RESEARCH_DOCS : RESEARCH_DOCS.filter(d => d.cat === selectedCat);
    const activeDoc = RESEARCH_DOCS.find(d => d.id === selectedDocId) || RESEARCH_DOCS[0];

    // ESC to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveView('DASHBOARD'); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [setActiveView]);

    return (
        <div className="res-fs-container macro-fs-container">
            <div className="macro-fs-header">
                <div>
                    <h1 className="macro-fs-title">INSTITUTIONAL RESEARCH DESK</h1>
                    <div className="macro-fs-subtitle">PROPRIETARY ANALYSIS, NOTES & STRATEGY · {new Date().toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--bb-text-dim)' }}><span className="kbd" style={{ fontSize: '9px' }}>ESC</span> CLOSE</span>
                    <button className="macro-fs-close" onClick={() => setActiveView('DASHBOARD')}>✕ CLOSE</button>
                </div>
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
                    {/* Quick stats */}
                    <div style={{ padding: '12px 14px', borderTop: '1px solid var(--bb-teal-border)', fontSize: '9px' }}>
                        <div style={{ color: 'var(--bb-text-dim)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '8px' }}>COVERAGE STATS</div>
                        {[{ l: 'Total Reports', v: '3' }, { l: 'Buy Recs', v: '1' }, { l: 'Sell Recs', v: '2' }, { l: 'Neutral', v: '0' }].map(r => (
                            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(22,51,68,0.3)' }}>
                                <span style={{ color: 'var(--bb-text-dim)' }}>{r.l}</span>
                                <span style={{ color: 'var(--bb-amber)', fontWeight: 700 }}>{r.v}</span>
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
                                <span>{doc.bank} · {doc.cat}</span>
                            </div>
                            <div className="r-title">{doc.title}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                <div className="r-desk">{doc.desk}</div>
                                <span style={{ padding: '2px 7px', borderRadius: '2px', fontSize: '8px', fontWeight: 800, letterSpacing: '0.05em', background: `${doc.ratingColor}18`, color: doc.ratingColor, border: `1px solid ${doc.ratingColor}40` }}>
                                    {doc.rating}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Viewer */}
                <div className="r-viewer">
                    {/* View Toggle */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexShrink: 0 }}>
                        {(['summary', 'full'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)} style={{
                                padding: '5px 14px', fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em',
                                border: `1px solid ${activeView === v ? 'var(--bb-amber)' : 'var(--bb-teal-border)'}`,
                                background: activeView === v ? 'var(--bb-amber-dim)' : 'transparent',
                                color: activeView === v ? 'var(--bb-amber)' : 'var(--bb-text-dim)',
                                cursor: 'pointer', borderRadius: '2px', transition: 'all 0.15s',
                            }}>
                                {v === 'summary' ? '⚡ AI SUMMARY' : '📄 FULL REPORT'}
                            </button>
                        ))}
                    </div>

                    {/* SUMMARY VIEW */}
                    {activeView === 'summary' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Header Card */}
                            <div style={{ background: 'rgba(8,22,30,0.9)', border: '1px solid var(--bb-teal-border)', borderTop: `3px solid ${activeDoc.ratingColor}`, borderRadius: '3px', padding: '18px 22px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: 900, color: activeDoc.ratingColor === '#ff4d4d' ? '#c0392b' : '#1a6fa8', letterSpacing: '0.05em', marginBottom: '4px', fontFamily: 'serif' }}>{activeDoc.bank}</div>
                                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--bb-text)', lineHeight: 1.3, maxWidth: '600px' }}>{activeDoc.title}</div>
                                    </div>
                                    <span style={{ padding: '4px 10px', borderRadius: '2px', fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', background: `${activeDoc.ratingColor}20`, color: activeDoc.ratingColor, border: `1px solid ${activeDoc.ratingColor}50`, whiteSpace: 'nowrap', marginLeft: '12px', flexShrink: 0 }}>
                                        {activeDoc.rating}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '9px', color: 'var(--bb-text-dim)' }}>
                                    <span><strong style={{ color: 'var(--bb-text-dim)' }}>DATE:</strong> {activeDoc.date}</span>
                                    <span><strong style={{ color: 'var(--bb-text-dim)' }}>DESK:</strong> {activeDoc.desk}</span>
                                    <span><strong style={{ color: 'var(--bb-text-dim)' }}>CLASS:</strong> {activeDoc.cat}</span>
                                </div>
                            </div>

                            {/* AI Summary */}
                            <div style={{ background: 'rgba(0,100,160,0.08)', border: '1px solid rgba(0,184,224,0.2)', borderLeft: '3px solid var(--bb-blue)', borderRadius: '3px', padding: '16px 20px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-blue)', letterSpacing: '0.12em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    ⚡ NEXUS AI SUMMARY
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--bb-text)', lineHeight: 1.7, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
                                    {activeDoc.summary}
                                </div>
                            </div>

                            {/* Key Points */}
                            <div style={{ background: 'rgba(8,22,30,0.7)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', padding: '16px 20px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-amber)', letterSpacing: '0.12em', marginBottom: '12px' }}>
                                    ★ IMPORTANT POINTS
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {activeDoc.keyPoints.map((point, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 10px', background: 'rgba(4,12,18,0.6)', borderRadius: '2px', borderLeft: '2px solid var(--bb-amber)' }}>
                                            <span style={{ color: 'var(--bb-amber)', fontWeight: 800, fontSize: '10px', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>0{i + 1}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--bb-text)', lineHeight: 1.5, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>{point}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Trade Recommendations */}
                            <div style={{ background: 'rgba(8,22,30,0.7)', border: '1px solid var(--bb-teal-border)', borderRadius: '3px', padding: '16px 20px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--bb-green)', letterSpacing: '0.12em', marginBottom: '12px' }}>
                                    ▶ TRADE RECOMMENDATIONS
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {activeDoc.trades.map((t, i) => {
                                        const actionColor = t.action === 'BUY' || t.action === 'ADD' || t.action === 'ENTER' ? '#00ff8f'
                                            : t.action === 'SELL' || t.action === 'REDUCE' || t.action === 'AVOID' ? '#ff4d4d'
                                            : 'var(--bb-blue)';
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', background: 'rgba(4,12,18,0.6)', borderRadius: '2px' }}>
                                                <span style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '8px', fontWeight: 800, letterSpacing: '0.08em', background: `${actionColor}20`, color: actionColor, border: `1px solid ${actionColor}40`, whiteSpace: 'nowrap' }}>{t.action}</span>
                                                <span style={{ fontSize: '11px', color: 'var(--bb-amber)', fontWeight: 700, minWidth: '140px' }}>{t.asset}</span>
                                                <span style={{ fontSize: '10px', color: 'var(--bb-text-dim)' }}>{t.note}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FULL REPORT VIEW */}
                    {activeView === 'full' && (
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
                            <div className="r-doc-abstract">{activeDoc.abstract}</div>
                            <div className="r-doc-body" dangerouslySetInnerHTML={{ __html: activeDoc.content }}></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
