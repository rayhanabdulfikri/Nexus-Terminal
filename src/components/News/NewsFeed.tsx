import { useState, useMemo, useEffect } from "react"
import calendarData from "../../data/major_currencies_calendar.json"
import "./NewsFeed.css"

// ─── Types ────────────────────────────────────────────────
type Sentiment = "Bullish" | "Bearish" | "Neutral" | "Mixed"
type Impact = "HIGH" | "MED" | "LOW"

interface NewsItem {
  id: number
  time: string
  title: string
  source: string
  region: string
  category: string
  impact: Impact
  impactScore: number
  sentiment: Sentiment
  sentimentAssets: { asset: string; direction: "↑" | "↓" | "→" }[]
  reaction: { label: string; change: string; dir: "pos" | "neg" | "neu" }[]
  tags: string[]
  breaking?: boolean
  bookmarked?: boolean
  summary: string
}

// ─── Static mock news data ────────────────────────────────
const STATIC_NEWS: NewsItem[] = [
  {
    id: 1,
    time: "08:32",
    title: "FOMC: Powell signals slower pace of rate hikes amid easing inflation",
    source: "Reuters",
    region: "US",
    category: "Central Bank",
    impact: "HIGH",
    impactScore: 9.4,
    sentiment: "Bearish",
    sentimentAssets: [
      { asset: "USD", direction: "↓" },
      { asset: "Gold", direction: "↑" },
      { asset: "Bonds", direction: "↑" },
    ],
    reaction: [
      { label: "DXY", change: "-0.15%", dir: "neg" },
      { label: "Gold", change: "+0.81%", dir: "pos" },
      { label: "10Y", change: "-3bps", dir: "pos" },
      { label: "SPX", change: "+0.62%", dir: "pos" },
    ],
    tags: ["Fed", "Rates", "Inflation", "Pivot"],
    breaking: false,
    summary: "Chair Powell indicated the Fed may slow its tightening cycle, citing cooling CPI data and stabilizing labor markets. Rate cut odds for Q2 rose to 68%.",
  },
  {
    id: 2,
    time: "07:15",
    title: "▸ALERT▸ BOJ surprises market — unexpectedly raises policy rate to 0.5%",
    source: "Bloomberg",
    region: "JP",
    category: "Central Bank",
    impact: "HIGH",
    impactScore: 9.8,
    sentiment: "Bullish",
    sentimentAssets: [
      { asset: "JPY", direction: "↑" },
      { asset: "Nikkei", direction: "↓" },
    ],
    reaction: [
      { label: "USD/JPY", change: "-1.42%", dir: "neg" },
      { label: "Nikkei", change: "-1.88%", dir: "neg" },
      { label: "JGB 10Y", change: "+8bps", dir: "neg" },
    ],
    tags: ["BOJ", "Yield Curve Control", "JPY", "Hawks"],
    breaking: true,
    summary: "The Bank of Japan raised its short-term policy rate from 0.25% to 0.5% — the highest since 2008 — catching FX markets off guard. USD/JPY fell sharply.",
  },
  {
    id: 3,
    time: "06:45",
    title: "ECB Lane: Euro zone inflation remains sticky, premature to discuss cuts",
    source: "ECB",
    region: "EU",
    category: "Central Bank",
    impact: "MED",
    impactScore: 6.5,
    sentiment: "Neutral",
    sentimentAssets: [
      { asset: "EUR", direction: "→" },
      { asset: "Bunds", direction: "→" },
    ],
    reaction: [
      { label: "EUR/USD", change: "+0.12%", dir: "pos" },
      { label: "Bunds", change: "flat", dir: "neu" },
    ],
    tags: ["ECB", "Inflation", "EUR"],
    breaking: false,
    summary: "ECB Chief Economist Lane reiterated that services inflation is proving persistent. Markets see first cut in June at 55% probability.",
  },
  {
    id: 4,
    time: "06:00",
    title: "China Caixin PMI: 49.8 vs 50.1 expected — factory activity contracts",
    source: "Caixin/SP",
    region: "CN",
    category: "PMI",
    impact: "MED",
    impactScore: 7.2,
    sentiment: "Bearish",
    sentimentAssets: [
      { asset: "CNY", direction: "↓" },
      { asset: "Copper", direction: "↓" },
      { asset: "AUD", direction: "↓" },
    ],
    reaction: [
      { label: "Copper", change: "-1.22%", dir: "neg" },
      { label: "AUD/USD", change: "-0.44%", dir: "neg" },
      { label: "HSI", change: "-0.91%", dir: "neg" },
    ],
    tags: ["China", "PMI", "Manufacturing", "Commodities"],
    breaking: false,
    summary: "China's factory activity contracted for the second consecutive month, raising concerns about demand for commodities — particularly copper and iron ore.",
  },
  {
    id: 5,
    time: "05:30",
    title: "US Jobless Claims: 218K vs 225K est — labor market remains tight",
    source: "DOL",
    region: "US",
    category: "Employment",
    impact: "HIGH",
    impactScore: 8.1,
    sentiment: "Bullish",
    sentimentAssets: [
      { asset: "USD", direction: "↑" },
      { asset: "Equities", direction: "↑" },
    ],
    reaction: [
      { label: "DXY", change: "+0.22%", dir: "pos" },
      { label: "SPX", change: "+0.18%", dir: "pos" },
      { label: "Gold", change: "-0.35%", dir: "neg" },
    ],
    tags: ["US", "Labor", "Jobless Claims", "Fed"],
    breaking: false,
    summary: "Initial jobless claims came in below expectations, suggesting the US labor market remains resilient despite tight monetary conditions.",
  },
  {
    id: 6,
    time: "04:15",
    title: "OPEC+ confirms output cut extension of 1.0M bpd through Q2 2026",
    source: "OPEC Secretariat",
    region: "GLOBAL",
    category: "Commodities",
    impact: "MED",
    impactScore: 7.8,
    sentiment: "Bullish",
    sentimentAssets: [
      { asset: "WTI", direction: "↑" },
      { asset: "CAD", direction: "↑" },
      { asset: "NOK", direction: "↑" },
    ],
    reaction: [
      { label: "WTI", change: "+1.85%", dir: "pos" },
      { label: "Brent", change: "+1.67%", dir: "pos" },
      { label: "USD/CAD", change: "-0.38%", dir: "neg" },
    ],
    tags: ["OPEC", "Oil", "Energy", "Supply"],
    breaking: false,
    summary: "OPEC+ agreed to extend voluntary production cuts through Q2. Saudi Arabia and Russia affirmed commitment to price support above $80/bbl.",
  },
]

