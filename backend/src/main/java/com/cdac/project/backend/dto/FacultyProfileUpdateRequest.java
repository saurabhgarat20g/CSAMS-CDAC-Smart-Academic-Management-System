package com.cdac.project.backend.dto;

import lombok.Data;

@Data
public class FacultyProfileUpdateRequest {
    private String fullName;
    private String phone;
    private String department;
}
