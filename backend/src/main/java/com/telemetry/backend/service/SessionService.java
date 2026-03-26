package com.telemetry.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.springframework.stereotype.Service;

import com.telemetry.backend.dto.WindowEventDto;
import com.telemetry.backend.entity.SessionStatus;
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

        // 1. Fetch the latest session regardless of title
        Optional<WindowSession> latestOpt = windowSessionRepository.findFirstByStatusOrderByStartTimeDesc(SessionStatus.OPEN);

        if (latestOpt.isPresent()) {
            WindowSession latest = latestOpt.get();

            // --- GAP DETECTION ---
            // If the gap between the last update and this new event is > 70s,
            // the previous session is "dead" (Network outage or Crash).
            boolean isGapTooLarge = Duration.between(latest.getEndTime(), eventTime).getSeconds() > 70;
            
            // 2. HEARTBEAT: Same Window, NO Gap
            if (latest.getTitle().equals(dto.title()) && !isGapTooLarge) {
                updateSessionDuration(latest, eventTime);
                return;
            }
            
            // 3. CONTEXT SWITCH
            if (!isGapTooLarge) {
                updateSessionDuration(latest, eventTime);
            }
        }
        
        // 4. START NEW SESSION (Unless the new event is "LOCKED")
        if (!"LOCKED".equals(dto.title())) {
            WindowClassification classification = classificationService.handleWindowEvent(dto);
            WindowSession next = new WindowSession();
            next.setTitle(dto.title());
            next.setStartTime(eventTime);
            next.setEndTime(eventTime);
            next.setClassification(classification);
            // next.setCategory(mlService.classify(dto.window_title()));
            windowSessionRepository.save(next);
        }
    }

    private void updateSessionDuration(WindowSession session, Instant endTime) {
        session.setEndTime(endTime);
        session.setDurationSeconds(Duration.between(session.getStartTime(), endTime).getSeconds());
        windowSessionRepository.save(session);
    }
}
