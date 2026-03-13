import { useState, memo } from "react";
import "./MacroRegime.css";

type RegimeType = "Expansion" | "Peak" | "Slowdown" | "Recession" | "Recovery";

// ── Regime Cycle Configuration ──
const REGIME_CYCLE: { label: RegimeType; cls: string }[] = [
  { label: "Recovery",  cls: "cycle-recovery"   },
  { label: "Expansion", cls: "cycle-expansion"   },
  { label: "Peak",      cls: "cycle-peak"        },
  { label: "Slowdown",  cls: "cycle-slowdown"    },
  { label: "Recession", cls: "cycle-recession"   },
];

// ── Decision Signals per regime ──
const REGIME_SIGNALS: Record<RegimeType, { label: string; class: string }[]> = {
  Expansion:  [
    { label: "LONG RISK",    class: "badge-green"  },
    { label: "SHORT BONDS",  class: "badge-red"    },
    { label: "LONG EQUITY",  class: "badge-green"  },
  ],
  Peak:       [
    { label: "REDUCE RISK",   class: "badge-amber"  },
    { label: "LONG COMMDT",   class: "badge-amber"  },
    { label: "WATCH CPI",     class: "badge-amber"  },
  ],
  Slowdown:   [
    { label: "SHORT EQUITY",  class: "badge-red"    },
    { label: "LONG BONDS",    class: "badge-green"  },
    { label: "LONG USD",      class: "badge-blue"   },
  ],
  Recession:  [
    { label: "CASH HEAVY",    class: "badge-amber"  },
    { label: "LONG GOLD",     class: "badge-green"  },
    { label: "FLIGHT SAFETY", class: "badge-blue"   },
  ],
  Recovery:   [
    { label: "ADD EQUITY",    class: "badge-green"  },
    { label: "REDUCE BONDS",  class: "badge-amber"  },
    { label: "RISK-ON BIAS",  class: "badge-green"  },
  ],
};

// ── Gauge Component ──
const Gauge = memo(function Gauge({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="mr-gauge-row">
      <span className="mr-gauge-label">{label}</span>
      <div className="mr-gauge-track">
        <div className={`mr-gauge-fill ${color}`} style={{ width: `${val}%` }} />
      </div>
      <span className="mr-gauge-val">{val}</span>
    </div>
  );
});

