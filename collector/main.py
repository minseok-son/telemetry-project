import ctypes
import ctypes.wintypes
import time
import logging
import os
from logging.handlers import RotatingFileHandler

from mq_client import RabbitMQClient
from tracker import WindowTracker

# --- CONFIGURATION ---
RABBIT_HOST = '164.152.21.149'
RECONNECT_DELAY = 5  # Seconds to wait before retrying connection

# --- LOGGING SETUP ---
def setup_logging():
    log_dir = os.path.join(os.path.dirname(__file__), "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "collector.log")

    handler = RotatingFileHandler(log_file, maxBytes=1*1024*1024, backupCount=5)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)
    return logger

# --- UTILITIES ---
def is_workstation_locked():
    """Returns True if the Windows desktop is locked."""
    h_desktop = ctypes.windll.user32.OpenInputDesktop(0, False, 0)
    if h_desktop:
        ctypes.windll.user32.CloseDesktop(h_desktop)
        return False
    return True

# --- CONFIGURATION ---
HEARTBEAT_INTERVAL = 30  # Send a heartbeat every 30 seconds
LOCK_CHECK_INTERVAL = 2.0

# --- CORE LOGIC ---
def run_collector():
    setup_logging()
    logging.info("Collector service started.")

    client = None
    tracker = None
    hook = None

    try:
        # 1. Persistent Connection Loop
        while True:
            try:
                logging.info(f"Connecting to RabbitMQ at {RABBIT_HOST}...")
                client = RabbitMQClient(host=RABBIT_HOST, user='guest', password='guest')
                logging.info("Connection established.")
                break 
            except Exception as e:
                logging.warning(f"Connection failed: {e}. Retrying in {RECONNECT_DELAY}s...")
                time.sleep(RECONNECT_DELAY)

        # 2. Setup Tracker & WinAPI Hook
        tracker = WindowTracker(client)
        tracker.start_polling_thread()

        WinEventProcType = ctypes.WINFUNCTYPE(
            None, ctypes.wintypes.HANDLE, ctypes.wintypes.DWORD, 
            ctypes.wintypes.HWND, ctypes.wintypes.LONG, 
            ctypes.wintypes.LONG, ctypes.wintypes.DWORD, ctypes.wintypes.DWORD
        )

        is_connected = True

        def win_event_callback(hWinEventHook, event, hwnd, idObject, idChild, dwEventThread, dwmsEventTime):
            nonlocal is_connected
            # Check if client connection is still healthy before processing
            try: 
                if client.connection and client.connection.is_open:
                    tracker.on_window_change(hwnd)
                else:
                    is_connected = False
            except Exception:
                is_connected = False

        callback_ptr = WinEventProcType(win_event_callback)
        hook = tracker.user32.SetWinEventHook(
            tracker.EVENT_SYSTEM_FOREGROUND, tracker.EVENT_SYSTEM_FOREGROUND, 
            0, callback_ptr, 0, 0, tracker.WINEVENT_OUTOFCONTEXT
        )

        # 3. Main Message Loop
        msg = ctypes.wintypes.MSG()
        last_lock_check = 0
        
        while True:
            current_time = time.time()

            # 1. Check for Heartbeat Timeout
            if current_time - tracker.last_send_time > HEARTBEAT_INTERVAL:
                current_hwnd = tracker.user32.GetForegroundWindow()
                tracker.on_window_change(current_hwnd, is_heartbeat=True)
            
            # --- LOCK CHECK ---
            if current_time - last_lock_check > LOCK_CHECK_INTERVAL:
                if is_workstation_locked():
                    logging.info("Lock detected. Sending final idle event and shutting down.")
                    client.send_telemetry("LOCKED")
                    # Optional: Send a specific 'LOCKED' event to Java before breaking
                    break
                last_lock_check = current_time

            # --- WINDOWS MESSAGE PUMP ---
            if tracker.user32.PeekMessageW(ctypes.byref(msg), 0, 0, 0, 0x0001):
                tracker.user32.TranslateMessage(ctypes.byref(msg))
                tracker.user32.DispatchMessageW(ctypes.byref(msg))
            
            time.sleep(0.1)
    except Exception as e:
        logging.error(f"Fatal crash: {e}", exc_info=True)
    finally:
        # 4. Final Cleanup
        if tracker and hook:
            logging.info("Unhooking WinEvent...")
            tracker.user32.UnhookWinEvent(hook)
        
        if client and client.connection and client.connection.is_open:
            logging.info("Closing RabbitMQ connection...")
            client.connection.close()
        
        logging.info("Collector stopped.")

if __name__ == "__main__":
    run_collector()