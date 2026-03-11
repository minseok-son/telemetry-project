package com.telemetry.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.telemetry.backend.entity.WindowSession;
import com.telemetry.backend.repository.SessionRepository;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    @Autowired private SessionRepository sessionRepository;

    @GetMapping("/today")
    public List<WindowSession> getTodaySession() {
        return sessionRepository.findAll();
    }
}
