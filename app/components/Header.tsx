"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/tasks", label: "Tasks" },
  { href: "/notes", label: "Notes" },
  { href: "/links", label: "Links" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === "/auth/signin") return null;

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-white">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-5">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#3525cd] to-[#4f46e5] text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(53,37,205,0.25)]">
              m
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-800 transition-colors group-hover:text-[#3525cd]">
              my-own
            </span>
          </Link>

          {/* Navigation + User */}
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1">
              {navItems.map(({ href, label }) => {
                const active = pathname.startsWith(href);
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
