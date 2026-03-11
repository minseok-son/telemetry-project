package com.telemetry.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.telemetry.backend.dto.WindowEventDto;
import com.telemetry.backend.entity.WindowSession;
import com.telemetry.backend.repository.SessionRepository;

import jakarta.transaction.Transactional;

@Service
public class SessionService {
    @Autowired private SessionRepository sessionRepository;
    // @Autowired private

    @Transactional
    public void handleWindowEvent(WindowEventDto dto) {
        LocalDateTime eventTime = LocalDateTime.ofInstant(Instant.ofEpochSecond((long) dto.timestamp()), ZoneId.systemDefault());
        Optional<WindowSession> latestOpt = sessionRepository.findTopByOrderByStartTimeDesc();

        if (latestOpt.isPresent()) {
            WindowSession latest = latestOpt.get();

            // 1. TERMINAL SIGNAL: Handle the Lock
            if (dto.windowTitle().equals("LOCKED")) {
                latest.setEndTime(eventTime);
                latest.setDurationSeconds(Duration.between(latest.getStartTime(), eventTime).getSeconds());
                sessionRepository.save(latest);
                return;
            }

            // 2. HEARTBEAT: Same Window & Open Session
            if (latest.getWindowTitle().equals(dto.windowTitle())) {
                latest.setEndTime(eventTime);
                latest.setDurationSeconds(Duration.between(latest.getStartTime(), eventTime).getSeconds());
                sessionRepository.save(latest);
                return;
            }

            // 3. CONTEXT SWITCH: Close the old one if it's still open
            if (!(latest.getWindowTitle().trim().equalsIgnoreCase(dto.windowTitle().trim())) || latest.getEndTime() == null) {
                latest.setEndTime(eventTime);
                latest.setDurationSeconds(Duration.between(latest.getStartTime(), eventTime).getSeconds());
                sessionRepository.save(latest);
            }
        }

        // 4. START NEW SESSION
        WindowSession next = new WindowSession();
        next.setWindowTitle(dto.windowTitle());
        next.setStartTime(eventTime);
        // next.setCategory(mlService.classify(dto.window_title()));
        sessionRepository.save(next);
    }
}
