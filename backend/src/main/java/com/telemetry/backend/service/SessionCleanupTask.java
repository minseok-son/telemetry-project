package com.telemetry.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.telemetry.backend.entity.WindowSession;
import com.telemetry.backend.repository.WindowSessionRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SessionCleanupTask {
    
    private final WindowSessionRepository windowSessionRepository;

    @Scheduled(fixedDelay = 60000) // Runs every 60 seconds
    @Transactional
    public void cleanupStaleSessions() {
        // Anything not updated in the last 65 seconds (giving a 5s buffer) is stale
        Instant cutoff = Instant.now().minusSeconds(65);
        
        List<WindowSession> staleSessions = windowSessionRepository
            .findStaleSessions(cutoff);

        for (WindowSession session : staleSessions) {
            // Use the updatedAt timestamp as the actual endTime 
            // since it represents the last moment the producer was confirmed active.
            session.setEndTime(session.getUpdatedAt());
            
            long duration = Duration.between(session.getStartTime(), session.getUpdatedAt()).getSeconds();
            session.setDurationSeconds(duration);
            
            windowSessionRepository.save(session);
        }
    }
}
