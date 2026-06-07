export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>{title}</h2>
      {subtitle ? <p style={{ margin: "6px 0 0", color: "#9ca3af", fontSize: 13 }}>{subtitle}</p> : null}
    </div>
  );
}
