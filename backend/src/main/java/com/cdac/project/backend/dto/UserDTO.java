package com.cdac.project.backend.dto;

import lombok.Data;
import com.cdac.project.backend.entity.User;

@Data
public class UserDTO {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private boolean active;
    private boolean firstLogin;

    public static UserDTO fromEntity(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole().getName());
        dto.setActive(user.isActive());
        dto.setFirstLogin(user.isFirstLogin());
        return dto;
    }
}
