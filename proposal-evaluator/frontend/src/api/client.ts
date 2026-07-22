// API client — เรียก Azure Functions ผ่าน SWA linked backend (/api relative)

export type Tier = "Critical" | "Important" | "Optional";
export type Verdict = "Strong" | "Adequate" | "Weak" | "Critical";
export type ScoreSource = "evaluated" | "reused";
export type Lang = "th" | "en";

export interface ScoreDetail {
  slide_section: string;
  tier: Tier;
  score_1_10: number;
  coverage: string;
}

export interface Recommendation {
  priority: Tier;
  rec_text: string;
  slide_ref: string;
}

export interface HistoryRow {
  ticket_no: string;
  version_no: number;
  status: string;
  score_source: ScoreSource | null;
  overall_score: number | null;
  verdict: Verdict | null;
  evaluated_at: string | null;
}

export interface CommentRow {
  submission_id: string | null;
  author: string;
  comment_text: string;
  created_at: string;
}

export interface ExistingInfo {
  ticket_no: string;
  latest_version: number;
  next_version: number;
  latest_score: number | null;
  latest_verdict: Verdict | null;
}

export interface PrepareResult {
  blob_url: string;
  filename: string;
  content_type: string;
  file_size: number;
  content_hash: string;
  text: string;
  suggested_client: string;
  suggested_project: string;
  existing: ExistingInfo | null; // null = โปรเจคใหม่
}

export interface EvaluationResult {
  thread_id: string;
  ticket_no: string;
  version_no: number;
  submission_id: string;
  score_source: ScoreSource;
  gate_note: string;
  lang: Lang;
  overall_score: number;
  verdict: Verdict;
  score_details: ScoreDetail[];
  recommendations: Recommendation[];
  skeleton_md: string;
  strengths: string[];
  gaps: string[];
  history: HistoryRow[];
  comments: CommentRow[];
  client_name?: string; // มาจาก /threads/{id} (เปิดจากหน้า list)
  project_name?: string;
  filename?: string;    // ไฟล์ต้นฉบับที่อัพโหลด (version ล่าสุด)
  file_url?: string;    // SAS URL เปิดไฟล์ต้นฉบับ (หมดอายุ ~4 ชม.)
}

export interface ProposalRow {
  thread_id: string;
  ticket_no: string;
  client_name: string | null;
  project_name: string | null;
  version_no: number;
  version_count: number;
  overall_score: number | null;
  verdict: Verdict | null;
  score_source: ScoreSource | null;
  evaluated_at: string | null;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}

/** F22 — upload + extract + detect + lookup (ยังไม่ประเมิน) */
export async function prepare(file: File): Promise<PrepareResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/prepare", { method: "POST", body: form });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}

/** F24/F25 — confirm client/project + เลือกภาษา output แล้วประเมิน (หรือ reuse) */
export async function evaluate(p: PrepareResult, client_name: string, project_name: string, lang: Lang): Promise<EvaluationResult> {
  return post<EvaluationResult>("/api/evaluate", {
    client_name,
    project_name,
    lang,
    text: p.text,
    content_hash: p.content_hash,
    blob_url: p.blob_url,
    filename: p.filename,
    content_type: p.content_type,
    file_size: p.file_size,
  });
}

/** F26 — add user comment */
export async function addComment(thread_id: string, submission_id: string, comment_text: string, author = "user") {
  return post<{ comments: CommentRow[] }>("/api/comments", { thread_id, submission_id, comment_text, author });
}

async function get<T>(url: string): Promise<T> {
  // no-store: ข้อมูล dynamic (settings/me/lists) ต้อง fresh เสมอ กัน browser cache ค่าเก่า
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}

/** F18/F19 — รายการทุก proposal (1 แถว/thread) */
export async function listProposals(): Promise<ProposalRow[]> {
  return get<ProposalRow[]>("/api/proposals");
}

/** F17 — ผลประเมินเต็มของ version ล่าสุดใน thread (shape เดียวกับ evaluate) */
export async function getThread(thread_id: string): Promise<EvaluationResult> {
  return get<EvaluationResult>(`/api/threads/${thread_id}`);
}

/* ---------- Proposal Library (F31-F33) ---------- */

