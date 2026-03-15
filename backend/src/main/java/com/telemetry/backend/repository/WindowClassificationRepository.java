package com.telemetry.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.telemetry.backend.entity.WindowClassification;

@Repository
public interface WindowClassificationRepository extends JpaRepository<WindowClassification, UUID>{

    Optional<WindowClassification> findByTitle(@Param("title") String title);
}
