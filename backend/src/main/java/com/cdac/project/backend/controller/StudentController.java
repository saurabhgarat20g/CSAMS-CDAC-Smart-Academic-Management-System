package com.cdac.project.backend.controller;

import com.cdac.project.backend.service.StudentService;
import com.cdac.project.backend.security.UserDetailsImpl;
import com.cdac.project.backend.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {
    @Autowired
    StudentService studentService;
    @Autowired
    com.cdac.project.backend.service.AdminService adminService;

    @PostMapping("/attendance/mark")
    public ResponseEntity<?> markAttendance(@RequestParam String token, 
                                          @RequestParam(required = false) Double lat, 
                                          @RequestParam(required = false) Double lng) {
        return ResponseEntity.badRequest().body("Attendance must be marked using Biometric Verification. Please use the dashboard button.");
    }

    @PostMapping("/leave/apply")
    public ResponseEntity<?> applyLeave(@RequestBody LeaveApplicationRequest request) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return ResponseEntity.ok(studentService.applyLeave(userDetails.getId(), request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/leave/history")
    public ResponseEntity<?> getLeaveHistory() {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return ResponseEntity.ok(studentService.getMyLeaveRequests(userDetails.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return ResponseEntity.ok(studentService.getStudentProfile(userDetails.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody com.cdac.project.backend.dto.StudentProfileUpdateRequest request) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            studentService.updateStudentProfile(userDetails.getId(), request);
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
