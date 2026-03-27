package com.telemetry.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.telemetry.backend.entity.SessionStatus;
import com.telemetry.backend.entity.TerminationReason;
import com.telemetry.backend.entity.WindowSession;
import com.telemetry.backend.repository.WindowSessionRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SessionCleanupTask {
    
    private final WindowSessionRepository windowSessionRepository;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void closeTimedOutSessions() { 
        // "Close" is more specific than "Cleanup"
        // 90s is 3 missed heartbeats; a safe threshold for 'stale'
        Instant heartbeatTimeout = Instant.now().minusSeconds(90);
        
        List<WindowSession> staleSessions = windowSessionRepository
            .findOpenSessionsOlderThan(heartbeatTimeout);

        for (WindowSession session : staleSessions) {
            // Explicitly move the state to CLOSED
            session.setStatus(SessionStatus.CLOSED);
            session.setTerminationReason(TerminationReason.TIMEOUT);
            
            // The last confirmed activity was the last DB update
            Instant lastActivity = session.getEndTime();
            session.setEndTime(lastActivity);
            
            long duration = Duration.between(session.getStartTime(), lastActivity).getSeconds();
            session.setDurationSeconds(duration);
            
            windowSessionRepository.save(session);
        }
    }
}
