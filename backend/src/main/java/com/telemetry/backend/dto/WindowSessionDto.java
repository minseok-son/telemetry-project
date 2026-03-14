package com.telemetry.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record WindowSessionDto(
    UUID id,
    String windowTitle,
    String category,
    String subCategory,
    Long durationSeconds,
    Instant startTime,
    Instant endTime
) {}