"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="hero-section relative flex flex-col items-center overflow-hidden px-6 pb-16 pt-20 sm:pb-20 sm:pt-6">
      {/* ── Ambient Orbs ── */}
      <div className="hero-orb hero-orb-notes" aria-hidden="true" />
      <div className="hero-orb hero-orb-links" aria-hidden="true" />
      <div className="hero-orb hero-orb-tasks" aria-hidden="true" />

      {/* ── Logo ── */}
      <div className="hero-logo-wrap relative z-10">
        <div className="hero-logo-glow" aria-hidden="true" />
        <Image
          src="/logo.svg"
          alt="my-own — Confluence"
          width={300}
          height={300}
          priority
          className="hero-logo relative z-10 drop-shadow-[0_0_40px_rgba(79,70,229,0.15)]"
        />
      </div>

      {/* ── Title ── */}
      <h1 className="hero-title relative z-10 mt-8 text-4xl font-bold tracking-tight sm:text-5xl">
        <span className="hero-title-gradient">my-own</span>
      </h1>

      {/* ── Tagline ── */}
      <p className="hero-tagline relative z-10 mt-4 max-w-md text-center text-base leading-relaxed text-slate-500 sm:text-lg">
        Notes, Links, Tasks — <br className="sm:hidden" />
        converging into your personal knowledge hub.
      </p>

      {/* ── Entity Pills ── */}
      <div className="hero-pills relative z-10 mt-8 flex items-center gap-3">
        <span className="hero-pill hero-pill-notes">
          <span className="hero-pill-dot hero-pill-dot-notes" />
          Notes
        </span>
        <span className="hero-pill-connector" aria-hidden="true" />
        <span className="hero-pill hero-pill-links">
          <span className="hero-pill-dot hero-pill-dot-links" />
          Links
        </span>
        <span className="hero-pill-connector" aria-hidden="true" />
        <span className="hero-pill hero-pill-tasks">
          <span className="hero-pill-dot hero-pill-dot-tasks" />
          Tasks
        </span>
      </div>

      {/* ── Bottom Fade ── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f7f9fb] to-transparent"
        aria-hidden="true"
      />
    </section>
  );
}
