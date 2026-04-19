export function QuickBtn({
  kind,
  label,
  busy,
  disabled,
  onClick,
}: {
  kind: "done" | "closed" | "reopen";
  label: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const tones: Record<
    typeof kind,
    { bg: string; fg: string; shadow: string; icon: React.ReactNode }
  > = {
    done: {
      bg: "linear-gradient(90deg,#10b981,#059669)",
      fg: "#fff",
      shadow: "0 2px 10px rgba(16,185,129,.22)",
      icon: <path d="M20 6L9 17l-5-5" />,
    },
    closed: {
      bg: "rgba(242,244,246,.9)",
      fg: "#464555",
      shadow: "inset 0 0 0 1px rgba(226,232,240,.8)",
      icon: <path d="M18 6L6 18M6 6l12 12" />,
    },
    reopen: {
      bg: "rgba(238,242,255,.9)",
      fg: "#4f46e5",
      shadow: "inset 0 0 0 1px rgba(99,102,241,.3)",
      icon: (
        <>
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
        </>
      ),
    },
  };
  const t = tones[kind];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        minWidth: 140,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        padding: "9px 14px",
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: t.bg,
        color: t.fg,
        boxShadow: t.shadow,
        opacity: disabled && !busy ? 0.5 : 1,
      }}
    >
      {busy ? (
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "tasks-spin 1s linear infinite" }}
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      ) : (
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {t.icon}
        </svg>
      )}
      {label}
      <style>{`@keyframes tasks-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
