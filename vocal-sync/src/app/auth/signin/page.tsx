"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            setIsLoggingIn(true);
            signIn("token-login", {
                token,
                callbackUrl: "/",
                redirect: true
            }).catch(err => {
                console.error("SSO Login failed:", err);
                setError("SSO Authentication failed");
                setIsLoggingIn(false);
            });
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            await signIn("credentials", {
                username,
                password,
                callbackUrl: "/",
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="signin-page">
            <div className="signin-bg">
                <div className="signin-orb signin-orb-1" />
                <div className="signin-orb signin-orb-2" />
                <div className="signin-grid-overlay" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="signin-container"
            >
                <div className="signin-header">
                    <div className="signin-icon-box">
                        <ShieldCheck size={40} strokeWidth={1.5} />
                    </div>
                    <h1 className="signin-title">Vocal Sync</h1>
                    <p className="signin-subtitle">Secure access to audio studio</p>
                </div>

                <form onSubmit={handleSubmit} className="signin-form">
                    {error && <div style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}
                    <div className="signin-field">
                        <div className="signin-input-container">
                            <Mail size={18} className="signin-input-icon" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                className="signin-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="signin-field">
                        <div className="signin-input-container">
                            <Lock size={18} className="signin-input-icon" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="signin-input"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="signin-submit-btn"
                    >
                        {isLoggingIn ? "Authenticating..." : "Enter Studio"}
                    </button>
                    
                    <div className="signin-extra">
                        <span className="signin-link">Request Access</span>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignInContent />
        </Suspense>
    );
}
