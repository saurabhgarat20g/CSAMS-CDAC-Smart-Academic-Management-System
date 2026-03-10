import api from './api';

const bufferToBase64URLString = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let str = "";
    for (const charCode of bytes) {
        str += String.fromCharCode(charCode);
    }
    const base64String = btoa(str);
    return base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

const base64URLStringToBuffer = (base64URLString) => {
    const base64 = base64URLString.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const paddedBase64 = base64 + "=".repeat(padLen);
    const binaryString = atob(paddedBase64);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        buffer[i] = binaryString.charCodeAt(i);
    }
    return buffer.buffer;
};

const registerFingerprint = async (user) => {
    // 1. Start Registration - Get Options
    const startRes = await api.post('/webauthn/register/start');
    const challengeBuffer = base64URLStringToBuffer(startRes.data);
    
    // Convert user ID string to buffer
    const userIdBuffer = new TextEncoder().encode(String(user.id));

    const createOptions = {
        publicKey: {
            challenge: challengeBuffer,
            rp: {
                name: "CDAC Portal",
                id: "localhost" 
            },
            user: {
                id: userIdBuffer, 
                name: user.email,
                displayName: user.fullName || user.email
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 }, // ES256
                { type: "public-key", alg: -257 } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform", // Forces built-in fingerprint/faceid
                userVerification: "required"
            },
            timeout: 60000,
            attestation: "direct"
        }
    };

    // 2. Browser calls OS/Auth
    const credential = await navigator.credentials.create(createOptions);

    // 3. Finish Registration - Send response
    const attestationObject = bufferToBase64URLString(credential.response.attestationObject);
    const clientDataJSON = bufferToBase64URLString(credential.response.clientDataJSON);
    const credentialId = credential.id;

    return api.post('/webauthn/register/finish', {
        credentialId,
        clientDataJSON,
        attestationObject
    });
};

const verifyFingerprintAndMarkAttendance = async (token, lat, lng) => {
    // 1. Start Auth
    const startRes = await api.post('/webauthn/auth/start');
    // Backend returns challenge bytes base64 encoded
    const challengeBuffer = base64URLStringToBuffer(startRes.data);

    const getOptions = {
        publicKey: {
            challenge: challengeBuffer,
            rpId: "localhost",
            timeout: 60000,
            userVerification: "required"
        }
    };

    const assertion = await navigator.credentials.get(getOptions);

    const authenticatorData = bufferToBase64URLString(assertion.response.authenticatorData);
    const clientDataJSON = bufferToBase64URLString(assertion.response.clientDataJSON);
    const signature = bufferToBase64URLString(assertion.response.signature);
    const credentialId = assertion.id;

    // 2. Finish Auth & Mark
    return api.post('/webauthn/auth/finish', {
        credentialId,
        clientDataJSON,
        authenticatorData,
        signature,
        token, // QR Token
        lat,
        lng
    });
};

export default {
    registerFingerprint,
    verifyFingerprintAndMarkAttendance
};
