from __future__ import annotations
import pandas as pd  # type: ignore[import]
import requests  # type: ignore[import]
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Literal
import re


class EconomistEconomicCalendar:
    """
    Economic Calendar dengan klasifikasi berdasarkan
    "The Economist Guide to Economic Indicators" & Market Structure

    Klasifikasi Mata Uang:
    - MAJOR: USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD (8 currencies)
    - MINOR/CROSS: EUR/GBP, EUR/JPY, GBP/JPY, dll (crosses dari major)
    - EXOTIC: CNY, INR, BRL, MXN, ZAR, TRY, IDR, SAR, ARS, KRW, RUB, dll

    Level Impact:
    - HIGH: Market-moving, policy-critical, forward-looking
    - MEDIUM: Important but predictable or lagging
    - LOW: Routine, minimal market impact
    - SPECIAL: Non-economic events (political, holidays)
    """

    # ==========================================
    # KLASIFIKASI MATA UANG FOREX
    # ==========================================

    MAJOR_CURRENCIES = {
        'US': {'name': 'United States', 'currency': 'USD', 'weight': 1.5},
        'EU': {'name': 'Euro Zone', 'currency': 'EUR', 'weight': 1.4},
        'GB': {'name': 'United Kingdom', 'currency': 'GBP', 'weight': 1.3},
        'JP': {'name': 'Japan', 'currency': 'JPY', 'weight': 1.3},
        'CH': {'name': 'Switzerland', 'currency': 'CHF', 'weight': 1.2},
        'CA': {'name': 'Canada', 'currency': 'CAD', 'weight': 1.1},
        'AU': {'name': 'Australia', 'currency': 'AUD', 'weight': 1.1},
        'NZ': {'name': 'New Zealand', 'currency': 'NZD', 'weight': 1.0},
    }

    # Euro Zone Components (untuk data detail, tapi currency sama = EUR)
    EURO_COMPONENTS = {
        'DE': {'name': 'Germany', 'currency': 'EUR', 'weight': 1.2, 'region': 'EU'},
        'FR': {'name': 'France', 'currency': 'EUR', 'weight': 1.1, 'region': 'EU'},
        'IT': {'name': 'Italy', 'currency': 'EUR', 'weight': 1.0, 'region': 'EU'},
        'ES': {'name': 'Spain', 'currency': 'EUR', 'weight': 0.9, 'region': 'EU'},
        'NL': {'name': 'Netherlands', 'currency': 'EUR', 'weight': 0.9, 'region': 'EU'},
    }

    # Exotic currencies - lower liquidity, wider spreads
    EXOTIC_CURRENCIES = {
        'CN': {'name': 'China', 'currency': 'CNY', 'weight': 0.8},
        'IN': {'name': 'India', 'currency': 'INR', 'weight': 0.7},
        'BR': {'name': 'Brazil', 'currency': 'BRL', 'weight': 0.7},
        'MX': {'name': 'Mexico', 'currency': 'MXN', 'weight': 0.7},
        'RU': {'name': 'Russia', 'currency': 'RUB', 'weight': 0.6},
        'ZA': {'name': 'South Africa', 'currency': 'ZAR', 'weight': 0.6},
        'TR': {'name': 'Turkey', 'currency': 'TRY', 'weight': 0.6},
        'ID': {'name': 'Indonesia', 'currency': 'IDR', 'weight': 0.6},
        'SA': {'name': 'Saudi Arabia', 'currency': 'SAR', 'weight': 0.6},
        'AR': {'name': 'Argentina', 'currency': 'ARS', 'weight': 0.5},
        'KR': {'name': 'South Korea', 'currency': 'KRW', 'weight': 0.7},
    }

    # G7 Countries (Major advanced economies)
    G7_COUNTRIES = ['US', 'GB', 'DE', 'FR', 'IT', 'JP', 'CA']

    # G20 Countries (Major economies)
    G20_COUNTRIES = ['US', 'GB', 'DE', 'FR', 'IT', 'JP', 'CA', 'AU', 'CN',
                     'IN', 'BR', 'RU', 'ZA', 'KR', 'ID', 'SA', 'AR', 'MX', 'TR', 'EU']

    # ==========================================
    # KLASIFIKASI IMPACT EVENTS
    # ==========================================

    HIGH_IMPACT_KEYWORDS = {
        # GDP & Growth (Chapter 4) - Ultimate measure
        'gdp', 'gross domestic product', 'economic growth',
        'gdp growth rate', 'real gdp', 'nominal gdp',

        # Employment (Chapter 5) - Lagging but critical
        'non farm payrolls', 'unemployment rate', 'employment change',
        'jobless claims', 'initial jobless claims', 'jolts',
        'payrolls', 'labor force participation', 'wage growth',
        'average hourly earnings', 'unit labor costs',

        # Interest Rates & Monetary Policy (Chapter 12) - Direct market impact
        'interest rate decision', 'fed interest rate', 'boe interest rate',
        'ecb interest rate', 'rba interest rate', 'boj interest rate',
        'federal funds rate', 'cash rate', 'bank rate', 'repo rate',
        'monetary policy statement', 'fomc statement', 'fed chair',
        'forward guidance', 'dot plot',

        # Inflation (Chapter 13) - Core price stability metric
        'inflation rate', 'cpi', 'consumer price index',
        'core inflation', 'core cpi', 'pce price index',
        'core pce', 'producer price index', 'ppi',
        'trimmed mean cpi', 'weighted median cpi',

        # Central Bank Communications
        'fed press conference', 'fomc minutes', 'monetary policy report',
        'financial stability report', 'inflation report',
    }

    MEDIUM_IMPACT_KEYWORDS = {
        # Consumers (Chapter 7) - Important but predictable
        'retail sales', 'consumer confidence', 'consumer sentiment',
        'personal spending', 'personal consumption', 'consumer credit',
        'personal income', 'disposable income', 'savings rate',

        # Investment (Chapter 8) - Forward-looking but noisy
        'durable goods orders', 'factory orders', 'business investment',
        'housing starts', 'building permits', 'new home sales',
        'existing home sales', 'pending home sales', 'construction spending',
        'capacity utilization', 'business inventories',

        # Industry (Chapter 9) - Specific sector data
        'industrial production', 'manufacturing production', 'factory output',
        'manufacturing pmi', 'services pmi', 'composite pmi',
        'business confidence', 'economic sentiment', 'zew economic sentiment',
        'ifo business climate',

        # Balance of Payments (Chapter 10)
        'trade balance', 'current account', 'capital account',
        'exports', 'imports', 'trade deficit', 'trade surplus',

        # Housing Market
        'home prices', 'house price index', 'case-shiller',
        'mortgage approvals', 'mortgage lending',

        # Regional Fed Surveys (leading indicators)
        'empire state manufacturing', 'philadelphia fed', 'chicago pmi',
        'dallas fed', 'richmond fed', 'kansas city fed',
    }

    LOW_IMPACT_KEYWORDS = {
        # Routine releases, minimal surprise value
        'weekly crude oil inventories', 'natural gas storage',
        'api crude oil', 'eia crude oil', 'gasoline inventories',
        'distillate inventories', 'baker hughes rig count',

        # Secondary/tertiary data
        'current account balance', 'foreign exchange reserves',
        'government budget', 'public sector borrowing',
        'money supply', 'm2 money supply', 'm3 money supply',

        # Housing details
        'mortgage applications', 'refinance index', 'purchase index',
        'fhfa house price index', 'new home mortgage',

        # Labor market details
        'continuing jobless claims', ' Challenger job cuts',
        'adp employment',  # ADP less reliable than NFP

        # Business details
        'wholesale inventories', 'wholesale trade sales',
        'business inventories', 'factory orders ex transportation',

        # Regional data
        'redbook index', 'johnson redbook', 'same store sales',
        'abc consumer confidence', 'umich inflation expectations',

        # Government auctions
        'treasury auction', 'bond auction', 'bill auction',
    }

    SPECIAL_KEYWORDS = {
        # Non-economic events
        'holiday', 'bank holiday', 'market closed',
        'g20 meeting', 'g7 meeting', 'imf meeting',
        'world economic forum', 'davos',
        'election', 'referendum', 'political',
        'national people\'s congress', 'federal budget',
        'state of the union', 'budget speech',
        'central bank governor speech',  # Unless policy announcement
        'treasury secretary speech',
    }

    def __init__(self,
                 focus: Literal['major', 'g7', 'g20', 'all', 'custom'] = 'major',
                 custom_countries: Optional[List[str]] = None,
                 timezone: str = 'Asia/Jakarta'):
        """
        Initialize Economic Calendar
        """
        self.url = 'https://economic-calendar.tradingview.com/events'
        self.timezone = timezone
        self.headers = {
            'Origin': 'https://www.tradingview.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        # Pre-declare attributes so type checkers can find them
        self.df: Any = None
        self.countries: List[str] = []
        self.country_names: Dict[str, Any] = {}
        self.focus = focus

        # Set countries based on focus
        self._set_countries(focus, custom_countries)

        # Build currency mapping
        self.currency_map: Dict[str, Any] = {}
        self._build_currency_map()

    def _set_countries(self, focus: str, custom_countries: Optional[List[str]]):
        """Set country list based on focus parameter"""
        if focus == 'major':
            self.countries = ['US', 'EU', 'GB', 'JP', 'CH', 'CA', 'AU', 'NZ']
            self.country_names = {k: v['name'] for k, v in self.MAJOR_CURRENCIES.items()}

        elif focus == 'g7':
            self.countries = self.G7_COUNTRIES
            self.country_names = {k: v['name'] for k, v in {**self.MAJOR_CURRENCIES,
                                                            **self.EURO_COMPONENTS}.items()}

        elif focus == 'g20':
            self.countries = self.G20_COUNTRIES
            all_data = {**self.MAJOR_CURRENCIES,
                       **self.EURO_COMPONENTS,
                       **self.EXOTIC_CURRENCIES}
            self.country_names = {k: v['name'] for k, v in all_data.items()}

        elif focus == 'all':
            all_countries = list(self.MAJOR_CURRENCIES.keys()) + \
                          list(self.EURO_COMPONENTS.keys()) + \
                          list(self.EXOTIC_CURRENCIES.keys())
            self.countries = list(set(all_countries))
            all_data = {**self.MAJOR_CURRENCIES,
                       **self.EURO_COMPONENTS,
                       **self.EXOTIC_CURRENCIES}
            self.country_names = {k: v['name'] for k, v in all_data.items()}

        elif focus == 'custom' and custom_countries:
            self.countries = custom_countries
            all_data = {**self.MAJOR_CURRENCIES,
                       **self.EURO_COMPONENTS,
                       **self.EXOTIC_CURRENCIES}
            self.country_names = {k: all_data.get(k, {}).get('name', k)
                                 for k in custom_countries}
        else:
            raise ValueError(f"Invalid focus: {focus}. Use 'major', 'g7', 'g20', 'all', or 'custom'")

    def _build_currency_map(self):
        for code, data in self.MAJOR_CURRENCIES.items():
            self.currency_map[code] = data['currency']

        for code, data in self.EURO_COMPONENTS.items():
            self.currency_map[code] = data['currency']

        for code, data in self.EXOTIC_CURRENCIES.items():
            self.currency_map[code] = data['currency']

    def _get_country_weight(self, country: str) -> float:
        weight: object
        if country in self.MAJOR_CURRENCIES:
            weight = self.MAJOR_CURRENCIES[country]['weight']
        elif country in self.EURO_COMPONENTS:
            weight = self.EURO_COMPONENTS[country]['weight']
        elif country in self.EXOTIC_CURRENCIES:
            weight = self.EXOTIC_CURRENCIES[country]['weight']
        else:
            weight = 0.7  # Default
        return float(weight)

    def _is_major_currency(self, country: str) -> bool:
        if country in self.MAJOR_CURRENCIES:
            return True
        if country in self.EURO_COMPONENTS:
            return True
        return False

    def _classify_event(self, title: str, country: str, tv_importance: int) -> Dict:
        title_lower = title.lower()
        country_weight = self._get_country_weight(country)
        is_major = self._is_major_currency(country)
        currency = self.currency_map.get(country, 'N/A')

        high_match = any(kw in title_lower for kw in self.HIGH_IMPACT_KEYWORDS)
        med_match = any(kw in title_lower for kw in self.MEDIUM_IMPACT_KEYWORDS)
        low_match = any(kw in title_lower for kw in self.LOW_IMPACT_KEYWORDS)
        spe_match = any(kw in title_lower for kw in self.SPECIAL_KEYWORDS)

        if spe_match:
            base_level = 'SPE'
            base_score = -1
            category = 'Special/Non-Economic'
        elif high_match:
            base_level = 'HIGH'
            base_score = 2
            if any(kw in title_lower for kw in ['interest rate', 'fed ', 'boe ', 'ecb ', 'rba ', 'boj ']):
                category = 'Monetary Policy'
            elif any(kw in title_lower for kw in ['payrolls', 'unemployment', 'jolts', 'wage']):
                category = 'Labor Market'
            elif any(kw in title_lower for kw in ['inflation', 'cpi', 'pce', 'ppi']):
                category = 'Price Stability'
            elif 'gdp' in title_lower:
                category = 'Economic Growth'
            else:
                category = 'High Impact'
        elif med_match:
            base_level = 'MED'
            base_score = 1
            if any(kw in title_lower for kw in ['pmi', 'confidence', 'sentiment']):
                category = 'Business Sentiment'
            elif any(kw in title_lower for kw in ['retail', 'consumer', 'spending']):
                category = 'Consumer Activity'
            elif any(kw in title_lower for kw in ['housing', 'home', 'construction']):
                category = 'Housing/Construction'
            elif any(kw in title_lower for kw in ['trade', 'export', 'import', 'current account']):
                category = 'External Trade'
            else:
                category = 'Medium Impact'
        else:
            base_level = 'LOW'
            base_score = 0
            category = 'Routine Data'

        if is_major:
            adjusted_score = base_score * country_weight * 1.2
        else:
            adjusted_score = base_score * country_weight * 0.8

        if is_major and base_level == 'LOW' and tv_importance >= 0:
            adjusted_score = max(adjusted_score, 0.8)

        if adjusted_score >= 1.5:
            final_level = 'HIGH'
        elif adjusted_score >= 0.8:
            final_level = 'MED'
        elif adjusted_score >= 0:
            final_level = 'LOW'
        else:
            final_level = 'SPE'

        reasons = []
        if is_major:
            reasons.append(f"Major currency ({currency})")
        else:
            reasons.append(f"Exotic currency ({currency})")

        if country in self.EURO_COMPONENTS:
            reasons.append("Euro Zone component")

        if high_match:
            reasons.append("Market-critical indicator")
        elif med_match:
            reasons.append("Significant economic data")

        if 'prel' in title_lower or 'flash' in title_lower:
            reasons.append("Preliminary/Flash data (more volatile)")
        if 'final' in title_lower:
            reasons.append("Final revision (less volatile)")

        return {
            'level': final_level,
            'score': round(float(adjusted_score), 2),  # type: ignore[call-overload]
            'reason': '; '.join(reasons) if reasons else 'Routine economic data',
            'category': category,
            'currency': currency,
            'is_major': is_major,
            'country_weight': country_weight
        }

    def fetch(self, start_date=None, end_date=None, days_back=30, days_forward=30,
              countries=None, apply_custom_classification=True):
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        if end_date is None:
            end_date = (datetime.now() + timedelta(days=days_forward)).strftime('%Y-%m-%d')

        from_time = pd.Timestamp(start_date).normalize()
        to_time = pd.Timestamp(end_date).normalize() + pd.offsets.Hour(23)

        if countries is None:
            countries_list = self.countries
        elif isinstance(countries, str):
            countries_list = countries.split(',')
        else:
            countries_list = countries

        countries_str = ','.join(countries_list)

        payload = {
            'from': from_time.isoformat() + '.000Z',
            'to': to_time.isoformat() + '.000Z',
            'countries': countries_str
        }

        try:
            response = requests.get(self.url, headers=self.headers, params=payload)
            data = response.json()['result']
            self.df = pd.DataFrame(data)

            if len(self.df) > 0:
                self._process_data()
                if apply_custom_classification:
                    self._apply_economist_classification()
            else:
                pass
        except Exception as e:
            self.df = pd.DataFrame()

        return self.df

    def _process_data(self):
        self.df['date'] = pd.to_datetime(self.df['date'])
        self.df['date_local'] = self.df['date'].dt.tz_convert(self.timezone)

        now = pd.Timestamp.now(tz=self.timezone)
        self.df['status'] = self.df['date_local'].apply(
            lambda x: 'RELEASED' if x < now else 'UPCOMING'
        )
        self.df = self.df.sort_values('date_local')

    def _apply_economist_classification(self):
        classifications = []
        for _, row in self.df.iterrows():
            cls = self._classify_event(
                row['title'],
                row['country'],
                row.get('importance', 0)
            )
            classifications.append(cls)

        self.df['eco_level'] = [c['level'] for c in classifications]
        self.df['eco_score'] = [c['score'] for c in classifications]
        self.df['eco_reason'] = [c['reason'] for c in classifications]
        self.df['eco_category'] = [c['category'] for c in classifications]
        self.df['currency'] = [c['currency'] for c in classifications]
        self.df['is_major'] = [c['is_major'] for c in classifications]
        self.df['country_weight'] = [c['country_weight'] for c in classifications]

        tv_map = {-1: 'SPE', 0: 'LOW', 1: 'MED', 2: 'HIGH'}
        self.df['tv_level'] = self.df.get('importance', pd.Series(0, index=self.df.index)).map(tv_map)
        self.df['classification_diff'] = self.df['eco_level'] != self.df['tv_level']

    def to_json(self, filepath, df=None):
        if df is None:
            df = self.df

        if len(df) == 0:
            return

        export_df = df.copy()
        for col in ['date', 'date_local']:
            if col in export_df.columns:
                export_df[col] = export_df[col].dt.strftime('%Y-%m-%dT%H:%M:%S%z')

        # Fix specific columns with missing or NaN values to avoid JSON serialization errors
        export_df = export_df.fillna('')

        output = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "focus": self.focus,
            },
            "events": export_df.to_dict('records')
        }

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    import os
    cal_major = EconomistEconomicCalendar(focus='major', timezone='Asia/Jakarta')
    cal_major.fetch(days_back=7, days_forward=35)

    # Write to src/data/ (where React app imports from)
    out_dir = os.path.join(os.path.dirname(__file__), "src", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "major_currencies_calendar.json")
    cal_major.to_json(out_path)
    print(f"✅ Saved {out_path}")

    # Also keep root copy for reference
    cal_major.to_json("major_currencies_calendar.json")
    print("✅ Also saved root copy")
