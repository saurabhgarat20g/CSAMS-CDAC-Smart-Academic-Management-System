package com.cdac.project.backend.dto;

import lombok.Data;


@Data
public class SignupRequest {
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private String role; // "student", "faculty", "admin"
    
    // For Student
    private String enrollmentNo;
    private String courseName;

    // For Faculty
    private String department;
}
