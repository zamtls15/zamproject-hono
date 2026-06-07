import { useState, useEffect, useCallback, useRef } from "react";
import { List } from "react-window";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const API = "http://localhost:8787";

// ─── TYPES ─────────────────────────────────────────────────────────────────
type Group   = { id: number; name: string };
type Gateway = { id: number; groupId: number; name: string; baseUrl: string; status: "ON" | "OFF" };
type Secret  = { id: number; gatewayId: number; keyName: string; envVar: string };
type Log     = { id: number; gatewayId: number | null; status: string; reason: string | null; createdAt: string | null };
type Toast   = { msg: string; ok: boolean } | null;

// ─── API HELPER ─────────────────────────────────────────────────────────────
async function api(method: string, path: string, body?: any) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── TOAST HOOK ─────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<Toast>(null);
  const show = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

// ─── CSS-IN-JS HELPERS ──────────────────────────────────────────────────────
const css = (obj: Record<string, any>) => obj as React.CSSProperties;

const T = {
  bg:        "#111111",
  surface:   "#191919",
  surface2:  "#1f1f1f",
  border:    "#2a2a2a",
  border2:   "#333333",
  text:      "#e2e8f0",
  muted:     "#737373",
  muted2:    "#555555",
  accent:    "#4f6ef7",
  accentDim: "rgba(79,110,247,0.12)",
  green:     "#4ade80",
  greenDim:  "rgba(74,222,128,0.10)",
  red:       "#f87171",
  redDim:    "rgba(248,113,113,0.10)",
  yellow:    "#fbbf24",
  yellowDim: "rgba(251,191,36,0.10)",
  white:     "#f0f2ff",
};

