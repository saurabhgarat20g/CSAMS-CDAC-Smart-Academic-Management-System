package com.cdac.project.backend.service;

import com.cdac.project.backend.dto.*;
import com.cdac.project.backend.entity.*;
import com.cdac.project.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AdminService {
    @Autowired
    UserRepository userRepository;
    @Autowired
    RoleRepository roleRepository;
    @Autowired
    StudentDetailsRepository studentDetailsRepository;
    @Autowired
    FacultyDetailsRepository facultyDetailsRepository;
    @Autowired
    PasswordEncoder passwordEncoder;
    @Autowired
    CollegeLocationRepository collegeLocationRepository;
    @Autowired
    UserAuthenticatorRepository userAuthenticatorRepository;
    @Autowired
    TimetableRepository timetableRepository;
    @Autowired
    AcademicRecordRepository academicRecordRepository;
    @Autowired
    LeaveRequestRepository leaveRequestRepository;

    @Transactional
    public UserDTO registerUser(SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Create new user's account
        User user = new User();
        user.setFullName(signUpRequest.getFullName());
        user.setEmail(signUpRequest.getEmail());
        user.setPhone(signUpRequest.getPhone());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));

        String rolename = "ROLE_" + signUpRequest.getRole().toUpperCase();
        Role role = roleRepository.findByName(rolename)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        user.setRole(role);
        user.setFirstLogin(true); // Force profile update on first login

        user = userRepository.save(user);

        if (rolename.equals("ROLE_STUDENT")) {
            StudentDetails details = new StudentDetails();
            details.setUser(user);
            details.setEnrollmentNo(signUpRequest.getEnrollmentNo());
            details.setCourseName(signUpRequest.getCourseName());
            studentDetailsRepository.save(details);
        } else if (rolename.equals("ROLE_FACULTY")) {
            FacultyDetails details = new FacultyDetails();
            details.setUser(user);
            details.setDepartment(signUpRequest.getDepartment());
            facultyDetailsRepository.save(details);
        }
        
        return UserDTO.fromEntity(user);
    }

    @Autowired
    AttendanceRepository attendanceRepository;
    @Autowired
    QrSessionRepository qrSessionRepository;

    public org.springframework.data.domain.Page<StudentDTO> getAllStudents(String search, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<StudentDetails> students;
        if (search != null && !search.trim().isEmpty()) {
            students = studentDetailsRepository.findByUserFullNameContainingIgnoreCaseOrEnrollmentNoContainingIgnoreCase(search, search, pageable);
        } else {
            students = studentDetailsRepository.findAll(pageable);
        }
        return students.map(StudentDTO::fromEntity);
    }

    public org.springframework.data.domain.Page<FacultyDTO> getAllFaculty(String search, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<FacultyDetails> faculty;
        if (search != null && !search.trim().isEmpty()) {
            faculty = facultyDetailsRepository.findByUserFullNameContainingIgnoreCase(search, pageable);
        } else {
            faculty = facultyDetailsRepository.findAll(pageable);
        }
        return faculty.map(FacultyDTO::fromEntity);
    }

    public List<SessionDTO> getAllSessions() {
        return qrSessionRepository.findAll().stream()
                .map(s -> SessionDTO.fromEntity(s, attendanceRepository.findByQrSessionId(s.getId()).size()))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceForSession(Long sessionId) {
        List<Attendance> attendances = attendanceRepository.findByQrSessionId(sessionId);
        return attendances.stream().map(a -> {
            AttendanceDTO dto = AttendanceDTO.fromEntity(a);
            studentDetailsRepository.findById(a.getStudent().getId()).ifPresent(dto::setStudentInfo);
            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

    public List<LeaveRequestDTO> getAllLeaveRequests() {
        return leaveRequestRepository.findAll().stream().map(l -> {
            LeaveRequestDTO dto = LeaveRequestDTO.fromEntity(l);
            studentDetailsRepository.findById(l.getStudent().getId()).ifPresent(dto::setStudentInfo);
            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void updateLeaveStatus(Long leaveId, String status) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found with id: " + leaveId));
        leave.setStatus(status);
        leaveRequestRepository.save(leave);
    }



    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Delete authenticators (WebAuthn/Fingerprint data)
        List<UserAuthenticator> authenticators = userAuthenticatorRepository.findByUser(user);
        userAuthenticatorRepository.deleteAll(authenticators);

        // Mark user as inactive immediately to block login
        user.setActive(false);
        userRepository.save(user);

        String roleName = user.getRole().getName();

        if (roleName.equals("ROLE_STUDENT")) {
            // Delete all attendance records for this student
            List<Attendance> attendances = attendanceRepository.findByStudentId(userId);
            attendanceRepository.deleteAll(attendances);

            // Delete leave requests
            List<LeaveRequest> leaves = leaveRequestRepository.findByStudentId(userId);
            leaveRequestRepository.deleteAll(leaves);
            
            // Delete student details
            if (studentDetailsRepository.existsById(userId)) {
                studentDetailsRepository.deleteById(userId);
            }
        } else if (roleName.equals("ROLE_FACULTY")) {
             // Delete timetable entries for this faculty
             List<Timetable> timetableEntries = timetableRepository.findByFacultyId(userId);
             timetableRepository.deleteAll(timetableEntries);

             // Delete all sessions created by this faculty
             List<QrSession> sessions = qrSessionRepository.findByFacultyId(userId);
             for (QrSession session : sessions) {
                 // Delete attendance for each session
                 List<Attendance> sessionAttendance = attendanceRepository.findByQrSessionId(session.getId());
                 attendanceRepository.deleteAll(sessionAttendance);
                 qrSessionRepository.delete(session);
             }

             // Delete faculty details
             if (facultyDetailsRepository.existsById(userId)) {
                 facultyDetailsRepository.deleteById(userId);
             }
        }

        userRepository.delete(user);
    }

    @Transactional
    public void deleteUsersBulk(List<Long> userIds) {
        for (Long userId : userIds) {
            if (userRepository.existsById(userId)) {
                deleteUser(userId);
            }
        }
    }

    @Transactional
    public void deleteSession(Long sessionId) {
        QrSession session = qrSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found with id: " + sessionId));

        // Delete all attendance records for this session first
        List<Attendance> attendances = attendanceRepository.findByQrSessionId(sessionId);
        attendanceRepository.deleteAll(attendances);

        // Delete the session itself
        qrSessionRepository.delete(session);
    }

    public CollegeLocation getCollegeLocation() {
        List<CollegeLocation> locations = collegeLocationRepository.findAll();
        return locations.isEmpty() ? null : locations.get(0);
    }

    @Transactional
    public CollegeLocation updateCollegeLocation(CollegeLocation location) {
        System.out.println("Updating College Location: " + location);
        List<CollegeLocation> locations = collegeLocationRepository.findAll();
        if (locations.isEmpty()) {
            System.out.println("No existing location found. Saving new entry.");
            return collegeLocationRepository.save(location);
        } else {
            CollegeLocation existing = locations.get(0);
            System.out.println("Updating existing location ID: " + existing.getId());
            existing.setLatitude(location.getLatitude());
            existing.setLongitude(location.getLongitude());
            existing.setRadiusInMeters(location.getRadiusInMeters());
            return collegeLocationRepository.save(existing);
        }
    }

    @Transactional
    public BulkUploadResponse bulkRegisterStudents(org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        BulkUploadResponse response = new BulkUploadResponse();
        List<BulkStudentRequest> students = parseExcelFile(file);
        response.setTotalRecords(students.size());
        
        Role studentRole = roleRepository.findByName("ROLE_STUDENT")
                .orElseThrow(() -> new RuntimeException("Error: Student role not found."));
        
        for (int i = 0; i < students.size(); i++) {
            BulkStudentRequest student = students.get(i);
            int rowNum = i + 2; // Excel row (1-indexed + header)
            
            try {
                // Validate required fields
                if (student.getEnrollmentNo() == null || student.getEnrollmentNo().trim().isEmpty()) {
                    throw new RuntimeException("PRN is required");
                }
                if (student.getFullName() == null || student.getFullName().trim().isEmpty()) {
                    throw new RuntimeException("Full Name is required");
                }
                
                // Default course to PG-DAC if not provided
                String courseName = (student.getCourseName() == null || student.getCourseName().trim().isEmpty()) 
                                    ? "PG-DAC" : student.getCourseName();
                
                // Check for duplicate PRN (enrollmentNo)
                if (studentDetailsRepository.existsByEnrollmentNo(student.getEnrollmentNo())) {
                    throw new RuntimeException("PRN already exists");
                }
                
                // Generate temporary email: PRN@temp.cdac.in
                String tempEmail = student.getEnrollmentNo() + "@temp.cdac.in";
                
                // Check if temp email already exists (shouldn't happen if PRN is unique)
                if (userRepository.existsByEmail(tempEmail)) {
                    throw new RuntimeException("Temporary email already exists");
                }
                
                // Create user with PRN as password and temp email
                User user = new User();
                user.setFullName(student.getFullName());
                user.setEmail(tempEmail); // Temporary email
                user.setPhone(null); // Will be set during first login
                user.setPassword(passwordEncoder.encode(student.getEnrollmentNo())); // PRN as password
                user.setRole(studentRole);
                user.setFirstLogin(true); // Force profile update
                user = userRepository.save(user);
                
                // Create student details
                StudentDetails details = new StudentDetails();
                details.setUser(user);
                details.setEnrollmentNo(student.getEnrollmentNo());
                details.setCourseName(courseName);
                studentDetailsRepository.save(details);
                
                response.setSuccessCount(response.getSuccessCount() + 1);
                response.getSuccessMessages().add("Row " + rowNum + ": " + student.getFullName() + " (" + student.getEnrollmentNo() + ") created successfully");
                
            } catch (Exception e) {
                response.setFailureCount(response.getFailureCount() + 1);
                response.getErrors().add("Row " + rowNum + ": " + e.getMessage());
            }
        }
        
        return response;
    }

    private List<BulkStudentRequest> parseExcelFile(org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        List<BulkStudentRequest> students = new java.util.ArrayList<>();
        
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(file.getInputStream())) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(0);
            
            // Skip header row, start from row 1
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null) continue;
                
                BulkStudentRequest student = new BulkStudentRequest();
                // Column 0: PRN, Column 1: Full Name, Column 2: Course Name (Optional)
                student.setEnrollmentNo(getCellValueAsString(row.getCell(0)));
                student.setFullName(getCellValueAsString(row.getCell(1)));
                
                // Safely get Course Name if it exists
                if (row.getLastCellNum() >= 3) {
                    student.setCourseName(getCellValueAsString(row.getCell(2)));
                }
                
                // Skip empty rows
                if (student.getEnrollmentNo() != null && !student.getEnrollmentNo().trim().isEmpty()) {
                    students.add(student);
                }
            }
        }
        
        return students;
    }

    @Transactional
    public BulkUploadResponse bulkUploadAcademicData(org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        BulkUploadResponse response = new BulkUploadResponse();
        
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(file.getInputStream())) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(0);
            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            
            if (headerRow == null) {
                throw new RuntimeException("Excel file is empty");
            }

            // Create a map of header name (cleaned) to column index
            Map<String, Integer> colMap = new HashMap<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                String header = getCellValueAsString(headerRow.getCell(i));
                if (header != null) {
                    // Clean header: UPPERCASE, ONLY ALPHANUMERIC
                    String cleanHeader = header.toUpperCase().replaceAll("[^A-Z0-9]+", "");
                    colMap.put(cleanHeader, i);
                }
            }

            // Helper to find column index with fallbacks
            int prnIdx = findIdx(colMap, 0, "PRN", "ENROLLMENT", "ROLLNO", "ID", "PRNNO");
            int nameIdx = findIdx(colMap, 1, "NAME", "FULLNAME", "STUDENTNAME", "STU_NAME");
            int aptitudeIdx = findIdx(colMap, 2, "APTITUDE", "APTITUD", "APT", "QA", "QUANT");
            int cppIdx = findIdx(colMap, 3, "CPP", "C++", "CPLUSPLUS", "C_PP");
            int oopIdx = findIdx(colMap, 4, "JAVAOOP", "OOP", "JAVA_OOP", "COREJAVA");
            int adsIdx = findIdx(colMap, 5, "JAVAADS", "ADS", "JAVA_ADS", "ALGO", "DS");
            int wptIdx = findIdx(colMap, 6, "WPT", "WEBTECH", "WEBTECHNOLOGY", "WEBPROGRAMMING");
            int dbtIdx = findIdx(colMap, 7, "DBT", "DATABASE", "SQL", "MYSQL", "DBMS");
            int dotnetIdx = findIdx(colMap, 8, "DOTNET", "NET", "CSHARP", "C#");
            int osIdx = findIdx(colMap, 9, "OSSDM", "OS", "SDM", "OS/SDM", "OS-SDM", "OPERATINGSYSTEM");
            int wbjIdx = findIdx(colMap, 10, "WBJ", "ADVANCEDJAVA", "ADVJAVA", "ADV_JAVA");

            response.setTotalRecords(sheet.getLastRowNum());
            
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null) continue;
                
                int rowNum = i + 1;
                try {
                    String prn = getCellValueAsString(row.getCell(prnIdx));
                    String name = getCellValueAsString(row.getCell(nameIdx));
                    
                    if (prn == null || prn.trim().isEmpty()) {
                        continue;
                    }

                    // CRITICAL: Check if student is registered
                    if (!studentDetailsRepository.existsByEnrollmentNo(prn)) {
                        throw new RuntimeException("Student with PRN " + prn + " is not registered");
                    }

                    Double aptitude = getCellValueAsDouble(row.getCell(aptitudeIdx));
                    Double cpp = getCellValueAsDouble(row.getCell(cppIdx));
                    Double oopJava = getCellValueAsDouble(row.getCell(oopIdx));
                    Double adsJava = getCellValueAsDouble(row.getCell(adsIdx));
                    Double wpt = getCellValueAsDouble(row.getCell(wptIdx));
                    Double dbt = getCellValueAsDouble(row.getCell(dbtIdx));
                    Double dotnet = getCellValueAsDouble(row.getCell(dotnetIdx));
                    Double osSdm = getCellValueAsDouble(row.getCell(osIdx));
                    Double wbj = getCellValueAsDouble(row.getCell(wbjIdx));

                    // Validate marks (0-40)
                    validateMarks(aptitude, "APTITUDE", rowNum);
                    validateMarks(cpp, "CPP", rowNum);
                    validateMarks(oopJava, "OOP JAVA", rowNum);
                    validateMarks(adsJava, "ADS JAVA", rowNum);
                    validateMarks(wpt, "WPT", rowNum);
                    validateMarks(dbt, "DBT", rowNum);
                    validateMarks(dotnet, "DOTNET", rowNum);
                    validateMarks(osSdm, "OS SDM", rowNum);
                    validateMarks(wbj, "WBJ", rowNum);

                    double calculatedTotal = aptitude + cpp + oopJava + adsJava + wpt + dbt + dotnet + osSdm + wbj;
                    double percentage = (calculatedTotal / 360.0) * 100.0;
                    
                    // Determine Status (Pass if total >= 180, i.e., 50% of 360)
                    String status = (calculatedTotal >= 180) ? "Pass" : "Fail";

                    AcademicRecord record = academicRecordRepository.findByPrn(prn).orElse(new AcademicRecord());
                    record.setPrn(prn);
                    record.setName(name);
                    record.setAptitude(aptitude);
                    record.setCpp(cpp);
                    record.setOopJava(oopJava);
                    record.setAdsJava(adsJava);
                    record.setWpt(wpt);
                    record.setDbt(dbt);
                    record.setDotnet(dotnet);
                    record.setOsSdm(osSdm);
                    record.setWbj(wbj);
                    record.setTotal(calculatedTotal);
                    record.setPercentage(percentage);
                    record.setStatus(status);

                    academicRecordRepository.save(record);
                    response.setSuccessCount(response.getSuccessCount() + 1);
                    response.getSuccessMessages().add("Row " + rowNum + ": Result for " + name + " (" + prn + ") uploaded successfully");

                } catch (Exception e) {
                    response.setFailureCount(response.getFailureCount() + 1);
                    response.getErrors().add("Row " + rowNum + ": " + e.getMessage());
                }
            }
        }
        return response;
    }

    private void validateMarks(Double marks, String subject, int rowNum) {
        if (marks == null) marks = 0.0;
        if (marks < 0 || marks > 40) {
            throw new RuntimeException(subject + " marks must be between 0 and 40. Found: " + marks);
        }
    }

    private Double getCellValueAsDouble(org.apache.poi.ss.usermodel.Cell cell) {
        if (cell == null) return 0.0;
        try {
            if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC) {
                return cell.getNumericCellValue();
            } else if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.STRING) {
                return Double.parseDouble(cell.getStringCellValue().trim());
            }
        } catch (Exception e) {
            return 0.0;
        }
        return 0.0;
    }

    public List<AcademicRecordDTO> getScoreboard() {
        return academicRecordRepository.findAllByOrderByPercentageDesc().stream()
                .map(AcademicRecordDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void deleteAcademicRecord(Long id) {
        academicRecordRepository.deleteById(id);
    }

    @Transactional
    public void clearScoreboard() {
        academicRecordRepository.deleteAll();
    }

    private int findIdx(Map<String, Integer> colMap, int defaultIdx, String... variants) {
        for (String v : variants) {
            String cleanV = v.toUpperCase().replaceAll("[^A-Z0-9]+", "");
            if (colMap.containsKey(cleanV)) {
                return colMap.get(cleanV);
            }
        }
        return defaultIdx;
    }

    private String getCellValueAsString(org.apache.poi.ss.usermodel.Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return null;
        }
    }
}
