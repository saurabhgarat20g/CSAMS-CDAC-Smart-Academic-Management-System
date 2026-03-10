package com.cdac.project.backend.service;

import com.cdac.project.backend.repository.*;
import com.cdac.project.backend.entity.*;
import com.cdac.project.backend.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StudentService {
    @Autowired
    AttendanceRepository attendanceRepository;
    @Autowired
    QrSessionRepository qrSessionRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    LeaveRequestRepository leaveRequestRepository;
    @Autowired
    StudentDetailsRepository studentDetailsRepository;
    @Autowired
    CollegeLocationRepository collegeLocationRepository;

    @Transactional
    public String markAttendance(Long studentId, String qrToken, Double lat, Double lng) {
        QrSession session = qrSessionRepository.findByToken(qrToken)
                .orElseThrow(() -> new RuntimeException("Invalid QR Token"));

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("QR Code Expired");
        }

        // Geolocation Validation
        List<CollegeLocation> locations = collegeLocationRepository.findAll();
        System.out.println("Geolocation check: locations found = " + locations.size());
        
        if (!locations.isEmpty()) {
            CollegeLocation campus = locations.get(0);
            System.out.println("Campus Location: Lat=" + campus.getLatitude() + ", Lng=" + campus.getLongitude() + ", Radius=" + campus.getRadiusInMeters());
            System.out.println("Student Location: Lat=" + lat + ", Lng=" + lng);

            if (lat == null || lng == null) {
                throw new RuntimeException("Location access is required to mark attendance");
            }

            if (campus.getLatitude() == null || campus.getLongitude() == null || campus.getRadiusInMeters() == null) {
                System.out.println("Warning: Campus location settings are incomplete. Skipping validation.");
            } else {
                double distance = calculateDistance(lat, lng, campus.getLatitude(), campus.getLongitude());
                System.out.println("Calculated Distance: " + distance + "m");
                
                if (distance > campus.getRadiusInMeters()) {
                    throw new RuntimeException(String.format("You are outside the allowed radius (%.2fm from campus)", distance));
                }
            }
        }

        if (attendanceRepository.existsByStudentIdAndQrSessionId(studentId, session.getId())) {
             return "Attendance already marked for this session";
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Attendance attendance = new Attendance();
        attendance.setStudent(student);
        attendance.setQrSession(session);
        attendanceRepository.save(attendance);

        return "Attendance Marked Successfully";
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c * 1000; // convert to meters
        return distance;
    }

    @Transactional
    public LeaveRequestDTO applyLeave(Long studentId, LeaveApplicationRequest request) {
        User student = userRepository.findById(studentId)
                 .orElseThrow(() -> new RuntimeException("Student not found"));
        
        LeaveRequest leave = new LeaveRequest();
        leave.setStudent(student);
        leave.setReason(request.getReason());
        leave.setStartDate(request.getStartDate());
        leave.setEndDate(request.getEndDate());
        
        LeaveRequest savedLeave = leaveRequestRepository.save(leave);
        LeaveRequestDTO dto = LeaveRequestDTO.fromEntity(savedLeave);
        // Map student details
        StudentDetails details = studentDetailsRepository.findById(studentId).orElseThrow();
        dto.setStudentInfo(details);
        return dto;
    }

    public List<LeaveRequestDTO> getMyLeaveRequests(Long studentId) {
        List<LeaveRequest> requests = leaveRequestRepository.findByStudentId(studentId);
        StudentDetails details = studentDetailsRepository.findById(studentId).orElse(null);
        
        return requests.stream().map(req -> {
            LeaveRequestDTO dto = LeaveRequestDTO.fromEntity(req);
            if (details != null) dto.setStudentInfo(details);
            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

    public StudentDTO getStudentProfile(Long studentId) {
        StudentDetails details = studentDetailsRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
        return StudentDTO.fromEntity(details);
    }

    @Transactional
    public void updateStudentProfile(Long studentId, StudentProfileUpdateRequest request) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        StudentDetails details = studentDetailsRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student details not found"));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        userRepository.save(user);

        details.setEnrollmentNo(request.getEnrollmentNo());
        details.setCourseName(request.getCourseName());
        studentDetailsRepository.save(details);
    }
}
