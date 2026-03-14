package com.telemetry.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.springframework.stereotype.Service;

import com.telemetry.backend.dto.WindowEventDto;
import com.telemetry.backend.entity.WindowSession;
import com.telemetry.backend.repository.WindowSessionRepository;

import jakarta.transaction.Transactional;

@Service
public class SessionService {
    private final WindowSessionRepository windowSessionRepository;

    public SessionService(WindowSessionRepository windowSessionRepository) {
        this.windowSessionRepository = windowSessionRepository;
    }
    // @Autowired private

    @Transactional
    public void handleWindowEvent(WindowEventDto dto) {
        Instant eventTime = Instant.ofEpochSecond((long) dto.timestamp());
        Optional<WindowSession> latestOpt = windowSessionRepository.findTopByOrderByStartTimeDesc();

        if (latestOpt.isPresent()) {
            WindowSession latest = latestOpt.get();

            // 1. HEARTBEAT: Same Window & Open Session
            if (latest.getWindowTitle().equals(dto.windowTitle())) {
                latest.setEndTime(eventTime);
                latest.setDurationSeconds(Duration.between(latest.getStartTime(), eventTime).getSeconds());
                windowSessionRepository.save(latest);
                return;
            }

            // 2. CONTEXT SWITCH: Close the old one if it's still open
            if (!(latest.getWindowTitle().equals(dto.windowTitle())) || latest.getEndTime() == null) {
                latest.setEndTime(eventTime);
                latest.setDurationSeconds(Duration.between(latest.getStartTime(), eventTime).getSeconds());
                windowSessionRepository.save(latest);
            }
        }

        // 3. START NEW SESSION
        WindowSession next = new WindowSession();
        next.setWindowTitle(dto.windowTitle());
        next.setStartTime(eventTime);
        // next.setCategory(mlService.classify(dto.window_title()));
        windowSessionRepository.save(next);
    }
}
