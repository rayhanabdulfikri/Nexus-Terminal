import "./TopNav.css"
import React, { useState, useEffect, memo, useRef } from "react"
import { useTerminal } from "../../context/TerminalContext"
import { User, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react"
import { useCommandBarStats } from "../../hooks/useCommandBarStats"

type MenuKey = "REGIME" | "ASSETS" | "TRADE" | "RISK" | "BACKTEST" | "CALENDAR" | "SETTINGS" | "HELP" | "POSITION" | "PORTFOLIO" | "RESEARCH" | null

function getSessionStatus(): { ny: boolean; lon: boolean; tok: boolean } {
  const now = new Date()
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  return {
    ny:  utcMin >= 780 && utcMin < 1320,
    lon: utcMin >= 420 && utcMin < 960,
    tok: utcMin >= 1380 || utcMin < 480,
  }
}

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

const COMMAND_GUIDE = [
  { cmd: "PORT",  desc: "Portfolio Summary & P&L", view: "PORTFOLIO" },
  { cmd: "RISK",  desc: "Cross-Asset Risk Analytics", view: "RISK" },
  { cmd: "TRADE", desc: "Advanced Execution Desk", view: "TRADE" },
  { cmd: "CAL",   desc: "Economic Data Calendar", view: "CALENDAR" },
  { cmd: "ENG",   desc: "Systematic Engineering Lab", view: "ENGINEERING" },
  { cmd: "SENT",  desc: "Participant Sentiment Engine", view: "SENTIMENT" },
  { cmd: "NEWS",  desc: "Institutional News Feed", view: "NEWS" },
  { cmd: "ESI",   desc: "Regional Surprise Velocity", view: "MOMENTUM" },
  { cmd: "IDEA",  desc: "Thesis Playbook Hub", view: "TRADE_IDEA" },
  { cmd: "SCAN",  desc: "Lead/Lag Alpha Scanner", view: "LEAD_LAG" },
  { cmd: "LIQ",   desc: "USD Net Liquidity Model", view: "LIQUIDITY" },
  { cmd: "YC",    desc: "Sovereign Yield Curves", view: "YIELD_CURVE" },
  { cmd: "CB",    desc: "Central Bank Framework", view: "CENTRAL_BANK" },
  { cmd: "FXS",   desc: "G10 FX Strength Matrix", view: "FX_STRENGTH" },
  { cmd: "DASH",  desc: "Main Dashboard View", view: "DASHBOARD" },
  { cmd: "HELP",  desc: "Nexus Terminal Guide", view: "GUIDE" },
]

export default function TopNav() {
  const { activeTicker, setActiveTicker, activeView, setActiveView } = useTerminal()
  const [command, setCommand] = useState("")
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [suggestions, setSuggestions] = useState<typeof COMMAND_GUIDE>([])
  const liveStats = useCommandBarStats()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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
          case "g": e.preventDefault(); setActiveView("GUIDE");       setActiveMenu(null); break
          case "n": e.preventDefault(); setActiveView("NEWS");        setActiveMenu(null); break
          case "s": e.preventDefault(); setActiveView("SENTIMENT");   setActiveMenu(null); break
        }
      }
      if (e.key === "Escape") {
        setActiveMenu(null)
        setActiveView("DASHBOARD")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setActiveView])

  useEffect(() => {
    if (command.length > 0) {
      const filtered = COMMAND_GUIDE.filter(c => 
        c.cmd.toLowerCase().startsWith(command.toLowerCase()) || 
        c.desc.toLowerCase().includes(command.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 6))
    } else {
      setSuggestions([])
    }
  }, [command])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = command.trim().toUpperCase()
    if (!cmd) return
    
    const found = COMMAND_GUIDE.find(c => c.cmd === cmd)
    if (found) {
        setActiveView(found.view as any)
    } else if (cmd === "QUAD" || cmd === "REGIME") setActiveView("REGIME")
    else if (cmd === "BANK") setActiveView("CENTRAL_BANK")
    else if (cmd === "CURVE") setActiveView("YIELD_CURVE")
    else if (cmd === "STRENGTH") setActiveView("FX_STRENGTH")
    else if (cmd === "FLOW") setActiveView("LIQUIDITY")
    else if (cmd === "THESIS") setActiveView("TRADE_IDEA")
    else if (cmd === "SURPRISE") setActiveView("MOMENTUM")
    else if (cmd === "BACK") setActiveView("ENGINEERING")
    else if (cmd === "SENTIMENT") setActiveView("SENTIMENT")
    else setActiveTicker(cmd.split(" ")[0])
    
    setCommand("")
    setSuggestions([])
  }

  const NAV_ITEMS = [
    { label: "QUADRANT",     view: "REGIME" },       
    { label: "LIQUIDITY",    view: "LIQUIDITY" },    
    { label: "CENTRAL BANK", view: "CENTRAL_BANK" }, 
    { label: "YIELD CURVE",  view: "YIELD_CURVE" },  
    { label: "MOMENTUM",     view: "MOMENTUM" },     
    { label: "ASSETS",       view: "ASSETS" },       
    { label: "RESEARCH",     view: "RESEARCH" },     
    { label: "CALENDAR",     view: "CALENDAR" },
    { label: "TRADE",        view: "TRADE" },
    { label: "RISK",         view: "RISK" },
    { label: "PORTFOLIO",    view: "PORTFOLIO" },
    { label: "ENGINEERING",  view: "ENGINEERING" },
    { label: "GUIDE",        view: "GUIDE" },
  ]

  const sessions = getSessionStatus()

  const scroll = (direction: "left" | "right") => {
    if (navRef.current) {
      const scrollAmount = 200
      navRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="topnav-container animate-fade">
      <div className="topnav-bar">
        <div className="tn-brand" onClick={() => { setActiveView("DASHBOARD"); setActiveMenu(null) }}>
          <div className="brand-logo">
            <span className="brand-primary">NEX</span>
            <span className="brand-secondary">US</span>
          </div>
          <span className="brand-subtitle">MARKET INTELLIGENCE</span>
        </div>

        <div className="tn-nav-scroll-wrapper">
          <button className="tn-scroll-btn" onClick={() => scroll("left")}><ChevronLeft size={14} /></button>
          <div className="tn-nav-scroll-container" ref={navRef}>
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
          </div>
          <button className="tn-scroll-btn" onClick={() => scroll("right")}><ChevronRight size={14} /></button>
        </div>

        <div className="tn-sessions">
          <div className={`tn-session ${sessions.tok ? "active-session" : "inactive-session"}`}><span className="session-dot" />TOK</div>
          <div className={`tn-session ${sessions.lon ? "active-session" : "inactive-session"}`}><span className="session-dot" />LON</div>
          <div className={`tn-session ${sessions.ny ? "active-session" : "inactive-session"}`}><span className="session-dot" />NY</div>
        </div>

        <WorldClocks time={currentTime} />
        <div className="tn-user-profile" title="User Profile"><span className="user-status-dot" /><User size={14} /></div>
      </div>

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
          <div className="tn-cmd-stats">
            <div className="tn-cmd-stat"><span className="tn-cmd-stat-label">VIX</span><span className="tn-cmd-stat-val text-pos">{liveStats.vix.toFixed(2)}</span></div>
            <div className="tn-cmd-stat"><span className="tn-cmd-stat-label">DXY</span><span className="tn-cmd-stat-val text-neg">{liveStats.dxy.toFixed(2)}</span></div>
            <div className="tn-cmd-stat"><span className="tn-cmd-stat-label">GOLD</span><span className="tn-cmd-stat-val text-pos">{liveStats.gold.toFixed(1)}</span></div>
            <div className="tn-cmd-stat"><span className="tn-cmd-stat-label">US10Y</span><span className="tn-cmd-stat-val text-neg">{liveStats.us10y.toFixed(3)}%</span></div>
          </div>
          <div className="tn-cmd-hint">PRESS <span className="kbd">↵</span> TO EXECUTE</div>
        </form>

        {suggestions.length > 0 && (
          <div className="tn-cmd-suggestions animate-fade-in" style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#051418',
              border: '1px solid var(--bb-teal-border)',
              zIndex: 1000,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '4px'
          }}>
            {suggestions.map((s, i) => (
              <div 
                key={i} 
                className="tn-suggestion-item" 
                onClick={() => {
                  if (s.view) setActiveView(s.view as any);
                  setCommand("");
                  setSuggestions([]);
                }}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(22,51,68,0.3)',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,184,224,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--bb-amber)', fontWeight: 800, fontSize: '11px' }}>{s.cmd}</span>
                  <span style={{ background: 'var(--bb-blue-dim)', color: 'var(--bb-blue)', fontSize: '8px', padding: '1px 4px', borderRadius: '2px', fontWeight: 900 }}>GO</span>
                </div>
                <span style={{ color: 'var(--bb-text-dim)', fontSize: '10px' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeMenu === "PORTFOLIO" && (
        <div className="tn-dropdown dropdown-port" style={{ width: "560px" }}>
          <div className="dd-header"><span>PNL SUMMARY</span><span className="text-pos">TOTAL: +$14,210 <span style={{ color: "var(--bb-green)", fontSize: "10px", display: "inline-flex", alignItems: "center", gap: "2px" }}><ChevronUp size={10} /> 5.2%</span></span></div>
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
    </div>
  )
}
