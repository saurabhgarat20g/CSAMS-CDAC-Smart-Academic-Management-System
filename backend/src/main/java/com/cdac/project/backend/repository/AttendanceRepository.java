package com.cdac.project.backend.repository;

import com.cdac.project.backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    boolean existsByStudentIdAndQrSessionId(Long studentId, Long qrSessionId);
    List<Attendance> findByQrSessionId(Long qrSessionId);
}
