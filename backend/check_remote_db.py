import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def check_counts():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("❌ DATABASE_URL not found")
        return
        
    # Ensure sslmode=require for local execution too
    if "?" not in url: url += "?sslmode=require"
    
    try:
        engine = create_engine(url, connect_args={"sslmode": "require"})
        with engine.connect() as conn:
            for table in ["dnd_list", "subscriptions", "unsubscriptions", "obdscheduling_details"]:
                res = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = res.scalar()
                print(f"📊 Table {table}: {count} rows")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_counts()
