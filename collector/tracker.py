import ctypes
import threading
import time
import logging

class WindowTracker:
    """Handles Windows API hooks and filtering of window events."""
    def __init__(self, mq_client):
        self.mq_client = mq_client
        self.last_title = None
        self.user32 = ctypes.windll.user32
        self.ignored_titles = {"Task Switching", "Task View", "Search", ""}
        self.last_send_time = 0

        self.EVENT_SYSTEM_FOREGROUND = 0x003
        self.WINEVENT_OUTOFCONTEXT = 0x000

    def is_valid_title(self, title):
        """Filters out 'noise' like Alt-Tab overlays or empty strings."""
        if not title or title.strip() in self.ignored_titles:
            return False
        return True

    def get_active_window_title(self, hwnd):
        length = self.user32.GetWindowTextLengthW(hwnd)
        buff = ctypes.create_unicode_buffer(length + 1)
        self.user32.GetWindowTextW(hwnd, buff, length + 1)
        return buff.value

    def on_window_change(self, hwnd, is_heartbeat=False):
        new_title = self.get_active_window_title(hwnd)
        
        if not self.is_valid_title(new_title):
            return

        if new_title != self.last_title or is_heartbeat:
            label = "[HEARTBEAT]" if is_heartbeat and new_title == self.last_title else "[CHANGE]"
            logging.info(f"{label} Sending to MQ: {new_title}")
            self.mq_client.send_telemetry(new_title)
            self.last_title = new_title
            self.last_send_time = time.time()
    
    def start_polling_thread(self):
        def loop():
            while True:
                hwnd = self.user32.GetForegroundWindow()
                self.on_window_change(hwnd)
                time.sleep(1) # Check for internal tab/file changes every second
        
        thread = threading.Thread(target=loop, daemon=True)
        thread.start()