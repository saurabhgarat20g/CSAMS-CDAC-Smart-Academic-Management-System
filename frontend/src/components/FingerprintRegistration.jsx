import React, { useState, useContext } from 'react';
import WebAuthnService from '../services/webauthn.service';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const FingerprintRegistration = () => {
    const { user } = useContext(AuthContext);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEnroll = async () => {
        setMessage('');
        setError('');
        setLoading(true);
        try {
            await WebAuthnService.registerFingerprint(user);
            setMessage("Fingerprint enrolled successfully!");
        } catch (err) {
            console.error(err);
            setError("Enrollment failed: " + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm("Are you sure you want to clear your fingerprint registration? You'll need to re-enroll.")) return;
        setMessage('');
        setError('');
        try {
            const response = await api.delete('/webauthn/reset');
            setMessage(response.data);
        } catch (err) {
            console.error(err);
            setError("Reset failed: " + (err.response?.data || err.message));
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 mt-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.131A8 8 0 008 2.85M6.268 6.268a4.49 4.49 0 00-1.722 3.864c0 3.818 2.375 7.026 5.64 8.718"></path></svg>
                Biometric Enrollment
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                Register your device's fingerprint or FaceID for secure attendance marking. 
                Your biometric data never leaves this device.
            </p>

            {message && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded dark:bg-green-900/30 dark:text-green-400">{message}</div>}
            {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded dark:bg-red-900/30 dark:text-red-400">{error}</div>}

            <div className="space-y-3">
                <button
                    onClick={handleEnroll}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white transition shadow-md flex justify-center items-center gap-2
                        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                    `}
                >
                    {loading ? 'Waiting for Sensor...' : 'Enroll Fingerprint'}
                </button>
                <button
                    onClick={handleReset}
                    className="w-full py-2 px-4 rounded-lg font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition border border-red-200 dark:border-red-800"
                >
                    Clear Registration
                </button>
            </div>
        </div>
    );
};

export default FingerprintRegistration;
