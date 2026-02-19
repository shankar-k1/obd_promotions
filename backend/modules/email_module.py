import os
import re
from imap_tools import MailBox, AND
from dotenv import load_dotenv

load_dotenv()

class EmailModule:
    def __init__(self):
        self.user = os.getenv("EMAIL_USER")
        self.password = os.getenv("EMAIL_PASS")
        self.host = os.getenv("EMAIL_HOST")

    def fetch_latest_obd_request(self):
        """
        Fetches the latest email matching OBD promotion request keywords.
        """
        with MailBox(self.host).login(self.user, self.password) as mailbox:
            for msg in mailbox.fetch(AND(all=True), limit=1, reverse=True):
                return {
                    "subject": msg.subject,
                    "from": msg.from_,
                    "body": msg.text,
                    "id": msg.uid
                }
        return None

    def extract_obd_details(self, body):
        """
        Extracts OBD base counts and conditions from email body using regex.
        """
        details: dict = {
            "total_base": 0,
            "conditions": []
        }
        
        # Look for patterns like "Total Base: 1,000,000" or "Base Count: 50000"
        base_match = re.search(r"(?:Total Base|Base Count|Total OBD Base)[:\s]+([\d,]+)", body, re.IGNORECASE)
        if base_match:
            try:
                details["total_base"] = int(base_match.group(1).replace(",", ""))
            except ValueError:
                details["total_base"] = 0

        # Look for conditions like "remove DND", "operator: MTN", etc.
        body_upper = body.upper()
        if "DND" in body_upper:
            details["conditions"].append("DND Scrubbing")
        
        operators = ["MTN", "Airtel", "Glo", "9mobile", "Vodafone", "Orange"]
        for op in operators:
            if op.upper() in body.upper():
                details["conditions"].append(f"Operator: {op}")
        
        return details

    def _send_email(self, subject, body, to_email):
        """Helper method to send an email via SMTP."""
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = os.getenv("SMTP_PORT", "587")

        msg = MIMEMultipart()
        msg['From'] = f"Outsmart OBD Agent <{smtp_user}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        try:
            with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"ERROR: Failed to send email: {e}")
            return False

    def send_scrub_report(self, report):
        """
        Sends a comprehensive scrubbing summary to the configured user.
        """
        final_count = report["stages"][-1]["count"] if report.get("stages") else 0
        
        subject = f"OBD Scrubbing Completed: {final_count} Final Targets"
        
        body = f"""
OBD Scrubbing Summary Report
---------------------------
Timestamp: {os.popen('date').read().strip()}

Summary Metrics:
- Initial Base Count: {report.get('initial_count', 0):,}
- DND Blocked: {report.get('dnd_removed', 0):,}
- Already Subscribed: {report.get('sub_removed', 0):,}
- Unsubscribed: {report.get('unsub_removed', 0):,}
- Operator Removals: {report.get('operator_removed', 0):,}

Final Clean Base: {final_count:,}

Status: Ready for Promotion.

Best regards,
Outsmart OBD Agent
        """
        
        return self._send_email(subject, body, self.user)

    def send_performance_reply(self, original_msg_id, stats):
        """
        Replies to the original email thread with performance statistics.
        """
        report_body = f"""
OBD Promotion Performance Report
-----------------------------
Total Base: {stats.get('total', 0)}
Success Rate: {stats.get('success_rate', '0%')}
Response Rate: {stats.get('response_rate', '0%')}
Average Handle Time: {stats.get('aht', '0s')}

The promotion was completed successfully.
        """
        
        return self._send_email("OBD Performance Report", report_body, self.user)
