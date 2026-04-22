"use client";

import type { ViewMode } from "../../lib/links/viewMode";

type Props = {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
};

type Option = {
  mode: ViewMode;
  label: string;
};

const OPTIONS: Option[] = [
  { mode: "card", label: "カード" },
  { mode: "compact", label: "一覧" },
];

export default function LinksViewToggle({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="リンクの表示モード"
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
    >
      {OPTIONS.map((option) => {
        const selected = option.mode === value;
        return (
          <button
            key={option.mode}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${option.label}ビュー`}
            onClick={() => onChange(option.mode)}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-200",
              selected
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-500 hover:text-indigo-600",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
