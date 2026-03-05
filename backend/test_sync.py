"""Quick test - fetch latest email and save to new timestamped table."""
import sys
sys.path.insert(0, '.')

from agents.email_csv_agent import EmailCSVAgent

agent = EmailCSVAgent()
print("Running one-shot sync (no polling, just fetch latest)...")
result = agent._try_fetch_and_save()
if result:
    print(f"\n🎯 SUCCESS: Data saved to table '{result}'")
else:
    print("\n❌ No new data to sync (already processed or no email found).")

# Verify
from modules.database_module import DatabaseModule
db = DatabaseModule()
log = db.execute_query("SELECT * FROM email_sync_log ORDER BY synced_at DESC LIMIT 3")
print(f"\nSync Log: {log}")
