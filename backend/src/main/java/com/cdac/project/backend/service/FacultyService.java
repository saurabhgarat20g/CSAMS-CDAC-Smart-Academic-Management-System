package com.cdac.project.backend.service;

import com.cdac.project.backend.repository.*;
import com.cdac.project.backend.entity.*;
import com.cdac.project.backend.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.List;

@Service
@lombok.extern.slf4j.Slf4j
public class FacultyService {
    @Autowired
    QrSessionRepository qrSessionRepository;
    @Autowired
    SubjectRepository subjectRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    AttendanceRepository attendanceRepository;
    @Autowired
    FacultyDetailsRepository facultyDetailsRepository;
    @Autowired
    StudentDetailsRepository studentDetailsRepository;

    @Transactional
    public QrSessionResponse generateQrSession(Long facultyId, Long subjectId, int durationMinutes) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        QrSession session = new QrSession();
        session.setFaculty(faculty);
        session.setSubject(subject);
        session.setToken(UUID.randomUUID().toString()); // Simple token
        session.setExpiresAt(LocalDateTime.now().plusMinutes(durationMinutes));

        log.info("Saving new QrSession for faculty ID: {} and subject ID: {}", facultyId, subjectId);
        QrSession saved = qrSessionRepository.save(session);
        log.info("QrSession saved with ID: {}", saved.getId());
        
        QrSessionResponse response = new QrSessionResponse();
        response.setId(saved.getId());
        response.setToken(saved.getToken());
        response.setSubjectName(subject.getName());
        response.setFacultyName(faculty.getFullName());
        response.setExpiresAt(saved.getExpiresAt());
        
        return response;
    }

    public List<SessionDTO> getFacultySessions(Long facultyId) {
        log.info("Fetching sessions for faculty ID: {}", facultyId);
        List<QrSession> sessions = qrSessionRepository.findByFacultyId(facultyId);
        log.info("Found {} sessions for faculty ID: {}", sessions.size(), facultyId);
        
        return sessions.stream().map(s -> {
            return SessionDTO.fromEntity(s, attendanceRepository.findByQrSessionId(s.getId()).size());
        }).collect(Collectors.toList());
    }

    public List<AttendanceDTO> getSessionAttendance(Long facultyId, Long sessionId) {
        QrSession session = qrSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        if (!session.getFaculty().getId().equals(facultyId)) {
            throw new RuntimeException("Unauthorized: You do not own this session");
        }
        
        return attendanceRepository.findByQrSessionId(sessionId).stream()
                .map(a -> {
                    AttendanceDTO dto = AttendanceDTO.fromEntity(a);
                    studentDetailsRepository.findById(a.getStudent().getId()).ifPresent(dto::setStudentInfo);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public FacultyDTO getFacultyProfile(Long facultyId) {
        FacultyDetails details = facultyDetailsRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty profile not found"));
        return FacultyDTO.fromEntity(details);
    }

    @Transactional
    public void updateFacultyProfile(Long facultyId, FacultyProfileUpdateRequest request) {
        User user = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        FacultyDetails details = facultyDetailsRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty details not found"));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        userRepository.save(user);

        details.setDepartment(request.getDepartment());
        facultyDetailsRepository.save(details);
    }
}
