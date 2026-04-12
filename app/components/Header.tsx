"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { useApiKey } from "../providers";

const navItems = [
  { href: "/tasks", label: "Tasks" },
  { href: "/notes", label: "Notes" },
  { href: "/links", label: "Links" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const apiKey = useApiKey();

  if (pathname === "/auth/signin") return null;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/dev/slack/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (!res.ok) throw new Error("sync failed");
      window.location.reload();
    } catch {
      setIsSyncing(false);
      alert("同期に失敗しました");
    }
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-white">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-5">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <Image src="/logo.svg" alt="my-own" width={45} height={45} />
            <span className="text-[15px] font-semibold tracking-tight text-slate-800 transition-colors group-hover:text-[#3525cd]">
              my-own
            </span>
          </Link>

          {/* Navigation + User */}
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1">
              {navItems.map(({ href, label }) => {
                const active = pathname?.startsWith(href) ?? false;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      "relative rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                      active
                        ? "bg-gradient-to-r from-[#3525cd] to-[#4f46e5] text-white shadow-[0_2px_12px_rgba(53,37,205,0.2)]"
                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {session?.user && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                aria-label="Slackを同期"
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
                {isSyncing ? "同期中…" : "同期"}
              </button>
            )}

            {session?.user && (
              <button
                onClick={() => signOut()}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tonal bottom edge — not a border, a gradient fade */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
    </header>
  );
}