export default function MacroRegime() {
  const [selectedRegion, setSelectedRegion] = useState("US");

  const regimeScore   = 1;
  const currentRegime: RegimeType = "Expansion";
  const confidence    = 68;
  const signals       = REGIME_SIGNALS[currentRegime];

  const macroData: Record<string, { title: string; rows: { label: string; val: string; trend: "up" | "down" | "neutral"; signal?: string }[] }[]> = {
    US: [
      {
        title: "ECONOMIC ACTIVITY",
        rows: [
          { label: "Real GDP Growth",   val: "3.2%",   trend: "up",      signal: "EXP" },
          { label: "ISM Mfg PMI",       val: "52.5",   trend: "up",      signal: "EXP" },
          { label: "ISM Services PMI",  val: "53.0",   trend: "up" },
          { label: "Industrial Prod",   val: "+0.2%",  trend: "neutral" },
          { label: "Leading Econ Idx",  val: "-0.4%",  trend: "down",    signal: "WARN" },
        ],
      },
      {
        title: "INFLATION & PRICES",
        rows: [
          { label: "Headline CPI YoY",  val: "3.1%",   trend: "down" },
          { label: "Core PCE YoY",      val: "2.8%",   trend: "neutral" },
          { label: "PPI Final Demand",  val: "1.6%",   trend: "up" },
          { label: "Avg Hourly Earn",   val: "4.4%",   trend: "down" },
          { label: "5Y5Y Fwd Breakeven",val: "2.34%",  trend: "neutral" },
        ],
      },
      {
        title: "LABOR MARKET",
        rows: [
          { label: "Non-Farm Payrolls", val: "275K",   trend: "up",      signal: "STR" },
          { label: "Unemployment Rate", val: "3.9%",   trend: "neutral" },
          { label: "JOLTS Job Openings",val: "8.86M",  trend: "down" },
          { label: "Initial Jobless",   val: "210K",   trend: "neutral" },
          { label: "Labor Participation",val:"62.5%",  trend: "neutral" },
        ],
      },
      {
        title: "CB POLICY & LIQUIDITY",
        rows: [
          { label: "FED Target Rate",    val: "5.50%",  trend: "neutral", signal: "HOLD" },
          { label: "ECB Main Refi",      val: "4.50%",  trend: "neutral", signal: "HOLD" },
          { label: "BOJ Policy Rate",    val: "0.10%",  trend: "up",      signal: "HIKE" },
          { label: "FED Balance Sheet",  val: "$7.54T", trend: "down" },
          { label: "Global Liquidity",   val: "CRITICAL",trend:"down",    signal: "RISK" },
        ],
      },
    ],
  };

  const sections = macroData[selectedRegion] || macroData["US"];

  return (
    <div className="mr-root animate-fade">
      {/* ── Scorecard Header ── */}
      <div className="mr-header glass">
        <div className="mr-header-main">
          <div className="mr-regime-wrap">
            <div className="mr-label">CURRENT REGIME</div>
            <div className="mr-regime-name">{currentRegime.toUpperCase()}</div>
            <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
              {signals.map((s, i) => (
                <span key={i} className={`badge ${s.class}`}>{s.label}</span>
              ))}
            </div>
          </div>
          <div className="mr-score-wrap">
            <div className="mr-score-val">{regimeScore > 0 ? `+${regimeScore}` : regimeScore}</div>
            <div className="mr-score-label">MACRO SCORE</div>
          </div>
          <div className="mr-conf-wrap">
            <div className="mr-conf-val">{confidence}%</div>
            <div className="mr-conf-label">CONFIDENCE</div>
          </div>
        </div>

        <div className="mr-gauges">
          <Gauge label="Growth"    val={70} color="green" />
          <Gauge label="Inflation" val={60} color="amber" />
          <Gauge label="Liquidity" val={30} color="red"   />
          <Gauge label="Risk Appt."val={72} color="green" />
        </div>
      </div>

      {/* ── Regime Cycle Tracker ── */}
      <div className="mr-cycle">
        {REGIME_CYCLE.map((phase) => (
          <div
            key={phase.label}
            className={`mr-cycle-item ${phase.label === currentRegime ? "current" : ""}`}
          >
            <div
              className={`mr-cycle-dot ${phase.cls}`}
              style={{ background: phase.label === currentRegime ? "currentColor" : "transparent" }}
            />
            <div className={`mr-cycle-label ${phase.cls}`}>{phase.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="mr-toolbar">
        <select
          className="mr-select"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          <option value="US">UNITED STATES (FRED)</option>
          <option value="EU">EUROZONE (ECB)</option>
          <option value="CN">CHINA (PBoC)</option>
          <option value="GLOBAL">GLOBAL AGGREGATE</option>
        </select>
        <div className="mr-status">
          <span className="pulse-dot" />
          LIVE FEED
        </div>
      </div>

      {/* ── Data Grid ── */}
      <div className="mr-grid">
        {sections.map((section, idx) => (
          <div key={idx} className="mr-card glass">
            <div className="mr-card-title">{section.title}</div>
            <div className="mr-card-content">
              {section.rows.map((row, rIdx) => {
                const cls = row.trend === "up" ? "text-pos" : row.trend === "down" ? "text-neg" : ""
                const arrow = row.trend === "up" ? "▲" : row.trend === "down" ? "▼" : "─"
                const signalClass =
                  row.signal === "WARN" || row.signal === "RISK" ? "badge-red"
                  : row.signal === "HOLD" ? "badge-amber"
                  : row.signal === "HIKE" || row.signal === "STR" ? "badge-green"
                  : row.signal === "EXP" ? "badge-blue"
                  : ""

                return (
                  <div key={rIdx} className="mr-row">
                    <span className="mr-row-label">{row.label}</span>
                    <div className="mr-row-right">
                      <span className={`mr-row-val ${cls}`}>{row.val}</span>
                      <span className={`${cls} fs-9`}>{arrow}</span>
                      {row.signal && (
                        <span className={`badge ${signalClass}`}>{row.signal}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
