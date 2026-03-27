package com.telemetry.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.springframework.stereotype.Service;

import com.telemetry.backend.dto.WindowEventDto;
import com.telemetry.backend.entity.SessionStatus;
import com.telemetry.backend.entity.TerminationReason;
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
        Optional<WindowSession> latestOpt = windowSessionRepository.findFirstByStatusOrderByStartTimeDesc(SessionStatus.OPEN);

        if (latestOpt.isPresent()) {
            WindowSession latest = latestOpt.get();

            boolean isGapTooLarge = Duration.between(latest.getEndTime(), eventTime).getSeconds() > 70;
            
            // SCENARIO A: HEARTBEAT (Same window, no gap)
            if (latest.getTitle().equals(dto.title()) && !isGapTooLarge) {
                updateSessionDuration(latest, eventTime);
                return;
            }
            
            // SCENARIO B: CONTEXT SWITCH or GAP or LOCK
            // We MUST close the old session now so the Janitor ignores it.
            latest.setStatus(SessionStatus.CLOSED);

            if (isGapTooLarge) {
                latest.setTerminationReason(TerminationReason.GAP_RECOVERY);
            } else {
                updateSessionDuration(latest, eventTime);
                latest.setTerminationReason("LOCKED".equals(dto.title()) ? 
                    TerminationReason.LOCKED : TerminationReason.CONTEXT_SWITCH);
            }
            
            windowSessionRepository.save(latest);
        }
        
        // SCENARIO C: START NEW (Unless Locked)
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