const S = {
  // Layout
  page:    css({ display: "flex", flexDirection: "column", height: "100vh", background: T.bg, color: T.text, fontFamily: "'SF Mono','JetBrains Mono','Fira Code',monospace", fontSize: 13, overflow: "hidden" }),
  body:    css({ display: "flex", flex: 1, overflow: "hidden" }),
  // Header
  hdr:     css({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 44, borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }),
  hdrLeft: css({ display: "flex", alignItems: "center", gap: 10 }),
  hdrTitle: css({ margin: 0, fontSize: 13, fontWeight: 700, color: T.white, letterSpacing: "0.04em" }),
  hdrBadge: css({ fontSize: 10, color: T.muted, background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 4, padding: "2px 7px" }),
  dot: (on: boolean) => css({ width: 7, height: 7, borderRadius: "50%", background: on ? T.green : T.red, flexShrink: 0, boxShadow: on ? `0 0 5px ${T.green}` : "none", transition: "background 0.3s" }),
  // Sidebar
  sidebar:  css({ width: 220, borderRight: `1px solid ${T.border}`, background: T.surface, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }),
  sbSection: css({ padding: "16px 8px 8px" }),
  sbLabel:  css({ fontSize: 10, color: T.muted2, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 8px", marginBottom: 4, fontWeight: 700, display: "block" }),
  sbItem: (active: boolean) => css({ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, cursor: "pointer", color: active ? T.accent : T.muted, background: active ? T.accentDim : "transparent", fontSize: 12, fontWeight: 500, transition: "all 0.12s", userSelect: "none", border: "none", width: "100%", fontFamily: "inherit", textAlign: "left" }),
  sbIcon:   css({ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }),
  sbCount:  (active: boolean) => css({ marginLeft: "auto", fontSize: 10, background: active ? T.accentDim : T.border2, color: active ? T.accent : T.muted, borderRadius: 10, padding: "1px 6px", fontWeight: 700 }),
  sbDivider: css({ height: 1, background: T.border, margin: "6px 16px" }),
  // Main
  main:     css({ flex: 1, overflowY: "auto" }),
  mainInner: css({ maxWidth: 720, padding: "28px 32px" }),
  pageHdr:  css({ marginBottom: 24 }),
  pageTitle: css({ fontSize: 20, fontWeight: 700, color: T.white, letterSpacing: "0.02em", marginBottom: 4 }),
  pageSub:  css({ fontSize: 11, color: T.muted }),
  // Cards
  card:     css({ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 16, overflow: "hidden" }),
  cardHead: css({ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }),
  cardTitle: css({ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }),
  cardBody: css({ padding: 14 }),
  // Form elements
  row:  css({ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }),
  inp:  css({ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 6, padding: "7px 10px", color: T.text, fontSize: 12, fontFamily: "inherit", flex: 1, minWidth: 100, outline: "none" }),
  btn: (variant?: "green" | "red" | "ghost") => css({
    background: variant === "green" ? T.greenDim : variant === "red" ? T.redDim : variant === "ghost" ? "transparent" : T.accentDim,
    color:      variant === "green" ? T.green   : variant === "red" ? T.red     : variant === "ghost" ? T.muted      : T.accent,
    border:     `1px solid ${variant === "green" ? T.green : variant === "red" ? T.red : variant === "ghost" ? T.border2 : T.accent}`,
    borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit",
    letterSpacing: "0.04em", whiteSpace: "nowrap", transition: "all 0.12s",
  }),
  btnSm: (variant?: "green" | "red" | "ghost") => css({
    background: variant === "green" ? T.greenDim : variant === "red" ? T.redDim : variant === "ghost" ? "transparent" : T.accentDim,
    color:      variant === "green" ? T.green   : variant === "red" ? T.red     : variant === "ghost" ? T.muted      : T.accent,
    border:     `1px solid ${variant === "green" ? T.green : variant === "red" ? T.red : variant === "ghost" ? T.border2 : T.accent}`,
    borderRadius: 6, padding: "5px 9px", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "inherit",
    letterSpacing: "0.04em", whiteSpace: "nowrap", transition: "all 0.12s",
  }),
  tag: (status: string) => {
    const s = status.toUpperCase();
    const on  = s === "ON" || s === "ALLOWED";
    const off = s === "OFF" || s === "BLOCKED";
    return css({ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
      background: on ? T.greenDim : off ? T.redDim : T.yellowDim,
      color:      on ? T.green    : off ? T.red    : T.yellow,
      border:     `1px solid ${on ? "rgba(74,222,128,0.3)" : off ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.3)"}`,
    });
  },
  // List items
  item:     css({ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 6, border: `1px solid ${T.border}`, marginBottom: 6, background: T.bg, flexWrap: "wrap" }),
  itemName: css({ fontSize: 13, fontWeight: 600, color: T.white }),
  itemSub:  css({ fontSize: 10, color: T.muted, marginTop: 2 }),
  itemActions: css({ display: "flex", gap: 6, marginLeft: "auto", flexShrink: 0 }),
  // Toggle
  filterBar: css({ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }),
  filterBtn: (active: boolean) => css({ background: active ? T.accentDim : "transparent", color: active ? T.accent : T.muted, border: `1px solid ${active ? "rgba(79,110,247,0.3)" : "transparent"}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", transition: "all 0.12s" }),
  // Section header
  sectionHdr:   css({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }),
  sectionLabel: css({ fontSize: 10, fontWeight: 700, color: T.muted2, letterSpacing: "0.1em", textTransform: "uppercase" }),
  // Logs
  logRow:  css({ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.border}`, marginBottom: 5, background: T.bg, flexWrap: "wrap" }),
  logTime: css({ fontSize: 10, color: T.muted, marginLeft: "auto" }),
  // Empty
  empty: css({ textAlign: "center", padding: "32px", color: T.muted2, fontSize: 11 }),
  // Toast
  toast: (ok: boolean) => css({ position: "fixed", bottom: 20, right: 20, background: ok ? T.greenDim : T.redDim, color: ok ? T.green : T.red, border: `1px solid ${ok ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 6, padding: "9px 16px", fontSize: 12, fontWeight: 600, zIndex: 9999, fontFamily: "inherit" }),
};

// ─── TOGGLE SWITCH ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={css({ position: "relative", width: 34, height: 18, flexShrink: 0, cursor: "pointer", display: "inline-block" })}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={css({ opacity: 0, width: 0, height: 0, position: "absolute" })} />
      <span style={css({ position: "absolute", inset: 0, background: checked ? T.green : T.border2, borderRadius: 9, transition: "background 0.2s" })} />
      <span style={css({ position: "absolute", top: 3, left: checked ? 19 : 3, width: 12, height: 12, background: checked ? "#fff" : T.muted, borderRadius: "50%", transition: "left 0.2s, background 0.2s" })} />
    </label>
  );
}

// ─── GROUPS TAB ─────────────────────────────────────────────────────────────
function GroupsTab({ show, onSelectGroup }: { show: (m: string, ok?: boolean) => void; onSelectGroup: (id: number) => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName]     = useState("");

  const load = useCallback(async () => {
    const r = await api("GET", "/gateway/groups");
    if (r.success) setGroups(r.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    const r = await api("POST", "/gateway/groups", { name });
    if (r.success) { show("Group created"); setName(""); load(); }
    else show(r.error || "Failed", false);
  };

  const del = async (id: number) => {
    await api("DELETE", `/gateway/groups/${id}`);
    show("Group deleted"); load();
  };

  return (
    <div>
      <div style={S.pageHdr}>
        <div style={S.pageTitle}>Groups</div>
        <div style={S.pageSub}>Organise gateways into named groups</div>
      </div>

      <div style={S.card}>
        <div style={S.cardHead}><span style={S.cardTitle}>New Group</span></div>
        <div style={S.cardBody}>
          <div style={S.row}>
            <input style={S.inp} placeholder="group-name" value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && create()} />
            <button style={S.btn()} onClick={create}>+ Create</button>
          </div>
        </div>
      </div>

      <div style={S.sectionHdr}>
        <span style={S.sectionLabel}>All Groups ({groups.length})</span>
      </div>

      {groups.length === 0 && <div style={S.empty}>No groups yet — create one above</div>}
      {groups.map(g => (
        <div key={g.id} style={S.item}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.itemName}>📁 {g.name}</div>
            <div style={S.itemSub}>id: {g.id}</div>
          </div>
          <div style={S.itemActions}>
            <button style={S.btnSm()} onClick={() => onSelectGroup(g.id)}>Open →</button>
            <button style={S.btnSm("red")} onClick={() => del(g.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── GATEWAYS TAB ───────────────────────────────────────────────────────────
function GatewaysTab({
  show, groups, initialGroupId, onSelectGateway,
}: {
  show: (m: string, ok?: boolean) => void;
  groups: Group[];
  initialGroupId: number | null;
  onSelectGateway: (gwId: number) => void;
}) {
  const [gateways, setGateways]       = useState<Gateway[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", baseUrl: "", groupId: "" });

  const loadGateways = useCallback(async (gid: number) => {
    const r = await api("GET", `/gateway/groups/${gid}/gateways`);
    if (r.success) setGateways(r.data);
  }, []);

  // when parent passes a group to jump to
  useEffect(() => {
    if (initialGroupId) {
      setSelectedGroup(initialGroupId);
      loadGateways(initialGroupId);
    } else if (groups.length && !selectedGroup) {
      setSelectedGroup(groups[0].id);
      loadGateways(groups[0].id);
    }
  }, [initialGroupId, groups, loadGateways]);

  const create = async () => {
    if (!form.name || !form.baseUrl || !form.groupId) { show("Fill all fields", false); return; }
    const r = await api("POST", `/gateway/groups/${form.groupId}/gateways`, {
      name: form.name, baseUrl: form.baseUrl, groupId: Number(form.groupId),
    });
    if (r.success) {
      show("Gateway created");
      setForm({ name: "", baseUrl: "", groupId: "" });
      if (selectedGroup) loadGateways(selectedGroup);
    } else show(r.error || "Failed", false);
  };

  const toggle = async (gw: Gateway, on: boolean) => {
    const newStatus = on ? "ON" : "OFF";
    const r = await api("PATCH", `/gateway/groups/${gw.groupId}/gateways/${gw.id}`, { status: newStatus });
    if (r.success) { show(`Gateway ${newStatus}`); if (selectedGroup) loadGateways(selectedGroup); }
    else show("Toggle failed", false);
  };

  const del = async (gw: Gateway) => {
    await api("DELETE", `/gateway/groups/${gw.groupId}/gateways/${gw.id}`);
    show("Gateway deleted"); if (selectedGroup) loadGateways(selectedGroup);
  };

  const selectGroup = (id: number) => {
    setSelectedGroup(id);
    loadGateways(id);
  };

  return (
    <div>
      <div style={S.pageHdr}>
        <div style={S.pageTitle}>Gateways</div>
        <div style={S.pageSub}>Proxy endpoints within a group</div>
      </div>

      <div style={S.card}>
        <div style={S.cardHead}><span style={S.cardTitle}>New Gateway</span></div>
        <div style={S.cardBody}>
          <div style={S.row}>
            <input style={S.inp} placeholder="gateway-name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input style={S.inp} placeholder="https://api.example.com" value={form.baseUrl}
              onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} />
          </div>
          <div style={S.row}>
            <select style={{ ...S.inp, cursor: "pointer" }} value={form.groupId}
              onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}>
              <option value="">Select group</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button style={S.btn()} onClick={create}>+ Create</button>
          </div>
        </div>
      </div>

      {/* Group filter tabs */}
      {groups.length > 0 && (
        <div style={S.filterBar}>
          {groups.map(g => (
            <button key={g.id} style={S.filterBtn(selectedGroup === g.id)} onClick={() => selectGroup(g.id)}>
              📁 {g.name}
            </button>
          ))}
        </div>
      )}

      <div style={S.sectionHdr}>
        <span style={S.sectionLabel}>Gateways ({gateways.length})</span>
      </div>

      {gateways.length === 0 && <div style={S.empty}>{groups.length ? "No gateways in this group" : "Create a group first"}</div>}
      {gateways.map(gw => (
        <div key={gw.id} style={S.item}>
          <Toggle checked={gw.status === "ON"} onChange={on => toggle(gw, on)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={S.itemName}>🔀 {gw.name}</span>
              <span style={S.tag(gw.status)}>{gw.status}</span>
            </div>
            <div style={S.itemSub}>{gw.baseUrl}</div>
          </div>
          <div style={S.itemActions}>
            <button style={S.btnSm()} onClick={() => onSelectGateway(gw.id)}>Secrets →</button>
            <button style={S.btnSm("red")} onClick={() => del(gw)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SECRETS TAB ────────────────────────────────────────────────────────────
function SecretsTab({
  show, groups, initialGwId,
}: {
  show: (m: string, ok?: boolean) => void;
  groups: Group[];
  initialGwId: number | null;
}) {
  const [allGateways, setAllGateways] = useState<Gateway[]>([]);
  const [secrets, setSecrets]         = useState<Secret[]>([]);
  const [selectedGw, setSelectedGw]   = useState<number | null>(null);
  const [form, setForm] = useState({ keyName: "", envVar: "" });
  const loaded = useRef(false);

  const loadAllGateways = useCallback(async () => {
    const all: Gateway[] = [];
    for (const g of groups) {
      const r = await api("GET", `/gateway/groups/${g.id}/gateways`);
      if (r.success) all.push(...r.data);
    }
    setAllGateways(all);
    return all;
  }, [groups]);

  const loadSecrets = useCallback(async (gwId: number) => {
    const r = await api("GET", `/gateway/gateways/${gwId}/secrets`);
    if (r.success) setSecrets(r.data);
  }, []);

  useEffect(() => {
    if (!groups.length) return;
    loadAllGateways().then(all => {
      if (!loaded.current) {
        loaded.current = true;
        const target = initialGwId ?? (all[0]?.id ?? null);
        if (target) { setSelectedGw(target); loadSecrets(target); }
      }
    });
  }, [groups, initialGwId, loadAllGateways, loadSecrets]);

  const selectGw = (gwId: number) => {
    setSelectedGw(gwId);
    loadSecrets(gwId);
  };

  const create = async () => {
    if (!form.keyName || !form.envVar || !selectedGw) { show("Fill all fields", false); return; }
    const r = await api("POST", `/gateway/gateways/${selectedGw}/secrets`, form);
    if (r.success) {
      show("Secret added");
      setForm({ keyName: "", envVar: "" });
      loadSecrets(selectedGw);
    } else show(r.error || "Failed", false);
  };

  const del = async (id: number) => {
    await api("DELETE", `/gateway/gateways/${selectedGw}/secrets/${id}`);
    show("Secret deleted"); if (selectedGw) loadSecrets(selectedGw);
  };

  return (
    <div>
      <div style={S.pageHdr}>
        <div style={S.pageTitle}>Secrets</div>
        <div style={S.pageSub}>Header keys injected at proxy time</div>
      </div>

      <div style={S.card}>
        <div style={S.cardHead}><span style={S.cardTitle}>Add Secret</span></div>
        <div style={S.cardBody}>
          <div style={S.row}>
            <select style={{ ...S.inp, cursor: "pointer" }} value={selectedGw ?? ""}
              onChange={e => selectGw(Number(e.target.value))}>
              <option value="">Select gateway</option>
              {allGateways.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div style={S.row}>
            <input style={S.inp} placeholder="Header name (e.g. Authorization)" value={form.keyName}
              onChange={e => setForm(f => ({ ...f, keyName: e.target.value }))} />
            <input style={S.inp} placeholder="Env var (e.g. GITHUB_TOKEN)" value={form.envVar}
              onChange={e => setForm(f => ({ ...f, envVar: e.target.value }))} />
            <button style={S.btn()} onClick={create}>+ Add</button>
          </div>
        </div>
      </div>

      {/* Gateway filter tabs */}
      {allGateways.length > 0 && (
        <div style={S.filterBar}>
          {allGateways.map(gw => (
            <button key={gw.id} style={S.filterBtn(selectedGw === gw.id)} onClick={() => selectGw(gw.id)}>
              🔀 {gw.name}
            </button>
          ))}
        </div>
      )}

      <div style={S.sectionHdr}>
        <span style={S.sectionLabel}>Secrets ({secrets.length})</span>
      </div>

      {secrets.length === 0 && <div style={S.empty}>No secrets for this gateway</div>}
      {secrets.map(s => (
        <div key={s.id} style={S.item}>
          <div style={{ flex: 1 }}>
            <div style={S.itemName}>🔑 {s.keyName}</div>
            <div style={S.itemSub}>env: {s.envVar}</div>
          </div>
          <button style={S.btnSm("red")} onClick={() => del(s.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

// ─── LOGS TAB ───────────────────────────────────────────────────────────────
const MAX_LOGS = 1000;

function LogsTab() {
  const [logs, setLogs]         = useState<Log[]>([]);
  const [loading, setLoading]   = useState(false);
  const [gwFilter, setGwFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api("GET", "/gateway/logs");
    if (r.success) {
      const reversed = r.data.slice().reverse();
      setLogs(reversed.length > MAX_LOGS ? reversed.slice(0, MAX_LOGS) : reversed);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const gwIds = [...new Set(logs.map(l => l.gatewayId).filter(Boolean) as number[])];
  const filtered = gwFilter === "all" ? logs : logs.filter(l => String(l.gatewayId) === gwFilter);

  const LogRow = ({ index, style, logs }: { index: number; style: React.CSSProperties; logs: Log[] }) => {
    const log = logs[index];
    return (
      <div style={{ ...style, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, boxSizing: "border-box" }}>
        <span style={S.tag(log.status)}>{log.status}</span>
        <span style={{ fontSize: 11, color: T.muted }}>gw: {log.gatewayId ?? "—"}</span>
        {log.reason && <span style={{ fontSize: 11, color: T.muted2 }}>{log.reason}</span>}
        <span style={S.logTime}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}</span>
      </div>
    );
  };

  return (
    <div>
      <div style={S.pageHdr}>
        <div style={S.pageTitle}>Logs</div>
        <div style={S.pageSub}>Request history across all gateways</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div style={S.filterBar}>
          <button style={S.filterBtn(gwFilter === "all")} onClick={() => setGwFilter("all")}>All</button>
          {gwIds.map(id => (
            <button key={id} style={S.filterBtn(gwFilter === String(id))} onClick={() => setGwFilter(String(id))}>
              gw:{id}
            </button>
          ))}
        </div>
        <button style={S.btn("ghost")} onClick={load}>{loading ? "Loading…" : "↻ Refresh"}</button>
      </div>

      <div style={S.sectionHdr}>
        <span style={S.sectionLabel}>Recent Logs ({filtered.length})</span>
      </div>

      {filtered.length === 0 && <div style={S.empty}>No logs yet — make some requests first</div>}
      {filtered.length > 0 && (
        <List<{ logs: Log[] }>
          defaultHeight={600}
          rowCount={filtered.length}
          rowHeight={44}
          rowComponent={LogRow}
          rowProps={{ logs: filtered }}
          style={{ width: "100%", height: 600 }}
        />
      )}
    </div>
  );
}

// ─── PROXY TAB ──────────────────────────────────────────────────────────────
function ProxyTab({ show, groups }: { show: (m: string, ok?: boolean) => void; groups: Group[] }) {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [form, setForm]   = useState({ group: "", name: "", method: "POST", body: "" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadGateways = useCallback(async (groupName: string) => {
    const group = groups.find(g => g.name === groupName);
    if (!group) return;
    const r = await api("GET", `/gateway/groups/${group.id}/gateways`);
    if (r.success) setGateways(r.data);
  }, [groups]);

  useEffect(() => { if (form.group) loadGateways(form.group); }, [form.group, loadGateways]);

  const preview = form.group && form.name ? `${form.method} ${API}/gateway/${form.group}/${form.name}` : "";

  const run = async () => {
    if (!form.group || !form.name) return;
    setLoading(true); setResult(null);
    const start = Date.now();
    try {
      const opts: RequestInit = { method: form.method, headers: { "Content-Type": "application/json" } };
      if (form.body && form.method !== "GET") opts.body = form.body;
      const res = await fetch(`${API}/gateway/${form.group}/${form.name}`, opts);
      const data = await res.json().catch(() => ({}));
      setResult({ ok: res.ok, status: res.status, data, time: Date.now() - start });
      show(res.ok ? "Request succeeded" : "Request failed", res.ok);
    } catch (e: any) {
      setResult({ ok: false, status: 0, data: { error: e.message }, time: Date.now() - start });
      show("Request error", false);
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={S.pageHdr}>
        <div style={S.pageTitle}>Proxy Test</div>
        <div style={S.pageSub}>Send a live request through a gateway</div>
      </div>

      <div style={S.card}>
        <div style={S.cardHead}><span style={S.cardTitle}>Request</span></div>
        <div style={S.cardBody}>
          <div style={S.row}>
            <select style={{ ...S.inp, cursor: "pointer" }} value={form.group}
              onChange={e => setForm(f => ({ ...f, group: e.target.value, name: "" }))}>
              <option value="">Select group</option>
              {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
            <select style={{ ...S.inp, cursor: "pointer" }} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}>
              <option value="">Select gateway</option>
              {gateways.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
            <select style={{ ...S.inp, cursor: "pointer", maxWidth: 90 }} value={form.method}
              onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
              {["POST", "GET", "PATCH", "DELETE"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          {form.method !== "GET" && (
            <div style={S.row}>
              <textarea style={{ ...S.inp, minHeight: 72, resize: "vertical" }}
                placeholder='{"key": "value"}' value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {preview && <code style={{ fontSize: 10, color: T.muted, fontFamily: "inherit", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</code>}
            <button style={{ ...S.btn("green"), marginLeft: "auto" }} onClick={run} disabled={loading}>
              {loading ? "Running…" : "▶ Send"}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div style={{ ...S.card, border: `1px solid ${result.ok ? T.green : T.red}` }}>
          <div style={{ ...S.cardHead, borderColor: result.ok ? T.green : T.red }}>
            <span style={{ ...S.cardTitle, color: result.ok ? T.green : T.red }}>
              {result.ok ? "✓ Success" : "✗ Failed"} — HTTP {result.status}
            </span>
            <span style={{ fontSize: 10, color: T.muted }}>{result.time}ms</span>
          </div>
          <div style={S.cardBody}>
            <pre style={{ margin: 0, fontSize: 11, color: result.ok ? T.green : T.red, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 240, overflowY: "auto", fontFamily: "inherit", lineHeight: 1.5 }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR ITEM ───────────────────────────────────────────────────────────
function SbItem({ icon, label, count, active, onClick }: {
  icon: string; label: string; count?: number | null; active: boolean; onClick: () => void;
}) {
  return (
    <button style={S.sbItem(active)} onClick={onClick}>
      <span style={S.sbIcon}>{icon}</span>
      {label}
      {count !== undefined && <span style={S.sbCount(active)}>{count ?? "—"}</span>}
    </button>
  );
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
type Tab = "groups" | "gateways" | "secrets" | "proxy" | "logs";

export default function GatewayConfig() {
  const [tab, setTab]         = useState<Tab>("groups");
  const [online, setOnline]   = useState(false);
  const [groups, setGroups]   = useState<Group[]>([]);
  const [counts, setCounts]   = useState({ groups: 0, gateways: 0, secrets: 0, logs: 0 });
  const { toast, show }       = useToast();

  // navigation state passed down to tabs
  const [jumpGroupId,  setJumpGroupId]  = useState<number | null>(null);
  const [jumpGwId,     setJumpGwId]     = useState<number | null>(null);

  // health check + initial group load
  useEffect(() => {
    fetch(`${API}/health`).then(r => setOnline(r.ok)).catch(() => setOnline(false));
    loadGroups();
  }, []);

  const loadGroups = async () => {
    const r = await api("GET", "/gateway/groups");
    if (r.success) {
      setGroups(r.data);
      setCounts(c => ({ ...c, groups: r.data.length }));
    }
  };

  const goTo = (t: Tab) => setTab(t);

  const handleSelectGroup = (id: number) => {
    setJumpGroupId(id);
    goTo("gateways");
  };

  const handleSelectGateway = (gwId: number) => {
    setJumpGwId(gwId);
    goTo("secrets");
  };

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.hdr}>
        <div style={S.hdrLeft}>
          <div style={S.dot(online)} />
          <span style={S.hdrTitle}>Gateway Config</span>
        </div>
        <span style={S.hdrBadge}>{online ? `connected · ${API}` : `offline · ${API}`}</span>
      </div>

      <div style={S.body}>
        {/* ── Sidebar ── */}
        <div style={S.sidebar}>
          <div style={S.sbSection}>
            <span style={S.sbLabel}>Navigation</span>
            <SbItem icon="📁" label="Groups"   count={counts.groups}   active={tab === "groups"}   onClick={() => goTo("groups")} />
            <SbItem icon="🔀" label="Gateways" count={counts.gateways} active={tab === "gateways"} onClick={() => goTo("gateways")} />
            <SbItem icon="🔑" label="Secrets"  count={counts.secrets}  active={tab === "secrets"}  onClick={() => goTo("secrets")} />
            <div style={S.sbDivider} />
            <SbItem icon="🚀" label="Proxy Test"               active={tab === "proxy"} onClick={() => goTo("proxy")} />
            <SbItem icon="📋" label="Logs" count={counts.logs} active={tab === "logs"}  onClick={() => goTo("logs")} />
          </div>
        </div>

        {/* ── Main ── */}
        <div style={S.main}>
          <div style={S.mainInner}>
            {tab === "groups"   && <GroupsTab   show={show} onSelectGroup={handleSelectGroup} />}
            {tab === "gateways" && <GatewaysTab show={show} groups={groups} initialGroupId={jumpGroupId} onSelectGateway={handleSelectGateway} />}
            {tab === "secrets"  && <SecretsTab  show={show} groups={groups} initialGwId={jumpGwId} />}
            {tab === "proxy"    && <ProxyTab    show={show} groups={groups} />}
            {tab === "logs"     && <LogsTab />}
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && <div style={S.toast(toast.ok)}>{toast.ok ? "✓" : "✗"} {toast.msg}</div>}
    </div>
  );
}