package com.telemetry.backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.telemetry.backend.dto.UnlabeledSummaryDto;
import com.telemetry.backend.entity.WindowClassification;
import com.telemetry.backend.entity.WindowSession;

@Repository
public interface WindowSessionRepository extends JpaRepository<WindowSession, UUID> {
    Optional<WindowSession> findTopByOrderByStartTimeDesc();

    // For the Heatmap (get everything for the year)
    List<WindowSession> findByStartTimeAfter(Instant since);

    // For the Histogram (get everything for one specific day)
    @Query("SELECT s FROM WindowSession s WHERE CAST(s.startTime AS date) = :date")
    List<WindowSession> findAllByDate(@Param("date") Instant date);

    @Query(
        "SELECT new com.telemetry.backend.dto.UnlabeledSummaryDto(" +
        "s.title, MAX(s.category), MAX(s.subCategory), SUM(s.durationSeconds)) " +
       "FROM WindowSession s JOIN s.classification c " +
       "WHERE c.isManualLabel = false " +
       "GROUP BY s.title " +
       "ORDER BY SUM(s.durationSeconds) DESC"
    )
    List<UnlabeledSummaryDto> findMostFrequentUnlabeledSummary();


    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE WindowSession s 
        SET s.category = :category, 
            s.subCategory = :subCategory, 
            s.classification = :classification 
        WHERE s.title = :title
        """)
    void updateAllCategoryAndSubCategoryByTitle(
        @Param("category") String category,
        @Param("subCategory") String subCategory,
        @Param("classification") WindowClassification classification,
        @Param("title") String title
    );
}
