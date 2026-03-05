from modules.database_module import DatabaseModule
db = DatabaseModule()
results = db.execute_query("SELECT * FROM email_sync_log;")
print(f"Sync Log Count: {len(results)}")
for r in results:
    print(r)

sourced = db.execute_query("SELECT COUNT(*) as count FROM email_sourced_targets;")
print(f"Total Sourced Targets: {sourced[0]['count']}")
