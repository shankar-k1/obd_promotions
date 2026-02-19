import os
from sqlalchemy import create_engine, text, bindparam
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

class DatabaseModule:
    def __init__(self):
        self.db_type = os.getenv("DB_TYPE", "postgresql") 
        # Consolidate URL and Handle Fallbacks
        self.url = os.getenv("DATABASE_URL")
        if self.url:
            if self.url.startswith("postgres://"):
                self.url = self.url.replace("postgres://", "postgresql://", 1)
            
            # Robust fix: Strip unsupported 'prepare_threshold' if it exists in the env var
            if "prepare_threshold" in self.url:
                import re
                self.url = re.sub(r'[&?]prepare_threshold=[^&]+', '', self.url)
                # Cleanup if ? was the only thing left
                if self.url.endswith('?'):
                    self.url = self.url[:-1]
        
        if not self.url:
            user = os.getenv("DB_USER", "postgres")
            password = os.getenv("DB_PASS", "")
            host = os.getenv("DB_HOST", "localhost")
            port = os.getenv("DB_PORT", "5432")
            dbname = os.getenv("DB_NAME", "postgres")
            self.url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
        
        url = self.url
        self.init_error = None
            
        try:
            # Handle PostgreSQL Connectors (Supabase/Render/Postgres)
            if url and ("postgresql" in url or "postgres" in url):
                # Ensure SQLAlchemy uses the psycopg2 driver explicitly
                if "://" in url and not url.startswith("postgresql+psycopg2"):
                    url = url.replace("://", "+psycopg2://", 1)
                
                # Ensure sslmode=require for cloud services
                if "supabase" in url or "render" in url:
                    if "sslmode" not in url:
                        if "?" not in url: url += "?sslmode=require"
                        else: url += "&sslmode=require"
                
                self.engine = create_engine(
                    url, 
                    pool_pre_ping=True,
                    pool_recycle=300, # Recycle connections every 5 mins
                    pool_timeout=30,
                    connect_args={"sslmode": "require"} if "sslmode=require" in url else {}
                )
            elif url:
                self.engine = create_engine(url)
            else:
                self.engine = None
        except Exception as e:
            self.init_error = str(e)
            print(f"❌ DATABASE INITIALIZATION ERROR: {e}")
            self.engine = None
            
        if self.engine:
            try:
                # Test connection immediately
                with self.engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
                self._initialize_tables()
            except Exception as e:
                self.init_error = f"Conn Test Failed: {str(e)}"
                print(f"Error initializing DB session: {e}")

    def _initialize_tables(self):
        """Creates the necessary tables if they don't exist (PostgreSQL syntax)."""
        # PostgreSQL uses SERIAL for auto-increment and different table creation checks
        queries = [
            """
            CREATE TABLE IF NOT EXISTS obdscheduling_details (
                id SERIAL PRIMARY KEY,
                obd_name VARCHAR(255) NOT NULL,
                flow_name VARCHAR(255) NOT NULL,
                msc_ip VARCHAR(50) NOT NULL,
                cli VARCHAR(50) NOT NULL,
                scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS dnd_list (
                id SERIAL PRIMARY KEY,
                msisdn VARCHAR(20) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                msisdn VARCHAR(20) NOT NULL,
                service_id VARCHAR(50) NOT NULL,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS unsubscriptions (
                id SERIAL PRIMARY KEY,
                msisdn VARCHAR(20) NOT NULL,
                service_id VARCHAR(50) DEFAULT 'PROMO',
                unsub_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        ]
        try:
            with self.engine.connect() as connection:
                for query in queries:
                    connection.execute(text(query))
                connection.commit()
        except Exception as e:
            print(f"Table Initialization Error: {e}")

    def save_scheduling_details(self, details: dict):
        """Inserts scheduling details into the database."""
        query = text("""
            INSERT INTO obdscheduling_details (obd_name, flow_name, msc_ip, cli)
            VALUES (:obd_name, :flow_name, :msc_ip, :cli)
        """)
        try:
            with self.engine.connect() as connection:
                connection.execute(query, details)
                connection.commit()
                return True
        except Exception as e:
            self.last_error = f"Save Scheduling Error: {str(e)}"
            print(self.last_error)
            return False

    def execute_query(self, query, params=None):
        """Executes a raw SQL select query and handles result mapping."""
        if not self.engine:
            return []
        
        try:
            with self.engine.connect() as connection:
                statement = text(query) if isinstance(query, str) else query
                result = connection.execute(statement, params or {})
                # Using .mappings() for robust dict conversion across SQL flavors
                return [dict(row) for row in result.mappings()]
        except Exception as e:
            print(f"Query Error: {e}")
            return []

    def _expand_msisdns(self, msisdns):
        """Expands a list of bare MSISDNs into multiple common formats for robust lookup."""
        expanded = set()
        for m in msisdns:
            if not m: continue
            # Add Bare (no prefix)
            expanded.add(m)
            # Add 0-prefixed (Local)
            expanded.add(f"0{m}")
            # Add 234-prefixed (International)
            expanded.add(f"234{m}")
        return list(expanded)

    def _chunked_lookup(self, msisdns, query_template, extra_params=None):
        """Processes large MSISDN lists in batches to handle cloud DB limits."""
        if not msisdns:
            return []
            
        expanded = self._expand_msisdns(msisdns)
        results = []
        chunk_size = 5000
        
        for i in range(0, len(expanded), chunk_size):
            chunk = expanded[i:i + chunk_size]
            params = {"msisdns": chunk}
            if extra_params:
                params.update(extra_params)
            
            # Using bindparams(expanding=True) for SQL 'IN' clause optimization
            query = text(query_template).bindparams(
                bindparam("msisdns", expanding=True)
            )
            
            chunk_results = self.execute_query(query, params)
            results.extend([row['msisdn'] for row in chunk_results if 'msisdn' in row])
            
        return list(set(results)) # Deduplicate matches

    def check_dnd_bulk(self, msisdns):
        """Checks which given MSISDNs are in the DND list (Batch-Optimized)."""
        query = "SELECT msisdn FROM dnd_list WHERE msisdn IN :msisdns"
        return self._chunked_lookup(msisdns, query)

    def check_subscriptions_bulk(self, msisdns, service_id="PROMO"):
        """Checks which MSISDNs are already subscribed (Batch-Optimized)."""
        query = "SELECT msisdn FROM subscriptions WHERE service_id = :service_id AND status = 'ACTIVE' AND msisdn IN :msisdns"
        return self._chunked_lookup(msisdns, query, {"service_id": service_id})

    def check_unsubscriptions_bulk(self, msisdns):
        """Checks which MSISDNs have unsubscribed (Batch-Optimized)."""
        query = "SELECT msisdn FROM unsubscriptions WHERE msisdn IN :msisdns"
        return self._chunked_lookup(msisdns, query)
