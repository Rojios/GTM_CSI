import { useState, useEffect } from "react";
import {
  prepare, evaluate, addComment, listProposals, getThread, getSubmissionStatus,
  listLibrary, getLibraryItem, updateLibraryItem, getDashboard,
  getMe, listUsers, addUser, setUserRole, listMasterData, addMasterData, deleteMasterData, getSettings, putSettings, getLlmModels,
  getRoles, initRbac, createRole, deleteRole, setRolePermissions, getPresentationCoach,
  type PrepareResult, type EvaluationResult, type HistoryRow, type Lang, type ProposalRow,
  type LibraryRow, type LibraryItem, type Milestone, type ManpowerRow, type DealOutcome,
  type Dashboard, type DashActionRow,
  type Me, type Role, type PageKey, type AppUser, type MasterDataRow,
  type AppSettings, type LlmProvider, type RoleRow, type Audience,
} from "./api/client";

/* ---------- helpers ---------- */
const verdictVar: Record<string, string> = {
  Strong: "var(--green)", Adequate: "var(--amber)", Weak: "var(--orange)", Critical: "var(--red)",
};
const verdictSoft: Record<string, string> = {
  Strong: "var(--green-soft)", Adequate: "var(--amber-soft)", Weak: "var(--orange-soft)", Critical: "var(--red-soft)",
};
function scoreVar(s: number): string {
  return s >= 8 ? "var(--green)" : s >= 6 ? "var(--amber)" : s >= 4 ? "var(--orange)" : "var(--red)";
}
function bySectionNo<T extends { slide_section: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (parseInt(a.slide_section, 10) || 0) - (parseInt(b.slide_section, 10) || 0));
}

/* ---------- nav (F38/F39) ---------- */
type Nav = "dashboard" | "evaluate" | "proposals" | "library" | "settings";
const NAV: { key: Nav; label: string; icon: JSX.Element }[] = [
  { key: "proposals", label: "Evaluation Resulted", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 6h11M8 12h11M8 18h11"/><circle cx="3.6" cy="6" r="1"/><circle cx="3.6" cy="12" r="1"/><circle cx="3.6" cy="18" r="1"/></svg> },
  { key: "library", label: "Proposal Library", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { key: "dashboard", label: "COS Dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg> },
  { key: "settings", label: "Settings", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg> },
];
const CsiLogo = () => (
  <img src="/logo.png" alt="CSI Groups" width={32} height={32} style={{ display: "block", objectFit: "contain" }} />
);

/* ---------- gauge ---------- */
function Gauge({ score, verdict }: { score: number; verdict: string }) {
  const C = 2 * Math.PI * 64;
  const offset = C * (1 - Math.max(0, Math.min(10, score)) / 10);
  const col = verdictVar[verdict] ?? scoreVar(score);
  return (
    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingLeft: 28, borderLeft: "1px solid var(--border)" }} className="hero-gauge">
      <div style={{ position: "relative", width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="80" cy="80" r="64" fill="none" stroke="var(--surface-2)" strokeWidth="14" />
          <circle cx="80" cy="80" r="64" fill="none" stroke={col} strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div className="num" style={{ fontSize: 42, fontWeight: 800, color: col, lineHeight: 1 }}>{score.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>/ 10</div>
        </div>
      </div>
      <span style={{ background: verdictSoft[verdict], color: col, padding: "6px 18px", borderRadius: 999, fontSize: 15, fontWeight: 800 }}>{verdict}</span>
    </div>
  );
}

/* ---------- trend chart (single series) ---------- */
function Trend({ history }: { history: HistoryRow[] }) {
  const pts = history.filter((h) => h.overall_score != null).map((h) => ({ v: h.version_no, s: Number(h.overall_score) }));
  const W = 640, x0 = 40, x1 = 620, yTop = 10, yBot = 150;
  const x = (i: number) => (pts.length <= 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (pts.length - 1));
  const y = (s: number) => yBot - (s / 10) * (yBot - yTop);
  const line = pts.map((p, i) => `${x(i)},${y(p.s)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} 180`} style={{ width: "100%", height: 180 }}>
      <line x1="40" y1="10" x2="40" y2="150" stroke="var(--border)" strokeWidth="1" />
      <line x1="40" y1="150" x2="620" y2="150" stroke="var(--border)" strokeWidth="1" />
      <text x="30" y="14" textAnchor="end" fontSize="11" fill="#94a1b5">10</text>
      <text x="30" y="84" textAnchor="end" fontSize="11" fill="#94a1b5">5</text>
      <text x="30" y="154" textAnchor="end" fontSize="11" fill="#94a1b5">0</text>
      <line x1="40" y1="80" x2="620" y2="80" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4" />
      {pts.length > 1 && <polyline points={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" />}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.s)} r="5" fill="var(--primary)" />
          <text x={x(i)} y="172" textAnchor="middle" fontSize="11.5" fill="var(--text-2)">v{p.v} · {p.s.toFixed(2)}</text>
        </g>
      ))}
    </svg>
  );
}

type TabKey = "history" | "score" | "recs" | "skeleton" | "sg" | "comments" | "coach";
const TABS: { key: TabKey; label: string }[] = [
  { key: "history", label: "History" },
  { key: "score", label: "Section Scores" },
  { key: "sg", label: "Strengths & Gaps" },
  { key: "recs", label: "Recommendations" },
  { key: "skeleton", label: "Skeleton" },
  { key: "coach", label: "Presentation Coach" },
  { key: "comments", label: "Comments" },
];
const TIER_ORDER: Record<string, number> = { Critical: 0, Important: 1, Optional: 2 };

/* ---------- proposals list sorting ---------- */
type SortKey = "ticket_no" | "client_name" | "project_name" | "version_no" | "version_count" | "overall_score" | "verdict" | "score_source" | "evaluated_at";
const PROP_COLS: { key: SortKey; label: string }[] = [
  { key: "ticket_no", label: "Ticket" },
  { key: "client_name", label: "Client" },
  { key: "project_name", label: "Project" },
  { key: "version_no", label: "Version" },
  { key: "overall_score", label: "Score" },
  { key: "verdict", label: "Verdict" },
  { key: "score_source", label: "Source" },
  { key: "evaluated_at", label: "Updated" },
];
const VERDICT_RANK: Record<string, number> = { Strong: 4, Adequate: 3, Weak: 2, Critical: 1 };
const NUM_DEFAULT_DESC: SortKey[] = ["version_no", "version_count", "overall_score", "verdict", "evaluated_at"];
function sortProposals(rows: ProposalRow[], key: SortKey, dir: "asc" | "desc"): ProposalRow[] {
  const sign = dir === "asc" ? 1 : -1;
  const numVal = (p: ProposalRow): number | null =>
    key === "overall_score" ? (p.overall_score != null ? Number(p.overall_score) : -1)
    : key === "version_no" ? p.version_no
    : key === "version_count" ? p.version_count
    : key === "verdict" ? (VERDICT_RANK[p.verdict ?? ""] ?? 0)
    : null;
  return [...rows].sort((a, b) => {
    const an = numVal(a), bn = numVal(b);
    if (an !== null && bn !== null) return (an - bn) * sign;
    const as = String(a[key] ?? "").toLowerCase();
    const bs = String(b[key] ?? "").toLowerCase();
    return (as < bs ? -1 : as > bs ? 1 : 0) * sign;
  });
}

/* ---------- Proposal Library helpers (F40/F41) ---------- */
const CONF_COLOR: Record<string, string> = { high: "var(--green)", medium: "var(--amber)", low: "var(--red)" };
function ConfChip({ c }: { c?: string }) {
  if (!c) return null;
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: CONF_COLOR[c] ?? "var(--text-3)", border: "1px solid currentColor", borderRadius: 999, padding: "1px 7px", marginLeft: 6 }}>{c}</span>;
}
const OUTCOME_COLOR: Record<string, string> = { Won: "var(--green)", Lost: "var(--red)", Pending: "var(--amber)" };
function fmtMoney(v: number | null, cur: string | null): string {
  return v == null ? "-" : `${Number(v).toLocaleString()} ${cur ?? ""}`.trim();
}
/* Library table sorting (คลิกหัว column) */
type LibSortKey = "ticket_no" | "client_name" | "project_name" | "industry" | "solution_type"
  | "price_amount" | "duration_months" | "deal_outcome" | "verify_status" | "overall_score";
const LIB_COLS: { key: LibSortKey; label: string }[] = [
  { key: "ticket_no", label: "Ticket" },
  { key: "client_name", label: "Client" },
  { key: "project_name", label: "Project" },
  { key: "industry", label: "Industry" },
  { key: "solution_type", label: "Solution" },
  { key: "price_amount", label: "Price" },
  { key: "duration_months", label: "Months" },
  { key: "deal_outcome", label: "Outcome" },
  { key: "verify_status", label: "Verify" },
  { key: "overall_score", label: "Score" },
];
const LIB_NUM_KEYS: LibSortKey[] = ["price_amount", "duration_months", "overall_score"];
function sortLibrary(rows: LibraryRow[], key: LibSortKey, dir: "asc" | "desc"): LibraryRow[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (LIB_NUM_KEYS.includes(key)) {
      // null อยู่ท้ายเสมอไม่ว่าจะ sort ทางไหน
      const an = a[key] != null ? Number(a[key]) : null;
      const bn = b[key] != null ? Number(b[key]) : null;
      if (an == null && bn == null) return 0;
      if (an == null) return 1;
      if (bn == null) return -1;
      return (an - bn) * sign;
    }
    const as = String(a[key] ?? "").toLowerCase();
    const bs = String(b[key] ?? "").toLowerCase();
    return (as < bs ? -1 : as > bs ? 1 : 0) * sign;
  });
}
function SyncBadge({ status }: { status: string | null }) {
  // F41 — M3 ยังไม่ deploy: pending = รอ SharePoint setup
  const label = status === "synced" ? "SharePoint ✓" : status === "failed" ? "Sync failed" : "SharePoint: pending";
  const col = status === "synced" ? "var(--green)" : status === "failed" ? "var(--red)" : "var(--text-3)";
  return <span style={{ fontSize: 11.5, fontWeight: 700, color: col, background: "var(--surface-2)", borderRadius: 999, padding: "3px 10px" }}>{label}</span>;
}

