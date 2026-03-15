import "./App.css"
import { useState, useEffect, memo, useRef, lazy, Suspense } from "react"
import { useTerminal } from "./context/TerminalContext"
import { TrendingUp, TrendingDown } from "lucide-react"
import TopNav from "./components/TopNav/TopNav"
import WindowManager from "./components/Workspace/WindowManager"

// ── Lazy Loading Full Screen components (Optimization - up to 50% faster initial load) ──
const MacroFullScreen = lazy(() => import("./components/MacroRegime/MacroFullScreen"))
const AssetsFullScreen = lazy(() => import("./components/Assets/AssetsFullScreen"))
const PortfolioFullScreen = lazy(() => import("./components/Portfolio/PortfolioFullScreen"))
const SentimentFullScreen = lazy(() => import("./components/Sentiment/SentimentFullScreen"))
const CalendarFullScreen = lazy(() => import("./components/Calendar/CalendarFullScreen"))
const RiskFullScreen = lazy(() => import("./components/Risk/RiskFullScreen"))
const EngineeringFullScreen = lazy(() => import("./components/Engineering/EngineeringFullScreen"))
const TradeFullScreen = lazy(() => import("./components/Trade/TradeFullScreen"))
const NewsFullScreen = lazy(() => import("./components/News/NewsFullScreen"))
const GuideFullScreen = lazy(() => import("./components/Workspace/GuideFullScreen"))
const ResearchTerminal = lazy(() => import("./components/Research/ResearchTerminal"))

// ── Live ticker data (with real-time simulation) ──
const TICKER_SEED = [
  { name: "EUR/USD", val: 1.0842, chg: -0.23, decimals: 5, vol: 0.00008 },
  { name: "USD/JPY", val: 149.38, chg: +0.51, decimals: 3, vol: 0.04 },
  { name: "GBP/USD", val: 1.2618, chg: +0.14, decimals: 5, vol: 0.00008 },
  { name: "AUD/USD", val: 0.6521, chg: -0.41, decimals: 5, vol: 0.00007 },
  { name: "USD/CAD", val: 1.3695, chg: +0.18, decimals: 5, vol: 0.00007 },
  { name: "XAU/USD", val: 2038.50, chg: +0.62, decimals: 2, vol: 0.4 },
  { name: "WTI",     val: 78.34, chg: +1.18, decimals: 2, vol: 0.05 },
  { name: "BTC/USD", val: 64180, chg: +3.24, decimals: 0, vol: 30 },
  { name: "SPX",     val: 4452, chg: +0.88, decimals: 1, vol: 0.8 },
  { name: "NDX",     val: 13820, chg: +1.22, decimals: 1, vol: 2 },
  { name: "VIX",     val: 13.42, chg: -5.10, decimals: 2, vol: 0.03 },
  { name: "DXY",     val: 104.32, chg: +0.08, decimals: 2, vol: 0.02 },
  { name: "US10Y",   val: 4.248, chg: -0.032, decimals: 3, vol: 0.003 },
  { name: "DE10Y",   val: 2.452, chg: +0.018, decimals: 3, vol: 0.002 },
  { name: "ETH/USD", val: 3280, chg: +2.44, decimals: 0, vol: 8 },
]

function useRealtimeTickers() {
  const [tickers, setTickers] = useState(TICKER_SEED.map(t => ({ ...t })))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTickers(prev => {
        return prev.map(t => {
          const drift = (Math.random() - 0.498) * t.vol
          const newVal = Math.max(0.0001, t.val + drift)
          const newChg = t.chg + (Math.random() - 0.5) * 0.05
          return { ...t, val: parseFloat(newVal.toFixed(t.decimals + 1)), chg: parseFloat(newChg.toFixed(3)) }
        })
      })
    }, 800)
    return () => clearInterval(timerRef.current ?? undefined)
  }, [])

  return tickers
}

// Determine market session
function getMarketSession(): { label: string; status: "open" | "closed" | "pre" } {
  const now = new Date()
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  if (utcMin >= 1380 || utcMin < 480) return { label: "TOKYO OPEN", status: "open" }
  if (utcMin >= 420 && utcMin < 960) return { label: "LONDON OPEN", status: "open" }
  if (utcMin >= 780 && utcMin < 1320) return { label: "NY OPEN", status: "open" }
  if (utcMin >= 1200 && utcMin < 1380) return { label: "PRE-MARKET", status: "pre" }
  return { label: "MARKET CLOSED", status: "closed" }
}

// ── Memoised ticker tape ──
const TickerTape = memo(function TickerTape({ items }: { items: typeof TICKER_SEED }) {
  const doubled = [...items, ...items]
  return (
    <div className="statusbar-ticker">
      <div className="statusbar-ticker-inner">
        {doubled.map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-item-name">{item.name}</span>
            <span className="ticker-item-val">
              {item.name.includes("JPY") || item.name.includes("BTC") || item.name.includes("SPX") || item.name.includes("NDX") || item.name.includes("ETH")
                ? item.val.toLocaleString(undefined, { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals })
                : item.val.toFixed(item.decimals)
              }
            </span>
            <span className={`ticker-item-chg ${item.chg >= 0 ? "pos" : "neg"}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              {item.chg >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(item.chg).toFixed(Math.abs(item.chg) < 1 ? 3 : 2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  )
})

function StatusBar() {
  const tickers = useRealtimeTickers()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const session = getMarketSession()
  const estTime = time.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })

  return (
    <div className="app-statusbar">
      <TickerTape items={tickers} />
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

// Ticker stats hook removed (moved to hooks/useCommandBarStats.ts)

export { } // Empty export to keep the file as a module if needed, but App is already a module

function App() {
  const { activeView } = useTerminal()

  // Render with Suspense for non-blocking UI
  const renderView = () => {
    switch(activeView) {
      case "REGIME":       return <MacroFullScreen />
      case "ASSETS":       return <AssetsFullScreen />
      case "PORTFOLIO":    return <PortfolioFullScreen />
      case "RESEARCH":     return <ResearchTerminal defaultTab="reports" />
      case "SENTIMENT":    return <SentimentFullScreen />
      case "CALENDAR":     return <CalendarFullScreen />
      case "RISK":         return <RiskFullScreen />
      case "ENGINEERING":  return <EngineeringFullScreen />
      case "TRADE":        return <TradeFullScreen />
      case "NEWS":         return <NewsFullScreen />
      case "CENTRAL_BANK": return <MacroFullScreen defaultTab="cbpolicy" />
      case "GUIDE":        return <GuideFullScreen />
      case "YIELD_CURVE":  return <MacroFullScreen defaultTab="yieldcurve" />
      case "FX_STRENGTH":  return <AssetsFullScreen defaultTab="fx" />
      case "LIQUIDITY":    return <MacroFullScreen defaultTab="liquidity" />
      case "LEAD_LAG":     return <ResearchTerminal defaultTab="scanner" />
      case "TRADE_IDEA":   return <ResearchTerminal defaultTab="playbook" />
      case "MOMENTUM":     return <MacroFullScreen defaultTab="momentum" />
      default: return null
    }
  }

  const view = renderView()
  if (view) {
      return (
          <Suspense fallback={<div className="loading-overlay">LOADING TERMINAL CORE...</div>}>
              {view}
          </Suspense>
      )
  }

  return (
    <div className="app">
      <TopNav />
      <WindowManager />
      <StatusBar />
    </div>
  )
}

export default App