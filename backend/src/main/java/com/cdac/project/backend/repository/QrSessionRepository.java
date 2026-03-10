package com.cdac.project.backend.repository;

import com.cdac.project.backend.entity.QrSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QrSessionRepository extends JpaRepository<QrSession, Long> {
    Optional<QrSession> findByToken(String token);

    @Query("SELECT s FROM QrSession s WHERE s.faculty.id = :facultyId ORDER BY s.createdAt DESC")
    List<QrSession> findByFacultyId(@Param("facultyId") Long facultyId);
}
