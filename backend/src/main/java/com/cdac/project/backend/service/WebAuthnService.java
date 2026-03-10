package com.cdac.project.backend.service;

import com.cdac.project.backend.entity.User;
import com.cdac.project.backend.entity.UserAuthenticator;
import com.cdac.project.backend.repository.UserAuthenticatorRepository;
import com.cdac.project.backend.repository.UserRepository;
import com.webauthn4j.WebAuthnManager;
import com.webauthn4j.converter.exception.DataConversionException;
import com.webauthn4j.converter.util.ObjectConverter;
import com.webauthn4j.data.RegistrationData;
import com.webauthn4j.data.RegistrationParameters;
import com.webauthn4j.data.RegistrationRequest;
import com.webauthn4j.data.AuthenticationData;
import com.webauthn4j.data.AuthenticationParameters;
import com.webauthn4j.data.AuthenticationRequest;
import com.webauthn4j.data.attestation.authenticator.COSEKey;
import com.webauthn4j.data.attestation.authenticator.AttestedCredentialData;
import com.webauthn4j.data.attestation.authenticator.AAGUID;
import com.webauthn4j.authenticator.AuthenticatorImpl;
import com.webauthn4j.authenticator.Authenticator;
import com.webauthn4j.data.client.Origin;
import com.webauthn4j.data.client.challenge.Challenge;
import com.webauthn4j.data.client.challenge.DefaultChallenge;
import com.webauthn4j.server.ServerProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebAuthnService {

    @Autowired
    private UserAuthenticatorRepository authenticatorRepository;

    @Autowired
    private UserRepository userRepository;

    private final WebAuthnManager webAuthnManager = WebAuthnManager.createNonStrictWebAuthnManager();
    private final ObjectConverter objectConverter = new ObjectConverter();

    // In-memory challenge store for MVP (Production should use Redis/DB)
    private final ConcurrentHashMap<Long, Challenge> challengeStore = new ConcurrentHashMap<>();

    // Dynamic origin and RP ID to support tunnels
    public byte[] startRegistration(Long userId) {
        Challenge challenge = new DefaultChallenge();
        challengeStore.put(userId, challenge);
        return challenge.getValue();
    }

    @Transactional
    public void finishRegistration(Long userId, String credentialId, String clientDataJSON, String attestationObject, String origin, String rpId) {
         try {
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
            
            // Write-Once Constraint: Check if user already has a registered authenticator
            List<UserAuthenticator> existing = authenticatorRepository.findByUser(user);
            if (!existing.isEmpty()) {
                throw new RuntimeException("Fingerprint already registered. Updates are not allowed.");
            }

            Challenge challenge = challengeStore.remove(userId);
            if (challenge == null) throw new RuntimeException("Challenge expired or not found");

            ServerProperty serverProperty = new ServerProperty(new Origin(origin), rpId, challenge, null);
            RegistrationRequest registrationRequest = new RegistrationRequest(
                    Base64.getUrlDecoder().decode(attestationObject),
                    Base64.getUrlDecoder().decode(clientDataJSON)
            );

            // Parse and Validate
            RegistrationData registrationData = webAuthnManager.parse(registrationRequest); 
            RegistrationParameters registrationParameters = new RegistrationParameters(serverProperty, null, false);
            webAuthnManager.validate(registrationData, registrationParameters);

            UserAuthenticator authenticator = new UserAuthenticator();
            authenticator.setUser(user);
            authenticator.setCredentialId(credentialId);
            authenticator.setCount(registrationData.getAttestationObject().getAuthenticatorData().getSignCount());
            authenticator.setAaguid(registrationData.getAttestationObject().getAuthenticatorData().getAttestedCredentialData().getAaguid().toString());
            
             // Correctly serialize COSEKey using our manual converter
             COSEKey coseKey = registrationData.getAttestationObject().getAuthenticatorData().getAttestedCredentialData().getCOSEKey();
             byte[] publicKey = objectConverter.getCborConverter().writeValueAsBytes(coseKey);
             authenticator.setPublicKey(Base64.getUrlEncoder().withoutPadding().encodeToString(publicKey));

            authenticatorRepository.save(authenticator);

        } catch (DataConversionException e) {
            throw new RuntimeException("Invalid data", e);
        }
    }

    public byte[] startAuthentication(Long userId) {
        Challenge challenge = new DefaultChallenge();
        challengeStore.put(userId, challenge);
        return challenge.getValue();
    }

    @Transactional
    public void finishAuthentication(Long userId, String credentialId, String clientDataJSON, String authenticatorData, String signature, String origin, String rpId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Challenge challenge = challengeStore.remove(userId);
        if (challenge == null) throw new RuntimeException("Challenge expired or not found");

        UserAuthenticator authenticator = authenticatorRepository.findByCredentialId(credentialId)
                .orElseThrow(() -> new RuntimeException("Authenticator not registered"));

        if (!authenticator.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Authenticator does not belong to user");
        }

        AuthenticationRequest authenticationRequest = new AuthenticationRequest(
                Base64.getUrlDecoder().decode(credentialId),
                Base64.getUrlDecoder().decode(authenticatorData),
                Base64.getUrlDecoder().decode(clientDataJSON),
                Base64.getUrlDecoder().decode(signature)
        );

        ServerProperty serverProperty = new ServerProperty(new Origin(origin), rpId, challenge, null);

        // Verification Logic
        try {
            AuthenticationData authenticationData = webAuthnManager.parse(authenticationRequest);

            // Reconstruct the Authenticator Instance
            byte[] publicKeyBytes = Base64.getUrlDecoder().decode(authenticator.getPublicKey());
            COSEKey coseKey = objectConverter.getCborConverter().readValue(publicKeyBytes, COSEKey.class);
            long counter = authenticator.getCount();
            
            // Construct AttestedCredentialData
            // NOTE: AAGUID constructor might vary. Trying string first.
            AAGUID aaguid = new AAGUID(authenticator.getAaguid()); 
            
            AttestedCredentialData attestedCredentialData = new AttestedCredentialData(aaguid, Base64.getUrlDecoder().decode(credentialId), coseKey);
            
            // Construct Authenticator object (Registered credential state)
            Authenticator authenticatorState = new AuthenticatorImpl(
                    attestedCredentialData,
                    null, // No attestation statement needing verification during auth
                    counter
            );

            List<byte[]> allowCredentials = Collections.singletonList(Base64.getUrlDecoder().decode(credentialId));
            
            // Validate using the reconstructed authenticator state
            AuthenticationParameters authenticationParameters = new AuthenticationParameters(
                    serverProperty,
                    authenticatorState, 
                    allowCredentials, 
                    false 
            );

            webAuthnManager.validate(authenticationData, authenticationParameters);
             
             // Update counter
             long newCount = authenticationData.getAuthenticatorData().getSignCount();
             authenticator.setCount(newCount);
             authenticatorRepository.save(authenticator);
             
        } catch (Exception e) {
             throw new RuntimeException("Auth verification failed: " + e.getMessage());
        }
    }

    @Transactional
    public void resetUserAuthenticators(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        List<UserAuthenticator> authenticators = authenticatorRepository.findByUser(user);
        authenticatorRepository.deleteAll(authenticators);
    }
}
