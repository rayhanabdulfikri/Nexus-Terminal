import "./MarketTable.css"
import { useState, useEffect, useCallback, memo, useRef } from "react"
import { useTerminal } from "../../context/TerminalContext"

type MarketTableProps = {
  group?: string
  sortBy?: string
}

type AssetRow = {
  name: string
  val: number
  chg: number
  chgPct: number
  bid: number
  ask: number
  high: number
  low: number
  vol: string
  dir: "▲" | "▼" | "─"
  sparkline: number[]
  category: string
}

// Generate random sparkline (simulated tick history)
function genSparkline(base: number, len = 12): number[] {
  const arr = [base]
  for (let i = 1; i < len; i++) {
    const delta = (Math.random() - 0.48) * base * 0.005
    arr.push(Math.max(0, arr[i - 1] + delta))
  }
  return arr
}

// Inline mini SVG sparkline
const Sparkline = memo(function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 60
  const h = 20
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 2) - 1
    return `${x},${y}`
  }).join(" ")

  const color = positive ? "#00e676" : "#ff3d57"
  return (
    <svg width={w} height={h} style={{ display: "block", flexShrink: 0 }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* End dot */}
      {(() => {
        const lastPt = pts.split(" ").pop()?.split(",")
        if (!lastPt) return null
        return <circle cx={lastPt[0]} cy={lastPt[1]} r="2" fill={color} />
      })()}
    </svg>
  )
})

// Raw data
const ALL_ASSETS: AssetRow[] = [
  // FX
  { name: "EUR/USD", val: 1.0850, chg: -0.0025, chgPct: -0.23, bid: 1.0849, ask: 1.0851, high: 1.0892, low: 1.0821, vol: "42.3B", dir: "▼", sparkline: genSparkline(1.0850), category: "Currencies" },
  { name: "USD/JPY", val: 149.38, chg: +0.68,   chgPct: +0.46, bid: 149.37, ask: 149.39, high: 149.72, low: 148.85, vol: "38.1B", dir: "▲", sparkline: genSparkline(149.38), category: "Currencies" },
  { name: "GBP/USD", val: 1.2618, chg: +0.0017, chgPct: +0.13, bid: 1.2617, ask: 1.2619, high: 1.2668, low: 1.2588, vol: "18.7B", dir: "▲", sparkline: genSparkline(1.2618), category: "Currencies" },
  { name: "AUD/USD", val: 0.6521, chg: -0.0027, chgPct: -0.41, bid: 0.6520, ask: 0.6522, high: 0.6565, low: 0.6498, vol: "9.2B",  dir: "▼", sparkline: genSparkline(0.6521), category: "Currencies" },
  { name: "USD/CAD", val: 1.3695, chg: +0.0024, chgPct: +0.18, bid: 1.3694, ask: 1.3696, high: 1.3721, low: 1.3668, vol: "7.4B",  dir: "▲", sparkline: genSparkline(1.3695), category: "Currencies" },
  // Indices
  { name: "SPX",     val: 4452,  chg: +38.8,    chgPct: +0.88, bid: 4451,  ask: 4453,  high: 4468, low: 4420, vol: "2.1T",  dir: "▲", sparkline: genSparkline(4452), category: "Indices" },
  { name: "NDX",     val: 13820, chg: +166.1,   chgPct: +1.22, bid: 13818, ask: 13822, high: 13875, low: 13680, vol: "1.8T",  dir: "▲", sparkline: genSparkline(13820), category: "Indices" },
  { name: "SX5E",    val: 4201,  chg: -6.3,     chgPct: -0.15, bid: 4200,  ask: 4202,  high: 4235, low: 4182, vol: "620B",  dir: "▼", sparkline: genSparkline(4201), category: "Indices" },
  { name: "N225",    val: 32820, chg: +212.4,   chgPct: +0.65, bid: 32815, ask: 32825, high: 32950, low: 32580, vol: "380B",  dir: "▲", sparkline: genSparkline(32820), category: "Indices" },
  // Fixed Income
  { name: "US 2Y",   val: 4.895, chg: -0.008,   chgPct: -0.16, bid: 4.893, ask: 4.897, high: 4.912, low: 4.872, vol: "—",    dir: "▼", sparkline: genSparkline(4.895), category: "Fixed Income" },
  { name: "US 10Y",  val: 4.248, chg: -0.012,   chgPct: -0.28, bid: 4.246, ask: 4.250, high: 4.275, low: 4.221, vol: "—",    dir: "▼", sparkline: genSparkline(4.248), category: "Fixed Income" },
  { name: "2s/10s",  val: -0.647, chg: +0.004,  chgPct: +0,    bid: -0.65, ask: -0.645, high: -0.62, low: -0.68, vol: "—",   dir: "▲", sparkline: genSparkline(4.248), category: "Fixed Income" },
  // Commodities & Crypto
  { name: "XAU/USD", val: 2038.5, chg: +12.5,   chgPct: +0.62, bid: 2038, ask: 2039,  high: 2052, low: 2018, vol: "84B",   dir: "▲", sparkline: genSparkline(2038.5), category: "Commodities" },
  { name: "WTI",     val: 78.34,  chg: +0.91,   chgPct: +1.18, bid: 78.30, ask: 78.38, high: 79.20, low: 77.40, vol: "42B",  dir: "▲", sparkline: genSparkline(78.34), category: "Commodities" },
  { name: "BTC/USD", val: 64180,  chg: +2009,   chgPct: +3.23, bid: 64150, ask: 64210, high: 64850, low: 61200, vol: "28B",  dir: "▲", sparkline: genSparkline(64180), category: "Crypto" },
  { name: "ETH/USD", val: 3281,   chg: +78.2,   chgPct: +2.44, bid: 3279,  ask: 3283,  high: 3320, low: 3180, vol: "12B",  dir: "▲", sparkline: genSparkline(3281), category: "Crypto" },
]

