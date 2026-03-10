package com.cdac.project.backend.dto;

import lombok.Data;
import com.cdac.project.backend.entity.Subject;

@Data
public class SubjectDTO {
    private Long id;
    private String name;
    private String code;

    public static SubjectDTO fromEntity(Subject subject) {
        if (subject == null) return null;
        SubjectDTO dto = new SubjectDTO();
        dto.setId(subject.getId());
        dto.setName(subject.getName());
        dto.setCode(subject.getCode());
        return dto;
    }
}
