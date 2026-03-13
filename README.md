# NEXUS Terminal 🌐💹

**NEXUS Terminal** is a premium, Bloomberg-like Global Macro Trading dashboard built with React and TypeScript. It is designed to provide professional-grade market insights, sentiment analysis, macroeconomic data, and real-time charting in a sleek, glassmorphic "Level 1.5" UI.

## 🚀 Features

The application is divided into several highly functional panels, all maintaining a premium and cohesive design syntax.

### 📊 Chart Panel & Market Data
- **Real-Time Data**: Live cryptocurrency price feeds (e.g., BTC/USD) retrieved via Binance WebSocket API.
- **Advanced Charting**: High-performance interactive charts built with ECharts and Lightweight Charts, featuring custom thematic styling.
- **Clean UI**: Custom minimal footprint with standard watermarks hidden for a clean professional look.
- **Market Table**: Live snapshot of key global macro assets.

### 🎭 Sentiment Panel 
- **Institutional vs. Retail Divergence**: Deep analysis comparing COT (Commitments of Traders) data against retail positioning.
- **Market-Wide Scorecard**: 'OVERVIEW' tab featuring positioning scorecards with gauge visualizations.
- **Alignment Confidence**: 'COMPARE' tab generating signals based on the divergence and alignment of different market participant groups.

### 📰 Macro News Feed Panel
- **Professional Feed**: A tailored macro news feed with breaking news alerts.
- **Impact Scoring & Sentiment**: News items enriched with AI-driven or metadata-driven impact scoring and sentiment analysis.
- **Multi-Asset Reactions**: Visual indicators of how a specific news drop impacts different asset classes.

### 🌍 Macro Regime Panel
- Data-driven views into the current macroeconomic environment (Growth vs. Inflation matrices, etc.) using clean, data-dense layouts.

---

## 💻 Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS with modern Glassmorphism, tailored Color Palettes, and Typography (Bloomberg-inspired fonts, Inter, etc.)
- **Charting**: ECharts
- **Data Gathering (Python Scripts)**:
  - `eco_calendar.py`: Fetches and formats macroeconomic calendar data.
  - `retail_sentiment.py`: Scrapes and aggregates retail sentiment positioning data.

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.9+) if you intend to run the data scrapers.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/nexus-terminal.git
cd nexus-terminal
```

### 2. Frontend Setup
Install dependencies and run the Vite development server:
```bash
npm install
npm run dev
```
The application will be running at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
npm run preview
```

---

## 🐍 Data Scrapers (Python)

The project includes several Python scripts located in the root directory to gather external sentiment and macroeconomic data. 

To run these scripts, create a virtual environment, install the requisite packages (e.g., `requests`, `pandas`, `beautifulsoup4` depending on the script requirements), and execute them:

```bash
# Create and activate virtual environment (Windows)
python -m venv .venv
.venv\Scripts\activate

# Run data fetchers
python eco_calendar.py
python retail_sentiment.py
```
Output JSON files (like `g20_calendar.json`, `major_currencies_calendar.json`) will be automatically consumed by the frontend.

---

## 💎 Design Philosophy & UI Standards

NEXUS Terminal adheres to strict premium design guidelines:
- **No cartoon emojis**: Uses professional Unicode symbols and minimalist icons.
- **Deep & Sleek Themes**: Specialized dark mode layouts with carefully tuned HSL color palettes.
- **Micro-animations**: Smooth hover transitions and dynamic data updates to make the interface feel alive and responsive.
- **Data Density**: Information architecture that accommodates professional traders who need dense data without visual clutter.

---

## 📜 License
This project is for private/educational use.
