package com.cdac.project.backend.repository;

import com.cdac.project.backend.entity.AcademicRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicRecordRepository extends JpaRepository<AcademicRecord, Long> {
    Optional<AcademicRecord> findByPrn(String prn);
    List<AcademicRecord> findAllByOrderByPercentageDesc();
}
