package com.telemetry.backend.entity;

public enum TerminationReason {
    CONTEXT_SWITCH, // User moved to a different window
    LOCKED,         // User manually locked the workstation
    TIMEOUT,        // Janitor closed it because of silence
    GAP_RECOVERY    // New event arrived after a long silence (Self-healing)
}
