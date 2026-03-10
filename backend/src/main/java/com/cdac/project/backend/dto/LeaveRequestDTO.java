package com.cdac.project.backend.dto;

import lombok.Data;
import com.cdac.project.backend.entity.LeaveRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LeaveRequestDTO {
    private Long id;
    private StudentDTO student;
    private String reason;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private LocalDateTime appliedAt;

    public static LeaveRequestDTO fromEntity(LeaveRequest request) {
        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setId(request.getId());
        dto.setReason(request.getReason());
        dto.setStartDate(request.getStartDate());
        dto.setEndDate(request.getEndDate());
        dto.setStatus(request.getStatus());
        dto.setAppliedAt(request.getAppliedAt());
        return dto;
    }
    
    public void setStudentInfo(com.cdac.project.backend.entity.StudentDetails studentDetails) {
        this.student = StudentDTO.fromEntity(studentDetails);
    }
}
