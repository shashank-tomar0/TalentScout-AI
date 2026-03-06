const API = "http://localhost:8000";
const WS = "ws://localhost:8000";

export const API_URL = API;
export const WS_URL = WS;

export interface Candidate {
  id?: number;
  file_hash?: string;
  name: string | null;
  filename: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  github_username: string | null;
  github_verified: boolean;
  github_stats: { verified: boolean; repos: number; followers: number; last_active?: string } | null;
  score: number;
  skills: string[];
  skills_count: number;
  internships: number;
  projects: number;
  raw_text: string;
  hireability_summary: string | null;
  interview_questions: string[] | null;
  upsell_recommendations?: string[] | null;
  trust_score?: number | null;
  trust_reasoning?: string | null;
  prompt_injection_detected?: boolean;
  hidden_signal_detected?: boolean;
  soft_skills: string[] | null;
  culture_fit: number | null;
  company_values_present?: boolean;
  jd_present: boolean;
  jd_analysis: { jd_present: boolean; matches: string[]; missing: string[] } | null;
  score_breakdown: Record<string, { score: number; max: number; detail: string }> | null;
  is_locked?: boolean;
}

export async function fetchCandidates(userId: string): Promise<Candidate[]> {
  const res = await fetch(`${API}/candidates`, {
    headers: { "X-User-Id": userId },
  });
  if (!res.ok) throw new Error("Failed to fetch candidates");
  return res.json();
}

export async function deleteCandidates(userId: string): Promise<any> {
  try {
    const res = await fetch(`${API}/candidates`, {
      method: "DELETE",
      headers: { "X-User-Id": userId },
    });
    if (!res.ok) throw new Error("Failed to delete from server");
    return res.json();
  } catch (err) {
    console.error("Purge Error:", err);
    throw err;
  }
}

export async function uploadResume(file: File, jdText?: string, companyValues?: string, userId?: string): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  if (jdText) form.append("jd_text", jdText);
  if (companyValues) form.append("company_values", companyValues);
  if (userId) form.append("user_id", userId);
  const headers: Record<string, string> = {};
  if (userId) headers["X-User-Id"] = userId;
  const res = await fetch(`${API}/upload`, {
    method: "POST",
    body: form,
    headers: headers
  });
  if (!res.ok) {
    const err: any = new Error("Upload failed");
    err.status = res.status;
    throw err;
  }
}

export async function generateEmail(
  name: string,
  type: "accept" | "reject",
  matchedSkills: string[],
  missingSkills: string[],
  jdPresent: boolean
): Promise<string> {
  const res = await fetch(`${API}/generate_email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      type,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      jd_present: jdPresent,
    }),
  });
  const d = await res.json();
  return d.email;
}

export async function generateJD(prompt: string): Promise<string> {
  const res = await fetch(`${API}/generate_jd`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const d = await res.json();
  return d.jd;
}

export async function chatWithResume(
  name: string,
  rawText: string,
  question: string
): Promise<string> {
  const res = await fetch(`${API}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, raw_text: rawText, question }),
  });
  const d = await res.json();
  return d.answer;
}

export interface ComparisonResult {
  winner: string;
  runner_up: string;
  comparison_matrix: Array<{ name: string; rank: number; kill_factor: string }>;
  arbitration_summary: string;
}

export async function compareCandidates(ids: number[], jdText: string = "", fileHashes: string[] = [], question: string = "", manualCandidates: any[] = []): Promise<ComparisonResult> {
  const res = await fetch(`${API}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_ids: ids, file_hashes: fileHashes, jd_text: jdText, question: question, manual_candidates: manualCandidates }),
  });
  return res.json();
}

export interface InterviewScript {
  script: Array<{ question: string; target: string }>;
}

export async function generateInterview(id: number | undefined, jdText: string = "", fileHash?: string): Promise<InterviewScript> {
  const res = await fetch(`${API}/generate_interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_id: id || null, file_hash: fileHash || null, jd_text: jdText }),
  });
  if (!res.ok) throw new Error("Interview generation failed");
  return res.json();
}

export async function generateOutreach(id: number | undefined, jdText: string = "", fileHash?: string): Promise<{ message: string }> {
  const res = await fetch(`${API}/generate_outreach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_id: id || null, file_hash: fileHash || null, jd_text: jdText }),
  });
  if (!res.ok) throw new Error("Outreach generation failed");
  return res.json();
}

export async function sendDirectEmail(toEmail: string, subject: string, body: string): Promise<{ message?: string; error?: string }> {
  try {
    const res = await fetch(`${API}/send_email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_email: toEmail, subject, body }),
    });
    return res.json();
  } catch (errValue: any) {
    return { error: errValue.message || "Network error" };
  }
}