export type DealOutcome = "Won" | "Lost" | "Pending";
export type VerifyStatus = "pending_verify" | "verified";
export type SyncStatus = "pending" | "synced" | "failed";
export type Confidence = "high" | "medium" | "low";

export interface Milestone { name: string; timeframe: string }
export interface ManpowerRow { role: string; count: number | null; man_days: number | null }

export interface LibraryRow {
  thread_id: string;
  ticket_no: string;
  client_name: string | null;
  project_name: string | null;
  price_amount: number | null;
  price_currency: string | null;
  cost_amount: number | null;
  cost_currency: string | null;
  duration_months: number | null;
  solution_type: string | null;
  industry: string | null;
  deal_outcome: DealOutcome | null;    // null = ยังไม่มี content record
  verify_status: VerifyStatus | null;
  content_stale: boolean | null;
  sync_status: SyncStatus | null;
  updated_at: string | null;
  version_no: number;
  overall_score: number | null;
  verdict: Verdict | null;
}

export interface LibraryItem {
  thread_id: string;
  ticket_no: string;
  client_name: string | null;
  project_name: string | null;
  price_amount: number | null;
  price_currency: string | null;
  cost_amount: number | null;
  cost_currency: string | null;
  duration_months: number | null;
  milestones: Milestone[];
  manpower: ManpowerRow[];
  solution_type: string | null;
  industry: string | null;
  deal_outcome: DealOutcome | null;
  source: "extracted" | "manual" | "pm_system" | null;
  field_confidence: Partial<Record<string, Confidence>>;
  content_stale: boolean | null;
  verify_status: VerifyStatus | null;
  verified_by: string | null;
  verified_at: string | null;
  sharepoint_url: string | null;
  sync_status: SyncStatus | null;
  updated_at: string | null;
  has_content: boolean;
  filename: string;
  file_url: string;
}

/** field ที่ PATCH ได้ (F33) */
export interface LibraryPatch {
  price_amount?: number | null;
  price_currency?: string | null;
  cost_amount?: number | null;
  cost_currency?: string | null;
  duration_months?: number | null;
  milestones?: Milestone[];
  manpower?: ManpowerRow[];
  solution_type?: string | null;
  industry?: string | null;
  deal_outcome?: DealOutcome;
  verify?: boolean;
  author?: string;
}

/* ---------- Dashboard (F42) ---------- */

export interface DashActionRow {
  thread_id: string;
  ticket_no: string;
  client_name: string | null;
  project_name: string | null;
  overall_score: number | null;
  verdict: Verdict | null;
  deal_outcome: DealOutcome | null;
  verify_status: VerifyStatus | null;
  content_stale: boolean;
  price_amount: number | null;
  price_currency: string | null;
}

export interface Dashboard {
  kpi: {
    total_proposals: number;
    avg_score: number | null;
    win_rate: number | null;   // 0-1
    won: number;
    lost: number;
    pending_deals: number;
    pipeline: { currency: string; amount: number }[];
    pending_verify: number;
  };
  verdict_breakdown: Record<Verdict, number>;
  score_trend: { month: string; avg_score: number; count: number; won: number; lost: number; win_rate: number | null }[];
  needs_attention: DashActionRow[];
  low_score: DashActionRow[];
}

/** F42 — สรุปภาพรวม Dashboard */
export async function getDashboard(): Promise<Dashboard> {
  return get<Dashboard>("/api/dashboard");
}

/* ---------- RBAC + Settings (F43-F46) ---------- */

export type Role = string;  // dynamic (R3) — role ใดๆ จาก dbo.Roles (ไม่ fix 4 ตัวแล้ว)
export type PageKey = "evaluate" | "proposals" | "library" | "dashboard" | "settings";

export interface Me {
  user_id: string | null;
  email: string | null;
  name: string;
  role: Role;
  authenticated: boolean;
  access: Record<PageKey, boolean>;
}

export interface AppUser {
  user_id: string;
  email: string;
  display_name: string | null;
  role: Role;
  created_at: string;
}

export interface MasterDataRow {
  id: string;
  category: "solution_type" | "industry";
  value: string;
  sort_order: number;
  active: boolean;
}

/** F43 — ตัวตน + role + สิทธิ์เข้าหน้า */
export async function getMe(): Promise<Me> {
  return get<Me>("/api/me");
}

