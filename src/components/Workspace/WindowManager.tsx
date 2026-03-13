import React, { useState, useRef, useCallback, useEffect, memo } from "react"
import "./WindowManager.css"
import Panel from "../Panel/Panel"

type PanelTab = "chart" | "news" | "markets" | "macro" | "sentiment"
type WindowState = "normal" | "minimized" | "maximized"

interface WindowConfig {
    id: string
    title: string
    tab: PanelTab
    x: number
    y: number
    h: number
    w: number
    state: WindowState
    zIndex: number
    channelId: number
}

const TASKBAR_HEIGHT = 40
const TITLE_H = 26

// Panel icon mapping
const PANEL_ICONS: Record<PanelTab, string> = {
    chart: "◤",
    news: "≡",
    markets: "⊞",
    macro: "◎",
    sentiment: "◉",
}

const PANEL_COLORS: Record<PanelTab, string> = {
    chart: "var(--bb-blue)",
    news: "var(--bb-amber)",
    markets: "var(--bb-green)",
    macro: "var(--bb-purple)",
    sentiment: "var(--bb-red)",
}

function getInitialWindows(cw: number, ch: number): WindowConfig[] {
    const hw = Math.floor(cw / 2)
    const hh = Math.floor(ch / 2)
    return [
        { id: "A", title: "CHART",     tab: "chart",     x: 0,  y: 0,  w: hw,      h: hh,      state: "normal", zIndex: 1, channelId: 1 },
        { id: "B", title: "NEWS",      tab: "news",      x: hw, y: 0,  w: cw - hw, h: hh,      state: "normal", zIndex: 2, channelId: 2 },
        { id: "C", title: "MARKETS",   tab: "markets",   x: 0,  y: hh, w: hw,      h: ch - hh, state: "normal", zIndex: 3, channelId: 3 },
        { id: "D", title: "SENTIMENT", tab: "sentiment", x: hw, y: hh, w: cw - hw, h: ch - hh, state: "normal", zIndex: 4, channelId: 4 },
    ]
}

let zTop = 10

// ── Memoized Panel Content (prevents re-render on drag) ──
const PanelContent = memo(function PanelContent({ channelId, tab }: { channelId: number; tab: PanelTab }) {
    return <Panel channelId={channelId} tab={tab} />
})

