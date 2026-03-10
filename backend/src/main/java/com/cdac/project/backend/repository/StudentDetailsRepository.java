package com.cdac.project.backend.repository;

import com.cdac.project.backend.entity.StudentDetails;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentDetailsRepository extends JpaRepository<StudentDetails, Long> {
    boolean existsByEnrollmentNo(String enrollmentNo);
    
    org.springframework.data.domain.Page<StudentDetails> findByUserFullNameContainingIgnoreCaseOrEnrollmentNoContainingIgnoreCase(String fullName, String enrollmentNo, org.springframework.data.domain.Pageable pageable);
}
