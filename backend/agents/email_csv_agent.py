import os
import io
import time
import pandas as pd
from modules.email_module import EmailModule
from modules.database_module import DatabaseModule
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

class EmailCSVAgent:
    """
    Agent that polls for the latest OBD Scrubbing email with a CSV attachment,
    and saves the data into a NEW timestamped table in Supabase each time.
    
    Designed to be triggered AFTER scrubbing completes.
    """
    def __init__(self):
        self.email_module = EmailModule()
        self.db_module = DatabaseModule()

    def wait_and_sync(self, poll_interval=30, max_wait=600):
        """
        Polls for a new email with CSV attachment for up to max_wait seconds.
        Once found, saves data to a new timestamped table.
        
        Args:
            poll_interval: seconds between each check (default: 30s)
            max_wait: total seconds to keep checking (default: 600s = 10 mins)
        """
        print(f"📧 Email CSV Agent: Waiting for new scrub report email (max {max_wait}s, checking every {poll_interval}s)...")
        
        start_time = time.time()
        attempt = 0
        
        while (time.time() - start_time) < max_wait:
            attempt += 1
            elapsed = int(time.time() - start_time)
            print(f"📧 Poll attempt {attempt} ({elapsed}s / {max_wait}s)...")
            
            try:
                result = self._try_fetch_and_save()
                if result:
                    return result  # Success! Return the table name
            except Exception as e:
                print(f"⚠️ Poll error: {e}")
            
            time.sleep(poll_interval)
        
        print("⏰ Email CSV Agent: Timeout. No new email found within the wait period.")
        return None

    def _try_fetch_and_save(self):
        """
        Attempts to fetch the latest email CSV and save it.
        Returns the table name if successful, None otherwise.
        """
        # Fetch only the LATEST email with matching subject
        csvs = self.email_module.fetch_csv_attachments(
            subject_filter="OBD Scrubbing Completed",
            limit=1
        )
        
        if not csvs:
            print("  No matching email with CSV found yet.")
            return None
        
        att = csvs[0]
        uid = att['uid']
        
        # Check if this UID was already processed
        already = self.db_module.execute_query(
            "SELECT 1 FROM email_sync_log WHERE email_uid = :uid",
            {"uid": str(uid)}
        )
        if already:
            print(f"  Email UID {uid} already processed. Waiting for a newer one...")
            return None
        
        # Parse the CSV
        print(f"📄 New CSV found: '{att['filename']}' from '{att['subject']}'")
        try:
            df = pd.read_csv(io.StringIO(att['content']))
            
            # Find MSISDN column
            msisdn_col = None
            for col in df.columns:
                if 'msisdn' in col.lower() or 'phone' in col.lower() or 'number' in col.lower():
                    msisdn_col = col
                    break
            if msisdn_col is None:
                msisdn_col = df.columns[0]
            
            msisdns = df[msisdn_col].dropna().astype(str).tolist()
            print(f"  Extracted {len(msisdns)} MSISDNs from column '{msisdn_col}'")
        except Exception as e:
            print(f"❌ CSV parse error: {e}")
            return None
        
        # Save to a NEW timestamped table
        success, table_name = self.db_module.save_email_csv_to_new_table(
            uid=str(uid),
            filename=att['filename'],
            msisdns=msisdns
        )
        
        if success:
            print(f"✅ SUCCESS: {len(msisdns)} targets saved to table '{table_name}'")
            return table_name
        else:
            print(f"❌ DB Error: {table_name}")
            return None

if __name__ == "__main__":
    agent = EmailCSVAgent()
    result = agent.wait_and_sync()
    if result:
        print(f"\n🎯 Final Result: Data saved to table '{result}'")
    else:
        print("\n❌ No data was synced.")
