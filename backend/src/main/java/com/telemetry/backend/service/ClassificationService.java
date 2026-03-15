package com.telemetry.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.telemetry.backend.dto.ClassificationRequestDto;
import com.telemetry.backend.dto.WindowEventDto;
import com.telemetry.backend.entity.WindowClassification;
import com.telemetry.backend.repository.WindowClassificationRepository;
import com.telemetry.backend.repository.WindowSessionRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClassificationService {

    private final WindowClassificationRepository windowClassificationRepository;
    private final WindowSessionRepository windowSessionRepository;

    @Transactional
    public WindowClassification handleWindowEvent(WindowEventDto dto) {
       return windowClassificationRepository.findByTitle(dto.title())
        .orElseGet(() -> {
            // This runs ONLY if the record was NOT found
            WindowClassification classification = new WindowClassification();
            classification.setTitle(dto.title());
            classification.setManualLabel(false);
            return windowClassificationRepository.save(classification);
        });
    }
    
    @Transactional
    public void updateClassificationAndSessions(ClassificationRequestDto dto) {
        WindowClassification classification = windowClassificationRepository.findByTitle(dto.title())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classification not found"));

        classification.setCategory(dto.category());
        classification.setSubCategory(dto.subCategory());
        classification.setManualLabel(true);
        windowClassificationRepository.save(classification);

        windowSessionRepository.updateAllCategoryAndSubCategoryByTitle(
            dto.category(),
            dto.subCategory(),
            classification,
            dto.title()
        );
    }
}
