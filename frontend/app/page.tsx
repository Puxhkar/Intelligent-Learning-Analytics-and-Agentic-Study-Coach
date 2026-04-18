"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, clearStoredSession, getStoredSessionToken, getStoredUser } from "@/src/lib/api";
import { ProjectLogo } from "@/src/components/ProjectLogo";

function FeatureCard({
  title,
  body,
  badge,
  tone
}: {
  title: string;
  body: string;
  badge: string;
  tone: "yellow" | "blue" | "rose";
}) {
  return (
    <article className={`sketch-card ${tone}`}>
      <div className="card-badge">{badge}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

export default function HomePage() {
  // null = not yet determined (SSR / first render), string = logged-in name, false = logged out
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getStoredSessionToken();

    if (token && storedUser) {
      setUser(storedUser);
      // Silently validate the token is still alive; if expired/invalid, clear it
      api<{ user: { name: string; email: string } }>("/api/auth/me").catch(() => {
        clearStoredSession();
        setUser(null);
      });
    }

    setHydrated(true);
  }, []);

function handleLogout() {
    api("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearStoredSession();
    setUser(null);
  }

  return (
    <main className="landing-shell">
      <div className="graph-paper" />
      <div className="landing-container">
        <nav className="landing-nav">
          <Link href="/" className="landing-brand">
            <ProjectLogo className="w-10 h-10" />
            <span>ResearchPilot x AskMyNotes</span>
          </Link>

          {/* Render nothing until after hydration to avoid SSR/localStorage flash */}
          {hydrated && (
            <div className="landing-nav-actions">
              {user ? (
                <>
                  <span className="landing-user-chip">👋 {user.name}</span>
                  <Link href="/research" className="sketch-btn primary">Go to Workspace</Link>
                  <button className="sketch-btn secondary" onClick={handleLogout}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="sketch-btn secondary">Sign In</Link>
                  <Link href="/register" className="sketch-btn primary">Open Workspace</Link>
                </>
              )}
            </div>
          )}
        </nav>
