package com.cdac.project.backend.repository;

import com.cdac.project.backend.entity.FacultyDetails;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacultyDetailsRepository extends JpaRepository<FacultyDetails, Long> {
    org.springframework.data.domain.Page<FacultyDetails> findByUserFullNameContainingIgnoreCase(String fullName, org.springframework.data.domain.Pageable pageable);
}
