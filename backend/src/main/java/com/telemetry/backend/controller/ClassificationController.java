package com.telemetry.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.telemetry.backend.dto.ClassificationRequestDto;
import com.telemetry.backend.dto.UnlabeledSummaryDto;
import com.telemetry.backend.repository.WindowSessionRepository;
import com.telemetry.backend.service.ClassificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/classifications")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ClassificationController {
    
    private final WindowSessionRepository windowSessionRepository;
    private final ClassificationService classificationService;

    @GetMapping("/unlabeled")
    public ResponseEntity<List<UnlabeledSummaryDto>> getUnlabeled() {
        return ResponseEntity.ok(windowSessionRepository.findMostFrequentUnlabeledSummary());
    }

    @PutMapping
    public ResponseEntity<Void> saveClassification(@RequestBody ClassificationRequestDto dto) {
        classificationService.updateClassificationAndSessions(dto);
        
        return ResponseEntity.noContent().build();
    }
}
