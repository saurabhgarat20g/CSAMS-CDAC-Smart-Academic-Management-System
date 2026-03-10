package com.cdac.project.backend.controller;

import com.cdac.project.backend.service.StudentService;
import com.cdac.project.backend.service.WebAuthnService;
import com.cdac.project.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Base64;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/webauthn")
public class WebAuthnController {

    @Autowired
    WebAuthnService webAuthnService;

    @Autowired
    StudentService studentService;

    @PostMapping("/register/start")
    @PreAuthorize("hasRole('STUDENT') or hasRole('FACULTY')")
    public ResponseEntity<?> startRegistration() {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            byte[] options = webAuthnService.startRegistration(userDetails.getId());
            return ResponseEntity.ok(Base64.getUrlEncoder().withoutPadding().encodeToString(options));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register/finish")
    @PreAuthorize("hasRole('STUDENT') or hasRole('FACULTY')")
    public ResponseEntity<?> finishRegistration(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        try {
            String origin = request.getHeader("Origin");
            String rpId = request.getServerName();
            
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            webAuthnService.finishRegistration(
                    userDetails.getId(),
                    payload.get("credentialId"),
                    payload.get("clientDataJSON"),
                    payload.get("attestationObject"),
                    origin,
                    rpId
            );
            return ResponseEntity.ok("Fingerprint registered successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/auth/start")
    @PreAuthorize("hasRole('STUDENT') or hasRole('FACULTY')")
    public ResponseEntity<?> startAuthentication() {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            byte[] options = webAuthnService.startAuthentication(userDetails.getId());
            return ResponseEntity.ok(Base64.getUrlEncoder().withoutPadding().encodeToString(options));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/auth/finish")
    @PreAuthorize("hasRole('STUDENT')") // Currently only Students mark attendance
    public ResponseEntity<?> finishAuthentication(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        try {
            String origin = request.getHeader("Origin");
            String rpId = request.getServerName();
            
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            
            // 1. Verify Fingerprint
            webAuthnService.finishAuthentication(
                    userDetails.getId(),
                    payload.get("credentialId"),
                    payload.get("clientDataJSON"),
                    payload.get("authenticatorData"),
                    payload.get("signature"),
                    origin,
                    rpId
            );

            // 2. Mark Attendance (Context: Using the QR token flow? Or just generic "Present"? 
            // The requirement says "mark attendance only after successful fingerprint".
            // If we are replacing the QR flow, we need the QR token here too.
            // Let's assume we pass the QR token in the payload too or this is a separate "Bio-Attendance" mode.
            // For now, let's assume we need to pass the 'token' to mark attendance.
            
            String token = payload.get("token");
            Double lat = payload.get("lat") != null ? Double.valueOf(payload.get("lat")) : null;
            Double lng = payload.get("lng") != null ? Double.valueOf(payload.get("lng")) : null;

            if (token == null) {
                return ResponseEntity.badRequest().body("QR Token is required to mark attendance.");
            }

            String result = studentService.markAttendance(userDetails.getId(), token, lat, lng);
            return ResponseEntity.ok("Fingerprint Verified & " + result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Authentication failed: " + e.getMessage());
        }
    }

    @DeleteMapping("/reset")
    @PreAuthorize("hasRole('STUDENT') or hasRole('FACULTY')")
    public ResponseEntity<?> resetFingerprint() {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            webAuthnService.resetUserAuthenticators(userDetails.getId());
            return ResponseEntity.ok("Fingerprint registration cleared. You can now re-register.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Reset failed: " + e.getMessage());
        }
    }
}
