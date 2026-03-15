package com.telemetry.backend.dto;

public record UnlabeledSummaryDto(
    String title, 
    String category, 
    String subCategory, 
    Long totalDuration
) {}