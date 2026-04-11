"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createNote } from "../notes/actions";

export default function QuickCapture() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit() {
    const body = draft.trim();
    if (!body || isPending) return;
    startTransition(async () => {
      const result = await createNote(body);
      if (result.note) {
        setDraft("");
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <textarea
        className="w-full resize-none rounded-xl bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#3525cd]/20"
        placeholder="メモを書く..."
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => {
          e.currentTarget.rows = 4;
        }}
        onBlur={(e) => {
          if (!draft.trim()) e.currentTarget.rows = 2;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {saved ? "Saved!" : "Cmd+Enter で投稿"}
        </span>
        <button
          type="submit"
          disabled={!draft.trim() || isPending}
          className="rounded-full bg-gradient-to-r from-[#3525cd] to-[#4f46e5] px-5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
        >
          {isPending ? "保存中..." : "投稿"}
        </button>
      </div>
    </form>
  );
}
