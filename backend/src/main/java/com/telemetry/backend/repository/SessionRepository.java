package com.telemetry.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.telemetry.backend.entity.WindowSession;

public interface SessionRepository extends JpaRepository<WindowSession, UUID> {
    Optional<WindowSession> findTopByOrderByStartTimeDesc();
}
