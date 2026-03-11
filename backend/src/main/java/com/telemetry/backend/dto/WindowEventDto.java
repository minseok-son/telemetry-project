package com.telemetry.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WindowEventDto(
    @JsonProperty("window_title")
    String windowTitle, 

    double timestamp
) {}
