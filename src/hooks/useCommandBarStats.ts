import { useState, useEffect } from "react"

export function useCommandBarStats() {
  const [stats, setStats] = useState({ vix: 13.42, dxy: 104.32, gold: 2038.5, us10y: 4.248 })
  useEffect(() => {
    const t = setInterval(() => {
      setStats(prev => ({
        vix: parseFloat((prev.vix + (Math.random() - 0.5) * 0.08).toFixed(2)),
        dxy: parseFloat((prev.dxy + (Math.random() - 0.5) * 0.04).toFixed(2)),
        gold: parseFloat((prev.gold + (Math.random() - 0.5) * 0.8).toFixed(1)),
        us10y: parseFloat((prev.us10y + (Math.random() - 0.5) * 0.005).toFixed(3)),
      }))
    }, 1200)
    return () => clearInterval(t)
  }, [])
  return stats
}
