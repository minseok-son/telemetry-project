import pika
import time
import json
import threading

class RabbitMQClient:
    """Handles all communication with the OCI RabbitMQ instance"""
    def __init__(self, host, user, password, queue='telemetry_queue'):
        self.queue = queue
        credentials = pika.PlainCredentials(user, password)
        self.parameters = pika.ConnectionParameters(
            host = host,
            port = 5672,
            virtual_host='/',
            credentials=credentials,
            heartbeat=600,
        )
        self.connection = None
        self.channel = None
        self._lock = threading.Lock()
        self.connect()

    def connect(self):
        with self._lock:
            # 1. Check if it's genuinely healthy
            if self.connection and self.connection.is_open:
                return

        # 2. Cleanup: If a connection object exists, try to kill it properly
        if self.connection:
            try:
                # We use 'close' to ensure buffers are flushed and sockets released
                self.connection.close()
            except Exception:
                # If it's already dead, closing might throw an error. 
                # We don't care; we just want it gone.
                pass

        # 3. Fresh Start
        try: 
            self.connection = pika.BlockingConnection(self.parameters)
            self.channel = self.connection.channel()
            self.channel.queue_declare(queue=self.queue, durable=True)
        except Exception as e:
            # Reset to None so the next call knows we are still disconnected
            self.connection = None
    
    def send_telemetry(self, title):
        payload = {
            "timestamp": time.time(),
            "title": title,
        }

        # Use the lock so only one thread can talk to RabbitMQ at a time
        with self._lock:
            try:
                if not self.channel or self.channel.is_closed:
                    raise pika.exceptions.AMQPConnectionError("Not connected")

                self.channel.basic_publish(
                    exchange='',
                    routing_key=self.queue,
                    body=json.dumps(payload),
                    properties=pika.BasicProperties(delivery_mode=2)
                )
            except (pika.exceptions.AMQPConnectionError, pika.exceptions.AMQPChannelError):
                # We release the lock first by exiting the block, then reconnect
                pass 

        # Reconnect logic outside the main lock block to avoid nested lock issues
        if not self.connection or self.connection.is_closed:
            self.connect()
            # Recursive call to try sending again after reconnection
            self.send_telemetry(title)