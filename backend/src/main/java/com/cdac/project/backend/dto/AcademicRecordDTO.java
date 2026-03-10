package com.cdac.project.backend.dto;

import lombok.Data;
import com.cdac.project.backend.entity.AcademicRecord;

@Data
public class AcademicRecordDTO {
    private Long id;
    private String name; // We might want to mask PRN if it's sensitive, but name is needed for scoreboard.
    private String prn;
    private Double total;
    private Double percentage;
    private String status;
    
    // Marks
    private Double aptitude;
    private Double cpp;
    private Double oopJava;
    private Double adsJava;
    private Double wpt;
    private Double dbt;
    private Double dotnet;
    private Double osSdm;
    private Double wbj;

    public static AcademicRecordDTO fromEntity(AcademicRecord record) {
        AcademicRecordDTO dto = new AcademicRecordDTO();
        dto.setId(record.getId());
        dto.setName(record.getName());
        dto.setPrn(record.getPrn());
        dto.setTotal(record.getTotal());
        dto.setPercentage(record.getPercentage());
        dto.setStatus(record.getStatus());
        dto.setAptitude(record.getAptitude());
        dto.setCpp(record.getCpp());
        dto.setOopJava(record.getOopJava());
        dto.setAdsJava(record.getAdsJava());
        dto.setWpt(record.getWpt());
        dto.setDbt(record.getDbt());
        dto.setDotnet(record.getDotnet());
        dto.setOsSdm(record.getOsSdm());
        dto.setWbj(record.getWbj());
        return dto;
    }
}
