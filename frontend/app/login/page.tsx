"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getStoredSessionToken, setStoredSession } from "@/src/lib/api";
import { ProjectLogo } from "@/src/components/ProjectLogo";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // If already logged in, skip the login page entirely
    useEffect(() => {
        if (getStoredSessionToken()) {
            router.replace("/research");
        }
    }, [router]);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError("");

        try {
            const result = await api<{
                user: { name: string; email: string };
                session: { token: string };
            }>("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            setStoredSession(result.session.token, result.user);
            router.push("/research");
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Login failed");
        }
    }