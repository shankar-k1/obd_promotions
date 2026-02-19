import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add the current directory to path so we can import modules if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def migrate():
    # 1. Source Connection (Local MySQL)
    mysql_user = os.getenv("DB_USER", "root")
    mysql_pass = os.getenv("DB_PASS", "shan2001")
    mysql_host = os.getenv("DB_HOST", "localhost")
    mysql_name = os.getenv("DB_NAME", "obd_db")
    mysql_url = f"mysql+mysqlconnector://{mysql_user}:{mysql_pass}@{mysql_host}/{mysql_name}"
    
    # 2. Destination Connection (Supabase PostgreSQL)
    pg_url = os.getenv("DATABASE_URL")
    
    if not pg_url:
        print("❌ ERROR: DATABASE_URL not found in .env. Please add your Supabase connection string.")
        return

    print("🚀 Starting Migration...")
    
    try:
        mysql_engine = create_engine(mysql_url)
        pg_engine = create_engine(pg_url)
        
        # Verify connections
        mysql_engine.connect()
        print("✅ Connected to Local MySQL")
        pg_engine.connect()
        print("✅ Connected to Supabase PostgreSQL")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    tables = ["dnd_list", "subscriptions", "unsubscriptions", "obdscheduling_details"]
    
    for table in tables:
        print(f"\n📦 Migrating table: {table}...")
        try:
            # Fetch from MySQL
            with mysql_engine.connect() as conn:
                result = conn.execute(text(f"SELECT * FROM {table}"))
                rows = [dict(row) for row in result.mappings()]
            
            if not rows:
                print(f"  ℹ️  No records found in local {table}. Skipping.")
                continue

            print(f"  📥 Found {len(rows)} records locally.")

            # Insert into PostgreSQL
            # We use a simple loop. For massive lists, we might want chunking.
            with pg_engine.connect() as conn:
                # First, ensure table exists in PG (Schema Initialization)
                # (This is a safety net in case Render hasn't started yet)
                from modules.database_module import DatabaseModule
                db = DatabaseModule() # This triggers _initialize_tables
                print(f"  🛠️  Ensured remote schema is initialized.")

                # Insert data
                # We build the column list dynamically
                cols = ", ".join(rows[0].keys())
                placeholders = ", ".join([f":{k}" for k in rows[0].keys()])
                insert_query = text(f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING")
                
                # Execute in batches
                conn.execute(insert_query, rows)
                conn.commit()
                print(f"  ✅ Successfully migrated {len(rows)} records to Supabase.")

        except Exception as e:
            print(f"  ❌ Error migrating {table}: {e}")

    print("\n✨ Migration Complete!")

if __name__ == "__main__":
    migrate()
