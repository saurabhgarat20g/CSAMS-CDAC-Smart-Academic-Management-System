package com.cdac.project.backend.dto;

import lombok.Data;
import com.cdac.project.backend.entity.FacultyDetails;

@Data
public class FacultyDTO {
    private Long userId;
    private UserDTO user;
    private String department;

    public static FacultyDTO fromEntity(FacultyDetails faculty) {
        FacultyDTO dto = new FacultyDTO();
        dto.setUserId(faculty.getUserId());
        dto.setUser(UserDTO.fromEntity(faculty.getUser()));
        dto.setDepartment(faculty.getDepartment());
        return dto;
    }
}
