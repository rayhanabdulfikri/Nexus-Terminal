import "./Panel.css"
import { useState, useCallback } from "react"

import MarketTable from "../Table/MarketTable"
import NewsFeed from "../News/NewsFeed"
import ChartPanel from "../Chart/ChartPanel"
import MenuTabs from "../MenuTabs/MenuTabs"
import type { TabItem } from "../MenuTabs/MenuTabs"
import MacroRegime from "../MacroRegime/MacroRegime"
import Sentiment from "../Sentiment/Sentiment"
import { ChannelProvider } from "../../context/TerminalContext"

type PanelTab = "news" | "chart" | "markets" | "macro" | "sentiment"

type PanelProps = {
  channelId: number;
  tab: PanelTab;
}

// Label for right side of the red bar
const PANEL_TITLES: Record<PanelTab, string> = {
  news: "Macro News Feed",
  chart: "Interactive Chart",
  markets: "Cross-Asset Monitor",
  macro: "Macro Regime",
  sentiment: "Positioning Monitor",
};

function Panel({ channelId, tab }: PanelProps) {
  // ── Chart state ──
  const [chartTf, setChartTf] = useState("1D");
  const [chartType, setChartType] = useState("Candle");

  // ── News state ──
  const [newsCategory, setNewsCategory] = useState("All");
  const [newsImpact, setNewsImpact] = useState("High + Med");

  // ── Markets state ──
  const [mktSort, setMktSort] = useState("Name");
  const [mktGroup, setMktGroup] = useState("All Assets");

  // ── Sentiment state ──
  const [sentView, setSentView] = useState("COT");

  // Copy current view URL to clipboard (simple util)
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).catch(() => { });
  }, []);

  // Build dynamic tabs based on panel type
  const buildTabs = (): TabItem[] => {
    switch (tab) {
      case "chart":
        return [
          {
            id: "tf", label: "94) Timeframe ▼", items: [
              { label: "1 Minute", shortcut: "1m", onClick: () => setChartTf("1m"), active: chartTf === "1m" },
              { label: "5 Minutes", shortcut: "5m", onClick: () => setChartTf("5m"), active: chartTf === "5m" },
              { label: "15 Minutes", shortcut: "15m", onClick: () => setChartTf("15m"), active: chartTf === "15m" },
              { label: "30 Minutes", shortcut: "30m", onClick: () => setChartTf("30m"), active: chartTf === "30m" },
              { label: "1 Hour", shortcut: "1h", onClick: () => setChartTf("1h"), active: chartTf === "1h" },
              { label: "4 Hours", shortcut: "4h", onClick: () => setChartTf("4h"), active: chartTf === "4h" },
              { label: "1 Day", shortcut: "1D", onClick: () => setChartTf("1D"), active: chartTf === "1D" },
              { label: "1 Week", shortcut: "1W", onClick: () => setChartTf("1W"), active: chartTf === "1W" },
              { label: "1 Month", shortcut: "1M", onClick: () => setChartTf("1M"), active: chartTf === "1M" },
              { label: "1 Year", shortcut: "1Y", onClick: () => setChartTf("1Y"), active: chartTf === "1Y" },
              { label: "All", shortcut: "All", onClick: () => setChartTf("All"), active: chartTf === "All" },
            ]
          },
          {
            id: "style", label: "95) Style ▼", items: [
              { label: "Candlestick", onClick: () => setChartType("Candle"), active: chartType === "Candle" },
              { label: "Bar Chart", onClick: () => setChartType("Bar"), active: chartType === "Bar" },
              { label: "Line Chart", onClick: () => setChartType("Line"), active: chartType === "Line" },
              { label: "Area Chart", onClick: () => setChartType("Area"), active: chartType === "Area" },
              { label: "Heikin Ashi", onClick: () => setChartType("Heikin Ashi"), active: chartType === "Heikin Ashi" },
              { divider: true, label: "" },
              { label: "Copy Link", shortcut: "Ctrl+L", onClick: copyLink },
            ]
          },
        ];

      case "news":
        return [
          {
            id: "cat", label: "94) Category ▼", items: [
              { label: "All News", onClick: () => setNewsCategory("All"), active: newsCategory === "All" },
              { label: "Central Banks", onClick: () => setNewsCategory("CB"), active: newsCategory === "CB" },
              { label: "Geopolitics", onClick: () => setNewsCategory("Geo"), active: newsCategory === "Geo" },
              { label: "Economics", onClick: () => setNewsCategory("Eco"), active: newsCategory === "Eco" },
              { label: "Commodities", onClick: () => setNewsCategory("Cmd"), active: newsCategory === "Cmd" },
            ]
          },
          {
            id: "imp", label: "95) Impact ▼", items: [
              { label: "High + Medium", onClick: () => setNewsImpact("High + Med"), active: newsImpact === "High + Med" },
              { label: "High Only", onClick: () => setNewsImpact("High"), active: newsImpact === "High" },
              { label: "All", onClick: () => setNewsImpact("All"), active: newsImpact === "All" },
              { divider: true, label: "" },
              { label: "Mark All Read", shortcut: "Ctrl+R", onClick: () => { } },
            ]
          },
        ];

      case "markets":
        return [
          {
            id: "group", label: "94) Group ▼", items: [
              { label: "All Assets", onClick: () => setMktGroup("All Assets"), active: mktGroup === "All Assets" },
              { label: "Currencies", onClick: () => setMktGroup("Currencies"), active: mktGroup === "Currencies" },
              { label: "Commodities", onClick: () => setMktGroup("Commodities"), active: mktGroup === "Commodities" },
              { label: "Indices", onClick: () => setMktGroup("Indices"), active: mktGroup === "Indices" },
              { label: "Crypto", onClick: () => setMktGroup("Crypto"), active: mktGroup === "Crypto" },
            ]
          },
          {
            id: "sort", label: "96) Sort ▼", items: [
              { label: "By Name", onClick: () => setMktSort("Name"), active: mktSort === "Name" },
              { label: "By Change %", onClick: () => setMktSort("Change"), active: mktSort === "Change" },
              { label: "By Volume", onClick: () => setMktSort("Volume"), active: mktSort === "Volume" },
              { divider: true, label: "" },
              { label: "Export CSV", shortcut: "Ctrl+E", onClick: () => { } },
              { label: "Copy Table", shortcut: "Ctrl+C", onClick: () => { } },
            ]
          },
        ];

      case "macro":
        return [
          {
            id: "exp", label: "94) Export ▼", items: [
              { label: "Export as PDF", onClick: () => window.print() },
              { label: "Copy Link", shortcut: "Ctrl+L", onClick: copyLink },
              { label: "Screenshot", onClick: () => { } },
            ]
          },
          {
            id: "cust", label: "95) Customize ▼", items: [
              { label: "Compact View", onClick: () => { } },
              { label: "Expanded View", onClick: () => { } },
              { divider: true, label: "" },
              { label: "Reset Layout", onClick: () => { } },
            ]
          },
        ];

      case "sentiment":
        return [
          {
            id: "view", label: "94) View ▼", items: [
              { label: "COT — Commitment of Traders", onClick: () => setSentView("COT"), active: sentView === "COT" },
              { label: "Retail Sentiment", onClick: () => setSentView("RETAIL"), active: sentView === "RETAIL" },
              { divider: true, label: "" },
              { label: "Explorer Mode", onClick: () => setSentView("EXPLORER"), active: sentView === "EXPLORER" },
            ]
          },
          {
            id: "set", label: "95) Settings ▼", items: [
              { label: "Leveraged Funds", onClick: () => { } },
              { label: "Asset Managers", onClick: () => { } },
              { label: "Dealers", onClick: () => { } },
              { divider: true, label: "" },
              { label: "Refresh Data", shortcut: "F5", onClick: () => { } },
            ]
          },
        ];
    }
  };

  const tabs = buildTabs();

  // Pass derived state down as props where children accept them
  const newsProps = tab === "news" ? { category: newsCategory, impact: newsImpact } : {};
  const marketsProps = tab === "markets" ? { group: mktGroup, sortBy: mktSort } : {};
  const sentimentProps = tab === "sentiment" ? { defaultView: sentView } : {};

  return (
    <div className="panel-container">
      <ChannelProvider channel={channelId}>
        <MenuTabs leftTabs={tabs} rightLabel={PANEL_TITLES[tab]} />

        <div className="panel-content">
          {tab === "news" && <div className="panel-full"><NewsFeed {...newsProps} /></div>}
          {tab === "markets" && <div className="panel-full"><MarketTable {...marketsProps} /></div>}
          {tab === "macro" && <div className="panel-full"><MacroRegime /></div>}
          {tab === "chart" && <div className="chart-wrapper"><ChartPanel timeframe={chartTf} chartType={chartType} onTimeframeChange={setChartTf} /></div>}
          {tab === "sentiment" && <div className="panel-full"><Sentiment defaultView={sentimentProps.defaultView} /></div>}
        </div>
      </ChannelProvider>
    </div>
  )
}

export default Panel
