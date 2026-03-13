import "./App.css"
import { useState, useEffect, memo } from "react"
import { useTerminal } from "./context/TerminalContext"
import TopNav from "./components/TopNav/TopNav"
import WindowManager from "./components/Workspace/WindowManager"
import MacroFullScreen from "./components/MacroRegime/MacroFullScreen"
import AssetsFullScreen from "./components/Assets/AssetsFullScreen"
import PortfolioFullScreen from "./components/Portfolio/PortfolioFullScreen"
import ResearchFullScreen from "./components/Research/ResearchFullScreen"
import SentimentFullScreen from "./components/Sentiment/SentimentFullScreen"
import CalendarFullScreen from "./components/Calendar/CalendarFullScreen"
import RiskFullScreen from "./components/Risk/RiskFullScreen"
import EngineeringFullScreen from "./components/Engineering/EngineeringFullScreen"
import TradeFullScreen from "./components/Trade/TradeFullScreen"

// ── Live ticker data (simulated real-time) ──
const TICKER_BASE = [
  { name: "EUR/USD", val: 1.0842, chg: -0.23 },
  { name: "USD/JPY", val: 149.38, chg: +0.51 },
  { name: "GBP/USD", val: 1.2618, chg: +0.14 },
  { name: "AUD/USD", val: 0.6521, chg: -0.41 },
  { name: "USD/CAD", val: 1.3695, chg: +0.18 },
  { name: "XAU/USD", val: 2038.50, chg: +0.62 },
  { name: "WTI",     val: 78.34, chg: +1.18 },
  { name: "BTC/USD", val: 64180, chg: +3.24 },
  { name: "SPX",     val: 4452, chg: +0.88 },
  { name: "NDX",     val: 13820, chg: +1.22 },
  { name: "VIX",     val: 13.42, chg: -5.10 },
  { name: "DXY",     val: 104.32, chg: +0.08 },
  { name: "US10Y",   val: 4.248, chg: -0.032 },
  { name: "DE10Y",   val: 2.452, chg: +0.018 },
  { name: "ETH/USD", val: 3280, chg: +2.44 },
]

// Determine market session
function getMarketSession(): { label: string; status: "open" | "closed" | "pre" } {
  const now = new Date()
  const utcH = now.getUTCHours()
  const utcM = now.getUTCMinutes()
  const utcMin = utcH * 60 + utcM

  // Tokyo: 23:00–08:00 UTC
  if (utcMin >= 1380 || utcMin < 480) return { label: "TOKYO OPEN", status: "open" }
  // London: 07:00–16:00 UTC
  if (utcMin >= 420 && utcMin < 960) return { label: "LONDON OPEN", status: "open" }
  // NY: 13:00–22:00 UTC
  if (utcMin >= 780 && utcMin < 1320) return { label: "NY OPEN", status: "open" }
  // Pre-market
  if (utcMin >= 1200 && utcMin < 1380) return { label: "PRE-MARKET", status: "pre" }
  return { label: "MARKET CLOSED", status: "closed" }
}

// ── Memoised ticker tape for performance (renders once) ──
const TickerTape = memo(function TickerTape({ items }: { items: typeof TICKER_BASE }) {
  // Double the items for seamless loop
  const doubled = [...items, ...items]
  return (
    <div className="statusbar-ticker">
      <div className="statusbar-ticker-inner">
        {doubled.map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-item-name">{item.name}</span>
            <span className="ticker-item-val">
              {item.name.includes("JPY") || item.name.includes("BTC") || item.name.includes("SPX") || item.name.includes("NDX") || item.name.includes("ETH")
                ? item.val.toLocaleString()
                : item.val.toFixed(item.name.includes("US10Y") || item.name.includes("DE10Y") ? 3 : 4)
              }
            </span>
            <span className={`ticker-item-chg ${item.chg >= 0 ? "pos" : "neg"}`}>
              {item.chg >= 0 ? "▲" : "▼"} {Math.abs(item.chg).toFixed(item.chg < 1 ? 3 : 2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  )
})

function StatusBar() {
  const [time, setTime] = useState(new Date())
  const [tickCount, setTickCount] = useState(0)

  // Update clock every second
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date())
      // Simulate minor tick price fluctuations every 5s
      if (tickCount % 5 === 0) setTickCount(c => c + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [tickCount])

  const session = getMarketSession()
  const estTime = time.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })

  return (
    <div className="app-statusbar">
      <TickerTape items={TICKER_BASE} />
      <div className="statusbar-right">
        <div className={`sb-market-status ${session.status}`}>
          <span className="sb-dot" />
          {session.label}
        </div>
        <span className="sb-theme">RISK-ON</span>
        <span className="sb-time">EST {estTime}</span>
      </div>
    </div>
  )
}

function App() {
  const { activeView } = useTerminal()

  if (activeView === "REGIME")      return <MacroFullScreen />
  if (activeView === "ASSETS")      return <AssetsFullScreen />
  if (activeView === "PORTFOLIO")   return <PortfolioFullScreen />
  if (activeView === "RESEARCH")    return <ResearchFullScreen />
  if (activeView === "SENTIMENT")   return <SentimentFullScreen />
  if (activeView === "CALENDAR")    return <CalendarFullScreen />
  if (activeView === "RISK")        return <RiskFullScreen />
  if (activeView === "ENGINEERING") return <EngineeringFullScreen />
  if (activeView === "TRADE")       return <TradeFullScreen />

  return (
    <div className="app">
      <TopNav />
      <WindowManager />
      <StatusBar />
    </div>
  )
}

export default App