export default function WindowManager() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [windows, setWindows] = useState<WindowConfig[]>([])
    const [ready, setReady] = useState(false)
    const [dragging, setDragging] = useState<string | null>(null)

    useEffect(() => {
        if (containerRef.current) {
            const { clientWidth: cw, clientHeight: ch } = containerRef.current
            setWindows(getInitialWindows(cw, ch - TASKBAR_HEIGHT))
            setReady(true)
        }
    }, [])

    const bringToFront = useCallback((id: string) => {
        zTop += 1
        setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: zTop } : w))
    }, [])

    const minimize = useCallback((id: string) => {
        setWindows(ws => ws.map(w => w.id === id ? { ...w, state: "minimized" } : w))
    }, [])

    const toggleMax = useCallback((id: string) => {
        setWindows(ws => ws.map(w => {
            if (w.id !== id) return w
            zTop += 1
            return { ...w, state: w.state === "maximized" ? "normal" : "maximized", zIndex: zTop }
        }))
    }, [])

    const restore = useCallback((id: string) => {
        setWindows(ws => ws.map(w => {
            if (w.id !== id) return w
            zTop += 1
            return { ...w, state: "normal", zIndex: zTop }
        }))
    }, [])

    // ── Optimized Drag (uses requestAnimationFrame throttle) ──
    const startDrag = useCallback((id: string, startX: number, startY: number) => {
        bringToFront(id)
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()

        // Snapshot the original position at drag start
        setWindows(ws => {
            const win = ws.find(w => w.id === id)
            if (!win) return ws
            const origX = win.x
            const origY = win.y
            const mouseStartX = startX - rect.left
            const mouseStartY = startY - rect.top

            let rafId = 0
            let lastX = startX
            let lastY = startY

            const onMove = (e: MouseEvent | TouchEvent) => {
                lastX = "touches" in e ? e.touches[0].clientX : e.clientX
                lastY = "touches" in e ? e.touches[0].clientY : e.clientY
                cancelAnimationFrame(rafId)
                rafId = requestAnimationFrame(() => {
                    const dx = (lastX - rect.left) - mouseStartX
                    const dy = (lastY - rect.top) - mouseStartY
                    setWindows(prev => prev.map(w => {
                        if (w.id !== id || w.state !== "normal") return w
                        const newX = Math.max(0, Math.min(rect.width - w.w, origX + dx))
                        const newY = Math.max(0, Math.min(rect.height - TASKBAR_HEIGHT - TITLE_H, origY + dy))
                        return { ...w, x: newX, y: newY }
                    }))
                })
            }

            const onUp = () => {
                cancelAnimationFrame(rafId)
                setDragging(null)
                window.removeEventListener("mousemove", onMove)
                window.removeEventListener("mouseup", onUp)
                window.removeEventListener("touchmove", onMove as any)
                window.removeEventListener("touchend", onUp)
            }

            setDragging(id)
            window.addEventListener("mousemove", onMove)
            window.addEventListener("mouseup", onUp)
            window.addEventListener("touchmove", onMove as any, { passive: false })
            window.addEventListener("touchend", onUp)
            return ws
        })
    }, [bringToFront])

    // ── Optimized Resize ──
    const startResize = useCallback((id: string, startX: number, startY: number) => {
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()

        setWindows(ws => {
            const win = ws.find(w => w.id === id)
            if (!win) return ws
            const origW = win.w
            const origH = win.h
            const mouseStartX = startX - rect.left
            const mouseStartY = startY - rect.top
            let rafId = 0
            let lastX = startX, lastY = startY

            const onMove = (e: MouseEvent | TouchEvent) => {
                lastX = "touches" in e ? e.touches[0].clientX : e.clientX
                lastY = "touches" in e ? e.touches[0].clientY : e.clientY
                cancelAnimationFrame(rafId)
                rafId = requestAnimationFrame(() => {
                    const dx = (lastX - rect.left) - mouseStartX
                    const dy = (lastY - rect.top) - mouseStartY
                    setWindows(prev => prev.map(w =>
                        w.id !== id ? w : { ...w, w: Math.max(300, origW + dx), h: Math.max(200, origH + dy) }
                    ))
                })
            }

            const onUp = () => {
                cancelAnimationFrame(rafId)
                window.removeEventListener("mousemove", onMove)
                window.removeEventListener("mouseup", onUp)
            }

            window.addEventListener("mousemove", onMove)
            window.addEventListener("mouseup", onUp)
            return ws
        })
    }, [])

    // ── Snap to layout presets ──
    const applyLayout = useCallback((preset: "quad" | "focused" | "news") => {
        if (!containerRef.current) return
        const { clientWidth: cw, clientHeight: ch } = containerRef.current
        const available = ch - TASKBAR_HEIGHT

        if (preset === "quad") {
            const hw = Math.floor(cw / 2)
            const hh = Math.floor(available / 2)
            setWindows(ws => ws.map((w, i) => ({
                ...w,
                state: "normal" as WindowState,
                x: i % 2 === 0 ? 0 : hw,
                y: i < 2 ? 0 : hh,
                w: i % 2 === 0 ? hw : cw - hw,
                h: i < 2 ? hh : available - hh,
            })))
        } else if (preset === "focused") {
            // Chart maximized, others minimized
            setWindows(ws => ws.map(w => ({
                ...w,
                state: w.id === "A" ? "maximized" as WindowState : "minimized" as WindowState,
            })))
        } else if (preset === "news") {
            // Left: chart wide, right: news full height
            const left = Math.floor(cw * 0.6)
            setWindows(ws => ws.map(w => ({
                ...w,
                state: "normal" as WindowState,
                x: ["A", "C"].includes(w.id) ? 0 : left,
                y: w.id === "A" ? 0 : w.id === "C" ? Math.floor(available / 2) : 0,
                w: ["A", "C"].includes(w.id) ? left : cw - left,
                h: w.id === "A" ? Math.floor(available / 2) : w.id === "C" ? available - Math.floor(available / 2) : available,
            })))
        }
    }, [])

    const visible = windows.filter(w => w.state !== "minimized")

    return (
        <div className="wm-root" ref={containerRef} style={{ position: "relative", display: "block" }}>
            {ready && visible.map(win => {
                const isMax = win.state === "maximized"
                const style: React.CSSProperties = isMax
                    ? { position: "absolute", left: 0, top: 0, width: "100%", height: `calc(100% - ${TASKBAR_HEIGHT}px)`, zIndex: win.zIndex }
                    : { position: "absolute", left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.zIndex }

                const isDragging = dragging === win.id

                return (
                    <div
                        key={win.id}
                        className="wm-window"
                        style={{
                            ...style,
                            cursor: isDragging ? "grabbing" : "default",
                            // Promote to GPU layer when dragging
                            transform: isDragging ? "translateZ(0)" : undefined,
                        }}
                        onMouseDown={() => bringToFront(win.id)}
                    >
                        {/* Title Bar */}
                        <div
                            className="wm-titlebar"
                            onMouseDown={e => {
                                if (!isMax && (e.target as HTMLElement).closest(".wm-controls") === null) {
                                    startDrag(win.id, e.clientX, e.clientY)
                                }
                            }}
                            onDoubleClick={() => toggleMax(win.id)}
                        >
                            <span className="wm-title">
                                <span
                                    className="wm-title-badge"
                                    style={{ background: PANEL_COLORS[win.tab] }}
                                />
                                {win.title} — PANEL {win.id}
                            </span>
                            <div className="wm-controls">
                                <button
                                    className="wm-btn wm-min"
                                    onClick={e => { e.stopPropagation(); minimize(win.id) }}
                                    title="Minimize"
                                />
                                <button
                                    className="wm-btn wm-max"
                                    onClick={e => { e.stopPropagation(); toggleMax(win.id) }}
                                    title={isMax ? "Restore" : "Maximize"}
                                />
                            </div>
                        </div>

                        {/* Memoized Panel Content — prevents re-render on drag */}
                        <div className="wm-content">
                            <PanelContent channelId={win.channelId} tab={win.tab} />
                        </div>

                        {!isMax && (
                            <div
                                className="wm-resize-handle"
                                onMouseDown={e => { e.stopPropagation(); startResize(win.id, e.clientX, e.clientY) }}
                            />
                        )}
                    </div>
                )
            })}

            {/* ── Taskbar ── */}
            <div className="wm-taskbar">
                <span className="wm-taskbar-label">PANELS</span>
                {windows.map(win => (
                    <button
                        key={win.id}
                        className={`wm-taskbtn ${win.state === "minimized" ? "wm-taskbtn-min" : win.state === "maximized" ? "wm-taskbtn-max" : ""}`}
                        onClick={() =>
                            win.state === "minimized" ? restore(win.id)
                            : win.state === "maximized" ? toggleMax(win.id)
                            : minimize(win.id)
                        }
                        title={win.state === "minimized" ? "Restore" : win.state === "maximized" ? "Restore" : "Minimize"}
                    >
                        <span className="wm-taskbtn-icon" style={{ color: PANEL_COLORS[win.tab] }}>
                            {PANEL_ICONS[win.tab]}
                        </span>
                        {win.title}
                        {win.state === "minimized" && <span style={{ marginLeft: "2px", opacity: 0.5, fontSize: "8px" }}>▲</span>}
                        {win.state === "maximized" && <span style={{ marginLeft: "2px", color: "var(--bb-blue)", fontSize: "8px" }}>⊞</span>}
                    </button>
                ))}

                <div className="wm-taskbar-sep" />

                {/* Layout Presets */}
                <div className="wm-layout-info">
                    LAYOUT:
                    <button className="wm-layout-btn" onClick={() => applyLayout("quad")} title="4-Panel Grid">4Q</button>
                    <button className="wm-layout-btn" onClick={() => applyLayout("focused")} title="Focus Chart">FCZ</button>
                    <button className="wm-layout-btn" onClick={() => applyLayout("news")} title="News Layout">NEWS</button>
                </div>
            </div>
        </div>
    )
}
