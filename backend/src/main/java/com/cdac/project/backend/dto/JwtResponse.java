package com.cdac.project.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private Long id;
    private String email;
    private String fullName;
    private String name; // For frontend compatibility
    private List<String> roles;
    private boolean firstLogin;
}
