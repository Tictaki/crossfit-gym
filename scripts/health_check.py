import requests
import time
import sys

SERVICES = {
    "Frontend": "http://localhost:3000",
    "Backend": "http://localhost:3001/health",
    "PDF Service": "http://localhost:3002/health"
}

def check_services():
    print("🔍 Checking services health...")
    all_ok = True
    for name, url in SERVICES.items():
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {name}: UP ({response.status_code})")
            else:
                print(f"⚠️ {name}: UNEXPECTED STATUS ({response.status_code})")
                all_ok = False
        except Exception as e:
            print(f"❌ {name}: DOWN ({str(e)})")
            all_ok = False
    return all_ok

if __name__ == "__main__":
    success = check_services()
    if not success:
        sys.exit(1)
    sys.exit(0)
