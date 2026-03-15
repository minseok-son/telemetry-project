package com.telemetry.backend.listener;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.telemetry.backend.dto.WindowEventDto;
import com.telemetry.backend.service.SessionService;

@Component
public class TelemetryListener {
    private final SessionService sessionService;

    public TelemetryListener(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @RabbitListener(queues = "telemetry_queue")
    public void receive(WindowEventDto message) {
        sessionService.handleWindowEvent(message);
    }
}