import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASS", "shan2001"),
        charset='utf8mb4'
    )
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS obd_promotions;")
    print("Database 'obd_promotions' created successfully.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
