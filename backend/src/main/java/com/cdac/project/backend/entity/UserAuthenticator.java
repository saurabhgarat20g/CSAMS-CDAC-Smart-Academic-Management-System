package com.cdac.project.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_authenticators")
@Data
@NoArgsConstructor
public class UserAuthenticator {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String credentialId; // Base64URL encoded

    @Column(nullable = false, columnDefinition = "TEXT")
    private String publicKey; // Base64URL encoded COSE key

    @Column(nullable = false)
    private long count;

    @Column(nullable = false)
    private String aaguid;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
