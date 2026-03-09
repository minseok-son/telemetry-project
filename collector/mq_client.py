import pika
import time
import json

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
        self.connect()

    def connect(self):
        self.connection = pika.BlockingConnection(self.parameters)
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=self.queue, durable=True)
    
    def send_telemetry(self, title):
        payload = {
            "timestamp": time.time(),
            "window_title": title,
        }

        try:
            self.channel.basic_publish(
                exchange='',
                routing_key=self.queue,
                body=json.dumps(payload),
                properties=pika.BasicProperties(
                    delivery_mode=2
                )
            )
        except pika.exceptions.AMQPConnectionError:
            print("Connection lost. Reconnecting...")
            self.connect()
            self.send_telemetry(title)