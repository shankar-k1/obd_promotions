import socket
import os
from dotenv import load_dotenv

load_dotenv()

def test_dns(hostname):
    print(f"🔍 Testing DNS for {hostname}...")
    try:
        addr = socket.gethostbyname(hostname)
        print(f"✅ Resolved to: {addr}")
        return True
    except Exception as e:
        print(f"❌ DNS Fail: {e}")
        return False

def check_env():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("❌ No DATABASE_URL in .env")
        return
    
    # Extract hostname
    try:
        parts = url.split("@")
        if len(parts) > 1:
            host_port = parts[1].split("/")[0]
            host = host_port.split(":")[0]
            test_dns(host)
    except:
        print("❌ Could not parse URL")

if __name__ == "__main__":
    check_env()
    # Try common alternatives
    test_dns("db.rezxqwjmkkdjwqjxlsxz.supabase.co")
    # Sometimes supabase uses different subdomains depending on the pooler
    test_dns("aws-0-ap-southeast-1.pooler.supabase.com") 
