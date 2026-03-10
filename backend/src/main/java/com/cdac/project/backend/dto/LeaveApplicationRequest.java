package com.cdac.project.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class LeaveApplicationRequest {
    private String reason;
    private LocalDate startDate;
    private LocalDate endDate;
}
