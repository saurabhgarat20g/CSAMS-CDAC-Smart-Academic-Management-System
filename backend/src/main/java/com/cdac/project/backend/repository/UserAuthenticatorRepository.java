package com.cdac.project.backend.repository;

import com.cdac.project.backend.entity.UserAuthenticator;
import com.cdac.project.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAuthenticatorRepository extends JpaRepository<UserAuthenticator, Long> {
    List<UserAuthenticator> findByUser(User user);
    Optional<UserAuthenticator> findByCredentialId(String credentialId);
}
