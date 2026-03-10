package com.cdac.project.backend.dto;

import lombok.Data;
import com.cdac.project.backend.entity.StudentDetails;

@Data
public class StudentDTO {
    private Long userId;
    private UserDTO user;
    private String fullName; // For UI compatibility
    private String enrollmentNo;
    private String courseName;

    public static StudentDTO fromEntity(StudentDetails student) {
        StudentDTO dto = new StudentDTO();
        dto.setUserId(student.getUserId());
        dto.setUser(UserDTO.fromEntity(student.getUser()));
        dto.setFullName(student.getUser().getFullName());
        dto.setEnrollmentNo(student.getEnrollmentNo());
        dto.setCourseName(student.getCourseName());
        return dto;
    }
}
