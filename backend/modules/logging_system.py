"""
Centralized Logging System for OBD Agent.
Captures logs across Backend, Database, Email, and Frontend categories.
Stores logs in-memory with a rolling buffer for real-time dashboard access.
"""
import time
from datetime import datetime
from collections import deque
from threading import Lock

class LogEntry:
    def __init__(self, category: str, level: str, message: str, source: str = ""):
        self.id = int(time.time() * 1000)
        self.timestamp = datetime.now().isoformat()
        self.category = category  # backend, database, email, frontend
        self.level = level        # info, warn, error, success, debug
        self.message = message
        self.source = source
    
    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "category": self.category,
            "level": self.level,
            "message": self.message,
            "source": self.source
        }

class LoggingSystem:
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.max_logs = 500  # Keep last 500 logs per category
        self.logs = {
            "backend": deque(maxlen=self.max_logs),
            "database": deque(maxlen=self.max_logs),
            "email": deque(maxlen=self.max_logs),
            "frontend": deque(maxlen=self.max_logs),
        }
        self._lock = Lock()
    
    def log(self, category: str, level: str, message: str, source: str = ""):
        entry = LogEntry(category, level, message, source)
        with self._lock:
            if category in self.logs:
                self.logs[category].append(entry)
            else:
                self.logs[category] = deque(maxlen=self.max_logs)
                self.logs[category].append(entry)
        # Also print to console for debugging
        icon = {"info": "ℹ️", "warn": "⚠️", "error": "❌", "success": "✅", "debug": "🔍"}.get(level, "📝")
        print(f"{icon} [{category.upper()}] {message}")
    
    def get_logs(self, category: str = None, since_id: int = 0):
        with self._lock:
            if category and category in self.logs:
                entries = list(self.logs[category])
            else:
                entries = []
                for cat_logs in self.logs.values():
                    entries.extend(list(cat_logs))
                entries.sort(key=lambda x: x.id)
            
            # Filter by since_id for polling
            if since_id > 0:
                entries = [e for e in entries if e.id > since_id]
            
            return [e.to_dict() for e in entries]
    
    def get_stats(self):
        with self._lock:
            stats = {}
            for cat, logs in self.logs.items():
                log_list = list(logs)
                stats[cat] = {
                    "total": len(log_list),
                    "errors": sum(1 for l in log_list if l.level == "error"),
                    "warnings": sum(1 for l in log_list if l.level == "warn"),
                    "last_activity": log_list[-1].timestamp if log_list else None
                }
            return stats
    
    def clear(self, category: str = None):
        with self._lock:
            if category and category in self.logs:
                self.logs[category].clear()
            else:
                for cat in self.logs:
                    self.logs[cat].clear()

# Singleton instance
logger = LoggingSystem()
