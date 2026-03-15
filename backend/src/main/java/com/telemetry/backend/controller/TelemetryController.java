package com.telemetry.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.telemetry.backend.dto.WindowSessionDto;
import com.telemetry.backend.repository.WindowSessionRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/telemetry")
@CrossOrigin(origins= "http://localhost:5173")
@RequiredArgsConstructor
public class TelemetryController {
    private final WindowSessionRepository windowSessionRepository;

    // 1. GET ALL (For the Heatmap)
    @GetMapping("/sessions")
    public ResponseEntity<List<WindowSessionDto>> getAllSessions() {
        List<WindowSessionDto> sessions =  windowSessionRepository.findAll().stream()
            .map(s -> new WindowSessionDto(
                s.getId(), 
                s.getTitle(), 
                s.getCategory(), 
                s.getSubCategory(), 
                s.getDurationSeconds(), 
                s.getStartTime(), 
                s.getEndTime()))
            .toList();
        return ResponseEntity.ok(sessions);
    }
}
