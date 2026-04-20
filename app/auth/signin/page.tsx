"use client";

import { signIn } from "next-auth/react";

const STAR_COUNT = 60;

export default function SignInPage() {
  return (
    <div className="signin-root">
      <div aria-hidden="true" className="signin-nebula" />

      <div aria-hidden="true" className="signin-grid" />

      <div aria-hidden="true" className="signin-stars">
        {Array.from({ length: STAR_COUNT }).map((_, i) => {
          const seed = (i * 9301 + 49297) % 233280;
          const rand = seed / 233280;
          const x = rand * 100;
          const y = (i * 7331) % 100;
          const size = rand < 0.15 ? 2.5 : rand < 0.4 ? 1.6 : 1;
          const dur = 2 + rand * 3.5;
          const delay = rand * 4;
          return (
            <span
              key={i}
              className="signin-star"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      <div aria-hidden="true" className="signin-rings">
        <span className="signin-ring signin-ring-1" />
        <span className="signin-ring signin-ring-2" />
        <span className="signin-ring signin-ring-3" />
        <span className="signin-ring signin-ring-4" />
      </div>

      <div aria-hidden="true" className="signin-aurora" />

      <div className="signin-content">
        <div className="signin-logo-wrap">
          <span className="signin-logo-glow" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="my-own"
            className="signin-logo-img"
            width={168}
            height={168}
          />
        </div>

        <h1 className="signin-title">my-own</h1>
        <p className="signin-tagline">あなたの情報を、静かに整理する</p>

        <button
          className="signin-btn"
          onClick={() => signIn("github", { callbackUrl: "/" })}
        >
          <span className="signin-btn-shine" aria-hidden="true" />
          <svg
            className="signin-btn-icon"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span className="signin-btn-label">Continue with GitHub</span>
          <svg
            className="signin-btn-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>

        <div className="signin-meta">
          <span>Notes</span>
          <span className="signin-meta-dot" />
          <span>Links</span>
          <span className="signin-meta-dot" />
          <span>Tasks</span>
        </div>
      </div>

      <p className="signin-footer">Personal knowledge inbox · v2.0</p>
    </div>
  );
}
