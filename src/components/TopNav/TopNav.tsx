import "./TopNav.css"
import React, { useState, useEffect, useMemo, useCallback, memo } from "react"
import calendarData from "../../data/major_currencies_calendar.json"
import sentimentData from "../../data/retail_sentiment.json"
import { useTerminal } from "../../context/TerminalContext"

type MenuKey = "REGIME" | "ASSETS" | "TRADE" | "RISK" | "BACKTEST" | "CALENDAR" | "SETTINGS" | "HELP" | "POSITION" | "PORTFOLIO" | "RESEARCH" | null

// ── Session open/closed helpers ──
function getSessionStatus(): { ny: boolean; lon: boolean; tok: boolean } {
  const now = new Date()
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  return {
    ny:  utcMin >= 780 && utcMin < 1320,
    lon: utcMin >= 420 && utcMin < 960,
    tok: utcMin >= 1380 || utcMin < 480,
  }
}

// ── Memoised clock component ──
const WorldClocks = memo(function WorldClocks({ time }: { time: Date }) {
  const fmt = (offset: number) => {
    const d = new Date(time.getTime() + time.getTimezoneOffset() * 60000 + offset * 3600000)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  }
  const sessions = getSessionStatus()

  return (
    <div className="tn-clocks">
      {[
        { city: "NY", time: fmt(-5), open: sessions.ny },
        { city: "LON", time: fmt(0), open: sessions.lon },
        { city: "TOK", time: fmt(9), open: sessions.tok },
      ].map(c => (
        <div key={c.city} className="tn-clock">
          <span className="tn-clock-city">{c.city}</span>
          <span className={`tn-clock-time ${c.open ? "market-open" : ""}`}>{c.time}</span>
        </div>
      ))}
    </div>
  )
})

