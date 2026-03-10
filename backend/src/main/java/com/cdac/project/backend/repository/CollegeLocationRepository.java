package com.cdac.project.backend.repository;

import com.cdac.project.backend.entity.CollegeLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollegeLocationRepository extends JpaRepository<CollegeLocation, Long> {
}
