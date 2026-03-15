package com.telemetry.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.springframework.stereotype.Service;

import com.telemetry.backend.dto.WindowEventDto;
import com.telemetry.backend.entity.WindowClassification;
import com.telemetry.backend.entity.WindowSession;
import com.telemetry.backend.repository.WindowSessionRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final WindowSessionRepository windowSessionRepository;
    private final ClassificationService classificationService;

    @Transactional
    public void handleWindowEvent(WindowEventDto dto) {
        Instant eventTime = Instant.ofEpochSecond((long) dto.timestamp());
        Optional<WindowSession> latestOpt = windowSessionRepository.findTopByOrderByStartTimeDesc();
        WindowClassification classification = classificationService.handleWindowEvent(dto);

        if (latestOpt.isPresent()) {
            WindowSession latest = latestOpt.get();

            // 1. HEARTBEAT: Same Window & Open Session
            if (latest.getTitle().equals(dto.title())) {
                updateSessionDuration(latest, eventTime);
                return;
            }

            // 2. CONTEXT SWITCH: Close the old one if it's still open
            updateSessionDuration(latest, eventTime);
        }

        // 3. START NEW SESSION
        WindowSession next = new WindowSession();
        next.setTitle(dto.title());
        next.setStartTime(eventTime);
        next.setClassification(classification);
        // next.setCategory(mlService.classify(dto.window_title()));
        windowSessionRepository.save(next);
    }

    private void updateSessionDuration(WindowSession session, Instant endTime) {
        session.setEndTime(endTime);
        session.setDurationSeconds(Duration.between(session.getStartTime(), endTime).getSeconds());
        windowSessionRepository.save(session);
    }
}
