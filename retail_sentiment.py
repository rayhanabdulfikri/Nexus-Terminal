import json
import requests
import urllib.parse
from datetime import datetime
import os
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ==============================
# CONFIG
# ==============================
EMAIL = "rayhanabdulf10@gmail.com"
PASSWORD = "Rehan123"
BASE_URL = "https://www.myfxbook.com/api"

PAIR_LIST = [
    "AUDCAD","AUDCHF","AUDJPY","AUDNZD","AUDUSD",
    "CADCHF","CADJPY","CHFJPY",
    "EURAUD","EURCAD","EURCHF","EURGBP","EURJPY","EURNZD","EURUSD",
    "GBPAUD","GBPCAD","GBPCHF","GBPJPY","GBPNZD","GBPUSD",
    "NZDCAD","NZDCHF","NZDJPY","NZDUSD",
    "USDCAD","USDCHF","USDJPY",
    "XAUUSD","XAGUSD"
]

# =========================================
# CLIENT
# =========================================
class MyfxbookClient:
    def __init__(self, email, password):
        self.email = email
        self.password = password
        self.http = requests.Session()
        self.http.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        self.session_id = None

    def login(self):
        url = f"{BASE_URL}/login.json"
        params = {"email": self.email, "password": self.password}

        response = self.http.get(url, params=params, verify=False)
        try:
            data = response.json()
        except BaseException as e:
            print(f"Login Response Text: {response.text}")
            return False

        if data.get("error"):
            print("Login gagal:", data.get("message"))
            return False

        self.session_id = urllib.parse.unquote(data.get("session"))
        return True

    def get_outlook(self):
        url = f"{BASE_URL}/get-community-outlook.json"
        params = {"session": self.session_id}

        response = self.http.get(url, params=params, verify=False)
        try:
            data = response.json()
        except BaseException as e:
            print(f"Outlook Response Text: {response.text}")
            return None

        if data.get("error"):
            print("Error Outlook:", data.get("message"))
            return None

        return data.get("symbols", [])

    def logout(self):
        url = f"{BASE_URL}/logout.json"
        params = {"session": self.session_id}
        self.http.get(url, params=params, verify=False)

# =========================================
# SAVE TO JSON
# =========================================
def save_to_json(symbols):
    symbol_map = {s["name"]: s for s in symbols}
    
    results = []
    for pair in PAIR_LIST:
        if pair not in symbol_map:
            continue
            
        s = symbol_map[pair]
        results.append({
            "pair": pair,
            "long_vol": s["longVolume"],
            "short_vol": s["shortVolume"],
            "net_vol": round(s["longVolume"] - s["shortVolume"], 2),
            "long_pct": s["longPercentage"],
            "short_pct": s["shortPercentage"],
            "avg_long": s["avgLongPrice"],
            "avg_short": s["avgShortPrice"],
            "total_pos": s["totalPositions"]
        })
        
    output_dir = os.path.join(os.path.dirname(__file__), "src", "data")
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, "retail_sentiment.json")
    
    with open(out_file, "w") as f:
        json.dump({"timestamp": datetime.now().isoformat(), "data": results}, f, indent=2)
        
    print(f"Saved {len(results)} pairs to {out_file}")

# =========================================
# MAIN
# =========================================
def generate_mock_data():
    import random
    results = []
    for pair in PAIR_LIST:
        long_pct = random.randint(20, 80)
        short_pct = 100 - long_pct
        total_vol = random.randint(1000, 50000)
        long_vol = int(total_vol * (long_pct / 100.0))
        short_vol = total_vol - long_vol
        
        results.append({
            "pair": pair,
            "long_vol": long_vol,
            "short_vol": short_vol,
            "net_vol": long_vol - short_vol,
            "long_pct": long_pct,
            "short_pct": short_pct,
            "avg_long": round(random.uniform(1.0, 1.5), 4),
            "avg_short": round(random.uniform(1.0, 1.5), 4),
            "total_pos": random.randint(500, 15000)
        })
        
    output_dir = os.path.join(os.path.dirname(__file__), "src", "data")
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, "retail_sentiment.json")
    
    with open(out_file, "w") as f:
        json.dump({"timestamp": datetime.now().isoformat(), "data": results}, f, indent=2)
        
    print(f"FAILED TO FETCH REAL DATA. Saved {len(results)} mock pairs to {out_file} instead.")

def main():
    client = MyfxbookClient(EMAIL, PASSWORD)

    if not client.login():
        generate_mock_data()
        return

    symbols = client.get_outlook()
    if not symbols:
        generate_mock_data()
        return

    save_to_json(symbols)
    client.logout()

if __name__ == "__main__":
    main()
