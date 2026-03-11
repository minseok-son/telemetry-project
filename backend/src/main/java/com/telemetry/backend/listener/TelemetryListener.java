package com.telemetry.backend.listener;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.telemetry.backend.dto.WindowEventDto;
import com.telemetry.backend.service.SessionService;

@Component
public class TelemetryListener {
    @Autowired private SessionService sessionService;

    @RabbitListener(queues = "telemetry_queue")
    public void receive(WindowEventDto message) {
        sessionService.handleWindowEvent(message);
    }
}