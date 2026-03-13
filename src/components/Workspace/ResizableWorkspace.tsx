import { useState, useRef, useCallback, useEffect } from "react"
import "./ResizableWorkspace.css"
import Panel from "../Panel/Panel"

function ResizableWorkspace() {
    // splitH: percentage of width for left column (default 50%)
    // splitV: percentage of height for top row (default 50%)
    const [splitH, setSplitH] = useState(50)
    const [splitV, setSplitV] = useState(50)
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)
    const [mobileActive, setMobileActive] = useState(0) // active panel index on mobile
    const workspaceRef = useRef<HTMLDivElement>(null)
    const draggingH = useRef(false)
    const draggingV = useRef(false)

    // Detect screen size
    useEffect(() => {
        const check = () => {
            setIsMobile(window.innerWidth < 768)
            setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1100)
        }
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    // Horizontal divider drag
    const onMouseDownH = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        draggingH.current = true
    }, [])

    // Vertical divider drag
    const onMouseDownV = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        draggingV.current = true
    }, [])

    useEffect(() => {
        const onMove = (e: MouseEvent | TouchEvent) => {
            if (!workspaceRef.current) return
            const rect = workspaceRef.current.getBoundingClientRect()
            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
            const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

            if (draggingH.current) {
                const newSplit = ((clientX - rect.left) / rect.width) * 100
                setSplitH(Math.min(80, Math.max(20, newSplit)))
            }
            if (draggingV.current) {
                const newSplit = ((clientY - rect.top) / rect.height) * 100
                setSplitV(Math.min(80, Math.max(20, newSplit)))
            }
        }
        const onUp = () => {
            draggingH.current = false
            draggingV.current = false
        }
        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", onUp)
        window.addEventListener("touchmove", onMove as any)
        window.addEventListener("touchend", onUp)
        return () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseup", onUp)
            window.removeEventListener("touchmove", onMove as any)
            window.removeEventListener("touchend", onUp)
        }
    }, [])

    const panels = [
        { title: "Panel A", tab: "chart" as const },
        { title: "Panel B", tab: "news" as const },
        { title: "Panel C", tab: "markets" as const },
        { title: "Panel D", tab: "sentiment" as const },
    ]

    // ── MOBILE: single panel at a time with tab bar ──
    if (isMobile) {
        return (
            <div className="rw-mobile">
                <div className="rw-mobile-tabs">
                    {panels.map((p, i) => (
                        <button
                            key={i}
                            className={`rw-mtab ${mobileActive === i ? "rw-mtab-active" : ""}`}
                            onClick={() => setMobileActive(i)}
                        >
                            {p.title}
                        </button>
                    ))}
                </div>
                <div className="rw-mobile-panel">
                    <Panel channelId={mobileActive + 1} tab={panels[mobileActive].tab} />
                </div>
            </div>
        )
    }

    // ── TABLET (iPad): 2-column, fixed 50/50, vertical drag only ──
    if (isTablet) {
        return (
            <div className="rw-tablet" ref={workspaceRef}>
                {/* Top row */}
                <div className="rw-tablet-row" style={{ height: `${splitV}%` }}>
                    <div className="rw-tablet-cell">
                        <Panel channelId={1} tab="chart" />
                    </div>
                    <div className="rw-tablet-cell">
                        <Panel channelId={2} tab="news" />
                    </div>
                </div>

                {/* Horizontal (vertical resize) divider */}
                <div
                    className="rw-divider-h"
                    onMouseDown={onMouseDownV}
                    onTouchStart={(e) => { e.preventDefault(); draggingV.current = true }}
                    title="Drag to resize"
                />

                {/* Bottom row */}
                <div className="rw-tablet-row" style={{ height: `${100 - splitV}%` }}>
                    <div className="rw-tablet-cell">
                        <Panel channelId={3} tab="markets" />
                    </div>
                    <div className="rw-tablet-cell">
                        <Panel channelId={4} tab="sentiment" />
                    </div>
                </div>
            </div>
        )
    }

    // ── DESKTOP: Full 2x2 with both axes draggable ──
    return (
        <div className="rw-desktop" ref={workspaceRef}>
            {/* Top row */}
            <div className="rw-row" style={{ height: `${splitV}%` }}>
                {/* Top-left panel */}
                <div className="rw-cell" style={{ width: `${splitH}%` }}>
                    <Panel channelId={1} tab="chart" />
                </div>

                {/* Vertical divider */}
                <div
                    className="rw-divider-v"
                    onMouseDown={onMouseDownH}
                    onTouchStart={(e) => { e.preventDefault(); draggingH.current = true }}
                    title="Drag to resize"
                />

                {/* Top-right panel */}
                <div className="rw-cell" style={{ width: `${100 - splitH}%` }}>
                    <Panel channelId={2} tab="news" />
                </div>
            </div>

            {/* Horizontal divider */}
            <div
                className="rw-divider-h"
                onMouseDown={onMouseDownV}
                onTouchStart={(e) => { e.preventDefault(); draggingV.current = true }}
                title="Drag to resize rows"
            />

            {/* Bottom row */}
            <div className="rw-row" style={{ height: `${100 - splitV}%` }}>
                {/* Bottom-left panel */}
                <div className="rw-cell" style={{ width: `${splitH}%` }}>
                    <Panel channelId={3} tab="markets" />
                </div>

                {/* Vertical divider */}
                <div
                    className="rw-divider-v"
                    onMouseDown={onMouseDownH}
                    onTouchStart={(e) => { e.preventDefault(); draggingH.current = true }}
                    title="Drag to resize"
                />

                {/* Bottom-right panel */}
                <div className="rw-cell" style={{ width: `${100 - splitH}%` }}>
                    <Panel channelId={4} tab="sentiment" />
                </div>
            </div>
        </div>
    )
}

export default ResizableWorkspace
