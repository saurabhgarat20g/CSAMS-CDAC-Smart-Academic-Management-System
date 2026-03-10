package com.cdac.project.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "academic_records")
@Data
public class AcademicRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String prn;

    @Column(nullable = false)
    private String name;

    private Double aptitude;
    private Double cpp;
    private Double oopJava;
    private Double adsJava;
    private Double wpt;
    private Double dbt;
    private Double dotnet;
    private Double osSdm;
    private Double wbj;

    private Double total;
    private Double percentage;
    private String status;
}
