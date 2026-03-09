from mq_client import RabbitMQClient
from tracker import WindowTracker
import ctypes
import ctypes.wintypes
import time

# 1. Setup the Network Client
client = RabbitMQClient(host='164.152.21.149', user='admin', password='password')

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

print("Tracking started. Press Ctrl+C to stop.")

# 4. Message Loop
try:
    msg = ctypes.wintypes.MSG()
    while True:
        if tracker.user32.PeekMessageW(ctypes.byref(msg), 0, 0, 0, 0x0001):
            tracker.user32.TranslateMessage(ctypes.byref(msg))
            tracker.user32.DispatchMessageW(ctypes.byref(msg))
        time.sleep(0.01)
except KeyboardInterrupt:
    print("\nCleaning up...")
finally:
    tracker.user32.UnhookWinEvent(hook)