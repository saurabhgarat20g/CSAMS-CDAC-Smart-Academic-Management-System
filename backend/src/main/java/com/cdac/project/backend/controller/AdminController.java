package com.cdac.project.backend.controller;

import com.cdac.project.backend.entity.CollegeLocation;
import com.cdac.project.backend.dto.*;
import com.cdac.project.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    @Autowired
    AdminService adminService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        try {
            adminService.registerUser(signUpRequest);
            return ResponseEntity.ok("User registered successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getAllStudents(search, pageable));
    }

    @GetMapping("/faculty")
    public ResponseEntity<?> getAllFaculty(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getAllFaculty(search, pageable));
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getAllSessions() {
        return ResponseEntity.ok(adminService.getAllSessions());
    }

    @GetMapping("/attendance/{sessionId}")
    public ResponseEntity<?> getAttendanceForSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(adminService.getAttendanceForSession(sessionId));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            adminService.deleteUser(userId);
            return ResponseEntity.ok("User deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/users/bulk-delete")
    public ResponseEntity<?> deleteUsersBulk(@RequestBody java.util.List<Long> userIds) {
        try {
            adminService.deleteUsersBulk(userIds);
            return ResponseEntity.ok("Selected users deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<?> deleteSession(@PathVariable Long sessionId) {
        try {
            adminService.deleteSession(sessionId);
            return ResponseEntity.ok("Session deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/leaves")
    public ResponseEntity<?> getAllLeaveRequests() {
        return ResponseEntity.ok(adminService.getAllLeaveRequests());
    }

    @PutMapping("/leaves/{id}/status")
    public ResponseEntity<?> updateLeaveStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            adminService.updateLeaveStatus(id, status);
            return ResponseEntity.ok("Leave status updated successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/location")
    public ResponseEntity<?> getCollegeLocation() {
        return ResponseEntity.ok(adminService.getCollegeLocation());
    }

    @PostMapping("/location")
    public ResponseEntity<?> updateCollegeLocation(@RequestBody CollegeLocation location) {
        try {
            return ResponseEntity.ok(adminService.updateCollegeLocation(location));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/students/bulk-upload")
    public ResponseEntity<?> bulkUploadStudents(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Please select a file to upload");
            }
            
            String filename = file.getOriginalFilename();
            if (filename == null || !filename.endsWith(".xlsx")) {
                return ResponseEntity.badRequest().body("Only .xlsx files are supported");
            }
            
            com.cdac.project.backend.dto.BulkUploadResponse response = adminService.bulkRegisterStudents(file);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing file: " + e.getMessage());
        }
    }

    @PostMapping("/academic/bulk-upload")
    public ResponseEntity<?> bulkUploadAcademicData(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Please select a file to upload");
            }
            String filename = file.getOriginalFilename();
            if (filename == null || !filename.endsWith(".xlsx")) {
                return ResponseEntity.badRequest().body("Only .xlsx files are supported");
            }
            return ResponseEntity.ok(adminService.bulkUploadAcademicData(file));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing file: " + e.getMessage());
        }
    }

    @GetMapping("/academic/scoreboard")
    public ResponseEntity<?> getScoreboardAdmin() {
        return ResponseEntity.ok(adminService.getScoreboard());
    }

    @DeleteMapping("/academic/{id}")
    public ResponseEntity<?> deleteAcademicRecord(@PathVariable Long id) {
        try {
            adminService.deleteAcademicRecord(id);
            return ResponseEntity.ok("Academic record deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/academic/clear")
    public ResponseEntity<?> clearScoreboard() {
        try {
            adminService.clearScoreboard();
            return ResponseEntity.ok("Scoreboard cleared successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
