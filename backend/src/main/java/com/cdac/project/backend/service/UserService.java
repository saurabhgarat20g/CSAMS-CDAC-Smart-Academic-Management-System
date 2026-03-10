package com.cdac.project.backend.service;

import com.cdac.project.backend.dto.UpdateProfileRequest;
import com.cdac.project.backend.entity.User;
import com.cdac.project.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Transactional
    public void updateProfile(String currentEmail, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify current password (should be PRN for first login)
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        // Validate new email is not already taken
        if (!request.getEmail().equals(currentEmail) && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }
        
        // Validate new password
        if (request.getNewPassword().length() < 8) {
            throw new RuntimeException("New password must be at least 8 characters long");
        }
        
        // Update email, password, phone, and clear first login flag
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            user.setPhone(request.getPhone());
        }
        user.setFirstLogin(false);
        userRepository.save(user);
    }
}
