from mq_client import RabbitMQClient
from tracker import WindowTracker
import ctypes
import ctypes.wintypes
import time
import logging
from logging.handlers import RotatingFileHandler
import os
import signal
import sys

def graceful_shutdown(signum, frame):
    logging.info(f"Received signal {signum}. Shutting down gracefully...")
    # This will trigger the 'finally' block by exiting the while loop
    sys.exit(0)

def is_workstation_locked():
    # Attempt to open the input desktop. 
    # If it fails, the workstation is likely locked.
    h_desktop = ctypes.windll.user32.OpenInputDesktop(0, False, 0)
    if h_desktop:
        ctypes.windll.user32.CloseDesktop(h_desktop)
        return False
    return True

signal.signal(signal.SIGINT, graceful_shutdown)
signal.signal(signal.SIGTERM, graceful_shutdown)

# 1. Setup paths
log_dir = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "collector.log")

# 2. Configure Rotating Handler
# maxBytes=1024 * 1024 (1 Megabyte)
# backupCount=5 (Keep 5 old log files before overwriting)
handler = RotatingFileHandler(log_file, maxBytes=1*1024*1024, backupCount=5)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

# 3. Setup the Logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(handler)

logging.info("Collector service started with Log Rotation.")

# 1. Setup the Network Client
client = RabbitMQClient(host='164.152.21.149', user='guest', password='guest')

# 2. Setup the Tracker
tracker = WindowTracker(client)
tracker.start_polling_thread()

# 3. Define the Callback for Windows
def win_event_callback(hWinEventHook, event, hwnd, idObject, idChild, dwEventThread, dwmsEventTime):
    tracker.on_window_change(hwnd)

# WinAPI Hook Setup
WinEventProcType = ctypes.WINFUNCTYPE(None, ctypes.wintypes.HANDLE, ctypes.wintypes.DWORD, 
                                     ctypes.wintypes.HWND, ctypes.wintypes.LONG, 
                                     ctypes.wintypes.LONG, ctypes.wintypes.DWORD, 
                                     ctypes.wintypes.DWORD)

callback_ptr = WinEventProcType(win_event_callback)
hook = tracker.user32.SetWinEventHook(
    tracker.EVENT_SYSTEM_FOREGROUND, tracker.EVENT_SYSTEM_FOREGROUND, 
    0, callback_ptr, 0, 0, tracker.WINEVENT_OUTOFCONTEXT
)

try:
    msg = ctypes.wintypes.MSG()
    last_lock_check = 0
    while True:
        current_time = time.time()
        if current_time - last_lock_check > 1.0:
            if is_workstation_locked():
                logging.info("Lock detected. Cleaning up and exiting.")
                sys.exit(0) # Triggers your 'finally' block for a clean exit
            last_lock_check = current_time
        if tracker.user32.PeekMessageW(ctypes.byref(msg), 0, 0, 0, 0x0001):
            tracker.user32.TranslateMessage(ctypes.byref(msg))
            tracker.user32.DispatchMessageW(ctypes.byref(msg))
        time.sleep(0.01)

except SystemExit:
    # This is triggered by sys.exit(0) in our signal handler
    logging.info("SystemExit caught. Cleaning up...")
except Exception as e:
    # Catch any network-related crashes during shutdown
    logging.error(f"Unexpected crash: {e}", exc_info=True)
finally:
    logging.info("Executing final cleanup (Unhooking WinEvent)...")
    tracker.user32.UnhookWinEvent(hook)
    # Ensure RabbitMQ connection is closed if it's still alive
    try:
        if client and client.connection and client.connection.is_open:
            client.connection.close()
    except:
        pass 
    logging.info("Collector stopped.")