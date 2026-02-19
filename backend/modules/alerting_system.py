import logging

class AlertingSystem:
    def __init__(self):
        self.thresholds = {
            "success_rate_min": 0.30,
            "response_rate_min": 0.10,
            "unsub_rate_max": 0.05
        }
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("OBDAlerts")

    def check_promotion_health(self, stats):
        """
        Monitors OBD stats and triggers alerts if performance drops.
        """
        alerts = []
        
        success_rate = stats.get("success_rate", 0)
        if success_rate < self.thresholds["success_rate_min"]:
            alerts.append(f"CRITICAL: Success rate dropped to {success_rate*100}%")

        unsub_rate = stats.get("unsub_rate", 0)
        if unsub_rate > self.thresholds["unsub_rate_max"]:
            alerts.append(f"WARNING: High Unsubscription Rate: {unsub_rate*100}%")

        if alerts:
            for alert in alerts:
                self.logger.warning(f"ALERT TRIGGERED: {alert}")
            return alerts
        
        return ["Health Check: OK"]

    def trigger_interruption_alert(self, reason):
        """Triggers an alert if the entire promotion is disturbed."""
        msg = f"EMERGENCY: OBD Promotion Disturbed! Reason: {reason}"
        self.logger.error(msg)
        return msg