const CATEGORIES = ["All", "Central Bank", "Employment", "Inflation", "GDP", "PMI", "Geopolitics", "Commodities", "Crypto"]
const REGIONS = ["All", "US", "EU", "JP", "CN", "GB", "GLOBAL"]
const IMPACTS: Impact[] = ["HIGH", "MED", "LOW"]

const BREAKING_HEADLINES = [
    "FED'S POWELL: INFLATION PROGRESS HAS STALLED, HIGHER FOR LONGER REMAINS BASE CASE",
    "U.S. RETAIL SALES (MOM): 0.7% VS 0.4% FORECAST - STRONGER THAN EXPECTED",
    "CHINA Q1 GDP GREW 5.3% Y/Y, BEATING 4.6% ESTIMATE",
    "ISRAEL WAR CABINET CONCLUDES MEETING ON IRAN RESPONSE",
    "UK WAGE GROWTH EXCLUDING BONUSES COOLED TO 6.0% IN FEB"
];

// ─── Countdown hook ───────────────────────────────────────
function useCountdowns(events: any[]) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000)
    return () => clearInterval(t)
  }, [])
  return events
}

// ─── Helpers ─────────────────────────────────────────────
function getCountdown(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  if (diff < 0) return "✓ Released"
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `▸ ${mins}m`
  if (mins < 1440) return `▸ ${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ""}`
  return `▸ ${Math.floor(mins / 1440)}d`
}

