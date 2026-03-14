package com.telemetry.backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.telemetry.backend.dto.WindowSessionDto;
import com.telemetry.backend.repository.WindowSessionRepository;

@RestController
@RequestMapping("/api/telemetry")
@CrossOrigin(origins= "http://localhost:5173")
public class TelemetryController {
    private final WindowSessionRepository windowSessionRepository;

    public TelemetryController(WindowSessionRepository windowSessionRepository) {
        this.windowSessionRepository = windowSessionRepository;
    }

    // Buggy
    @GetMapping("/bug/sessions")
    public List<WindowSessionDto> getBugAllSessions() {
        List<WindowSessionDto> sessions =  windowSessionRepository.findAll().stream()
            .map(s -> new WindowSessionDto(
                s.getId(), 
                s.getWindowTitle(), 
                s.getCategory(), 
                s.getSubCategory(), 
                s.getDurationSeconds(), 
                s.getStartTime(), 
                s.getEndTime()))
            .toList();
        return sessions;
    }

    // 1. GET ALL (For the Heatmap)
    @GetMapping("/sessions")
    public ResponseEntity<List<WindowSessionDto>> getAllSessions() {
        List<WindowSessionDto> sessions =  windowSessionRepository.findAll().stream()
            .map(s -> new WindowSessionDto(
                s.getId(), 
                s.getWindowTitle(), 
                s.getCategory(), 
                s.getSubCategory(), 
                s.getDurationSeconds(), 
                s.getStartTime(), 
                s.getEndTime()))
            .toList();
        return ResponseEntity.ok(sessions);
    }

    // 2. GET BY DATE (For the Drill-down Histogram)
    @GetMapping("/sessions/daily")
    public List<WindowSessionDto> getSessionsByDay(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return windowSessionRepository.findAllByDate(date).stream()
            .map(s -> new WindowSessionDto(
                s.getId(), 
                s.getWindowTitle(), 
                s.getCategory(), 
                s.getSubCategory(), 
                s.getDurationSeconds(), 
                s.getStartTime(), 
                s.getEndTime()))
            .toList();
    }
}
