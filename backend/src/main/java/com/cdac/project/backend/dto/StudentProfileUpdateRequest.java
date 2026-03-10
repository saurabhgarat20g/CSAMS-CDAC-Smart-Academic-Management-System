package com.cdac.project.backend.dto;

import lombok.Data;

@Data
public class StudentProfileUpdateRequest {
    private String fullName;
    private String phone;
    private String enrollmentNo;
    private String courseName;
}
