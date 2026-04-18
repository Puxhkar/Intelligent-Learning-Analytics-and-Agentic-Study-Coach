"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, clearStoredSession, getStoredSessionToken, getStoredUser } from "@/src/lib/api";
import { ProjectLogo } from "@/src/components/ProjectLogo";

function LoadingOverlay({ label }: { label: string }) {
    return (
        <div className="loading-overlay">
            <div className="loading-overlay-card">
                <div className="loading-pencil-track">
                    <div className="loading-pencil-track-bar-border" />
                    <div className="loading-pencil-track-fill" />
                </div>
                <span className="loading-overlay-label">{label}</span>
                <p className="loading-overlay-sub">ResearchPilot × AskMyNotes</p>
            </div>
        </div>
    );
}

interface ResearchSource {
    title: string;
    url: string;
    snippet: string;
    domain: string;
    sourceType: string;
    credibility: number;
    publishedAt?: string | null;
}

interface ResearchReport {
    title: string;
    abstract: string;
    keyFindings: string[];
    sources: ResearchSource[];
    conclusion: string;
    followUpQuestions: string[];
    generatedAt: string;
}

interface ResearchResponse {
    sessionId: string;
    report: ResearchReport;
    workflow: {
        searchQuery: string;
        sourcesAnalyzed: number;
        warnings: string[];
        usedSessionMemory: boolean;
        modelUsed: string | null;
        stages: string[];
    };
}

interface TopicExpansion {
    expansions: string[];
    subtopics: string[];
    suggestedQuestions: string[];
}

interface HistoryItem {
    query: string;
    title: string;
    abstract: string;
    generatedAt: string;
    sessionId: string;
    sourceCount: number;
    warnings: string[];
}

function formatDate(value: string): string {
    return new Date(value).toLocaleString();
}

export default function ResearchPage() {
    const [query, setQuery] = useState("");
    const [sessionId, setSessionId] = useState(`research_${Date.now()}`);
    const [result, setResult] = useState<ResearchResponse | null>(null);
    const [expansion, setExpansion] = useState<TopicExpansion | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState("Working on it...");
    // Read stored user as state after mount to avoid SSR/hydration mismatch
    const [storedUser, setStoredUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        if (!getStoredSessionToken()) {
            window.location.href = "/login";
            return;
        }