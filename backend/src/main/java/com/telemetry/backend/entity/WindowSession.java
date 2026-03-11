package com.telemetry.backend.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "window_session",
    indexes = {
        @Index(name = "idx_window_category", columnList = "category")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WindowSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String windowTitle;
    private String category;
    private String subCategory;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long durationSeconds;
}