function TopNav() {
  const { activeTicker, setActiveTicker, setActiveView, activeView } = useTerminal()
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null)
  const [command, setCommand] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update every second for smooth clocks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const [calendarFilter, setCalendarFilter] = useState<"TODAY" | "THIS_WEEK" | "NEXT_WEEK" | "LAST_WEEK" | "THIS_MONTH">("TODAY")
  const [impactFilters, setImpactFilters] = useState<string[]>(["HIGH", "MED"])

  const toggleImpact = useCallback((level: string) => {
    setImpactFilters(prev => prev.includes(level) ? prev.filter(x => x !== level) : [...prev, level])
  }, [])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "r": e.preventDefault(); setActiveView("REGIME");      setActiveMenu(null); break
          case "a": e.preventDefault(); setActiveView("ASSETS");      setActiveMenu(null); break
          case "t": e.preventDefault(); setActiveView("TRADE");       setActiveMenu(null); break
          case "k": e.preventDefault(); setActiveView("RISK");        setActiveMenu(null); break
          case "b": e.preventDefault(); setActiveView("ENGINEERING"); setActiveMenu(null); break
          case "c": e.preventDefault(); setActiveView("CALENDAR");    setActiveMenu(null); break
          case "p": e.preventDefault(); setActiveView("PORTFOLIO");   setActiveMenu(null); break
          case "e": e.preventDefault(); setActiveView("RESEARCH");    setActiveMenu(null); break
          case "s": e.preventDefault(); setActiveView("SENTIMENT");   setActiveMenu(null); break
        }
      }
      if (e.key === "Escape") setActiveMenu(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setActiveView])

  // Calendar data processing
  const fullCalendarItems = useMemo(() => {
    try {
      if (!calendarData || !calendarData.events) return {}
      const now = new Date()
      const dow = now.getDay() === 0 ? 7 : now.getDay()
      const startOfThisWeek = new Date(now.getTime() - (dow - 1) * 86400000)
      startOfThisWeek.setHours(0, 0, 0, 0)

      let startBound: Date
      let endBound: Date

      if (calendarFilter === "TODAY") {
        startBound = new Date(now); startBound.setHours(0, 0, 0, 0)
        endBound = new Date(now); endBound.setHours(23, 59, 59, 999)
      } else if (calendarFilter === "THIS_WEEK") {
        startBound = new Date(startOfThisWeek)
        endBound = new Date(startOfThisWeek.getTime() + 6 * 86400000); endBound.setHours(23, 59, 59, 999)
      } else if (calendarFilter === "LAST_WEEK") {
        endBound = new Date(startOfThisWeek.getTime() - 1)
        startBound = new Date(endBound.getTime() - 6 * 86400000); startBound.setHours(0, 0, 0, 0)
      } else if (calendarFilter === "NEXT_WEEK") {
        startBound = new Date(startOfThisWeek.getTime() + 7 * 86400000)
        endBound = new Date(startBound.getTime() + 6 * 86400000); endBound.setHours(23, 59, 59, 999)
      } else {
        startBound = new Date(now.getFullYear(), now.getMonth(), 1)
        endBound = new Date(now.getFullYear(), now.getMonth() + 1, 0); endBound.setHours(23, 59, 59, 999)
      }

      const filtered = calendarData.events.filter((e: any) => {
        const eventTime = new Date(e.date_local)
        return eventTime >= startBound && eventTime <= endBound && impactFilters.includes(e.eco_level)
      })

      const grouped: Record<string, any[]> = {}
      for (const e of filtered) {
        const d = new Date(e.date_local)
        const dayKey = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
        if (!grouped[dayKey]) grouped[dayKey] = []
        grouped[dayKey].push({ ...e, time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) })
      }
      return grouped
    } catch { return {} }
  }, [calendarFilter, impactFilters])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = command.trim().toUpperCase()
    if (!cmd) return
    if (cmd === "CAL")                    setActiveView("CALENDAR")
    else if (cmd === "POS" || cmd === "SENT") setActiveView("SENTIMENT")
    else if (cmd === "PORT" || cmd === "PNL") setActiveView("PORTFOLIO")
    else if (cmd === "RES" || cmd === "RESEARCH") setActiveView("RESEARCH")
    else if (cmd === "HELP")              setActiveMenu("HELP")
    else if (cmd === "RISK")              setActiveView("RISK")
    else if (cmd === "ENG" || cmd === "BACK") setActiveView("ENGINEERING")
    else if (cmd === "DASHBOARD" || cmd === "DASH") setActiveView("DASHBOARD")
    else                                  setActiveTicker(cmd.split(" ")[0])
    setCommand("")
  }

  const NAV_ITEMS = [
    { label: "MACRO REGIME", view: "REGIME" },
    { label: "ASSETS",       view: "ASSETS" },
    { label: "SENTIMENT",    view: "SENTIMENT" },
    { label: "CALENDAR",     view: "CALENDAR" },
    { label: "TRADE",        view: "TRADE" },
    { label: "RISK",         view: "RISK" },
    { label: "PORTFOLIO",    view: "PORTFOLIO" },
    { label: "RESEARCH",     view: "RESEARCH" },
    { label: "ENGINEERING",  view: "ENGINEERING" },
  ]

  const sessions = getSessionStatus()

  return (
    <div className="topnav-container animate-fade">
      {/* ── Main Navbar ── */}
      <div className="topnav-bar">
        <div className="tn-brand" onClick={() => { setActiveView("DASHBOARD"); setActiveMenu(null) }}>
          <div className="brand-logo">
            <span className="brand-primary">NEX</span>
            <span className="brand-secondary">US</span>
          </div>
          <span className="brand-subtitle">MARKET INTELLIGENCE</span>
        </div>

        <div className="tn-nav-items">
          {NAV_ITEMS.map(item => (
            <div
              key={item.view}
              className={`tn-item ${activeView === item.view ? "active" : ""}`}
              onClick={() => { setActiveView(item.view); setActiveMenu(null) }}
            >
              {item.label}
            </div>
          ))}
        </div>

        <div className="tn-spacer" />

        {/* ── Market Session Indicators ── */}
        <div className="tn-sessions">
          <div className={`tn-session ${sessions.tok ? "active-session" : "inactive-session"}`}>
            <span className="session-dot" />TOK
          </div>
          <div className={`tn-session ${sessions.lon ? "active-session" : "inactive-session"}`}>
            <span className="session-dot" />LON
          </div>
          <div className={`tn-session ${sessions.ny ? "active-session" : "inactive-session"}`}>
            <span className="session-dot" />NY
          </div>
        </div>

        {/* ── World Clocks ── */}
        <WorldClocks time={currentTime} />

        <div className="tn-user-profile" title="User Profile">
          <span className="user-status-dot" />
          👤
        </div>
      </div>

      {/* ── Command Line ── */}
      <div className="tn-cmd-line">
        <form onSubmit={handleCommand} className="tn-cmd-form">
          <div className="tn-cmd-prompt-wrap">
            <span className="tn-cmd-ticker">{activeTicker}</span>
            <span className="tn-cmd-action">GO</span>
            <span className="tn-cmd-symbol">❯</span>
          </div>
          <input
            type="text"
            className="tn-cmd-input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="ENTER COMMAND OR TICKER (e.g. EURUSD, PORT, CAL, RISK, SENT)..."
            autoFocus
          />
          {/* Quick stats in command bar */}
          <div className="tn-cmd-stats">
            <div className="tn-cmd-stat">
              <span className="tn-cmd-stat-label">VIX</span>
              <span className="tn-cmd-stat-val text-pos">13.42</span>
            </div>
            <div className="tn-cmd-stat">
              <span className="tn-cmd-stat-label">DXY</span>
              <span className="tn-cmd-stat-val text-neg">104.32</span>
            </div>
            <div className="tn-cmd-stat">
              <span className="tn-cmd-stat-label">GOLD</span>
              <span className="tn-cmd-stat-val text-pos">2038</span>
            </div>
            <div className="tn-cmd-stat">
              <span className="tn-cmd-stat-label">US10Y</span>
              <span className="tn-cmd-stat-val text-neg">4.248%</span>
            </div>
          </div>
          <div className="tn-cmd-hint">
            PRESS <span className="kbd">↵</span> TO EXECUTE · <span className="kbd">ESC</span> CLOSE
          </div>
        </form>
      </div>

      {/* ═══ DROPDOWNS ═══ */}

      {/* ASSETS */}
      {activeMenu === "ASSETS" && (
        <div className="tn-dropdown dropdown-assets" style={{ width: "650px" }}>
          <div className="dd-header">CROSS ASSET DIRECTORY</div>
          <div className="dd-body">
            <div className="asset-grid">
              <div className="asset-col">
                <div className="text-amber fw-bold mb-1" style={{ fontSize: "9px", letterSpacing: "0.1em" }}>CURRENCIES</div>
                <div className="text-dim" style={{ fontSize: "9px", marginBottom: "6px" }}>Majors & Minors</div>
                {["EURUSD", "USDJPY", "GBPUSD", "AUDUSD", "USDCAD"].map(t => (
                  <div key={t} className="dd-ticker-row" onClick={() => { setActiveTicker(t); setActiveMenu(null) }}
                    style={{ padding: "3px 0", cursor: "pointer", color: "var(--bb-text-dim)", fontSize: "11px" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--bb-text-bright)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--bb-text-dim)")}
                  >{t}</div>
                ))}
              </div>
              <div className="asset-col">
                <div className="text-amber fw-bold mb-1" style={{ fontSize: "9px", letterSpacing: "0.1em" }}>COMMODITIES</div>
                <div className="text-dim" style={{ fontSize: "9px", marginBottom: "6px" }}>Metals & Energy</div>
                {["XAUUSD", "XAGUSD", "WTIUSD", "NGASUSD", "COPUSD"].map(t => (
                  <div key={t} className="dd-ticker-row" onClick={() => { setActiveTicker(t); setActiveMenu(null) }}
                    style={{ padding: "3px 0", cursor: "pointer", color: "var(--bb-text-dim)", fontSize: "11px" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--bb-text-bright)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--bb-text-dim)")}
                  >{t}</div>
                ))}
              </div>
              <div className="asset-col">
                <div className="text-amber fw-bold mb-1" style={{ fontSize: "9px", letterSpacing: "0.1em" }}>CRYPTO</div>
                <div className="text-dim" style={{ fontSize: "9px", marginBottom: "6px" }}>Spot & Perps</div>
                {["BTCUSD", "ETHUSD", "SOLUSD", "BNBUSD", "XRPUSD"].map(t => (
                  <div key={t} className="dd-ticker-row" onClick={() => { setActiveTicker(t); setActiveMenu(null) }}
                    style={{ padding: "3px 0", cursor: "pointer", color: "var(--bb-text-dim)", fontSize: "11px" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--bb-text-bright)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--bb-text-dim)")}
                  >{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PORTFOLIO */}
      {activeMenu === "PORTFOLIO" && (
        <div className="tn-dropdown dropdown-port" style={{ width: "560px" }}>
          <div className="dd-header">
            <span>PNL SUMMARY</span>
            <span className="text-pos">TOTAL: +$14,210 <span style={{ color: "var(--bb-green)", fontSize: "10px" }}>▲ 5.2%</span></span>
          </div>
          <div className="dd-body" style={{ padding: "0" }}>
            <table className="dd-table">
              <thead><tr><th>ASSET</th><th>ENTRY</th><th>MARK</th><th>SIZE</th><th>P&L</th><th>STATUS</th></tr></thead>
              <tbody>
                <tr><td className="text-amber">EURUSD</td><td>1.0820</td><td>1.0865</td><td>+5M</td><td className="text-pos fw-bold">+$22,500</td><td><span className="badge badge-green">WIN</span></td></tr>
                <tr><td className="text-amber">XAUUSD</td><td>2045.0</td><td>2038.5</td><td>-100oz</td><td className="text-pos fw-bold">+$650</td><td><span className="badge badge-green">WIN</span></td></tr>
                <tr><td className="text-amber">BTCUSD</td><td>64,100</td><td>63,150</td><td>+1.0</td><td className="text-neg fw-bold">-$950</td><td><span className="badge badge-red">LOSS</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESEARCH */}
      {activeMenu === "RESEARCH" && (
        <div className="tn-dropdown dropdown-res" style={{ width: "520px" }}>
          <div className="dd-header">RESEARCH TERMINAL</div>
          <div className="dd-body">
            {[
              { title: "Fed Meeting Projection", source: "Goldman Research", time: "2h ago", color: "var(--bb-amber)", body: "Dot plot expected higher for end-2024. Rate cuts pushed to Q4." },
              { title: "Yen Intervention Watch", source: "Barclays FX", time: "5h ago", color: "var(--bb-red)", body: "MoF monitoring 152.00 level carefully. 155 seen as line in sand." },
              { title: "ECB Pivot Signal Analysis", source: "JPM Macro", time: "8h ago", color: "var(--bb-blue)", body: "First cut expected June 2024 if inflation prints cooperate." },
            ].map((item, i) => (
              <div key={i} className="res-item" style={{ paddingBottom: "12px", marginBottom: "12px", borderBottom: i < 2 ? "1px solid var(--bb-teal-border)" : "none" }}>
                <div style={{ color: item.color, fontWeight: 800, fontSize: "11px" }}>● {item.title}</div>
                <div style={{ color: "var(--bb-text-dim)", fontSize: "9px", marginTop: "2px" }}>{item.source} · {item.time}</div>
                <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--bb-text)" }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRADE */}
      {activeMenu === "TRADE" && (
        <div className="tn-dropdown dropdown-trade" style={{ width: "460px" }}>
          <div className="dd-header">NEW ORDER ENTRY</div>
          <div className="dd-body">
            <div className="flex-between" style={{ fontSize: "11px" }}>
              <span className="text-dim">STRATEGY:</span>
              <span className="dropdown-box">[Momentum ▼]</span>
            </div>
            <div className="mt-2 text-amber fw-bold" style={{ fontSize: "13px" }}>ASSET: {activeTicker}</div>
            <div className="d-grid-2 mt-2">
              <div className="text-dim" style={{ fontSize: "10px" }}>DIRECTION:</div>
              <span className="text-pos fw-bold">[LONG]</span>
              <div className="text-dim" style={{ fontSize: "10px" }}>LOTS:</div>
              <input className="inline-input" defaultValue="15" />
            </div>
            <div className="divider-full mt-2 mb-2" />
            <div className="d-grid-2" style={{ fontSize: "11px" }}>
              <div className="text-dim">STOP LOSS:</div><div className="text-neg">1.0760</div>
              <div className="text-dim">TAKE PROFIT:</div><div className="text-pos">1.0950</div>
              <div className="text-dim">RISK/REWARD:</div><div className="text-blue fw-bold">1:2.5</div>
              <div className="text-dim">RISK USD:</div><div className="text-amber fw-bold">$12,500</div>
            </div>
          </div>
        </div>
      )}

      {/* RISK */}
      {activeMenu === "RISK" && (
        <div className="tn-dropdown dropdown-risk" style={{ width: "400px" }}>
          <div className="dd-header">RISK & POSITION SIZING</div>
          <div className="dd-body">
            <div className="text-amber fw-bold" style={{ fontSize: "10px", letterSpacing: "0.08em" }}>TURTLE METHOD (UNIT SIZING)</div>
            <div className="d-grid-2 mt-2">
              <div className="text-dim">Account:</div><div>$10,000,000</div>
              <div className="text-dim">Risk/Trade:</div><div className="text-amber">25bps ($25k)</div>
              <div className="text-dim">ATR (20N):</div><div>0.0085</div>
              <div className="text-dim">2N Gap:</div><div>170 pips</div>
            </div>
            <div className="divider-full mt-2 mb-2" />
            <div className="flex-between" style={{ fontSize: "13px" }}>
              <span>TOTAL UNITS:</span>
              <span className="text-pos fw-bold">14.7 UNITS</span>
            </div>
            <div className="flex-between mt-1" style={{ fontSize: "10px" }}>
              <span className="text-dim">PORTFOLIO HEAT:</span>
              <span className="text-amber">31.4%</span>
            </div>
          </div>
        </div>
      )}

      {/* BACKTEST */}
      {activeMenu === "BACKTEST" && (
        <div className="tn-dropdown dropdown-backtest" style={{ width: "440px" }}>
          <div className="dd-header">EVENT BACKTESTER</div>
          <div className="dd-body">
            <div style={{ fontSize: "11px" }}>EVENT: <span className="dropdown-box">[NFP Surprise ▼]</span></div>
            <div className="mt-2" style={{ fontSize: "11px" }}>WINDOW: [T-1] to [T+5] Days</div>
            <div className="divider-full mt-2 mb-2" />
            <table className="dd-table">
              <thead><tr><th>ASSET</th><th>AVG %</th><th>WIN%</th><th>MAX DD</th></tr></thead>
              <tbody>
                <tr><td>USDJPY</td><td className="text-pos">+0.45%</td><td>68%</td><td className="text-neg">-0.8%</td></tr>
                <tr><td>SPX500</td><td className="text-neg">-0.12%</td><td>45%</td><td className="text-neg">-1.4%</td></tr>
                <tr><td>XAUUSD</td><td className="text-pos">+0.28%</td><td>61%</td><td className="text-neg">-0.5%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CALENDAR */}
      {activeMenu === "CALENDAR" && (
        <div className="tn-dropdown dropdown-calendar" style={{ width: "940px" }}>
          <div className="dd-header">
            <div>ECONOMIC CALENDAR</div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {(["TODAY", "THIS_WEEK", "LAST_WEEK", "NEXT_WEEK", "THIS_MONTH"] as const).map(f => (
                <span key={f} onClick={() => setCalendarFilter(f)} style={{
                  cursor: "pointer", padding: "2px 8px", fontSize: "9px", fontWeight: 700,
                  border: "1px solid", borderRadius: "2px",
                  borderColor: calendarFilter === f ? "var(--bb-amber)" : "var(--bb-teal-border)",
                  color: calendarFilter === f ? "var(--bb-amber)" : "var(--bb-text-dim)",
                  background: calendarFilter === f ? "var(--bb-amber-dim)" : "transparent",
                  transition: "all 0.15s",
                }}>{f.replace(/_/g, " ")}</span>
              ))}
              <span style={{ color: "var(--bb-text-very-dim)", margin: "0 4px" }}>|</span>
              {(["HIGH", "MED", "LOW"] as const).map(lvl => (
                <span key={lvl} onClick={() => toggleImpact(lvl)} style={{
                  cursor: "pointer", padding: "2px 8px", fontSize: "9px", fontWeight: 700,
                  border: "1px solid", borderRadius: "2px",
                  borderColor: impactFilters.includes(lvl) ? (lvl === "HIGH" ? "var(--bb-red)" : lvl === "MED" ? "var(--bb-amber)" : "var(--bb-text-dim)") : "var(--bb-teal-border)",
                  color: impactFilters.includes(lvl) ? (lvl === "HIGH" ? "var(--bb-red)" : lvl === "MED" ? "var(--bb-amber)" : "var(--bb-text-dim)") : "var(--bb-text-very-dim)",
                  background: impactFilters.includes(lvl) ? (lvl === "HIGH" ? "var(--bb-red-dim)" : lvl === "MED" ? "var(--bb-amber-dim)" : "transparent") : "transparent",
                  transition: "all 0.15s",
                }}>{lvl}</span>
              ))}
            </div>
          </div>
          <div style={{ maxHeight: "430px", overflowY: "auto", padding: "0 16px 14px" }}>
            {Object.keys(fullCalendarItems as Record<string, any[]>).length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--bb-text-dim)", fontSize: "11px" }}>
                No events found for selected period and filters.
              </div>
            ) : (
              <table className="dd-table" style={{ width: "100%" }}>
                <thead><tr>
                  <th>Time</th><th>CCY</th><th>Event</th><th>Impact</th>
                  <th style={{ textAlign: "right" }}>Actual</th>
                  <th style={{ textAlign: "right" }}>Forecast</th>
                  <th style={{ textAlign: "right" }}>Prev</th>
                </tr></thead>
                <tbody>
                  {Object.entries(fullCalendarItems as Record<string, any[]>).map(([day, events]) => (
                    <React.Fragment key={day}>
                      <tr style={{ background: "var(--bb-teal-dark)" }}>
                        <td colSpan={7} style={{ padding: "5px 8px", fontSize: "9px", color: "var(--bb-amber)", fontWeight: 800, letterSpacing: "0.08em" }}>
                          ▸ {day.toUpperCase()}
                        </td>
                      </tr>
                      {events.map((e: any, idx: number) => {
                        const actualVal = parseFloat(e.actual)
                        const forecastVal = parseFloat(e.forecast)
                        let actualColor = "var(--bb-text-dim)"
                        if (e.actual && !isNaN(actualVal) && !isNaN(forecastVal)) {
                          actualColor = actualVal > forecastVal ? "var(--bb-green)" : actualVal < forecastVal ? "var(--bb-red)" : "var(--bb-text)"
                        }
                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(22,51,68,0.4)", cursor: "pointer" }}
                            onMouseEnter={el => (el.currentTarget.style.background = "rgba(0,184,224,0.04)")}
                            onMouseLeave={el => (el.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ color: "var(--bb-text-dim)", whiteSpace: "nowrap" }}>{e.time}</td>
                            <td style={{ color: "var(--bb-amber)", fontWeight: 800 }}>{e.currency || e.country}</td>
                            <td style={{ maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</td>
                            <td>
                              <span className={`badge ${e.eco_level === "HIGH" ? "badge-red" : e.eco_level === "MED" ? "badge-amber" : ""}`}>
                                {e.eco_level}
                              </span>
                            </td>
                            <td style={{ color: actualColor, fontWeight: e.actual ? 800 : 400, textAlign: "right" }}>{e.actual || "—"}</td>
                            <td style={{ color: "var(--bb-text-dim)", textAlign: "right" }}>{e.forecast || "—"}</td>
                            <td style={{ color: "var(--bb-text-very-dim)", textAlign: "right" }}>{e.previous || "—"}</td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* POSITION / RETAIL SENTIMENT */}
      {activeMenu === "POSITION" && (
        <div className="tn-dropdown dropdown-pos" style={{ width: "600px" }}>
          <div className="dd-header">RETAIL SENTIMENT — LIVE POSITIONING</div>
          <div style={{ padding: "0 0 8px" }}>
            <table className="dd-table">
              <thead><tr>
                <th>PAIR</th><th>LONG%</th><th>SHORT%</th><th style={{ width: "160px" }}>SENTIMENT BAR</th><th style={{ textAlign: "right" }}>SIGNAL</th>
              </tr></thead>
              <tbody>
                {sentimentData.data.slice(0, 14).map((s, i) => (
                  <tr key={i}>
                    <td className="text-amber fw-bold">{s.pair}</td>
                    <td className="text-pos">{s.long_pct}%</td>
                    <td className="text-neg">{s.short_pct}%</td>
                    <td>
                      <div style={{ display: "flex", background: "var(--bb-teal-border)", height: "4px", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${s.long_pct}%`, background: "var(--bb-green)" }} />
                        <div style={{ width: `${s.short_pct}%`, background: "var(--bb-red)" }} />
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {s.long_pct > 65 ? <span className="badge badge-red">CONTRARIAN SELL</span>
                       : s.short_pct > 65 ? <span className="badge badge-green">CONTRARIAN BUY</span>
                       : <span style={{ color: "var(--bb-text-dim)", fontSize: "9px" }}>NEUTRAL</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {activeMenu === "SETTINGS" && (
        <div className="tn-dropdown dropdown-settings" style={{ width: "320px" }}>
          <div className="dd-header">SETTINGS</div>
          <div className="dd-body">
            <div className="flex-between" style={{ fontSize: "11px", padding: "4px 0" }}>
              <span className="text-dim">Theme:</span><span>Dark Terminal</span>
            </div>
            <div className="flex-between" style={{ fontSize: "11px", padding: "4px 0" }}>
              <span className="text-dim">Font:</span><span>Bloomberg / JetBrains Mono</span>
            </div>
            <div className="flex-between" style={{ fontSize: "11px", padding: "4px 0" }}>
              <span className="text-dim">Layout:</span><span>4-Panel Grid</span>
            </div>
            <div className="divider-full mt-2 mb-2" />
            <button className="w-full" onClick={() => setActiveMenu(null)} style={{
              background: "var(--bb-teal-dark)", border: "1px solid var(--bb-teal-border)",
              color: "var(--bb-text)", padding: "6px", cursor: "pointer", fontSize: "10px",
              letterSpacing: "0.08em", fontWeight: 700, borderRadius: "2px"
            }}>CLOSE</button>
          </div>
        </div>
      )}

      {/* HELP */}
      {activeMenu === "HELP" && (
        <div className="tn-dropdown dropdown-help" style={{ width: "420px" }}>
          <div className="dd-header">NEXUS COMMAND REFERENCE</div>
          <div className="dd-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
              <div>
                <div className="text-amber fw-bold mb-1" style={{ fontSize: "9px", letterSpacing: "0.1em" }}>KEYBOARD SHORTCUTS</div>
                {[
                  ["CTRL+R", "Macro Regime"], ["CTRL+A", "Assets"], ["CTRL+P", "Portfolio"],
                  ["CTRL+T", "Trade"], ["CTRL+K", "Risk"], ["CTRL+S", "Sentiment"], ["ESC", "Close Menu"],
                ].map(([k, v]) => (
                  <div key={k} className="flex-between" style={{ fontSize: "11px", padding: "3px 0", borderBottom: "1px solid rgba(22,51,68,0.4)" }}>
                    <span className="kbd">{k}</span><span className="text-dim">{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-amber fw-bold mb-1" style={{ fontSize: "9px", letterSpacing: "0.1em" }}>COMMANDS</div>
                {[
                  ["CAL", "Calendar"], ["SENT / POS", "Sentiment"], ["PORT / PNL", "Portfolio"],
                  ["RES / RESEARCH", "Research"], ["RISK", "Risk"], ["ENG / BACK", "Engineering"],
                  ["[TICKER]", "Set Active Symbol"],
                ].map(([k, v]) => (
                  <div key={k} className="flex-between" style={{ fontSize: "11px", padding: "3px 0", borderBottom: "1px solid rgba(22,51,68,0.4)" }}>
                    <span style={{ color: "var(--bb-blue)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>{k}</span>
                    <span className="text-dim">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TopNav