/** F44 — รายชื่อ user (admin) */
export async function listUsers(): Promise<AppUser[]> {
  return get<AppUser[]>("/api/users");
}

/** F44 — pre-add user ด้วย email + role */
export async function addUser(email: string, role: Role): Promise<{ ok: boolean; users: AppUser[] }> {
  return post<{ ok: boolean; users: AppUser[] }>("/api/users", { email, role });
}

/** F44 — เปลี่ยน role */
export async function setUserRole(userId: string, role: Role): Promise<{ ok: boolean; users: AppUser[] }> {
  const res = await fetch(`/api/users/${userId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}

/** F45 — master data (Solution Type / Industry) */
export async function listMasterData(category?: string): Promise<MasterDataRow[]> {
  return get<MasterDataRow[]>(`/api/masterdata${category ? `?category=${category}` : ""}`);
}
export async function addMasterData(category: string, value: string): Promise<MasterDataRow[]> {
  return post<MasterDataRow[]>("/api/masterdata", { category, value });
}
export async function deleteMasterData(id: string): Promise<{ ok: boolean; items: MasterDataRow[] }> {
  const res = await fetch(`/api/masterdata/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}

/** F46/R2 — audit defaults + LLM provider (local config ฝัง env ฝั่ง backend ไม่ส่งค่ากลับ) */
export type LlmProvider = "azure" | "local";
export interface AppSettings {
  default_lang: string;
  default_currency: string;
  llm_provider: LlmProvider;
  local_llm_ready?: boolean;   // admin-only — env (base_url+model) ตั้งครบไหม
  local_llm_model?: string;    // admin-only — model จาก env (read-only)
}
export async function getSettings(): Promise<AppSettings> {
  return get<AppSettings>("/api/settings");
}
export async function putSettings(kv: Record<string, string>): Promise<AppSettings> {
  const res = await fetch("/api/settings", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kv),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}

/** R2 — รายชื่อ model จาก local LLM server ให้เลือกใน Settings (admin) */
export interface LlmModelsResp { ready: boolean; models: string[]; }
export async function getLlmModels(): Promise<LlmModelsResp> {
  return get<LlmModelsResp>("/api/llm/models");
}

/* ---------- Roles & Permissions (R3 — dynamic RBAC) ---------- */
export interface RoleRow {
  role_id: string;
  name: string;
  is_system: boolean;
  permissions: Record<string, boolean>;  // {page: canAccess}
  user_count: number;
}
export interface RolesResp { roles: RoleRow[]; pages: string[]; }

export async function getRoles(): Promise<RolesResp> {
  return get<RolesResp>("/api/roles");
}
export async function initRbac(): Promise<{ seeded_roles: string[]; pages: string[] }> {
  return post<{ seeded_roles: string[]; pages: string[] }>("/api/rbac-init", {});
}
export async function createRole(name: string): Promise<RolesResp> {
  return post<RolesResp>("/api/roles", { name });
}
export async function deleteRole(roleId: string): Promise<RolesResp> {
  const res = await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}
export async function setRolePermissions(roleId: string, permissions: Record<string, boolean>): Promise<RolesResp> {
  const res = await fetch(`/api/roles/${roleId}/permissions`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}

/* ---------- Presentation Coach (R4) ---------- */
export type Audience = "c_level" | "users" | "it" | "purchase" | "technical" | "non_technical";
/** preset: ส่ง audience key; custom: ส่ง audience="" + custom_audience ข้อความที่พิมพ์เอง */
export async function getPresentationCoach(thread_id: string, audience: Audience | "", custom_audience = ""): Promise<{ guideline: string }> {
  return post<{ guideline: string }>("/api/presentation-coach", { thread_id, audience, custom_audience });
}

/** F31 — รายการ Proposal Library (1 แถว/thread) */
export async function listLibrary(): Promise<LibraryRow[]> {
  return get<LibraryRow[]>("/api/library");
}

/** F32 — content เต็ม + ลิงก์ไฟล์ */
export async function getLibraryItem(thread_id: string): Promise<LibraryItem> {
  return get<LibraryItem>(`/api/library/${thread_id}`);
}

/** F33 — แก้/ยืนยัน project content */
export async function updateLibraryItem(thread_id: string, patch: LibraryPatch): Promise<LibraryItem> {
  const res = await fetch(`/api/library/${thread_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}
