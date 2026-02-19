import pandas as pd
from .database_module import DatabaseModule

class ScrubbingEngine:
    def __init__(self):
        self.db = DatabaseModule()
        self.operator_series = {
            "MTN": ["0803", "0806", "0703", "0706", "0810", "0813", "0814", "0816", "0903", "0906"],
            "Airtel": ["0802", "0808", "0701", "0708", "0812", "0902", "0901", "0907"],
            "Glo": ["0805", "0807", "0705", "0811", "0815", "0905"],
            "9mobile": ["0809", "0817", "0818", "0909", "0809"]
        }
        self.subscription_data = {} # MSISDN: Status

    def scrub_dnd(self, msisdns):
        """Removes numbers present in the DND list (via Optimized Batch SQL)."""
        if not msisdns:
            return [], 0
            
        initial_count = len(msisdns)
        # 1. Get all matches from DB in one go
        dnd_matches = set(self.db.check_dnd_bulk(msisdns))
        
        # 2. Filter the original list
        cleaned = [m for m in msisdns if m not in dnd_matches]
        return cleaned, initial_count - len(cleaned)

    def scrub_by_operator(self, msisdns, operator_name):
        """Filters numbers that belong to a specific operator series."""
        if operator_name not in self.operator_series:
            return msisdns, 0
        
        allowed_prefixes = self.operator_series[operator_name]
        initial_count = len(msisdns)
        cleaned = [m for m in msisdns if any(m.startswith(p) for p in allowed_prefixes)]
        return cleaned, initial_count - len(cleaned)

    def scrub_subscriptions(self, msisdns, service_id="PROMO"):
        """Filters out MSISDNs that are already subscribed (Optimized Bulk)."""
        if not msisdns:
            return [], 0
            
        initial_count = len(msisdns)
        subscribed = set(self.db.check_subscriptions_bulk(msisdns, service_id))
        cleaned = [m for m in msisdns if m not in subscribed]
        return cleaned, initial_count - len(cleaned)

    def scrub_unsubscribed(self, msisdns):
        """Filters out MSISDNs who have unsubscribed recently (Mocked SQL)."""
        initial_count = len(msisdns)
        # Mocking unsubscription logic hit to DB
        # query = "SELECT msisdn FROM unsubscriptions WHERE ..."
        cleaned = msisdns 
        return cleaned, initial_count - len(cleaned)

    def perform_full_scrub(self, msisdns, target_operator=None, options=None):
        """
        Executes the full scrubbing pipeline based on toggled options.
        """
        options = options or {"dnd": True, "sub": True, "unsub": True, "operator": True}
        # 1. Initial State
        report = {
            "initial_count": len(msisdns),
            "dnd_removed": 0,
            "operator_removed": 0,
            "sub_removed": 0,
            "unsub_removed": 0,
            "stages": []
        }
        report["stages"].append({"stage": "Total Base", "count": len(msisdns), "removed": 0})
        
        current_base = msisdns
        
        # 2. DND Scrubbing
        if options.get("dnd"):
            current_base, removed = self.scrub_dnd(current_base)
            report["dnd_removed"] = removed
            report["stages"].append({"stage": "After DND", "count": len(current_base), "removed": removed})
        
        # 3. Operator Scrubbing
        if options.get("operator") and target_operator:
            current_base, removed = self.scrub_by_operator(current_base, target_operator)
            report["operator_removed"] = removed
            report["stages"].append({"stage": f"After {target_operator} Scrubbing", "count": len(current_base), "removed": removed})
            
        # 4. Subscription Scrubbing
        if options.get("sub"):
            current_base, removed = self.scrub_subscriptions(current_base)
            report["sub_removed"] = removed
            report["stages"].append({"stage": "After Subscription Check", "count": len(current_base), "removed": removed})

        # 5. Unsubscription Scrubbing
        if options.get("unsub"):
            current_base, removed = self.scrub_unsubscribed(current_base)
            report["unsub_removed"] = removed
            report["stages"].append({"stage": "Final (After Unsub Check)", "count": len(current_base), "removed": removed})
        
        return current_base, report