function calcSurprise(actual: string, forecast: string) {
  const a = parseFloat(actual)
  const f = parseFloat(forecast)
  if (isNaN(a) || isNaN(f) || forecast === "" || actual === "") return null
  const diff = a - f
  return { diff: diff.toFixed(2), dir: diff > 0 ? "pos" : diff < 0 ? "neg" : "neu" }
}

export default function NewsFeed({ category }: { category?: string; impact?: string }) {
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState(category ?? "All")
  const [filterRegion, setFilterRegion] = useState("All")
  const [filterImpact, setFilterImpact] = useState<string[]>(["HIGH", "MED"])
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [liveNews, setLiveNews] = useState<NewsItem[]>(STATIC_NEWS)
  const [tickerIndex, setTickerIndex] = useState(0)

  // Live News Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.8) {
        const headline = BREAKING_HEADLINES[Math.floor(Math.random() * BREAKING_HEADLINES.length)];
        const newItem: NewsItem = {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          title: headline,
          source: "Terminal",
          region: "GLOBAL",
          category: "Geopolitics",
          impact: Math.random() > 0.7 ? "HIGH" : "MED",
          impactScore: (Math.random() * 5 + 4),
          sentiment: Math.random() > 0.5 ? "Bullish" : "Bearish",
          sentimentAssets: [],
          reaction: [],
          tags: ["Breaking", "Realtime"],
          breaking: true,
          summary: "Flash headline detected on global wires. Situation evolving rapidly."
        };
        setLiveNews(prev => [newItem, ...prev.slice(0, 25)]);
      }
    }, 12000);

    const tickerTimer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % BREAKING_HEADLINES.length);
    }, 15000);

    return () => { clearInterval(timer); clearInterval(tickerTimer); };
  }, []);

  const toggleImpact = (lvl: string) =>
    setFilterImpact(prev => prev.includes(lvl) ? prev.filter(x => x !== lvl) : [...prev, lvl])

  const toggleBookmark = (id: number) =>
    setBookmarks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  // Filter news
  const news = useMemo(() => {
    return liveNews.filter(n => {
      if (showBookmarksOnly && !bookmarks.includes(n.id)) return false
      if (filterCat !== "All" && n.category !== filterCat) return false
      if (filterRegion !== "All" && n.region !== filterRegion) return false
      if (!filterImpact.includes(n.impact)) return false
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()) &&
        !n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
  }, [filterCat, filterRegion, filterImpact, search, showBookmarksOnly, bookmarks, liveNews])

  // Calendar events
  const calendarItems = useMemo(() => {
    try {
      if (!calendarData?.events) return []
      const start = new Date(); start.setHours(0, 0, 0, 0)
      const end = new Date(); end.setHours(23, 59, 59, 999)
      const today = calendarData.events.filter((e: any) => {
        const t = new Date(e.date_local)
        return t >= start && t <= end && (e.eco_level === "HIGH" || e.eco_level === "MED")
      })
      let items = today.length >= 5 ? today.slice(0, 5) : [
        ...today,
        ...calendarData.events.filter((e: any) => {
          const t = new Date(e.date_local)
          return t > end && (e.eco_level === "HIGH" || e.eco_level === "MED")
        }).slice(0, 5 - today.length)
      ]
      return items.map((e: any) => {
        const d = new Date(e.date_local)
        return {
          time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
          currency: e.currency,
          event: e.title,
          level: e.eco_level,
          actual: e.actual || "",
          forecast: e.forecast || "",
          prev: e.previous || "",
          countdown: getCountdown(e.date_local),
          dateStr: e.date_local,
        }
      })
    } catch { return [] }
  }, [])

  useCountdowns(calendarItems) // force re-render for countdowns

  const sentColor = (s: Sentiment) =>
    s === "Bullish" ? "#00ff8f" : s === "Bearish" ? "#ff4d4d" : s === "Mixed" ? "#ff9f1c" : "#9db4bd"

  const impactColor = (imp: Impact) =>
    imp === "HIGH" ? "#ff4d4d" : imp === "MED" ? "#ff9f1c" : "#5c8397"

  const scoreBar = (score: number) => {
    const pct = (score / 10) * 100
    const c = score >= 8 ? "var(--bb-red)" : score >= 5 ? "var(--bb-amber)" : "var(--bb-blue)"
    return (
      <div className="nf-score-wrap">
        <div className="nf-score-track">
          <div className="nf-score-fill" style={{ width: `${pct}%`, background: c, boxShadow: `0 0 10px ${c}` }} />
        </div>
        <span className="nf-score-val" style={{ color: c }}>{score.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="nf-root animate-fade">
      {/* Breaking News Ticker */}
      <div className="news-ticker glass">
          <div className="ticker-label">BREAKING</div>
          <div className="ticker-content">
              <span className="ticker-text">{BREAKING_HEADLINES[tickerIndex]}</span>
          </div>
          <div className="ticker-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      {/* ── Search + Filter Row ── */}
      <div className="nf-filter-bar glass">
        <div className="nf-search-wrap">
          <span className="nf-search-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
          <input
            className="nf-search"
            placeholder="Search headlines, tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="nf-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "Category ▼" : c}</option>)}
        </select>

        <select className="nf-select" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
          {REGIONS.map(r => <option key={r} value={r}>{r === "All" ? "Region ▼" : r}</option>)}
        </select>

        <div className="nf-impact-toggles">
          {IMPACTS.map(lvl => (
            <div
              key={lvl}
              className={`nf-impact-chip ${filterImpact.includes(lvl) ? "active" : ""}`}
              style={{ "--chip-color": impactColor(lvl) } as React.CSSProperties}
              onClick={() => toggleImpact(lvl)}
            >{lvl}</div>
          ))}
        </div>

        <div
          className={`nf-bookmark-btn ${showBookmarksOnly ? "active" : ""}`}
          onClick={() => setShowBookmarksOnly(v => !v)}
          title="Show bookmarks"
        >★</div>
      </div>

      {/* ── News Feed ── */}
      <div className="nf-feed-area">
        <div className="nf-section-header">
            <span className="nf-section-label">MARKET INTELLIGENCE FEED</span>
            <div className="nf-feed-stats">
                <span className="text-pos">LIVE ENABLED</span>
                <span className="dot dot-lon pulse" style={{ display: 'inline-block' }}></span>
            </div>
        </div>

        {news.length === 0 && (
          <div className="nf-empty">No news matches current filters.</div>
        )}

        <div className="nf-scroll-container">
            {news.map(item => {
                const expanded = expandedId === item.id
                const bookmarked = bookmarks.includes(item.id)
                return (
                    <div
                        key={item.id}
                        className={`nf-item ${item.breaking ? "breaking" : ""} ${expanded ? "expanded" : ""}`}
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                    >
                        {/* Breaking badge */}
                        {item.breaking && (
                            <div className="nf-breaking-badge">
                                <span className="flash"></span>
                                MARKET ALERT: BREAKING
                            </div>
                        )}

                        {/* Top row: time / region / impact / score */}
                        <div className="nf-item-header">
                            <span className="nf-item-time">{item.time}</span>
                            <span className="nf-item-region">{item.region}</span>
                            <span className="nf-item-cat">{item.category}</span>
                            <span className="nf-item-impact" style={{ color: impactColor(item.impact) }}>
                                {item.impact}
                            </span>
                            {scoreBar(item.impactScore)}
                            <div style={{ flex: 1 }} />
                            <span className="nf-item-source">{item.source}</span>
                            <span
                                className={`nf-bookmark-icon ${bookmarked ? "bookmarked" : ""}`}
                                onClick={e => { e.stopPropagation(); toggleBookmark(item.id) }}
                                title="Bookmark"
                            >★</span>
                        </div>

                        {/* Headline */}
                        <div className="nf-item-title">{item.title}</div>

                        {/* Sentiment */}
                        <div className="nf-item-sentiment">
                            <div className="nf-sent-badge" style={{ borderColor: sentColor(item.sentiment), background: `${sentColor(item.sentiment)}15` }}>
                                <span className="dot" style={{ background: sentColor(item.sentiment), boxShadow: `0 0 6px ${sentColor(item.sentiment)}` }}></span>
                                <span style={{ color: sentColor(item.sentiment) }}>{item.sentiment.toUpperCase()}</span>
                            </div>
                            
                            <div className="nf-sent-assets">
                                {item.sentimentAssets.map(a => (
                                    <span key={a.asset} className="nf-sent-asset">
                                        {a.asset}
                                        <span className={a.direction === "↑" ? "text-pos" : a.direction === "↓" ? "text-neg" : "text-dim"}>
                                            {a.direction}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Market Reaction */}
                        <div className="nf-reaction-row">
                            {item.reaction.map(r => (
                                <span key={r.label} className={`nf-reaction-chip nf-reaction-${r.dir}`}>
                                    <span className="reaction-label">{r.label}</span> 
                                    <span className="reaction-val">{r.change}</span>
                                </span>
                            ))}
                        </div>

                        {/* Expanded: AI-style summary + tags */}
                        {expanded && (
                            <div className="nf-item-expanded animate-fade">
                                <div className="nf-summary-header">
                                    <span className="nf-summary-icon">◈</span>
                                    CORE TAKEAWAY
                                </div>
                                <div className="nf-summary-text">{item.summary}</div>
                                <div className="nf-tags">
                                    {item.tags.map(t => <span key={t} className="nf-tag">#{t}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="nf-divider" />

      {/* ── Economic Calendar ── */}
      <div className="nf-calendar">
        <div className="nf-section-label">TODAY'S EVENTS — HIGH &amp; MED IMPACT</div>

        {calendarItems.length === 0 && (
          <div className="nf-empty">No events for today.</div>
        )}

        <table className="nf-cal-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>CCY</th>
              <th style={{ textAlign: "left" }}>Event</th>
              <th>Imp</th>
              <th>Actual</th>
              <th>Fcst</th>
              <th>Prev</th>
              <th>Δ Surprise</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {calendarItems.map((item: any, i: number) => {
              const surprise = calcSurprise(item.actual, item.forecast)
              const isReleased = item.countdown === "✓ Released"
              return (
                <tr key={i} className={item.level === "HIGH" ? "cal-row-high" : ""}>
                  <td className="cal-time">{item.time}</td>
                  <td style={{ color: "#ff9f1c", fontWeight: "bold" }}>{item.currency}</td>
                  <td className="cal-event-cell">
                    {item.event.length > 32 ? item.event.slice(0, 32) + "…" : item.event}
                  </td>
                  <td style={{ color: impactColor(item.level as Impact), fontWeight: "bold", textAlign: "center" }}>
                    {item.level}
                  </td>
                  <td style={{ color: item.actual ? "#00ff8f" : "#5c8397", textAlign: "right" }}>
                    {item.actual || "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>{item.forecast || "—"}</td>
                  <td style={{ color: "#5c8397", textAlign: "right" }}>{item.prev || "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    {surprise ? (
                      <span style={{ color: surprise.dir === "pos" ? "#00ff8f" : surprise.dir === "neg" ? "#ff4d4d" : "#9db4bd", fontWeight: "bold" }}>
                        {surprise.dir === "pos" ? "▲" : "▼"} {Math.abs(Number(surprise.diff))}
                      </span>
                    ) : <span style={{ color: "#5c8397" }}>—</span>}
                  </td>
                  <td style={{
                    textAlign: "right",
                    color: isReleased ? "#00ff8f" : "#ff9f1c",
                    fontWeight: "bold",
                    fontSize: "9px",
                  }}>
                    {item.countdown}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}