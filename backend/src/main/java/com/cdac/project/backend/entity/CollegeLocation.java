package com.cdac.project.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "college_location")
@Data
public class CollegeLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double latitude;
    @Column(nullable = false)
    private Double longitude;
    @Column(nullable = false)
    private Double radiusInMeters;

    public CollegeLocation() {}

    public CollegeLocation(Double latitude, Double longitude, Double radiusInMeters) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.radiusInMeters = radiusInMeters;
    }
}
