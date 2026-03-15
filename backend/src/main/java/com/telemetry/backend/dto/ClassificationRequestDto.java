package com.telemetry.backend.dto;

public record ClassificationRequestDto (
    String title,
    String category, 
    String subCategory
) {}
