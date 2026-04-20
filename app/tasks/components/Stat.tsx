export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: tone,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(70,69,85,.45)",
          marginTop: 4,
        }}
      >
        {label}
      </span>
    </div>
  );
}
