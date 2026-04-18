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
        <p className="loading-overlay-sub">AskMyNotes × Study Copilot</p>
      </div>
    </div>
  );
}

type StudyTab = "notes" | "chat" | "study";
