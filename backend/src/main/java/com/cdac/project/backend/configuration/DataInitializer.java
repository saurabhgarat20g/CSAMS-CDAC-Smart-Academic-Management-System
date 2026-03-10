package com.cdac.project.backend.configuration;

import com.cdac.project.backend.entity.Role;
import com.cdac.project.backend.entity.User;
import com.cdac.project.backend.repository.RoleRepository;
import com.cdac.project.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    com.cdac.project.backend.repository.SubjectRepository subjectRepository;

    @Override
    public void run(String... args) throws Exception {
        // Init Roles
        Arrays.asList("ROLE_ADMIN", "ROLE_FACULTY", "ROLE_STUDENT").forEach(roleName -> {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
            }
        });

        // Init Admin
        if (!userRepository.existsByEmail("admin@cdac.in")) {
            User admin = new User();
            admin.setEmail("admin@cdac.in");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("System Admin");
            admin.setRole(roleRepository.findByName("ROLE_ADMIN").get());
            admin.setFirstLogin(false); // Admin doesn't need to update profile
            userRepository.save(admin);
            System.out.println("Admin User Created: admin@cdac.in / admin123");
        }

        // Init Subjects
        if (subjectRepository.count() == 0) {
            createSubject("Web Programming", "WP");
            createSubject("Operating Systems", "OS");
            createSubject("Data Structures", "DS");
            createSubject("Java Technologies", "JAVA");
            System.out.println("Default Subjects Initialized");
        }
    }

    private void createSubject(String name, String code) {
        com.cdac.project.backend.entity.Subject subject = new com.cdac.project.backend.entity.Subject();
        subject.setName(name);
        subject.setCode(code);
        subjectRepository.save(subject);
    }
    }

