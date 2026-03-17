"""
VOIP Module for OBD Agent.
Enhanced for Virtual IVR Development Lab and real-world SIP integration.
Supports: Twilio, SIP (Asterisk/VM), and Virtual (Development).
"""
import time
import os
import re
import socket
from .logging_system import logger

# In-memory store for virtual developer lab
active_virtual_calls = {}

class VOIPModule:
    def __init__(self):
        # General Config
        self.mode = os.getenv("VOIP_MODE", "virtual").lower() # 'twilio', 'sip', or 'virtual'
        
        # Twilio Config
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        # SIP / VM Config (Asterisk AMI)
        self.sip_host = os.getenv("SIP_HOST")
        self.sip_port = int(os.getenv("SIP_PORT", 5038))
        self.sip_user = os.getenv("SIP_USER")
        self.sip_pass = os.getenv("SIP_PASS")
        self.sip_context = os.getenv("SIP_CONTEXT", "from-internal")
        
        self.client = None
        self.provider = "Unknown"

        if self.mode == "twilio" and self.account_sid and self.auth_token:
            from twilio.rest import Client
            try:
                self.client = Client(self.account_sid, self.auth_token)
                self.provider = "Twilio (Global)"
            except Exception as e:
                logger.log("backend", "error", f"Twilio Init Error: {str(e)}", "voip")
                self.mode = "virtual"
        
        elif self.mode == "sip":
            self.provider = f"SIP VM ({self.sip_host})"
            
        elif self.mode == "virtual":
            self.provider = "Outsmart Virtual Lab"

    def trigger_sip_call(self, msisdn: str, shortcode: str):
        """
        Triggers a call via Asterisk Manager Interface (AMI) on your VM.
        """
        try:
            # Simple AMI implementation via direct socket
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(5)
            s.connect((self.sip_host, self.sip_port))
            
            # Login
            s.send(f"Action: Login\r\nUsername: {self.sip_user}\r\nSecret: {self.sip_pass}\r\n\r\n".encode())
            response = s.recv(1024).decode()
            
            if "Success" not in response:
                return False, f"AMI Login Failed on VM: {response}"

            # Originate Call
            # Channel: PJSIP/trunk_name/msisdn OR Local/extension
            # For testing, we use a generic originate to a context
            originate = (
                f"Action: Originate\r\n"
                f"Channel: PJSIP/{msisdn}@my-trunk\r\n"
                f"Context: {self.sip_context}\r\n"
                f"Exten: {shortcode}\r\n"
                f"Priority: 1\r\n"
                f"CallerID: {shortcode}\r\n"
                f"Variable: msisdn={msisdn}\r\n"
                f"\r\n"
            )
            s.send(originate.encode())
            s.recv(1024)
            s.close()
            
            logger.log("backend", "success", f"SIP Originate sent to VM for {msisdn}", "voip")
            return True, f"SIP Call Triggered via VM ({self.sip_host})"
            
        except Exception as e:
            logger.log("backend", "error", f"SIP VM Error: {str(e)}", "voip")
            return False, f"Could not connect to VM SIP: {str(e)}"

    def trigger_call(self, msisdn: str, shortcode: str, script: str | None = None):
        """
        Main entry point for triggering calls based on env mode.
        """
        ivr_script = script or "Welcome to the Outsmart Global OBD Platform. This is a system test call."
        logger.log("backend", "info", f"Initiating {self.mode} call to {msisdn}", "voip")
        
        if self.mode == "virtual":
            call_id = f"vcall_{int(time.time())}"
            active_virtual_calls[call_id] = {
                "msisdn": msisdn,
                "shortcode": shortcode,
                "status": "ringing",
                "script": ivr_script
            }
            return True, f"VIRTUAL_CALL_INITIATED:{call_id}"

        elif self.mode == "sip":
            return self.trigger_sip_call(msisdn, shortcode)

        elif self.mode == "twilio":
            try:
                call = self.client.calls.create(
                    to=msisdn if msisdn.startswith('+') else f"+{msisdn}",
                    from_=self.from_number,
                    twiml=f'<Response><Say voice="alice">{ivr_script}</Say></Response>'
                )
                return True, f"Twilio Call Initiated: {call.sid}"
            except Exception as e:
                return False, f"Twilio Error: {str(e)}"

        return False, "Invalid VOIP mode configured."

# Singleton instance
voip_module = VOIPModule()
