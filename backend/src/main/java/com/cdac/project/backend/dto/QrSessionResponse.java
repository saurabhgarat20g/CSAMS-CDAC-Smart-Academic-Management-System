package com.cdac.project.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class QrSessionResponse {
    private Long id;
    private String token;
    private String subjectName;
    private String facultyName;
    private LocalDateTime expiresAt;
}