function formatVal(row: AssetRow): string {
  if (row.name.includes("JPY") || row.name.includes("BTC") || row.name.includes("SPX") || row.name.includes("NDX") || row.name.includes("N225") || row.name.includes("SX5E") || row.name.includes("ETH"))
    return row.val.toLocaleString()
  if (row.name.includes("Y") || row.name === "2s/10s") return `${row.val.toFixed(3)}%`
  if (row.name === "WTI") return `$${row.val.toFixed(2)}`
  if (row.name.includes("XAU") || row.name.includes("XAG")) return `$${row.val.toFixed(1)}`
  return row.val.toFixed(4)
}

function MarketTable({ group = "All Assets" }: MarketTableProps) {
  const { setActiveTicker } = useTerminal()
  const [flashSet, setFlashSet] = useState<Set<string>>(new Set())
  const [liveData, setLiveData] = useState<AssetRow[]>(ALL_ASSETS)
  const liveRef = useRef(ALL_ASSETS)

  // Simulate live price ticks — ALL assets update every tick, no stale closure
  useEffect(() => {
    const tick = setInterval(() => {
      const nextFlash = new Set<string>()
      const updated = liveRef.current.map((asset: AssetRow) => {
        // Only move ~60% of assets per tick for natural feel
        if (Math.random() > 0.6) return asset
        const volatility = asset.val * 0.0008
        const delta = (Math.random() - 0.48) * volatility
        const newVal = Math.max(0.0001, asset.val + delta)
        const open = asset.val - asset.chg
        nextFlash.add(asset.name)
        return {
          ...asset,
          val: newVal,
          chg: parseFloat((newVal - open).toFixed(6)),
          chgPct: parseFloat(((newVal - open) / open * 100).toFixed(3)),
          dir: (delta > 0 ? "▲" : delta < 0 ? "▼" : "─") as "▲" | "▼" | "─",
          sparkline: [...asset.sparkline.slice(1), newVal],
        }
      })
      liveRef.current = updated
      setLiveData(updated)
      setFlashSet(nextFlash)
      // Clear flash after 500ms
      setTimeout(() => setFlashSet(new Set()), 500)
    }, 1500)
    return () => clearInterval(tick)
  }, []) // ← no dependency on liveData — uses ref instead


  const filteredData = useCallback(() => {
    if (group === "All Assets") return liveData
    if (group === "Currencies") return liveData.filter(a => a.category === "Currencies")
    if (group === "Indices") return liveData.filter(a => a.category === "Indices")
    if (group === "Commodities") return liveData.filter(a => a.category === "Commodities" || a.category === "Crypto")
    if (group === "Crypto") return liveData.filter(a => a.category === "Crypto")
    if (group === "Fixed Income") return liveData.filter(a => a.category === "Fixed Income")
    return liveData
  }, [group, liveData])

  const sections = ["Currencies", "Indices", "Fixed Income", "Commodities", "Crypto"]

  return (
    <div className="mt-root">
      <div className="mt-header">
        <div className="mt-header-left">
          <div className="mt-header-title">CROSS-ASSET MONITOR</div>
          <div className="mt-header-subtitle">REAL-TIME STREAMING</div>
        </div>
        <div className="mt-header-right">
          <span className="mt-live-badge">
            <span className="pulse-dot-sm" style={{ background: "var(--bb-green)" }} />
            LIVE
          </span>
        </div>
      </div>

      <div className="mt-table-header">
        <div style={{ flex: 1.2 }}>ASSET</div>
        <div style={{ flex: 1, textAlign: "right" }}>PRICE</div>
        <div style={{ flex: 1, textAlign: "right" }}>CHG%</div>
        <div style={{ flex: 1.2, textAlign: "right" }}>H / L</div>
        <div style={{ flex: 0.8, textAlign: "center" }}>TREND</div>
        <div style={{ flex: 0.6, textAlign: "right" }}>VOL</div>
      </div>

      <div className="mt-scroll">
        {(group === "All Assets" ? sections : [group]).map(cat => {
          const rows = filteredData().filter(a => {
            if (cat === "Commodities") return a.category === "Commodities" || a.category === "Crypto"
            return a.category === cat
          })
          if (rows.length === 0) return null
          return (
            <div key={cat}>
              <div className="mt-section-header">
                <span className="mt-section-title">{cat.toUpperCase()}</span>
                <div className="mt-section-line" />
              </div>
              {rows.map((item) => {
                const isPos = item.dir === "▲"
                const isNeg = item.dir === "▼"
                const colorClass = isPos ? "text-pos" : isNeg ? "text-neg" : ""
                const isFlashing = flashSet.has(item.name)

                return (
                  <div
                    key={item.name}
                    className={`mt-row ${isFlashing ? (isPos ? "flash-green" : "flash-red") : ""}`}
                    onClick={() => setActiveTicker(item.name.replace("/", ""))}
                  >
                    {/* Left bar indicator */}
                    <div className={`mt-row-bar ${isPos ? "pos" : isNeg ? "neg" : "flat"}`} />

                    <div className="mt-row-name">{item.name}</div>

                    <div className={`mt-row-price ${colorClass}`}>
                      {formatVal(item)}
                    </div>

                    <div className={`mt-row-chg ${colorClass}`}>
                      {item.dir} {Math.abs(item.chgPct).toFixed(2)}%
                    </div>

                    <div className="mt-row-hl">
                      <span className="text-pos" style={{ fontSize: "9px" }}>
                        {formatVal({ ...item, val: item.high })}
                      </span>
                      <span style={{ color: "var(--bb-text-very-dim)", fontSize: "9px" }}>—</span>
                      <span className="text-neg" style={{ fontSize: "9px" }}>
                        {formatVal({ ...item, val: item.low })}
                      </span>
                    </div>

                    <div className="mt-row-spark">
                      <Sparkline data={item.sparkline} positive={isPos} />
                    </div>

                    <div className="mt-row-vol">{item.vol}</div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MarketTable