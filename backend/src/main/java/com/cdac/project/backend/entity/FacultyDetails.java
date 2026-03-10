package com.cdac.project.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "faculty_details")
@Data
public class FacultyDetails {
    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String department;
}
