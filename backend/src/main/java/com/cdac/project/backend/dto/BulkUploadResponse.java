package com.cdac.project.backend.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class BulkUploadResponse {
    private int totalRecords;
    private int successCount;
    private int failureCount;
    private List<String> errors = new ArrayList<>();
    private List<String> successMessages = new ArrayList<>();
}
