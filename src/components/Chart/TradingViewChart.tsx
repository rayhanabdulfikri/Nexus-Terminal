import { useEffect, useRef } from "react"
import { useChannelTicker } from "../../context/TerminalContext"

type TradingViewChartProps = {
    timeframe?: string
    chartType?: string
    symbol?: string
}

// Map our timeframe strings to TradingView interval strings
const TF_MAP: Record<string, string> = {
    "1m": "1", "5m": "5", "15m": "15", "30m": "30",
    "1h": "60", "4h": "240",
    "1D": "D", "1W": "W", "1M": "M", "1Y": "12M", "All": "60M",
}

// Map our chart type strings to TradingView style numbers
const CHARTTYPE_MAP: Record<string, number> = {
    "Candle": 1, "Bar": 0, "Line": 2, "Area": 3, "Heikin Ashi": 8,
}

export default function TradingViewChart({ timeframe = "1D", chartType = "Candle", symbol }: TradingViewChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const activeTicker = useChannelTicker()

    const resolvedSymbol = symbol ?? activeTicker
    const interval = TF_MAP[timeframe] ?? "D"
    const style = CHARTTYPE_MAP[chartType] ?? 1

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // Clear previous widget
        container.innerHTML = ""

        // Must wait a tick so the container has real pixel dimensions
        const inject = () => {
            const h = container.offsetHeight
            const w = container.offsetWidth
            if (h < 80 || w < 80) return  // not ready yet

            const wrapper = document.createElement("div")
            wrapper.className = "tradingview-widget-container__widget"
            wrapper.style.cssText = `width:${w}px;height:${h}px;`

            const script = document.createElement("script")
            script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
            script.type = "text/javascript"
            script.async = true
            script.innerHTML = JSON.stringify({
                width: w,
                height: h,
                symbol: resolvedSymbol,
                interval: interval,
                timezone: "Asia/Jakarta",
                theme: "dark",
                style: style,
                locale: "en",
                backgroundColor: "#0b2730",
                gridColor: "#0f3b45",
                hide_top_toolbar: false,
                hide_side_toolbar: false,
                allow_symbol_change: true,
                save_image: true,
                withdateranges: true,
                calendar: false,
                support_host: "https://www.tradingview.com",
                overrides: {
                    "mainSeriesProperties.candleStyle.upColor": "#00ff8f",
                    "mainSeriesProperties.candleStyle.downColor": "#ff4d4d",
                    "mainSeriesProperties.candleStyle.borderUpColor": "#00ff8f",
                    "mainSeriesProperties.candleStyle.borderDownColor": "#ff4d4d",
                    "mainSeriesProperties.candleStyle.wickUpColor": "#00ff8f",
                    "mainSeriesProperties.candleStyle.wickDownColor": "#ff4d4d",
                }
            })

            container.appendChild(wrapper)
            container.appendChild(script)
        }

        // Use ResizeObserver: once container gets real size, inject
        const ro = new ResizeObserver(() => {
            // Only inject once (clear = widget not yet mounted)
            if (container.children.length === 0) inject()
        })
        ro.observe(container)

        // Also try immediately (might already have size)
        inject()

        return () => {
            ro.disconnect()
            container.innerHTML = ""
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedSymbol, interval, style])

    return (
        <div
            ref={containerRef}
            className="tradingview-widget-container"
            style={{
                width: "100%",
                height: "100%",
                minHeight: "150px",
                overflow: "hidden",
                background: "#0b2730",
                // Prevent any blur from parent transforms
                transform: "translateZ(0)",
                WebkitTransform: "translateZ(0)",
                imageRendering: "crisp-edges",
            }}
        />
    )
}
