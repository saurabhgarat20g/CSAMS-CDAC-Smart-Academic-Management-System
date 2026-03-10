package com.cdac.project.backend.controller;

import com.cdac.project.backend.dto.*;
import com.cdac.project.backend.service.FacultyService;
import com.cdac.project.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/faculty")
@PreAuthorize("hasRole('FACULTY')")
@lombok.extern.slf4j.Slf4j
public class FacultyController {
    @Autowired
    FacultyService facultyService;
    @Autowired
    com.cdac.project.backend.service.AdminService adminService;

    @PostMapping("/qr/generate")
    public ResponseEntity<?> generateQr(@RequestParam Long subjectId, @RequestParam int durationMinutes) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            log.info("Faculty ID: {} is generating QR for Subject ID: {}", userDetails.getId(), subjectId);
            QrSessionResponse response = facultyService.generateQrSession(userDetails.getId(), subjectId, durationMinutes);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating QR: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getMySessions() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        log.info("Faculty ID: {} is fetching their sessions", userDetails.getId());
        return ResponseEntity.ok(facultyService.getFacultySessions(userDetails.getId()));
    }

    @GetMapping("/sessions/{sessionId}/attendance")
    public ResponseEntity<?> getSessionAttendance(@PathVariable Long sessionId) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return ResponseEntity.ok(facultyService.getSessionAttendance(userDetails.getId(), sessionId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return ResponseEntity.ok(facultyService.getFacultyProfile(userDetails.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody com.cdac.project.backend.dto.FacultyProfileUpdateRequest request) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            facultyService.updateFacultyProfile(userDetails.getId(), request);
            return ResponseEntity.ok("Profile updated successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/scoreboard")
    public ResponseEntity<?> getScoreboard() {
        return ResponseEntity.ok(adminService.getScoreboard());
    }
}
