package com.cdac.project.backend.dto;

import lombok.Data;
import com.cdac.project.backend.entity.QrSession;
import java.time.LocalDateTime;

@Data
public class SessionDTO {
    private Long id;
    private SubjectDTO subject; // For UI compatibility
    private UserDTO faculty;   // For UI compatibility
    private String subjectName;
    private String subjectCode;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean active;
    private String facultyName;
    private int attendanceCount;
    private String token;

    public static SessionDTO fromEntity(QrSession session, int attendanceCount) {
        SessionDTO dto = new SessionDTO();
        dto.setId(session.getId());
        dto.setToken(session.getToken());
        dto.setSubject(SubjectDTO.fromEntity(session.getSubject()));
        dto.setFaculty(UserDTO.fromEntity(session.getFaculty()));
        dto.setSubjectName(session.getSubject().getName());
        dto.setSubjectCode(session.getSubject().getCode());
        dto.setCreatedAt(session.getCreatedAt());
        dto.setExpiresAt(session.getExpiresAt());
        dto.setActive(LocalDateTime.now().isBefore(session.getExpiresAt()));
        dto.setFacultyName(session.getFaculty().getFullName());
        dto.setAttendanceCount(attendanceCount);
        return dto;
    }
}
