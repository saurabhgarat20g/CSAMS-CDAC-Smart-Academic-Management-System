package com.cdac.project.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FacultySessionResponse {
    private Long id;
    private String subjectName;
    private String subjectCode;
    private String token;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private int attendanceCount;
}
