package com.cdac.project.backend.repository;

import com.cdac.project.backend.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TimetableRepository extends JpaRepository<Timetable, Long> {
    List<Timetable> findByFacultyId(Long facultyId);
}