function LibraryDetail({ item, onBack, onSaved }: { item: LibraryItem; onBack: () => void; onSaved: (it: LibraryItem) => void }) {
  const [f, setF] = useState({
    price_amount: item.price_amount != null ? String(item.price_amount) : "",
    price_currency: item.price_currency ?? "",
    cost_amount: item.cost_amount != null ? String(item.cost_amount) : "",
    cost_currency: item.cost_currency ?? "",
    duration_months: item.duration_months != null ? String(item.duration_months) : "",
    solution_type: item.solution_type ?? "",
    industry: item.industry ?? "",
    deal_outcome: (item.deal_outcome ?? "Pending") as DealOutcome,
  });
  const [ms, setMs] = useState<Milestone[]>(item.milestones ?? []);
  const [mp, setMp] = useState<ManpowerRow[]>(item.manpower ?? []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const conf = item.field_confidence ?? {};
  const num = (s: string): number | null => (s.trim() === "" || isNaN(Number(s)) ? null : Number(s));

  async function save(verify: boolean) {
    setSaving(true); setErr(null);
    try {
      const updated = await updateLibraryItem(item.thread_id, {
        price_amount: num(f.price_amount), price_currency: f.price_currency.trim() || null,
        cost_amount: num(f.cost_amount), cost_currency: f.cost_currency.trim() || null,
        duration_months: num(f.duration_months),
        milestones: ms.filter((m) => m.name.trim()), manpower: mp.filter((m) => m.role.trim()),
        solution_type: f.solution_type.trim() || null, industry: f.industry.trim() || null,
        deal_outcome: f.deal_outcome, verify,
      });
      onSaved(updated);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setSaving(false); }
  }

  const field = (label: string, key: keyof typeof f, confKey?: string, placeholder = "", width?: string) => (
    <div style={{ width }}>
      <div className="field-label">{label}{confKey && <ConfChip c={conf[confKey]} />}</div>
      <input className="field" value={f[key] as string} placeholder={placeholder}
        onChange={(e) => setF({ ...f, [key]: e.target.value })} />
    </div>
  );

  return (
    <>
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 14, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        Proposal Library
      </button>

      <div className="card" style={{ padding: "24px 28px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <div className="num" style={{ fontSize: 24, fontWeight: 800 }}>{item.ticket_no}</div>
          <span className="pill" style={{ background: item.verify_status === "verified" ? "var(--green-soft)" : "var(--amber-soft)", color: item.verify_status === "verified" ? "var(--green)" : "var(--amber)" }}>
            {item.verify_status === "verified" ? "Verified" : "Pending verify"}
          </span>
          {!!item.content_stale && <span className="pill" style={{ background: "var(--orange-soft)", color: "var(--orange)" }}>New version — review needed</span>}
          <SyncBadge status={item.sync_status} />
          <div style={{ flex: 1 }} />
          {item.file_url && (
            <a href={item.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>Open file ↗</a>
          )}
          {item.sharepoint_url && (
            <a href={item.sharepoint_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>SharePoint ↗</a>
          )}
        </div>
        <div style={{ fontSize: 15 }}><span style={{ color: "var(--text-2)" }}>Client:</span> <b>{item.client_name || "-"}</b> <span style={{ color: "var(--text-3)", margin: "0 8px" }}>·</span> <span style={{ color: "var(--text-2)" }}>Project:</span> <b>{item.project_name || "-"}</b></div>
        {item.verify_status === "verified" && <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 4 }}>Verified by {item.verified_by} · {item.verified_at}</div>}
      </div>

      <div className="card card-pad" style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Commercial & Schedule</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1fr", gap: 14, marginBottom: 14 }}>
          {field("Price (proposed value)", "price_amount", "price", "e.g. 12500000")}
          {field("Currency", "price_currency", undefined, "THB")}
          {field("Cost (internal)", "cost_amount", "cost", "leave blank if unknown")}
          {field("Currency", "cost_currency", undefined, "THB")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
          {field("Duration (months)", "duration_months", "duration", "e.g. 8")}
          {field("Solution Type", "solution_type", "solution_type", "e.g. ERP Implementation")}
          {field("Industry", "industry", "industry", "e.g. Automotive")}
          <div>
            <div className="field-label">Deal Outcome</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["Won", "Lost", "Pending"] as DealOutcome[]).map((o) => (
                <button key={o} onClick={() => setF({ ...f, deal_outcome: o })}
                  style={{ flex: 1, padding: "9px 4px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700,
                    border: "1px solid " + (f.deal_outcome === o ? OUTCOME_COLOR[o] : "var(--border-strong)"),
                    background: f.deal_outcome === o ? "var(--surface-2)" : "var(--surface)",
                    color: f.deal_outcome === o ? OUTCOME_COLOR[o] : "var(--text-2)" }}>{o}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 22 }}>
        <div className="card card-pad">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Milestones<ConfChip c={conf["milestones"]} /></div>
          {ms.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input className="field" style={{ flex: 2 }} value={m.name} placeholder="Milestone"
                onChange={(e) => setMs(ms.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input className="field" style={{ flex: 1 }} value={m.timeframe} placeholder="Month 3 / Q2"
                onChange={(e) => setMs(ms.map((x, j) => (j === i ? { ...x, timeframe: e.target.value } : x)))} />
              <button className="btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setMs(ms.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button className="btn-ghost" style={{ padding: "6px 12px" }} onClick={() => setMs([...ms, { name: "", timeframe: "" }])}>+ Add milestone</button>
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Manpower<ConfChip c={conf["manpower"]} /></div>
          {mp.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input className="field" style={{ flex: 2 }} value={m.role} placeholder="Role"
                onChange={(e) => setMp(mp.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
              <input className="field" style={{ flex: 1 }} value={m.count ?? ""} placeholder="Count" type="number"
                onChange={(e) => setMp(mp.map((x, j) => (j === i ? { ...x, count: e.target.value === "" ? null : Number(e.target.value) } : x)))} />
              <input className="field" style={{ flex: 1 }} value={m.man_days ?? ""} placeholder="Man-days" type="number"
                onChange={(e) => setMp(mp.map((x, j) => (j === i ? { ...x, man_days: e.target.value === "" ? null : Number(e.target.value) } : x)))} />
              <button className="btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setMp(mp.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button className="btn-ghost" style={{ padding: "6px 12px" }} onClick={() => setMp([...mp, { role: "", count: null, man_days: null }])}>+ Add row</button>
        </div>
      </div>

      {err && <p style={{ color: "var(--red)" }}>Error: {err}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn-ghost" onClick={() => save(false)} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        <button className="btn" onClick={() => save(true)} disabled={saving}>{saving ? "Saving…" : "Save & Verify"}</button>
      </div>
    </>
  );
}

/* ---------- Dashboard (F42) ---------- */
function DonutVerdict({ data }: { data: Record<string, number> }) {
  const order = ["Strong", "Adequate", "Weak", "Critical"];
  const total = order.reduce((s, k) => s + (data[k] ?? 0), 0);
  const R = 60, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <g transform="rotate(-90 75 75)">
          {total === 0 && <circle cx="75" cy="75" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="20" />}
          {order.map((k) => {
            const v = data[k] ?? 0;
            if (!v) return null;
            const len = (v / total) * C;
            const seg = <circle key={k} cx="75" cy="75" r={R} fill="none" stroke={verdictVar[k]} strokeWidth="20"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />;
            acc += len;
            return seg;
          })}
        </g>
        <text x="75" y="70" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--text)">{total}</text>
        <text x="75" y="90" textAnchor="middle" fontSize="11" fill="var(--text-3)">proposals</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {order.map((k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: verdictVar[k], display: "inline-block" }} />
            <span style={{ color: "var(--text-2)", minWidth: 68 }}>{k}</span>
            <b>{data[k] ?? 0}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreWinTrend({ data }: { data: { month: string; avg_score: number; count: number; won: number; lost: number; win_rate: number | null }[] }) {
  if (data.length === 0) return <div style={{ color: "var(--text-3)", padding: "30px 0", textAlign: "center" }}>No data yet</div>;
  const W = 640, H = 210, x0 = 42, x1 = 596, yTop = 16, yBot = 168;
  const n = data.length;
  const x = (i: number) => (n <= 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1));
  const yScore = (s: number) => yBot - (s / 10) * (yBot - yTop);
  const yRate = (r: number) => yBot - r * (yBot - yTop); // r = 0..1
  const scorePts = data.map((d, i) => ({ x: x(i), y: yScore(d.avg_score), v: d.avg_score }));
  const ratePts = data.map((d, i) => ({ i, x: x(i), r: d.win_rate })).filter((p) => p.r != null) as { i: number; x: number; r: number }[];
  const scoreLine = scorePts.map((p) => `${p.x},${p.y}`).join(" ");
  const rateLine = ratePts.map((p) => `${p.x},${yRate(p.r)}`).join(" ");
  const hasRate = ratePts.length > 0;
  return (
    <div>
      <div style={{ display: "flex", gap: 18, marginBottom: 6, fontSize: 12.5 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 3, background: "var(--primary)", display: "inline-block", borderRadius: 2 }} /> Avg Score (left)</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 3, background: "var(--green)", display: "inline-block", borderRadius: 2 }} /> Win-Rate (right)</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 210 }}>
        {[0, 5, 10].map((s) => (
          <g key={s}>
            <line x1={x0} y1={yScore(s)} x2={x1} y2={yScore(s)} stroke="var(--border)" strokeWidth="1" strokeDasharray={s === 0 ? "0" : "3 4"} />
            <text x={x0 - 8} y={yScore(s) + 4} textAnchor="end" fontSize="11" fill="var(--primary)">{s}</text>
          </g>
        ))}
        {[0, 0.5, 1].map((r) => (
          <text key={r} x={x1 + 8} y={yRate(r) + 4} textAnchor="start" fontSize="11" fill="var(--green)">{r * 100}%</text>
        ))}
        {/* score */}
        {n > 1 && <polyline points={scoreLine} fill="none" stroke="var(--primary)" strokeWidth="2.5" />}
        {scorePts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="var(--primary)" />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--primary)">{p.v.toFixed(2)}</text>
          </g>
        ))}
        {/* win-rate */}
        {ratePts.length > 1 && <polyline points={rateLine} fill="none" stroke="var(--green)" strokeWidth="2.5" />}
        {ratePts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={yRate(p.r)} r="4.5" fill="var(--green)" />
            <text x={p.x} y={yRate(p.r) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--green)">{(p.r * 100).toFixed(0)}%</text>
          </g>
        ))}
        {/* x labels */}
        {data.map((d, i) => (
          <text key={d.month} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11.5" fill="var(--text-2)">{d.month} · n={d.count}</text>
        ))}
      </svg>
      {!hasRate && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Win-Rate จะปรากฏเมื่อมี Deal Outcome (Won/Lost) — ตอนนี้ยังเป็น Pending ทั้งหมด</div>}
    </div>
  );
}

function KpiTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card card-pad" style={{ flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 6 }}>{label}</div>
      <div className="num" style={{ fontSize: 28, fontWeight: 800, color: color ?? "var(--text)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function DashboardView({ onOpen, onGoLibrary }: { onOpen: (id: string) => void; onGoLibrary: () => void }) {
  const [d, setD] = useState<Dashboard | null>(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let alive = true;
    setBusy(true); setErr(null);
    getDashboard()
      .then((r) => { if (alive) setD(r); })
      .catch((e) => { if (alive) setErr(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [reload]);

  if (busy) return <div style={{ color: "var(--text-3)", padding: "60px 0", textAlign: "center" }}>Loading…</div>;
  if (err) return <div className="card card-pad" style={{ color: "var(--red)", display: "flex", gap: 12, alignItems: "center" }}><span>Error: {err}</span><button className="btn-ghost" onClick={() => setReload((k) => k + 1)}>Retry</button></div>;
  if (!d) return null;

  const k = d.kpi;
  const pipeline = k.pipeline[0];
  const winPct = k.win_rate != null ? `${(k.win_rate * 100).toFixed(0)}%` : "-";

  const actionTable = (title: string, rows: DashActionRow[], empty: string, tag: (r: DashActionRow) => JSX.Element) => (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", fontSize: 15, fontWeight: 700, borderBottom: "1px solid var(--border)" }}>{title} <span style={{ color: "var(--text-3)", fontWeight: 500 }}>({rows.length})</span></div>
      {rows.length === 0
        ? <div style={{ padding: "24px 18px", color: "var(--text-3)", fontSize: 13.5 }}>{empty}</div>
        : <table className="tbl"><tbody>
            {rows.slice(0, 8).map((r) => (
              <tr key={r.thread_id} style={{ cursor: "pointer" }} onClick={() => onOpen(r.thread_id)}>
                <td className="num" style={{ fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap" }}>{r.ticket_no}</td>
                <td>{r.client_name || "-"}</td>
                <td style={{ textAlign: "right" }}>{tag(r)}</td>
              </tr>
            ))}
          </tbody></table>}
      {rows.length > 8 && <div style={{ padding: "10px 18px", fontSize: 12.5, color: "var(--text-3)" }}>+{rows.length - 8} more · <span style={{ color: "var(--primary)", cursor: "pointer" }} onClick={onGoLibrary}>open Library</span></div>}
    </div>
  );

  return (
    <>
      <div className="h-title">COS Dashboard</div>
      <div className="h-sub">Pipeline health and outstanding work across all evaluated proposals.</div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <KpiTile label="Total Proposals" value={String(k.total_proposals)} />
        <KpiTile label="Avg Score" value={k.avg_score != null ? k.avg_score.toFixed(2) : "-"} sub="latest per project" color={k.avg_score != null ? scoreVar(k.avg_score) : undefined} />
        <KpiTile label="Win Rate" value={winPct} sub={`${k.won} won · ${k.lost} lost · ${k.pending_deals} pending`} color={k.win_rate != null ? (k.win_rate >= 0.5 ? "var(--green)" : "var(--orange)") : undefined} />
        <KpiTile label="Pipeline Value" value={pipeline ? `${pipeline.amount.toLocaleString()}` : "-"} sub={pipeline ? `${pipeline.currency} · pending deals` : "no priced pending deals"} />
        <KpiTile label="Pending Verify" value={String(k.pending_verify)} sub="need review in Library" color={k.pending_verify > 0 ? "var(--amber)" : "var(--green)"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 22, marginBottom: 22 }}>
        <div className="card card-pad">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Verdict breakdown</div>
          <DonutVerdict data={d.verdict_breakdown} />
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Score &amp; Win-Rate trend</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 6 }}>by month · latest version per project</div>
          <ScoreWinTrend data={d.score_trend} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {actionTable("Needs attention", d.needs_attention, "All caught up — nothing pending.", (r) => (
          <span style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {r.verify_status === "pending_verify" && <span className="pill" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>verify</span>}
            {r.content_stale && <span className="pill" style={{ background: "var(--orange-soft)", color: "var(--orange)" }}>stale</span>}
            {r.deal_outcome === "Pending" && <span className="pill" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>outcome?</span>}
          </span>
        ))}
        {actionTable("Low-scoring proposals", d.low_score, "No Weak/Critical proposals.", (r) => (
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
            <b className="num" style={{ color: r.overall_score != null ? scoreVar(r.overall_score) : "var(--text-3)" }}>{r.overall_score != null ? r.overall_score.toFixed(2) : "-"}</b>
            <span style={{ color: verdictVar[r.verdict ?? ""] }}>{r.verdict ?? "-"}</span>
          </span>
        ))}
      </div>
    </>
  );
}

/* ---------- Settings (F44-F46) ---------- */
const ROLE_LABEL: Record<Role, string> = { user: "User", manager: "Manager", management: "Management", admin: "Master Admin" };

function MasterList({ category, title }: { category: "solution_type" | "industry"; title: string }) {
  const [rows, setRows] = useState<MasterDataRow[]>([]);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  useEffect(() => { listMasterData(category).then(setRows).catch((e) => setErr(String(e))); }, [category]);
  async function add() {
    if (!val.trim()) return;
    setBusy(true); setErr(null);
    try { const all = await addMasterData(category, val.trim()); setRows(all.filter((r) => r.category === category)); setVal(""); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }
  async function del(id: string) {
    setBusy(true);
    try { const r = await deleteMasterData(id); setRows(r.items.filter((x) => x.category === category)); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }
  return (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: show ? 12 : 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{title} <span style={{ color: "var(--text-3)", fontWeight: 500, fontSize: 12.5 }}>({rows.length})</span></span>
        <button className="btn-ghost" style={{ padding: "5px 14px", fontSize: 13 }} onClick={() => setShow((v) => !v)}>{show ? "ซ่อน" : "แสดง"}</button>
      </div>
      {show && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {rows.map((r) => (
              <span key={r.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface-2)", borderRadius: 999, padding: "5px 8px 5px 12px", fontSize: 13 }}>
                {r.value}
                <button className="btn-ghost" style={{ padding: "0 6px", lineHeight: 1 }} onClick={() => del(r.id)} disabled={busy} title="Remove">✕</button>
              </span>
            ))}
            {rows.length === 0 && <span style={{ color: "var(--text-3)", fontSize: 13 }}>ยังไม่มีรายการ</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="field" style={{ flex: 1 }} value={val} placeholder={`เพิ่ม ${title}…`} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <button className="btn" onClick={add} disabled={busy || !val.trim()}>Add</button>
          </div>
          {err && <p style={{ color: "var(--red)", margin: "8px 0 0" }}>Error: {err}</p>}
        </>
      )}
    </div>
  );
}

function AuditDefaults() {
  const [s, setS] = useState<AppSettings>({ default_lang: "th", default_currency: "THB", llm_provider: "azure" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  useEffect(() => { getSettings().then(setS).catch(() => {}); }, []);
  async function save() {
    setSaving(true); setMsg(null);
    try { setS(await putSettings({ default_lang: s.default_lang ?? "th", default_currency: s.default_currency ?? "THB" })); setMsg("บันทึกแล้ว"); }
    catch (e) { setMsg(e instanceof Error ? e.message : String(e)); } finally { setSaving(false); }
  }
  return (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: show ? 12 : 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Audit defaults</span>
        <button className="btn-ghost" style={{ padding: "5px 14px", fontSize: 13 }} onClick={() => setShow((v) => !v)}>{show ? "ซ่อน" : "แสดง"}</button>
      </div>
      {show && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 420 }}>
            <div>
              <div className="field-label">Default output language</div>
              <select className="field" value={s.default_lang ?? "th"} onChange={(e) => setS({ ...s, default_lang: e.target.value })}>
                <option value="th">Thai</option><option value="en">English</option>
              </select>
            </div>
            <div>
              <div className="field-label">Default currency</div>
              <input className="field" value={s.default_currency ?? "THB"} onChange={(e) => setS({ ...s, default_currency: e.target.value })} placeholder="THB" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
            <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save defaults"}</button>
            {msg && <span style={{ fontSize: 13, color: "var(--text-2)" }}>{msg}</span>}
          </div>
        </>
      )}
    </div>
  );
}

function UserManagement({ myEmail }: { myEmail: string | null }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("user");
  const [adding, setAdding] = useState(false);
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [show, setShow] = useState(false); // default ซ่อนรายละเอียด users
  useEffect(() => { listUsers().then(setUsers).catch((e) => setErr(e instanceof Error ? e.message : String(e))); }, []);
  useEffect(() => { getRoles().then((r) => setRoleNames(r.roles.map((x) => x.name))).catch(() => {}); }, []);
  async function change(userId: string, role: Role) {
    setBusyId(userId); setErr(null);
    try { const r = await setUserRole(userId, role); setUsers(r.users); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusyId(null); }
  }
  async function add() {
    if (!newEmail.includes("@")) { setErr("email ไม่ถูกต้อง"); return; }
    setAdding(true); setErr(null);
    try { const r = await addUser(newEmail.trim(), newRole); setUsers(r.users); setNewEmail(""); setNewRole("user"); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setAdding(false); }
  }
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: show ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>User Management <span style={{ color: "var(--text-3)", fontWeight: 500, fontSize: 12.5 }}>({users.length})</span></span>
        <button className="btn-ghost" style={{ padding: "5px 14px", fontSize: 13 }} onClick={() => setShow((s) => !s)}>{show ? "ซ่อน" : "แสดง"}</button>
      </div>
      {show && (
        <>
          {err && <div style={{ padding: "10px 18px", color: "var(--red)" }}>Error: {err}</div>}
          <div style={{ display: "flex", gap: 8, padding: "14px 18px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", alignItems: "center" }}>
            <input className="field" style={{ flex: 2, minWidth: 220 }} value={newEmail} placeholder="เพิ่ม user ด้วย email (เช่น somchai@csigroups.com)"
              onChange={(e) => setNewEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <select className="field" style={{ width: 160 }} value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
              {roleNames.map((r) => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
            </select>
            <button className="btn" onClick={add} disabled={adding || !newEmail.includes("@")}>{adding ? "Adding…" : "Add user"}</button>
          </div>
          <table className="tbl">
            <thead><tr><th>User</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td style={{ fontWeight: 600 }}>{u.display_name || "-"}{u.email?.toLowerCase() === (myEmail ?? "").toLowerCase() && <span style={{ color: "var(--text-3)", fontWeight: 400 }}> (you)</span>}</td>
                  <td style={{ color: "var(--text-2)" }}>{u.email}</td>
                  <td style={{ width: 180 }}>
                    <select className="field" value={u.role} disabled={busyId === u.user_id} onChange={(e) => change(u.user_id, e.target.value as Role)}>
                      {roleNames.map((r) => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={3} style={{ padding: "24px 18px", color: "var(--text-3)" }}>ยังไม่มี user (จะปรากฏเมื่อมีคน login ผ่าน SSO)</td></tr>}
            </tbody>
          </table>
          <div style={{ padding: "12px 18px", fontSize: 12.5, color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
            กำหนดสิทธิ์ว่าแต่ละ role เห็นเมนูหน้าไหนได้ ที่ตาราง “Roles &amp; Permissions” ด้านล่าง
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- LLM Provider (R2) — สลับ Azure/Local + เลือก model จาก server (config ฝัง env) ---------- */
function LlmProviderSettings() {
  const [provider, setProvider] = useState<LlmProvider>("azure");
  const [selectedModel, setSelectedModel] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [ready, setReady] = useState(false);        // endpoint local (base_url env) พร้อมไหม
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setProvider(s.llm_provider ?? "azure");
      setSelectedModel(s.local_llm_model ?? "");
      setReady(!!s.local_llm_ready);
    }).catch(() => {});
  }, []);

  // โหลดรายชื่อ model จาก server เมื่อเลือก Local (ครั้งแรก)
  useEffect(() => {
    if (provider !== "local" || modelsLoaded) return;
    setLoadingModels(true);
    getLlmModels()
      .then((r) => { setReady(r.ready); setModels(r.models); setModelsLoaded(true); })
      .catch(() => {})
      .finally(() => setLoadingModels(false));
  }, [provider, modelsLoaded]);

  async function save() {
    setSaving(true); setMsg(null); setErr(null);
    try {
      const kv: Record<string, string> = { llm_provider: provider };
      if (provider === "local") kv.local_llm_model = selectedModel;
      const s = await putSettings(kv);
      setProvider(s.llm_provider ?? "azure"); setSelectedModel(s.local_llm_model ?? ""); setReady(!!s.local_llm_ready);
      setMsg("บันทึกแล้ว — มีผลทั้งระบบทันที");
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setSaving(false); }
  }

  return (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: show ? 14 : 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>LLM Provider</span>
        <button className="btn-ghost" style={{ padding: "5px 14px", fontSize: 13 }} onClick={() => setShow((v) => !v)}>{show ? "ซ่อน" : "แสดง"}</button>
      </div>
      {show && (
        <>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 14 }}>เครื่องมือ AI ที่ใช้ประเมิน proposal — สลับแล้วมีผลทั้งระบบทันที (endpoint/token ของ Local ตั้งที่ env ของ Function App)</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {(["azure", "local"] as LlmProvider[]).map((p) => (
          <button key={p} onClick={() => setProvider(p)}
            style={{ flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700,
              border: "1px solid " + (provider === p ? "var(--primary)" : "var(--border-strong)"),
              background: provider === p ? "var(--surface-2)" : "var(--surface)",
              color: provider === p ? "var(--primary)" : "var(--text-2)" }}>
            {p === "azure" ? "Azure OpenAI" : "Local LLM"}
          </button>
        ))}
      </div>
      {provider === "local" && (() => {
        // แสดง selectedModel เสมอแม้โหลด list ใหม่ไม่ได้ (network) -> Boss เห็น/save ค่าที่ตั้งไว้ได้
        const modelOptions = models.length > 0
          ? (selectedModel && !models.includes(selectedModel) ? [selectedModel, ...models] : models)
          : (selectedModel ? [selectedModel] : []);
        return (
          <div style={{ marginBottom: 14 }}>
            {loadingModels ? (
              <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลดรายการ model จาก server…</div>
            ) : !ready ? (
              <div style={{ fontSize: 12.5, color: "var(--red)" }}>⚠ Local endpoint ไม่พร้อม — ตั้ง env LOCAL_LLM_BASE_URL บน Function App</div>
            ) : modelOptions.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--red)" }}>⚠ โหลดรายการ model ไม่ได้ — Azure ต่อ server ไม่ถึง (ตรวจ firewall)</div>
            ) : (
              <>
                <div className="field-label" style={{ marginBottom: 8 }}>เลือก Model (เลือกได้ตัวเดียว)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {modelOptions.map((m) => (
                    <button key={m} onClick={() => setSelectedModel(m)}
                      style={{ padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 700,
                        border: "1px solid " + (selectedModel === m ? "var(--primary)" : "var(--border-strong)"),
                        background: selectedModel === m ? "var(--surface-2)" : "var(--surface)",
                        color: selectedModel === m ? "var(--primary)" : "var(--text-2)" }}>{m}</button>
                  ))}
                </div>
                {models.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--orange)", marginTop: 8 }}>
                    โหลด list model ใหม่จาก server ไม่ได้ (Azure ต่อไม่ถึง — ตรวจ firewall) · แสดงค่าที่ตั้งไว้เดิม
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn" onClick={save} disabled={saving || (provider === "local" && !selectedModel)}>{saving ? "Saving…" : "Save provider"}</button>
        {msg && <span style={{ fontSize: 13, color: "var(--green)" }}>{msg}</span>}
        {err && <span style={{ fontSize: 13, color: "var(--red)" }}>{err}</span>}
      </div>
        </>
      )}
    </div>
  );
}

/* ---------- Roles & Permissions (R3) — dynamic RBAC matrix (role x page) ---------- */
const PAGE_LABEL: Record<string, string> = {
  evaluate: "New Evaluation", proposals: "Evaluation Resulted", library: "Proposal Library",
  dashboard: "Dashboard", settings: "Settings", view_all: "เห็นทุกโปรเจค",
};
function RolesPermissions() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notInit, setNotInit] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [show, setShow] = useState(false);

  function apply(r: { roles: RoleRow[]; pages: string[] }) { setRoles(r.roles); setPages(r.pages); }
  useEffect(() => {
    getRoles().then((r) => { apply(r); setNotInit(r.roles.length === 0); })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoaded(true));
  }, []);

  async function run(fn: () => Promise<{ roles: RoleRow[]; pages: string[] }>) {
    setBusy(true); setErr(null);
    try { apply(await fn()); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  const togglePerm = (role: RoleRow, page: string) =>
    run(() => setRolePermissions(role.role_id, { ...role.permissions, [page]: !role.permissions[page] }));
  const delRole = (role: RoleRow) => run(() => deleteRole(role.role_id));
  const addRole = () => { if (newRole.trim()) run(async () => { const r = await createRole(newRole.trim()); setNewRole(""); return r; }); };
  async function doInit() {
    setBusy(true); setErr(null);
    try { await initRbac(); apply(await getRoles()); setNotInit(false); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div onClick={() => setShow((v) => !v)}
        style={{ padding: "14px 18px", borderBottom: show ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Roles &amp; Permissions<span style={{ color: "var(--text-3)", fontWeight: 500, fontSize: 12.5 }}> — กำหนดว่าแต่ละ role เห็นเมนูหน้าไหนได้</span></span>
        <button className="btn-ghost" style={{ padding: "5px 14px", fontSize: 13 }}>{show ? "ซ่อน" : "แสดง"}</button>
      </div>
      {show && (
        <>
      {err && <div style={{ padding: "10px 18px", color: "var(--red)" }}>Error: {err}</div>}
      {!loaded ? (
        <div style={{ padding: "18px", color: "var(--text-3)" }}>Loading…</div>
      ) : notInit ? (
        <div style={{ padding: "18px" }}>
          <div style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 12 }}>ยังไม่ได้ตั้งค่า RBAC — กดเพื่อสร้างตาราง role + ค่าเริ่มต้น (ทำครั้งเดียว)</div>
          <button className="btn" onClick={doInit} disabled={busy}>{busy ? "Initializing…" : "Initialize RBAC"}</button>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Role</th>
                  {pages.map((p) => <th key={p} style={{ textAlign: "center", whiteSpace: "nowrap" }}>{PAGE_LABEL[p] ?? p}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.role_id}>
                    <td style={{ fontWeight: 600 }}>
                      {role.name}{role.is_system && <span style={{ color: "var(--text-3)", fontWeight: 400, fontSize: 11 }}> (system)</span>}
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{role.user_count} users</div>
                    </td>
                    {pages.map((p) => (
                      <td key={p} style={{ textAlign: "center" }}>
                        <input type="checkbox" checked={!!role.permissions[p]} disabled={busy}
                          onChange={() => togglePerm(role, p)} style={{ cursor: "pointer", width: 16, height: 16 }} />
                      </td>
                    ))}
                    <td style={{ textAlign: "right" }}>
                      {!role.is_system && (
                        <button className="btn-ghost" style={{ padding: "4px 10px" }} disabled={busy || role.user_count > 0}
                          title={role.user_count > 0 ? "มี user ใช้อยู่ ย้าย role ก่อนลบ" : "ลบ role"} onClick={() => delRole(role)}>ลบ</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 8, padding: "14px 18px", borderTop: "1px solid var(--border)" }}>
            <input className="field" style={{ flex: 1 }} value={newRole} placeholder="เพิ่ม role ใหม่ (เช่น auditor)"
              onChange={(e) => setNewRole(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRole()} />
            <button className="btn" onClick={addRole} disabled={busy || !newRole.trim()}>Add role</button>
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}

function SettingsView({ me }: { me: Me }) {
  return (
    <>
      <div className="h-title">Settings</div>
      <div className="h-sub">Master data, audit defaults, and user access — Master Admin only.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <LlmProviderSettings />
        <UserManagement myEmail={me.email} />
        <RolesPermissions />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          <MasterList category="solution_type" title="Solution Type" />
          <MasterList category="industry" title="Industry" />
        </div>
        <AuditDefaults />
      </div>
    </>
  );
}

/* ---------- Presentation Coach (R4) — guideline การนำเสนอตามกลุ่มผู้ฟัง ---------- */
const AUDIENCES: { k: Audience; label: string }[] = [
  { k: "c_level", label: "C-Level (ผู้บริหาร)" },
  { k: "users", label: "Users (ผู้ใช้งาน)" },
  { k: "it", label: "IT" },
  { k: "purchase", label: "Purchase (จัดซื้อ)" },
  { k: "technical", label: "Technical" },
  { k: "non_technical", label: "Non-technical" },
];
function PresentationCoach({ threadId }: { threadId: string }) {
  const [audience, setAudience] = useState<Audience | "custom" | "">("");
  const [customText, setCustomText] = useState("");
  const [guideline, setGuideline] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function gen(a: Audience) {
    setAudience(a); setBusy(true); setErr(null); setGuideline("");
    try { const r = await getPresentationCoach(threadId, a); setGuideline(r.guideline); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  async function genCustom() {
    if (!customText.trim()) return;
    setAudience("custom"); setBusy(true); setErr(null); setGuideline("");
    try { const r = await getPresentationCoach(threadId, "", customText.trim()); setGuideline(r.guideline); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  return (
    <div className="card card-pad">
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Presentation Coach</div>
      <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 14 }}>เลือกกลุ่มผู้ฟัง เพื่อรับ guideline การนำเสนอที่เจาะจงระดับผู้ฟัง (อิงเนื้อหา proposal จริง)</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        {AUDIENCES.map((a) => (
          <button key={a.k} onClick={() => gen(a.k)} disabled={busy}
            style={{ padding: "10px 18px", borderRadius: 10, cursor: busy ? "default" : "pointer", fontSize: 14, fontWeight: 700,
              border: "1px solid " + (audience === a.k ? "var(--primary)" : "var(--border-strong)"),
              background: audience === a.k ? "var(--surface-2)" : "var(--surface)",
              color: audience === a.k ? "var(--primary)" : "var(--text-2)" }}>{a.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input className="field" style={{ flex: 1 }} value={customText} disabled={busy}
          placeholder="หรือพิมพ์กลุ่มผู้ฟังเอง เช่น คณะกรรมการจัดซื้อภาครัฐ, ทีมกฎหมาย…"
          onChange={(e) => setCustomText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && genCustom()} />
        <button className="btn" onClick={genCustom} disabled={busy || !customText.trim()}
          style={audience === "custom" ? { outline: "2px solid var(--primary)" } : undefined}>Generate</button>
      </div>
      {busy && <div style={{ color: "var(--text-3)", padding: "20px 0", textAlign: "center" }}>กำลังสร้าง guideline… (อาจใช้เวลาสักครู่)</div>}
      {err && <div style={{ color: "var(--red)" }}>Error: {err}</div>}
      {guideline && !busy && (
        <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "'IBM Plex Sans Thai', Inter, sans-serif", fontSize: 14, lineHeight: 1.6, color: "var(--text)" }}>{guideline}</pre>
      )}
      {!guideline && !busy && !err && <div style={{ color: "var(--text-3)", fontSize: 13 }}>ยังไม่ได้เลือกกลุ่มผู้ฟัง — กดปุ่มด้านบนเพื่อสร้าง guideline</div>}
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [me, setMe] = useState<Me | null>(null);
  const [nav, setNav] = useState<Nav>("evaluate");
  const [file, setFile] = useState<File | null>(null);
  const [prep, setPrep] = useState<PrepareResult | null>(null);
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [busy, setBusy] = useState<"" | "prepare" | "evaluate" | "comment">("");
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState<TabKey>("history");
  const [lang, setLang] = useState<Lang>("th"); // audit output language
  const [activeModel, setActiveModel] = useState(""); // LLM model ปัจจุบันที่จะใช้ประเมิน
  // R5 — โหมดเลือกโปรเจคใน confirm modal
  const [projectMode, setProjectMode] = useState<"existing" | "select" | "new">("new");
  const [selectedTid, setSelectedTid] = useState(""); // thread ที่เลือกจากรายชื่อ (mode select)
  const [modalProposals, setModalProposals] = useState<ProposalRow[]>([]);
  const [proposals, setProposals] = useState<ProposalRow[] | null>(null);
  const [listBusy, setListBusy] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("evaluated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dragOver, setDragOver] = useState(false);
  // Proposal Library (F39/F40)
  const [libRows, setLibRows] = useState<LibraryRow[] | null>(null);
  const [libBusy, setLibBusy] = useState(false);
  const [libError, setLibError] = useState<string | null>(null);
  const [libReload, setLibReload] = useState(0);
  const [libItem, setLibItem] = useState<LibraryItem | null>(null);
  const [search, setSearch] = useState(""); // topbar search — กรองทั้ง Evaluation Resulted และ Library
  const [libOutcome, setLibOutcome] = useState<"all" | DealOutcome>("all");
  const [libVerify, setLibVerify] = useState<"all" | "verified" | "pending_verify">("all");
  const [libSortKey, setLibSortKey] = useState<LibSortKey>("ticket_no");
  const [libSortDir, setLibSortDir] = useState<"asc" | "desc">("desc");

  // ดึงตัวตน + role + สิทธิ์เข้าหน้า (F43) จาก backend
  // SSO เปิดแล้ว: ยังไม่ login -> เด้งไป /login (SWA จัดการ redirect เป็นด่านแรก, นี่คือด่านสำรอง
  // กันกรณี token หมดอายุกลาง session หรือ path หลุด route protection)
  useEffect(() => {
    getMe()
      .then((m) => {
        if (!m.authenticated) { window.location.href = "/login"; return; }
        setMe(m);
        getSettings().then((s) => setActiveModel(s.active_model || "")).catch(() => {});
        // ถ้าหน้าเริ่มต้นไม่มีสิทธิ์ -> ย้ายไปหน้าแรกที่เข้าได้
        setNav((cur) => (m.access[cur as PageKey] ? cur : (["evaluate", "proposals", "library", "dashboard", "settings"] as PageKey[]).find((p) => m.access[p]) ?? "evaluate"));
      })
      .catch(() => { window.location.href = "/login"; });
  }, []);

  // กัน browser เปิดไฟล์เมื่อ drop นอก dropzone (default = navigate ไปเปิดไฟล์)
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => { window.removeEventListener("dragover", prevent); window.removeEventListener("drop", prevent); };
  }, []);

  function toggleSort(k: SortKey) {
    if (k === sortKey) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); return; }
    setSortKey(k);
    setSortDir(NUM_DEFAULT_DESC.includes(k) ? "desc" : "asc");
  }
  function toggleLibSort(k: LibSortKey) {
    if (k === libSortKey) { setLibSortDir((d) => (d === "asc" ? "desc" : "asc")); return; }
    setLibSortKey(k);
    setLibSortDir(LIB_NUM_KEYS.includes(k) ? "desc" : "asc");
  }

  // โหลด list เมื่ออยู่หน้า Proposals และยังไม่ได้เลือก thread ไหน (reloadKey = trigger retry)
  useEffect(() => {
    if (nav !== "proposals" || result) return;
    let alive = true;
    setListBusy(true); setListError(null);
    listProposals()
      .then((rows) => { if (alive) setProposals(rows); })
      .catch((e) => { if (alive) setListError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setListBusy(false); });
    return () => { alive = false; };
  }, [nav, result, reloadKey]);

  // โหลด Library list (F31)
  useEffect(() => {
    if (nav !== "library" || libItem) return;
    let alive = true;
    setLibBusy(true); setLibError(null);
    listLibrary()
      .then((rows) => { if (alive) setLibRows(rows); })
      .catch((e) => { if (alive) setLibError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLibBusy(false); });
    return () => { alive = false; };
  }, [nav, libItem, libReload]);

  async function openLibraryItem(threadId: string) {
    setLibBusy(true); setLibError(null);
    try { setLibItem(await getLibraryItem(threadId)); }
    catch (e) { setLibError(e instanceof Error ? e.message : String(e)); }
    finally { setLibBusy(false); }
  }

  async function openProposal(threadId: string) {
    setBusy("evaluate"); setError(null);
    try {
      const r = await getThread(threadId);
      setResult(r); setClient(r.client_name ?? ""); setProject(r.project_name ?? ""); setTab("history");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(""); }
  }
  function backToList() { setResult(null); setError(null); }

  async function onUpload() {
    if (!file) return;
    setBusy("prepare"); setError(null);
    try {
      const p = await prepare(file);
      setPrep(p); setClient(p.suggested_client); setProject(p.suggested_project);
      setProjectMode(p.existing ? "existing" : "new");  // R5 — เดิมถ้า detect เจอ, ไม่งั้นใหม่
      setSelectedTid(p.existing?.thread_id ?? "");
      listProposals("mine").then(setModalProposals).catch(() => {});  // dropdown = เฉพาะโปรเจคที่ user submit เอง
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(""); }
  }
  // poll สถานะ async eval (LLM) จนเสร็จ — ~ทุก 3 วิ สูงสุด ~10 นาที
  async function pollEvaluation(submissionId: string, threadId: string) {
    for (let i = 0; i < 200; i++) {
      await new Promise((res) => setTimeout(res, 3000));
      const st = await getSubmissionStatus(submissionId);
      if (st.status === "Evaluated") {
        const full = await getThread(threadId);
        setResult(full); setPrep(null); setTab("history"); setNav("proposals");
        return;
      }
      if (st.status === "Failed") throw new Error("การประเมินล้มเหลว — ลองใหม่อีกครั้ง");
    }
    throw new Error("ประเมินใช้เวลานานผิดปกติ — ดูผลที่หน้า Evaluation Resulted ภายหลัง");
  }
  async function onConfirm() {
    if (!prep) return;
    // R5 — resolve thread + client/project ตามโหมดที่เลือก
    let tid: string | undefined; let cn = client; let pn = project;
    if (projectMode === "existing" && prep.existing) {
      tid = prep.existing.thread_id; cn = prep.existing.client_name; pn = prep.existing.project_name;
    } else if (projectMode === "select") {
      if (!selectedTid) { setError("กรุณาเลือกโปรเจคจากรายชื่อ"); return; }
      tid = selectedTid;
      const sp = modalProposals.find((x) => x.thread_id === selectedTid);
      cn = sp?.client_name || client; pn = sp?.project_name || project;
    }
    if (!cn.trim() || !pn.trim()) { setError("ต้องมีชื่อ client และ project"); return; }
    setBusy("evaluate"); setError(null);
    try {
      const r = await evaluate(prep, cn, pn, lang, tid);
      if ("status" in r && r.status === "processing") {
        await pollEvaluation(r.submission_id, r.thread_id);  // LLM async -> poll จนเสร็จ
      } else {
        setResult(r as EvaluationResult); setPrep(null); setTab("history"); setNav("proposals");  // cache hit -> ทันที
      }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(""); }
  }
  async function onAddComment() {
    if (!result || !comment.trim()) return;
    setBusy("comment");
    try {
      const { comments } = await addComment(result.thread_id, result.submission_id, comment.trim());
      setResult({ ...result, comments }); setComment("");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(""); }
  }
  function goEvaluate() { setNav("evaluate"); setResult(null); setFile(null); setError(null); }

  const showResult = nav === "proposals" && result;
  const crumb = showResult
    ? <span className="crumb">Evaluation Resulted <span className="sep">/</span> <b className="num">{result!.ticket_no}</b></span>
    : nav === "library" && libItem
    ? <span className="crumb">Proposal Library <span className="sep">/</span> <b className="num">{libItem.ticket_no}</b></span>
    : nav === "evaluate"
    ? <span className="crumb">Evaluate <span className="sep">/</span> <b>Upload proposal</b></span>
    : <span className="crumb"><b>{NAV.find((n) => n.key === nav)?.label}</b></span>;

  return (
    <div data-theme={theme} className="shell">
      {/* ---------- Sidebar ---------- */}
      <aside className="sidebar">
        <div className="brand"><CsiLogo /><div><div className="brand-name">CSI GROUP</div><div className="brand-sub">COS Solution Audit</div></div></div>
        <div style={{ padding: "0 8px 14px", fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-.01em", lineHeight: 1.15 }}>Proposal Audit Agent</div>
        <button className="btn-new" onClick={goEvaluate} style={{ marginTop: 40 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>New Evaluation
        </button>
        <nav className="nav" style={{ marginTop: 20 }}>
          {NAV.filter((n) => !me || me.access[n.key as PageKey]).map((n) => (
            <button key={n.key} className={"nav-item" + ((nav === n.key || (n.key === "proposals" && showResult)) ? " active" : "")}
              onClick={() => { setNav(n.key); if (n.key === "proposals") setResult(null); if (n.key === "library") setLibItem(null); }}>
              {n.icon}{n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 6 }}>
            <div className="avatar">{(me?.name ?? "GU").slice(0, 2).toUpperCase()}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me?.name ?? "Guest"}</div>
              <div style={{ color: "#8494b0", fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me?.email ?? "not signed in"}</div>
            </div>
            {me && (
              <a href="/logout" title="Sign out" style={{ color: "#8494b0", display: "flex", flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>
              </a>
            )}
          </div>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="main">
        <header className="topbar">
          {crumb}
          <div style={{ flex: 1 }} />
          {/* search แสดงเฉพาะหน้า list ที่กรองได้จริง */}
          {((nav === "proposals" && !showResult) || (nav === "library" && !libItem)) && (
          <div className="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket, client…"
              style={{ border: "none", outline: "none", background: "transparent", flex: 1, minWidth: 0, font: "inherit", color: "var(--text)" }} />
            {search && <button onClick={() => setSearch("")} title="Clear" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-3)", fontSize: 13 }}>✕</button>}
          </div>
          )}
          <button className="icon-btn" onClick={() => setTheme(theme === "light" ? "dark" : "light")} title="Toggle theme">
            {theme === "light"
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg>}
          </button>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12.5 }}>RS</div>
        </header>

        <main className="content">
          {/* ===== Evaluate ===== */}
          {nav === "evaluate" && (
            <>
              <div className="h-title">New Proposal Audit</div>
              <div className="h-sub">Upload a PDF or PPTX — the system auto-detects the client/project name, then asks you to confirm before evaluating.</div>
              <div className="card card-pad" style={{ marginBottom: 22 }}>
                <label className={"dropzone" + (dragOver ? " dragover" : "")} style={{ cursor: "pointer" }}
                  onDragOver={(e) => { e.preventDefault(); if (!dragOver) setDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                  onDrop={(e) => {
                    e.preventDefault(); setDragOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f && /\.(pdf|pptx)$/i.test(f.name)) { setFile(f); setError(null); }
                    else if (f) setError("รองรับเฉพาะ .pdf และ .pptx");
                  }}>
                  <div className="dz-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V7M8.5 10.5 12 7l3.5 3.5"/><path d="M5 18a4 4 0 0 1 .5-8 6 6 0 0 1 11.6 1.5A3.5 3.5 0 0 1 18 18"/></svg></div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Drag &amp; drop a file here, or <span style={{ color: "var(--primary)" }}>browse</span></div>
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>Supports .pdf, .pptx · up to 25 MB</div>
                  <input type="file" accept=".pdf,.pptx" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
                {file && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                    <div className="file-chip" style={{ flex: 1 }}>
                      <div className="file-badge">{file.name.toLowerCase().endsWith(".pdf") ? "PDF" : "PPTX"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</div><div style={{ fontSize: 12, color: "var(--text-3)" }}>{(file.size / 1048576).toFixed(1)} MB · ready to upload</div></div>
                      <button className="btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setFile(null)}>✕</button>
                    </div>
                    <button className="btn" onClick={onUpload} disabled={busy !== ""}>
                      {busy === "prepare" ? "Reading…" : "Upload & Detect"}
                    </button>
                  </div>
                )}
                {error && <p style={{ color: "var(--red)" }}>Error: {error}</p>}
              </div>
            </>
          )}

          {/* ===== Result ===== */}
          {showResult && result && (
            <>
              <button className="btn-ghost" onClick={backToList} style={{ marginBottom: 14, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                All proposals
              </button>
              <div className="card" style={{ padding: "26px 28px", display: "flex", gap: 28, marginBottom: 22 }}>
                <div className="hero" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 10h18M8 7V5h8v2"/></svg>
                    </div>
                    <div className="num" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.01em" }}>{result.ticket_no}</div>
                    <span className={"pill " + (result.score_source === "reused" ? "pill-reused" : "pill-eval")}>
                      {result.score_source === "reused" ? "Reused score" : "Newly evaluated"}
                    </span>
                    <span className="pill" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{result.lang === "th" ? "TH" : "EN"}</span>
                  </div>
                  <div style={{ fontSize: 15, marginBottom: 6 }}><span style={{ color: "var(--text-2)" }}>Client:</span> <b>{client || "-"}</b> <span style={{ color: "var(--text-3)", margin: "0 8px" }}>·</span> <span style={{ color: "var(--text-2)" }}>Project:</span> <b>{project || "-"}</b></div>
                  <div style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 16 }}>Version <b style={{ color: "var(--text)" }}>v{result.version_no}</b> จาก {result.history.length} เวอร์ชัน{result.model_name && <> · Model: <b style={{ color: "var(--text)" }}>{result.model_name}</b></>}</div>
                  {result.gate_note && <div className="note" style={{ width: "fit-content" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.9" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.6" r=".7" fill="var(--primary)" stroke="none"/></svg><span>{result.gate_note}</span></div>}
                  {result.file_url && (
                    <a href={result.file_url} target="_blank" rel="noopener noreferrer" title={result.filename}
                      style={{ alignSelf: "center", marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 999, background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                      Open Latest Proposal
                    </a>
                  )}
                </div>
                <Gauge score={result.overall_score} verdict={result.verdict} />
              </div>

              <div className="tabs">
                {TABS.map((t) => (
                  <button key={t.key} className={"tab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
                    {t.label}{t.key === "comments" && result.comments.length > 0 ? ` (${result.comments.length})` : ""}
                  </button>
                ))}
              </div>

              {tab === "history" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <div className="card card-pad">
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Score across versions</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 12 }}>score 0–10 · single series</div>
                    <Trend history={result.history} />
                  </div>
                  <div className="card" style={{ overflow: "hidden" }}>
                    <table className="tbl"><thead><tr><th>Version</th><th>Score</th><th>Verdict</th><th>Source</th><th>Evaluated</th></tr></thead>
                      <tbody>{result.history.map((h, i) => (
                        <tr key={i}><td className="num">v{h.version_no}</td><td className="num">{h.overall_score != null ? Number(h.overall_score).toFixed(2) : "-"}</td>
                          <td style={{ color: verdictVar[h.verdict ?? ""] }}>{h.verdict ?? "-"}</td><td>{h.score_source ?? "-"}</td><td style={{ color: "var(--text-2)" }}>{h.evaluated_at ?? "-"}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "score" && (
                <div className="card" style={{ overflow: "hidden" }}>
                  <table className="tbl"><thead><tr><th style={{ width: "22%" }}>Section</th><th>Tier</th><th>Score</th><th style={{ width: "54%" }}>Coverage</th></tr></thead>
                    <tbody>{bySectionNo(result.score_details).map((d, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{d.slide_section}</td>
                        <td><span className={"tier tier-" + d.tier}>{d.tier}</span></td>
                        <td style={{ width: 90 }}><span className="num" style={{ fontWeight: 800, color: scoreVar(d.score_1_10) }}>{d.score_1_10}</span><div className="bar"><i style={{ width: `${d.score_1_10 * 10}%`, background: scoreVar(d.score_1_10) }} /></div></td>
                        <td style={{ color: "var(--text-2)", fontSize: 13 }}>{d.coverage}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}

              {tab === "recs" && (
                <div className="card card-pad">
                  {result.recommendations.length === 0 && <div style={{ color: "var(--text-3)" }}>No recommendations</div>}
                  {[...result.recommendations].sort((a, b) => (TIER_ORDER[a.priority] ?? 9) - (TIER_ORDER[b.priority] ?? 9)).map((r, i, arr) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <span className={"tier tier-" + r.priority} style={{ height: "fit-content" }}>{r.priority}</span>
                      <div><div style={{ fontSize: 14 }}>{r.rec_text}</div>{r.slide_ref && <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>{r.slide_ref}</div>}</div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "skeleton" && (
                <div className="card card-pad"><pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "'IBM Plex Sans Thai', Inter, sans-serif", fontSize: 14, lineHeight: 1.6, color: "var(--text)" }}>{result.skeleton_md}</pre></div>
              )}

              {tab === "sg" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
                  <div className="card card-pad"><div style={{ fontSize: 15, fontWeight: 700, color: "var(--green)", marginBottom: 10 }}>Strengths</div><ul style={{ margin: 0, paddingLeft: 18 }}>{result.strengths.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}{!result.strengths.length && <li style={{ color: "var(--text-3)" }}>-</li>}</ul></div>
                  <div className="card card-pad"><div style={{ fontSize: 15, fontWeight: 700, color: "var(--orange)", marginBottom: 10 }}>Gaps</div><ul style={{ margin: 0, paddingLeft: 18 }}>{result.gaps.map((g, i) => <li key={i} style={{ marginBottom: 6 }}>{g}</li>)}{!result.gaps.length && <li style={{ color: "var(--text-3)" }}>-</li>}</ul></div>
                </div>
              )}

              {tab === "comments" && (
                <div className="card card-pad">
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                    {result.comments.map((c, i) => (
                      <div key={i} style={{ display: "flex", gap: 10 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>{(c.author || "U").slice(0, 2).toUpperCase()}</div>
                        <div><div style={{ fontSize: 13 }}><b>{c.author}</b> <span style={{ color: "var(--text-3)" }}>· {c.created_at}</span></div><div style={{ fontSize: 14, marginTop: 2 }}>{c.comment_text}</div></div>
                      </div>
                    ))}
                    {!result.comments.length && <div style={{ color: "var(--text-3)" }}>No comments yet</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="field" style={{ flex: 1 }} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" onKeyDown={(e) => e.key === "Enter" && onAddComment()} />
                    <button className="btn" onClick={onAddComment} disabled={busy !== "" || !comment.trim()}>Add</button>
                  </div>
                </div>
              )}
              {tab === "coach" && <PresentationCoach threadId={result.thread_id} />}
            </>
          )}

          {/* ===== Proposals list ===== */}
          {nav === "proposals" && !showResult && (
            <>
              <div className="h-title">Evaluation Resulted</div>
              <div className="h-sub">{me && me.role === "user" ? "Proposals you submitted" : "All evaluated proposals"} — one row per project (ticket). Click a row to open its full audit and version history.</div>
              {listError && <div className="card card-pad" style={{ marginBottom: 16, color: "var(--red)", display: "flex", alignItems: "center", gap: 12 }}><span>Error: {listError}</span><button className="btn-ghost" onClick={() => setReloadKey((k) => k + 1)}>Retry</button></div>}
              {listBusy && <div style={{ color: "var(--text-3)", padding: "40px 0", textAlign: "center" }}>Loading…</div>}
              {!listBusy && proposals && proposals.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, color: "var(--text-3)", textAlign: "center", gap: 8 }}>
                  <div style={{ fontSize: 40 }}>📄</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-2)" }}>No proposals yet</div>
                  <div>Upload your first proposal to get started</div>
                  <button className="btn" style={{ marginTop: 10 }} onClick={goEvaluate}>New Evaluation</button>
                </div>
              )}
              {!listBusy && proposals && proposals.length > 0 && (() => {
                const q = search.trim().toLowerCase();
                const filtered = !q ? proposals : proposals.filter((p) =>
                  [p.ticket_no, p.client_name, p.project_name].some((v) => (v ?? "").toLowerCase().includes(q)));
                if (filtered.length === 0) return <div style={{ color: "var(--text-3)", padding: "40px 0", textAlign: "center" }}>No proposals match “{search}”</div>;
                return (
                <div className="card" style={{ overflow: "hidden" }}>
                  <table className="tbl">
                    <thead><tr>
                      {PROP_COLS.map((c) => (
                        <th key={c.key} onClick={() => toggleSort(c.key)} style={{ cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }} title="Click to sort">
                          {c.label}<span style={{ opacity: sortKey === c.key ? 1 : 0.25, marginLeft: 4 }}>{sortKey === c.key ? (sortDir === "asc" ? "▲" : "▼") : "▾"}</span>
                        </th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {sortProposals(filtered, sortKey, sortDir).map((p) => (
                        <tr key={p.thread_id} style={{ cursor: "pointer" }} onClick={() => openProposal(p.thread_id)}>
                          <td className="num" style={{ fontWeight: 700, color: "var(--primary)" }}>{p.ticket_no}</td>
                          <td>{p.client_name || "-"}</td>
                          <td>{p.project_name || "-"}</td>
                          <td className="num">v{p.version_no}</td>
                          <td className="num" style={{ fontWeight: 800, color: p.overall_score != null ? scoreVar(Number(p.overall_score)) : "var(--text-3)" }}>{p.overall_score != null ? Number(p.overall_score).toFixed(2) : "-"}</td>
                          <td style={{ color: verdictVar[p.verdict ?? ""] ?? "var(--text-3)" }}>{p.verdict ?? "-"}</td>
                          <td style={{ color: "var(--text-2)" }}>{p.score_source ?? "-"}</td>
                          <td style={{ color: "var(--text-2)" }}>{p.evaluated_at ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                );
              })()}
            </>
          )}

          {/* ===== Proposal Library (F39) ===== */}
          {nav === "library" && libItem && (
            <LibraryDetail item={libItem} onBack={() => setLibItem(null)} onSaved={(it) => { setLibItem(it); setLibReload((k) => k + 1); }} />
          )}
          {nav === "library" && !libItem && (
            <>
              <div className="h-title">Proposal Library</div>
              <div className="h-sub">Project content view — price, cost, schedule, manpower per proposal. Click a row to review and edit.</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <input className="field" style={{ flex: 2, minWidth: 220 }} value={search} placeholder="Search ticket, client, project, solution, industry…"
                  onChange={(e) => setSearch(e.target.value)} />
                <select className="field" style={{ width: 150 }} value={libOutcome} onChange={(e) => setLibOutcome(e.target.value as typeof libOutcome)}>
                  <option value="all">Outcome: all</option><option value="Won">Won</option><option value="Lost">Lost</option><option value="Pending">Pending</option>
                </select>
                <select className="field" style={{ width: 170 }} value={libVerify} onChange={(e) => setLibVerify(e.target.value as typeof libVerify)}>
                  <option value="all">Verify: all</option><option value="verified">Verified</option><option value="pending_verify">Pending verify</option>
                </select>
              </div>
              {libError && <div className="card card-pad" style={{ marginBottom: 16, color: "var(--red)", display: "flex", alignItems: "center", gap: 12 }}><span>Error: {libError}</span><button className="btn-ghost" onClick={() => setLibReload((k) => k + 1)}>Retry</button></div>}
              {libBusy && <div style={{ color: "var(--text-3)", padding: "40px 0", textAlign: "center" }}>Loading…</div>}
              {!libBusy && libRows && (() => {
                const q = search.trim().toLowerCase();
                const rows = libRows.filter((r) => {
                  if (libOutcome !== "all" && (r.deal_outcome ?? "Pending") !== libOutcome) return false;
                  if (libVerify !== "all" && (r.verify_status ?? "pending_verify") !== libVerify) return false;
                  if (!q) return true;
                  return [r.ticket_no, r.client_name, r.project_name, r.solution_type, r.industry]
                    .some((v) => (v ?? "").toLowerCase().includes(q));
                });
                if (rows.length === 0) return <div style={{ color: "var(--text-3)", padding: "40px 0", textAlign: "center" }}>No proposals match</div>;
                return (
                  <div className="card" style={{ overflow: "hidden" }}>
                    <table className="tbl">
                      <thead><tr>
                        {LIB_COLS.map((c) => (
                          <th key={c.key} onClick={() => toggleLibSort(c.key)} style={{ cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }} title="Click to sort">
                            {c.label}<span style={{ opacity: libSortKey === c.key ? 1 : 0.25, marginLeft: 4 }}>{libSortKey === c.key ? (libSortDir === "asc" ? "▲" : "▼") : "▾"}</span>
                          </th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {sortLibrary(rows, libSortKey, libSortDir).map((r) => (
                          <tr key={r.thread_id} style={{ cursor: "pointer" }} onClick={() => openLibraryItem(r.thread_id)}>
                            <td className="num" style={{ fontWeight: 700, color: "var(--primary)" }}>{r.ticket_no}</td>
                            <td>{r.client_name || "-"}</td>
                            <td>{r.project_name || "-"}</td>
                            <td>{r.industry || "-"}</td>
                            <td>{r.solution_type || "-"}</td>
                            <td className="num">{fmtMoney(r.price_amount, r.price_currency)}</td>
                            <td className="num">{r.duration_months ?? "-"}</td>
                            <td style={{ color: OUTCOME_COLOR[r.deal_outcome ?? "Pending"], fontWeight: 700 }}>{r.deal_outcome ?? "Pending"}</td>
                            <td>
                              {r.verify_status === "verified"
                                ? <span style={{ color: "var(--green)", fontWeight: 700 }}>✓{r.content_stale ? " (stale)" : ""}</span>
                                : <span style={{ color: "var(--amber)", fontWeight: 600 }}>{r.verify_status ? "pending" : "no data"}</span>}
                            </td>
                            <td className="num" style={{ fontWeight: 800, color: r.overall_score != null ? scoreVar(Number(r.overall_score)) : "var(--text-3)" }}>{r.overall_score != null ? Number(r.overall_score).toFixed(2) : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </>
          )}

          {/* ===== Dashboard (F42) ===== */}
          {nav === "dashboard" && (
            <DashboardView
              onOpen={(id) => { setLibItem(null); setNav("library"); openLibraryItem(id); }}
              onGoLibrary={() => { setLibItem(null); setNav("library"); }}
            />
          )}

          {/* ===== Settings (F44-F46) ===== */}
          {nav === "settings" && me && <SettingsView me={me} />}
        </main>
      </div>

      {/* ---------- Confirm modal ---------- */}
      {prep && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-head">
              <div style={{ fontSize: 18, fontWeight: 800 }}>Confirm before evaluating</div>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", marginTop: 3 }}>Detected the following from the file — you can edit before confirming.</div>
            </div>
            <div className="modal-body">
              <div>
                <div className="field-label">โปรเจค</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {(([["existing", "โปรเจคเดิม (ที่ตรวจพบ)"], ["select", "เลือกจากรายชื่อ"], ["new", "โปรเจคใหม่"]] as [typeof projectMode, string][])
                    .filter(([m]) => m !== "existing" || prep.existing)).map(([m, lbl]) => (
                    <button key={m} onClick={() => setProjectMode(m)}
                      style={{ padding: "8px 14px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700,
                        border: "1px solid " + (projectMode === m ? "var(--primary)" : "var(--border-strong)"),
                        background: projectMode === m ? "var(--primary-soft)" : "var(--surface)",
                        color: projectMode === m ? "var(--primary)" : "var(--text-2)" }}>{lbl}</button>
                  ))}
                </div>
                {projectMode === "existing" && prep.existing && (
                  <div style={{ fontSize: 13.5, color: "var(--text-2)", background: "var(--surface-2)", borderRadius: 9, padding: "10px 14px", lineHeight: 1.6 }}>
                    <b style={{ color: "var(--text)" }}>{prep.existing.client_name}</b> / <b style={{ color: "var(--text)" }}>{prep.existing.project_name}</b><br />
                    {prep.existing.ticket_no} · จะประเมินเป็นเวอร์ชัน v{prep.existing.next_version}
                  </div>
                )}
                {projectMode === "select" && (
                  <select className="field" value={selectedTid} onChange={(e) => setSelectedTid(e.target.value)}>
                    <option value="">— เลือกโปรเจคจากรายชื่อ —</option>
                    {modalProposals.map((pp) => (
                      <option key={pp.thread_id} value={pp.thread_id}>{pp.ticket_no} — {pp.client_name || "?"} / {pp.project_name || "?"}</option>
                    ))}
                  </select>
                )}
                {projectMode === "new" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div><div className="field-label">Client name {prep.suggested_client && <span className="pill-detected">detected</span>}</div><input className="field" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" /></div>
                    <div><div className="field-label">Project name {prep.suggested_project && <span className="pill-detected">detected</span>}</div><input className="field" value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project name" /></div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <div className="tile"><div className="tile-k">Ticket</div><div className="tile-v num">{prep.existing ? prep.existing.ticket_no : "New (issued on confirm)"}</div></div>
                <div className="tile"><div className="tile-k">Version</div><div className="tile-v">v{prep.existing ? prep.existing.next_version : 1}</div></div>
                <div className="tile"><div className="tile-k">AI Model</div><div className="tile-v">{activeModel || "—"}</div></div>
              </div>
              <div>
                <div className="field-label">Audit output language</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["th", "en"] as Lang[]).map((l) => (
                    <button key={l} onClick={() => setLang(l)}
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: 600,
                        border: "1px solid " + (lang === l ? "var(--primary)" : "var(--border-strong)"),
                        background: lang === l ? "var(--primary-soft)" : "var(--surface)",
                        color: lang === l ? "var(--primary)" : "var(--text-2)" }}>
                      {l === "th" ? "Thai" : "English"}
                    </button>
                  ))}
                </div>
              </div>
              {projectMode === "existing" && prep.existing && prep.existing.latest_score != null && (
                <div style={{ border: "1px solid var(--border)", borderRadius: 11, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, background: "var(--surface-2)" }}>
                  <div><div style={{ fontSize: 12, color: "var(--text-2)" }}>Previously submitted — latest score</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span className="num" style={{ fontSize: 28, fontWeight: 800, color: verdictVar[prep.existing.latest_verdict ?? ""] }}>{prep.existing.latest_score.toFixed(2)}</span>
                      <span style={{ fontSize: 13, color: "var(--text-3)" }}>/ 10</span>
                      <span style={{ marginLeft: 4, background: verdictSoft[prep.existing.latest_verdict ?? ""], color: verdictVar[prep.existing.latest_verdict ?? ""], padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{prep.existing.latest_verdict}</span>
                    </div>
                    {prep.existing.evaluated_at && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3 }}>ประเมินล่าสุด: {prep.existing.evaluated_at.slice(0, 16).replace("T", " ")}</div>}
                  </div>
                </div>
              )}
              <div className="note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.9" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.6" r=".7" fill="var(--primary)" stroke="none"/></svg>
                <span>{prep.existing ? "If the content is unchanged or the recommendations aren't addressed, the previous score is reused — upload improved content to get a new score." : "New project — a new ticket will be issued and evaluated as version 1."}</span>
              </div>
              {error && <p style={{ color: "var(--red)", margin: 0 }}>Error: {error}</p>}
            </div>
            {busy === "evaluate" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px", fontSize: 12.5, color: "var(--text-3)" }}>
                <span>⏳</span> กำลังประเมินด้วย AI — อาจใช้เวลาสักครู่ (โปรดอย่าปิดหน้านี้)
              </div>
            )}
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setPrep(null)} disabled={busy !== ""}>Cancel</button>
              <button className="btn" onClick={onConfirm} disabled={busy !== "" || (projectMode === "new" && (!client.trim() || !project.trim())) || (projectMode === "select" && !selectedTid)}>{busy === "evaluate" ? "Evaluating…" : "Confirm & Evaluate"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
