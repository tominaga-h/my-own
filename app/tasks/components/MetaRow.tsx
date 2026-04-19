export function MetaRow({
  label,
  value,
  sub,
  tone,
  accent,
  accentDot,
  icon,
  last,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
  accent?: string;
  accentDot?: string;
  icon: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        boxShadow: last ? "none" : "inset 0 -1px 0 rgba(226,232,240,.55)",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 26,
          height: 26,
          borderRadius: 8,
          background: "rgba(255,255,255,.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(70,69,85,.55)",
          boxShadow: "inset 0 0 0 1px rgba(226,232,240,.7)",
        }}
      >
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </div>
      <span
        style={{
          flexShrink: 0,
          width: 88,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(70,69,85,.5)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        {accentDot && (
          <span
            style={{
              flexShrink: 0,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: accentDot,
            }}
          />
        )}
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: tone ?? "#191c1e",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>
        {sub && (
          <span style={{ fontSize: 11, color: "rgba(70,69,85,.45)" }}>
            {sub}
          </span>
        )}
      </div>
      {accent && (
        <span
          style={{
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: tone ?? "#ef4444",
          }}
        >
          {accent}
        </span>
      )}
    </div>
  );
}
