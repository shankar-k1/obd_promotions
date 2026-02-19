import pandas as pd
from sqlalchemy import text, bindparam
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

    def normalize_msisdn(self, msisdn):
        """Standardizes MSISDN by removing common prefixes for consistent matching."""
        if not msisdn: return ""
        m = str(msisdn).strip().replace(" ", "").replace("-", "").replace("+", "")
        # Strip Nigerian country code if present
        if m.startswith("234") and len(m) > 10:
            m = m[3:]
        # Strip leading zero
        if m.startswith("0") and len(m) > 9:
            m = m[1:]
        return m

    def scrub_dnd(self, msisdns):
        """Removes numbers present in the DND list (via Optimized Batch SQL)."""
        if not msisdns:
            return [], 0
            
        initial_count = len(msisdns)
        # 1. Normalize input for lookup
        norm_msisdns = [self.normalize_msisdn(m) for m in msisdns]
        
        # 2. Get matches and normalize THEM too
        raw_matches = self.db.check_dnd_bulk(norm_msisdns)
        dnd_matches = {self.normalize_msisdn(m) for m in raw_matches}
        
        # 3. Filter: keep original if its normalized form is NOT in matches
        cleaned = [m for m in msisdns if self.normalize_msisdn(m) not in dnd_matches]
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
        norm_msisdns = [self.normalize_msisdn(m) for m in msisdns]
        
        raw_matches = self.db.check_subscriptions_bulk(norm_msisdns, service_id)
        subscribed_matches = {self.normalize_msisdn(m) for m in raw_matches}
        
        cleaned = [m for m in msisdns if self.normalize_msisdn(m) not in subscribed_matches]
        return cleaned, initial_count - len(cleaned)

    def scrub_unsubscribed(self, msisdns):
        """Filters out MSISDNs who have unsubscribed recently."""
        if not msisdns:
            return [], 0
            
        initial_count = len(msisdns)
        norm_msisdns = [self.normalize_msisdn(m) for m in msisdns]
        
        query = text("SELECT msisdn FROM unsubscriptions WHERE msisdn IN :msisdns").bindparams(
            bindparam("msisdns", expanding=True)
        )
        unsub_res = self.db.execute_query(query, {"msisdns": norm_msisdns})
        unsub_matches = {self.normalize_msisdn(row['msisdn']) for row in unsub_res}
        
        cleaned = [m for m in msisdns if self.normalize_msisdn(m) not in unsub_matches]
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
