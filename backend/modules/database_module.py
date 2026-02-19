import os
from sqlalchemy import create_engine, text, bindparam
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

class DatabaseModule:
    def __init__(self):
        self.db_type = os.getenv("DB_TYPE", "mysql")
        self.host = os.getenv("DB_HOST", "localhost")
        self.user = os.getenv("DB_USER", "root")
        self.password = os.getenv("DB_PASS", "shan2001")
        self.dbname = os.getenv("DB_NAME", "obd_db")
        
        if self.db_type == "sqlite":
            self.url = f"sqlite:///./{self.dbname}.db"
            self.engine = create_engine(self.url)
        else:
            # Use connect_args for the database name to handle spaces/special characters safely
            self.url = f"{self.db_type}+mysqlconnector://{self.user}:{self.password}@{self.host}/"
            try:
                self.engine = create_engine(self.url, connect_args={"database": self.dbname})
            except Exception as e:
                print(f"Error initializing database: {e}")
                self.engine = None
            
        if self.engine:
            try:
                self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
                self._initialize_tables()
            except Exception as e:
                print(f"Error creating sessionmaker: {e}")

    def _initialize_tables(self):
        """Creates the necessary tables if they don't exist."""
        # Simple table creation for obdscheduling_details
        create_table_query = """
        CREATE TABLE IF NOT EXISTS obdscheduling_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            obd_name VARCHAR(255) NOT NULL,
            flow_name VARCHAR(255) NOT NULL,
            msc_ip VARCHAR(50) NOT NULL,
            cli VARCHAR(50) NOT NULL,
            scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        try:
            with self.engine.connect() as connection:
                connection.execute(text(create_table_query))
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
            print(f"Save Scheduling Error: {e}")
            return False

    def execute_query(self, query, params=None):
        """Executes a raw SQL select query."""
        if not self.engine:
            return []
        
        try:
            with self.engine.connect() as connection:
                # If query is a string, wrap it in text()
                statement = text(query) if isinstance(query, str) else query
                result = connection.execute(statement, params or {})
                return [dict(row) for row in result.mappings()]
        except Exception as e:
            print(f"Query Error: {e}")
            return []

    def check_dnd_bulk(self, msisdns):
        """Checks which MSISDNs are in the DND list in a single batch query."""
        if not msisdns:
            return []
        
        # Batching for massive lists (SQL 'IN' clause limit is usually large but we should be careful)
        # SQLAlchemy 2.0: use bindparam with expanding=True for 'IN' clauses
        query = text("SELECT msisdn FROM dnd_list WHERE msisdn IN :msisdns").bindparams(
            bindparam("msisdns", expanding=True)
        )
        # We pass msisdns as a list - SQLAlchemy handles the expansion
        res = self.execute_query(query, {"msisdns": list(msisdns)})
        return [row['msisdn'] for row in res]

    def check_dnd(self, msisdn):
        """Checks if a single MSISDN is in the DND table."""
        query = "SELECT msisdn FROM dnd_list WHERE msisdn = :msisdn"
        res = self.execute_query(query, {"msisdn": msisdn})
        return len(res) > 0

    def check_subscription(self, msisdn, service_id):
        """Checks if a single MSISDN is subscribed to a service."""
        query = "SELECT msisdn FROM subscriptions WHERE msisdn = :msisdn AND service_id = :service_id AND status = 'ACTIVE'"
        res = self.execute_query(query, {"msisdn": msisdn, "service_id": service_id})
        return len(res) > 0

    def check_subscriptions_bulk(self, msisdns, service_id="PROMO"):
        """Checks which MSISDNs are subscribed in a single batch query."""
        if not msisdns:
            return []
        query = text("SELECT msisdn FROM subscriptions WHERE service_id = :service_id AND status = 'ACTIVE' AND msisdn IN :msisdns").bindparams(
            bindparam("msisdns", expanding=True)
        )
        res = self.execute_query(query, {"msisdns": list(msisdns), "service_id": service_id})
        return [row['msisdn'] for row in res]
