package com.cdac.project.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "student_details")
@Data
public class StudentDetails {
    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "enrollment_no", unique = true, nullable = false)
    private String enrollmentNo;

    @Column(name = "course_name")
    private String courseName;
}
