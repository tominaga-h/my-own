"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { mutate } from "swr";

import { useApiKey } from "../providers";
import { runAllSync } from "../../lib/sync";

const navItems = [
  { href: "/tasks", label: "Tasks" },
  { href: "/notes", label: "Notes" },
  { href: "/links", label: "Links" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const apiKey = useApiKey();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  if (pathname === "/auth/signin") return null;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const failures = await runAllSync(apiKey);
      if (failures.length > 0) {
        alert(`同期に失敗しました: ${failures.join(", ")}`);
        return;
      }
      // mount 中の SWR key を全て revalidate (notes / links / tasks)。
      // reload は使わない: クライアント状態を保ったまま最新データに差し替える。
      await mutate(() => true);
    } finally {
      setIsSyncing(false);
    }
  };

  const pillClass = (active: boolean) =>
    [
      "relative rounded-full px-4 py-1.5 text-sm font-medium transition-all",
      active
        ? "bg-gradient-to-r from-[#3525cd] to-[#4f46e5] text-white shadow-[0_2px_12px_rgba(53,37,205,0.2)]"
        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-white">
        <div className="mx-auto flex h-14 max-w-[1600px] flex-nowrap items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5">
          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <Image src="/logo.svg" alt="my-own" width={45} height={45} />
            <span className="hidden text-[15px] font-semibold tracking-tight text-slate-800 transition-colors group-hover:text-[#3525cd] sm:inline">
              my-own
            </span>
          </Link>

          {/* Navigation + User */}
          <div className="flex flex-nowrap items-center gap-1 sm:gap-3">
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map(({ href, label }) => {
                const active = pathname?.startsWith(href) ?? false;
                return (
                  <Link key={href} href={href} className={pillClass(active)}>
                    {label}
                  </Link>
                );
              })}
            </nav>

            {session?.user && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                aria-label="Slackとタスクを同期"
                className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSyncing ? (
                  <svg
                    className="h-3 w-3 animate-spin text-[#3525cd]"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeOpacity="0.2"
                    />
                    <path
                      d="M22 12a10 10 0 0 1-10 10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 12a9 9 0 1 1-3.2-6.9M21 4v5h-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                <span className="hidden sm:inline">
                  {isSyncing ? "同期中…" : "同期"}
                </span>
              </button>
            )}

            {session?.user && (
              <button
                onClick={() => signOut()}
                className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:inline-flex"
              >
                Sign out
              </button>
            )}

            {/* Hamburger (mobile only) */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label="メニュー"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 sm:hidden"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                {menuOpen ? (
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tonal bottom edge — not a border, a gradient fade */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="sm:hidden">
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 top-14 z-40 cursor-default bg-slate-900/20 backdrop-blur-sm"
          />
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="false"
            className="absolute inset-x-0 top-full z-50 border-b border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
          >
            <nav className="flex flex-col px-3 py-2">
              {navItems.map(({ href, label }) => {
                const active = pathname?.startsWith(href) ?? false;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                      active
                        ? "bg-gradient-to-r from-[#3525cd] to-[#4f46e5] text-white"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                );
              })}
              {session?.user && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="mt-1 rounded-xl px-4 py-3 text-left text-base font-medium text-slate-500 transition-colors hover:bg-slate-100"
                >
                  Sign out
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
