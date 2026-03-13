import { useState, useRef, useEffect } from "react"
import TradingViewChart from "./TradingViewChart"
import "./ChartPanel.css"

type ChartLayoutMode = "single" | "split-lr" | "split-lmr" | "split-4"

type ChartPanelProps = {
    timeframe?: string
    chartType?: string
    onTimeframeChange?: (tf: string) => void
}

const LAYOUT_OPTIONS: { id: ChartLayoutMode; label: string; icon: string; description: string }[] = [
    { id: "single", label: "Single", description: "1 Chart View", icon: "S" },
    { id: "split-lr", label: "Split L/R", description: "Dual Horizontal", icon: "LR" },
    { id: "split-lmr", label: "Split L/M/R", description: "Triple Vertical", icon: "LMR" },
    { id: "split-4", label: "Grid 2×2", description: "Quad Monitor", icon: "4" },
]

const TF_LIST = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W", "1M", "YTD", "All"]

export default function ChartPanel({ timeframe = "1D", chartType = "Candle", onTimeframeChange }: ChartPanelProps) {
    const [layout, setLayout] = useState<ChartLayoutMode>("single")
    const [showLayoutPicker, setShowLayoutPicker] = useState(false)
    const layoutPickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (layoutPickerRef.current && !layoutPickerRef.current.contains(e.target as Node)) {
                setShowLayoutPicker(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const renderChart = () => <TradingViewChart timeframe={timeframe} chartType={chartType} />

    return (
        <div className="cp-root animate-fade">
            <div className="cp-hud glass">
                <div className="cp-tf-group">
                    {TF_LIST.map(tf => (
                        <button
                            key={tf}
                            className={`cp-tf-btn ${tf === timeframe ? 'active' : ''}`}
                            onClick={() => onTimeframeChange && onTimeframeChange(tf)}
                        >
                            {tf}
                        </button>
                    ))}
                </div>

                <div className="cp-actions" ref={layoutPickerRef}>
                    <button 
                        className={`cp-action-btn ${showLayoutPicker ? 'active' : ''}`}
                        onClick={() => setShowLayoutPicker(!showLayoutPicker)}
                    >
                        <span className="cp-icon">◫</span>
                        LAYOUT
                    </button>

                    {showLayoutPicker && (
                        <div className="cp-picker animate-fade glass">
                            <div className="cp-picker-header">TERMINAL VIEW LAYOUT</div>
                            <div className="cp-picker-grid">
                                {LAYOUT_OPTIONS.map(opt => (
                                    <div
                                        key={opt.id}
                                        className={`cp-picker-item ${layout === opt.id ? "active" : ""}`}
                                        onClick={() => { setLayout(opt.id); setShowLayoutPicker(false) }}
                                    >
                                        <div className={`cp-preview preview-${opt.id}`}>
                                            {opt.id === "single" && <div className="p-block full" />}
                                            {opt.id === "split-lr" && <><div className="p-block half" /><div className="p-block half" /></>}
                                            {opt.id === "split-lmr" && <><div className="p-block third" /><div className="p-block third" /><div className="p-block third" /></>}
                                            {opt.id === "split-4" && <div className="p-grid-4">{[1,2,3,4].map(i => <div key={i} className="p-block quad" />)}</div>}
                                        </div>
                                        <div className="cp-picker-info">
                                            <div className="cp-picker-label">{opt.label}</div>
                                            <div className="cp-picker-desc">{opt.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="cp-viewport">
                {layout === "single" && <div className="cp-slot full">{renderChart()}</div>}
                
                {layout === "split-lr" && (
                    <div className="cp-split-lr">
                        <div className="cp-slot">{renderChart()}</div>
                        <div className="cp-divider-v" />
                        <div className="cp-slot">{renderChart()}</div>
                    </div>
                )}

                {layout === "split-lmr" && (
                    <div className="cp-split-lmr">
                        <div className="cp-slot">{renderChart()}</div>
                        <div className="cp-divider-v" />
                        <div className="cp-slot">{renderChart()}</div>
                        <div className="cp-divider-v" />
                        <div className="cp-slot">{renderChart()}</div>
                    </div>
                )}

                {layout === "split-4" && (
                    <div className="cp-grid-quad">
                        <div className="cp-slot">{renderChart()}</div>
                        <div className="cp-slot">{renderChart()}</div>
                        <div className="cp-slot">{renderChart()}</div>
                        <div className="cp-slot">{renderChart()}</div>
                    </div>
                )}
            </div>
        </div>
    )
}
