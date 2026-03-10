package com.cdac.project.backend.dto;

import lombok.Data;
import com.cdac.project.backend.entity.Attendance;
import java.time.LocalDateTime;

@Data
public class AttendanceDTO {
    private Long id;
    private StudentDTO student;
    private Long sessionId;
    private String subjectName;
    private String status;
    private LocalDateTime markedAt;

    public static AttendanceDTO fromEntity(Attendance attendance) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(attendance.getId());
        // Note: Creating StudentDTO here might require fetching student details. 
        // For simplicity in lists, we might want a lighter object or rely on mapping service logic.
        // But for consistency let's set what we can, or let the service handle complex hydration.
        // Here we assume student is eagerly fetched or available.
        // We will need to hande StudentDetails separately if not available directly from User entity in Attendance.
        // Actually Attendance has User student. To get StudentDTO we need StudentDetails.
        // So we might need to handle this in service. For now, let's just return basic User info if full StudentDTO is hard.
        // BUT the requirement is to check StudentDetails. 
        // Let's defer strict StudentDTO creation to Service where we can join/fetch details.
        // Or simpler: Just return student name and enrollment if available. 
        // Attendance -> User -> (maybe) StudentDetails
        // Let's keep it simple: Student Name + ID
        
        dto.setSessionId(attendance.getQrSession().getId());
        dto.setSubjectName(attendance.getQrSession().getSubject().getName());
        dto.setStatus(attendance.getStatus());
        dto.setMarkedAt(attendance.getMarkedAt());
        return dto;
    }
    
    // Helper to set student info manually
    public void setStudentInfo(com.cdac.project.backend.entity.StudentDetails studentDetails) {
        this.student = StudentDTO.fromEntity(studentDetails);
    }
}
