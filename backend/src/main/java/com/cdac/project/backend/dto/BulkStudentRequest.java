package com.cdac.project.backend.dto;

import lombok.Data;

@Data
public class BulkStudentRequest {
    private String enrollmentNo; // PRN - Required
    private String fullName;     // Required
    private String courseName;   // Required
}
