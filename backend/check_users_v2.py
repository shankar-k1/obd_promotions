from modules.database_module import DatabaseModule
from sqlalchemy import text
db = DatabaseModule()
if db.engine:
    with db.engine.connect() as conn:
        users = conn.execute(text("SELECT username FROM user_details")).all()
        print(f"User Details: {users}")
else:
    print("No DB Connection")
