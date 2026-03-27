"use client";

import AudioApp from "@/components/AudioApp";
import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, Suspense } from 'react';

function SessionInitializer() {
    const searchParams = useSearchParams();
    const { status } = useSession();
    const token = searchParams.get('token');

    useEffect(() => {
        if (status === "unauthenticated" && token) {
            console.log("[Auth] Attempting auto-login with token...");
            signIn("token-login", { token, redirect: false });
        }
    }, [status, token]);

    return null;
}

export default function Home() {
    return (
        <main className="min-h-screen">
            <Suspense fallback={null}>
                <SessionInitializer />
            </Suspense>
            <AudioApp />
        </main>
    );
}
