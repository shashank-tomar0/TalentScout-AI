"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Loader2, FileText, Upload, Users, Search, Brain, CheckCircle2, AlertTriangle, ChevronRight, X, Mail, Github, ExternalLink, Activity, Zap, Sparkles, LogOut, Send, Copy, Check, MessageSquare, Wand2, Settings2, Trash2, FileCheck2, ShieldAlert, Cpu, Award, Target, BookOpen, ArrowRight, Filter, History, Scan, Shield, TrendingUp, BarChart3, Download, Info, ChevronUp, ChevronDown, Eye, EyeOff, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import {
  Candidate, fetchCandidates, deleteCandidates,
  uploadResume, generateEmail, generateJD, chatWithResume,
  compareCandidates, generateInterview, generateOutreach, sendDirectEmail, ComparisonResult, InterviewScript,
  WS_URL, API_URL
} from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────
type ModalType = "email" | "chat" | "battle" | "interview" | "outreach" | "howItWorks" | null;

const ROLE_TEMPLATES: Record<string, string> = {
  "Software Engineer (Backend)": "Looking for a Backend Software Engineer with 2+ years experience in Python, Java, or Go. Must have experience with REST APIs, databases (SQL/NoSQL), microservices architecture, CI/CD pipelines, and cloud services (AWS/GCP/Azure). Experience with Docker and Kubernetes is a plus.",
  "Frontend Developer (React)": "Seeking a Frontend Developer proficient in React.js/Next.js, TypeScript, HTML5, CSS3. Must have experience with state management (Redux/Zustand), responsive design, REST/GraphQL APIs, and testing frameworks. Experience with Figma and design systems preferred.",
  "Data Scientist / ML Engineer": "Looking for a Data Scientist with expertise in Python, TensorFlow/PyTorch, scikit-learn, pandas, numpy. Must have experience with statistical analysis, machine learning models, data visualization, SQL, and deployment of ML models. Published research is a plus.",
  "DevOps / Cloud Engineer": "Seeking a DevOps Engineer with experience in AWS/GCP/Azure, Docker, Kubernetes, Terraform, CI/CD (Jenkins/GitHub Actions), Linux administration, monitoring (Prometheus/Grafana), and infrastructure as code.",
  "Full Stack Developer": "Looking for a Full Stack Developer with experience in React/Next.js frontend and Node.js/Python backend. Must know databases (PostgreSQL, MongoDB), REST/GraphQL APIs, authentication, deployment, and version control (Git).",
  "Mobile Developer": "Seeking a Mobile Developer with experience in React Native, Flutter, or native iOS/Android development. Must know state management, REST APIs, push notifications, app store deployment, and mobile UI/UX best practices.",
  "Cybersecurity Analyst": "Looking for a Cybersecurity Analyst with experience in penetration testing, vulnerability assessment, SIEM tools, incident response, network security, firewalls, and compliance frameworks (ISO 27001, NIST). Security certifications (CEH, CISSP) preferred.",
  "Product Manager": "Seeking a Product Manager with experience in agile methodologies, user research, roadmap planning, A/B testing, data-driven decision making, stakeholder management, and product analytics tools. Technical background preferred.",
};

const BREAKDOWN_LABELS: Record<string, string> = {
  internships: "Prior Internships",
  skills: "Technical Skills",
  projects: "Projects",
  cgpa: "CGPA / Academic",
  achievements: "Quantifiable Achievements",
  experience: "Work Experience",
  extra_curricular: "Extra-Curricular",
  degree: "Degree Quality",
  online_presence: "Online Presence",
  languages: "Language Fluency",
  college_rank: "College Tier",
  school_marks: "School Marks",
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [logs, setLogs] = useState<string[]>(["> TalentScout AI ready."]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [jd, setJd] = useState("");
  const [companyValues, setCompanyValues] = useState("");
  const [jdGenerating, setJdGenerating] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [emailContent, setEmailContent] = useState("");
  const [emailType, setEmailType] = useState<"accept" | "reject">("accept");
  const [emailLoading, setEmailLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pdfView, setPdfView] = useState(false);
  const [wsStatus, setWsStatus] = useState<"online" | "offline">("offline");
  const [logExpanded, setLogExpanded] = useState(true);
  const [processingCount, setProcessingCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [outreachMessage, setOutreachMessage] = useState<string>("");
  const [featureLoading, setFeatureLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);
  const [interviewScript, setInterviewScript] = useState<InterviewScript | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [battleQuestion, setBattleQuestion] = useState("");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [howItWorksSlide, setHowItWorksSlide] = useState(0);
  const [showRoleTemplates, setShowRoleTemplates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showConfirmPurge, setShowConfirmPurge] = useState(false);
  const [showJdPrompt, setShowJdPrompt] = useState(false);
  const [jdPromptText, setJdPromptText] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({
    internships: 20, skills: 20, projects: 15, cgpa: 10,
    achievements: 10, experience: 5, extra_curricular: 5,
    degree: 3, online_presence: 3, languages: 3, college_rank: 2, school_marks: 2
  });
  const [manualCandidate, setManualCandidate] = useState<Record<string, any>>({
    name: "Manual Candidate",
    internships: 0,
    skills: 0,
    projects: 0,
    cgpa: 0,
    achievements: 0,
    experience: 0,
    extra_curricular: 0,
    degree: 2,
    online_presence: 0,
    school_marks: 0
  });

  const [professionFilter, setProfessionFilter] = useState("All");
  const [showFraudLog, setShowFraudLog] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ── Auth guard + init ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) return;
    load(user.id);
    connectWS(user.id);
  }, [isLoaded, user]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const addLog = (msg: string) => setLogs((p) => [...p.slice(-80), msg]);

  const load = useCallback(async (userId: string) => {
    try {
      const data = await fetchCandidates(userId);
      setCandidates(data);
      if (data.length) addLog(`> Loaded ${data.length} candidates.`);
    } catch { addLog("! Backend offline — start the FastAPI server."); }
  }, []);

  const connectWS = useCallback((userId: string) => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/logs`);
      wsRef.current = ws;
      ws.onopen = () => { setWsStatus("online"); addLog("> Connected to server."); };
      ws.onclose = () => { setWsStatus("offline"); setTimeout(() => connectWS(userId), 4000); };
      ws.onmessage = (e) => {
        if (e.data.startsWith("COMPLETE_JSON:")) {
          console.log("WebSocket Inbound:", e.data);
          try {
            setProcessingCount(p => Math.max(0, p - 1));
            const d: Candidate = JSON.parse(e.data.replace("COMPLETE_JSON:", ""));
            setCandidates((prev) => {
              const idx = prev.findIndex((c) => c.filename === d.filename);
              const next = idx !== -1 ? [...prev] : [...prev, d];
              if (idx !== -1) next[idx] = d;
              return next.sort((a, b) => b.score - a.score);
            });
            // Update selected if this is the one
            setSelected(prev => (prev?.filename === d.filename) ? d : prev);
          } catch (err) {
            console.error("Parse error:", err, e.data);
            addLog("! Data sync error — see console.");
          }
        } else if (e.data.startsWith("ERROR_JSON:")) {
          setProcessingCount(p => Math.max(0, p - 1));
          addLog("! " + e.data.replace("ERROR_JSON:", ""));
        } else if (!e.data.startsWith("COMPLETE:")) {
          addLog(e.data);
          if (e.data.includes("🚨") || e.data.includes("SECURITY_ALERT") || e.data.includes("MALICIOUS")) {
            setLogExpanded(true);
          }
        }
      };
    } catch { addLog("! WebSocket unavailable."); }
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const fileList = Array.from(files);
    setUploading(true);
    setProcessingCount(p => p + fileList.length);
    for (const f of fileList) {
      addLog(`> Uploading: ${f.name}`);
      try {
        await uploadResume(f, jd, companyValues, user.id, customWeights);
        addLog(`✓ Uploaded: ${f.name}`);
      } catch (err: any) {
        addLog(`! Failed: ${f.name}`);
        setProcessingCount(p => Math.max(0, p - 1));
      }
    }
    setUploading(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const openEmail = async (type: "accept" | "reject") => {
    if (!selected) return;
    setEmailType(type); setEmailLoading(true); setEmailContent(""); setModal("email");
    try {
      const txt = await generateEmail(
        selected.name || "Candidate", type,
        selected.jd_analysis?.matches || [],
        selected.jd_analysis?.missing || [],
        selected.jd_present
      );
      setEmailContent(txt);
    } catch { setEmailContent("Error generating email. Is the backend running?"); }
    setEmailLoading(false);
  };

  const handleDirectSend = async () => {
    if (!selected?.email || !emailContent || sendingEmail) return;
    setSendingEmail(true);
    try {
      const subject = emailType === "accept"
        ? `TalentScout: Next Steps for ${selected.name}`
        : `Following up on your application - ${selected.name}`;

      const res = await sendDirectEmail(selected.email, subject, emailContent);
      if (res.message) {
        addLog(`✓ Email dispatched to ${selected.email}`);
        setModal(null);
        setSentSuccess(`Email successfully sent to ${selected.email}`);
        setTimeout(() => setSentSuccess(null), 4000);
      } else {
        addLog(`! Delivery failed: ${res.error || "Check SMTP config"}`);
      }
    } catch {
      addLog("! Network disruption during dispatch.");
    }
    setSendingEmail(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !selected || chatLoading) return;
    const q = chatInput.trim(); setChatInput("");
    setChatMessages((p) => [...p, { role: "user" as const, text: q }]);
    setChatLoading(true);
    try {
      const ans = await chatWithResume(selected.name || "Candidate", selected.raw_text, q);
      setChatMessages((p) => [...p, { role: "ai" as const, text: ans }]);
    } catch { setChatMessages((p) => [...p, { role: "ai" as const, text: "Error: backend offline." }]); }
    setChatLoading(false);
  };

  const handleGenJD = async () => {
    setShowJdPrompt(true);
  };

  const submitJdGen = async () => {
    if (!jdPromptText.trim()) return;
    setShowJdPrompt(false);
    setJdGenerating(true);
    try { setJd(await generateJD(jdPromptText)); } catch { setJd("Error generating JD."); }
    setJdGenerating(false);
    setJdPromptText("");
  };

  const startBattle = async () => {
    if (selectedIds.length < 2) return addLog("! Select at least 2 candidates for Battle Royale.");
    if (selectedIds.length > 6) return addLog("! Neural Overload: Select a maximum of 6 candidates to prevent context token overflows.");
    setFeatureLoading(true); setModal("battle");
    try {
      // selectedIds are already file_hashes — pass them directly
      const fileHashes = selectedIds.filter(Boolean);
      // Also try to resolve numeric IDs as fallback
      const ids = candidates
        .filter(c => selectedIds.includes(c.file_hash || ""))
        .map(c => c.id)
        .filter((id): id is number => id !== undefined && id !== null);

      if (fileHashes.length === 0 && ids.length === 0) throw new Error("Could not resolve candidate hashes.");

      const res = await compareCandidates(ids, jd, fileHashes, battleQuestion);
      setComparison(res);
    } catch (e: any) { addLog(`! Battle failed: ${e.message}`); }
    setFeatureLoading(false);
  };

  const toggleSelect = (hash: string) => {
    if (!hash) return;
    setSelectedIds(p => p.includes(hash) ? p.filter(x => x !== hash) : [...p, hash]);
  };

  const startInterviewPilot = async () => {
    if (!selected) return addLog("! No candidate selected.");
    if (!selected.file_hash) return addLog("! Candidate has no file hash. Try re-uploading.");

    setFeatureLoading(true); setModal("interview");
    setInterviewScript(null);
    try {
      const res = await generateInterview(selected.id, jd, selected.file_hash);
      if ((res as any).error) throw new Error((res as any).error);
      setInterviewScript(res);
    } catch (e: any) {
      addLog(`! Interview Pilot failed: ${e.message}`);
      setInterviewScript(null);
    }
    setFeatureLoading(false);
  };

  const startSmartOutreach = async () => {
    if (!selected) return addLog("! No candidate selected.");
    if (!selected.file_hash) return addLog("! Candidate has no file hash. Try re-uploading.");

    setFeatureLoading(true); setModal("outreach");
    setOutreachMessage("");
    try {
      const res = await generateOutreach(selected.id, jd, selected.file_hash);
      setOutreachMessage(res.message);
    } catch (e: any) {
      addLog(`! Outreach failed: ${e.message}`);
      setOutreachMessage("Unable to generate outreach message at this time.");
    }
    setFeatureLoading(false);
  };

  const purge = () => {
    if (!user) return;
    setShowConfirmPurge(true);
  };

  const confirmPurge = async () => {
    if (!user) return;
    setShowConfirmPurge(false);
    try {
      const resp = await deleteCandidates(user.id);
      setCandidates([]);
      setSelectedIds([]);
      setSelected(null);
      setPdfView(false);
      addLog(`> ${resp?.message || "All candidates cleared."}`);
    } catch (err: any) {
      addLog(`! Failed to clear database: ${err.message || "Backend offline"}`);
    }
  };

  const candidateName = (c: Candidate, rank: number) =>
    anonymousMode ? `Applicant ${String(rank).padStart(3, "0")}` : (c.name || c.filename);

  const exportCSV = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/export`, { headers: { "X-User-Id": user.id } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "talentscout_export.csv"; a.click();
      URL.revokeObjectURL(url);
      addLog("> Exported candidates to CSV.");
    } catch { addLog("! Export failed."); }
  };

  // ── Analytics computed ──
  const analytics = (() => {
    if (!candidates.length) return null;
    const scores = candidates.map(c => c.score || 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
    const topScore = Math.max(...scores);
    const skillMap: Record<string, number> = {};
    candidates.forEach(c => (c.skills || []).forEach(s => { skillMap[s] = (skillMap[s] || 0) + 1; }));
    const topSkills = Object.entries(skillMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const scoreDist = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
    scores.forEach(s => { const idx = Math.min(Math.floor(s / 20), 4); scoreDist[idx]++; });
    return { avgScore, topScore, topSkills, scoreDist, total: candidates.length };
  })();

  const HOW_IT_WORKS_SLIDES = [
    { icon: <Scan className="w-6 h-6 text-[var(--cyan)]" />, title: "DUAL-ENGINE EXTRACTION", desc: "Two extraction engines with font-level metadata analysis and OCR fallback for scanned documents.", steps: ["PyMuPDF dict-level extraction reads font color, size & position per span", "pdfplumber extracts layout text + embedded hyperlinks", "Tesseract OCR @ 200 DPI activates for scanned/image PDFs", "Encrypted/locked PDFs auto-detected and flagged", "DOCX, DOC (win32com), and TXT formats supported"] },
    { icon: <Shield className="w-6 h-6 text-[var(--rose)]" />, title: "7-LAYER SECURITY FIREWALL", desc: "Forensic defense system with font-level fraud detection and AI-powered security analysis.", steps: ["Two-pass dark-mode detection (>15% white chars = dark theme, prevents false flags)", "Invisible white text (0xFFFFFF) filtered on non-dark-mode docs", "Microscopic font (<4pt) automatically stripped", "Regex injection scanner for prompt manipulation", "LLM AI Firewall analyzes full text for manipulation patterns", "Duplicate detection via cosine similarity (>90% = flagged)", "Keyword density sanitizer (25+ repeats → redacted)"] },
    { icon: <Target className="w-6 h-6 text-[var(--emerald)]" />, title: "12-FACTOR SCORING + BONUSES", desc: "Deterministic 100-point scale with prestige multipliers and consistency checks.", steps: ["Internships: 20 pts | Technical Skills: 20 pts (with partial credit)", "Projects: 15 pts | CGPA/Academic: 10 pts | Achievements: 10 pts", "Experience: 5 pts | Extra-Curricular: 5 pts | Degree: 3 pts", "Online Presence: 3 pts | Languages: 3 pts | College: 2 pts | School: 2 pts", "Prestige Multiplier: +8% FAANG/Tier-1 | +4% Tier-2 | +5% Tier-1 colleges", "Skill-Project Consistency: up to +3 pts for verified skill usage", "Completeness Bonus: +4% per section (projects, achievements, links, languages)"] },
    { icon: <TrendingUp className="w-6 h-6 text-[var(--violet)]" />, title: "PARALLEL AI ANALYSIS", desc: "6 concurrent Groq LLaMA-3.1 tasks fired simultaneously via asyncio.gather.", steps: ["Personal info extraction + GitHub trust chain verification", "AI Hireability Synthesis (Markdown forensic report)", "AI Interview Script (10 personalized screening questions)", "Soft skills + Culture Fit analysis (0-100%)", "Training Roadmap + upsell recommendations", "LLM Security Firewall (manipulation detection)"] },
  ];

  const signOutFn = () => signOut({ redirectUrl: "/" });

  if (!isLoaded || !user) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--cyan)]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="w-6 h-6 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin relative z-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex font-[var(--font-body)] overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-[280px] shrink-0 border-r border-[rgba(255,255,255,0.05)] flex flex-col py-8 px-6 bg-[var(--surface)] backdrop-blur-3xl relative z-20">
        <div className="flex-1" />
        <div className="mt-auto border-t border-[rgba(255,255,255,0.05)] pt-6 flex flex-col gap-4">
          <button onClick={() => setAnonymousMode(!anonymousMode)}
            className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] font-[var(--font-mono)] font-bold uppercase tracking-wider border
              ${anonymousMode
                ? 'bg-[rgba(124,58,237,0.15)] text-[var(--violet)] border-[var(--violet)]/30 shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                : 'bg-[rgba(255,255,255,0.02)] text-[var(--muted)] border-[rgba(255,255,255,0.05)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'}`}
          >
            {anonymousMode ? <><Eye className="w-3.5 h-3.5 shrink-0" /> Reveal Names</> : <><EyeOff className="w-3.5 h-3.5 shrink-0" /> Anonymous Mode</>}
          </button>
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 shrink-0 rounded-full bg-[linear-gradient(135deg,rgba(6,182,212,0.2),rgba(124,58,237,0.2))] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-sm font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              {(user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || "U").toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-sm font-bold text-[var(--text)] truncate">{user.fullName || "TalentScout User"}</p>
              <p className="text-[10px] font-[var(--font-mono)] text-[var(--muted)] truncate">{user.primaryEmailAddress?.emailAddress || ""}</p>
            </div>
          </div>
          <button onClick={signOutFn} className="w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-[var(--font-mono)] font-bold uppercase tracking-wider text-[var(--muted)] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:text-[var(--rose)] hover:border-[var(--rose)]/30 hover:bg-[rgba(244,63,94,0.05)] transition-all">
            <LogOut className="w-3.5 h-3.5 shrink-0" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="border-b border-[rgba(255,255,255,0.03)] px-8 py-4 flex flex-wrap gap-4 items-center justify-between bg-[rgba(3,7,18,0.6)] backdrop-blur-2xl z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-[var(--cyan)] animate-pulse rounded-full shadow-[0_0_8px_var(--cyan)]" />
              <h1 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                TalentScout<span className="opacity-50 text-[var(--cyan)]">.AI</span>
              </h1>
            </div>
            <div className="h-5 w-[1px] bg-[rgba(255,255,255,0.08)]" />
            <div className="flex items-center gap-2 text-[10px] font-[var(--font-mono)] text-[var(--muted)]">
              <span className="relative flex h-2 w-2">
                {wsStatus === "online" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--emerald)] opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${wsStatus === "online" ? "bg-[var(--emerald)]" : "bg-[var(--rose)]"}`} />
              </span>
              {wsStatus === "online" ? "Connected" : "Offline"}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {candidates.length > 0 && (
              <div className="flex items-center gap-2">
                {/* Battle Royale section */}
                {selectedIds.length > 1 ? (
                  <button onClick={startBattle} className="text-xs font-bold text-[#030712] bg-[var(--cyan)] px-4 py-2 rounded-lg hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse hover:animate-none">
                    <Zap className="w-3.5 h-3.5" /> BATTLE ROYALE ({selectedIds.length})
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/20 px-3 py-2 rounded-lg bg-white/[0.02] border border-dashed border-white/10">
                    <Zap className="w-3 h-3" />
                    <span>Select 2+ candidates for Battle Royale</span>
                  </div>
                )}

                <div className="h-5 w-[1px] bg-white/8 mx-1" />

                {/* Tools */}
                <button onClick={exportCSV} className="text-[10px] font-bold text-[var(--muted)] hover:text-white px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> EXPORT
                </button>
                <button onClick={() => setShowAnalytics(!showAnalytics)} className={`text-[10px] font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${showAnalytics ? 'text-[var(--emerald)] border-[var(--emerald)]/30 bg-[var(--emerald)]/10' : 'text-[var(--muted)] hover:text-white bg-white/5 border-white/10 hover:border-white/20'}`}>
                  <BarChart3 className="w-3.5 h-3.5" /> ANALYTICS
                </button>
                <button onClick={() => { setShowHowItWorks(true); setHowItWorksSlide(0); }} className="text-[10px] font-bold text-[var(--muted)] hover:text-white px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> HOW IT WORKS
                </button>

              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 relative overflow-hidden group hover:border-[var(--violet)]/40 transition-all duration-500">
                <style>{`
                  @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                  }
                  @keyframes radar-pulse {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { opacity: 0.2; }
                    100% { transform: scale(1.0); opacity: 0; }
                  }
                  .radar-ring {
                    position: absolute;
                    border: 1px solid var(--cyan);
                    border-radius: 50%;
                    animation: radar-pulse 4s cubic-bezier(0.21, 0.53, 0.56, 0.8) infinite;
                  }
                  .radar-ring:nth-child(2) { animation-delay: 1s; }
                  .radar-ring:nth-child(3) { animation-delay: 2s; }
                  .radar-ring:nth-child(4) { animation-delay: 3s; }
                `}</style>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--violet)] to-transparent opacity-30" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[var(--violet)]/20 border border-[var(--violet)]/40 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                      <span className="text-xs font-black text-[var(--violet)]">1</span>
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">Job Description</h3>
                  </div>
                  <button onClick={handleGenJD} disabled={jdGenerating} className="text-[10px] font-bold text-black bg-[var(--violet)] px-3 py-1.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                    <Sparkles className="w-3.5 h-3.5" /> AI Generate
                  </button>
                </div>
                <div className="relative mb-2">
                  <button onClick={() => setShowRoleTemplates(!showRoleTemplates)} className="text-[10px] font-bold text-[var(--muted)] hover:text-white flex items-center gap-1.5 transition-all">
                    <BookOpen className="w-3 h-3" /> {showRoleTemplates ? "Hide Templates" : "Role Templates ▾"}
                  </button>
                  {showRoleTemplates && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {Object.keys(ROLE_TEMPLATES).map(role => (
                        <button key={role} onClick={() => { setJd(ROLE_TEMPLATES[role]); setShowRoleTemplates(false); }}
                          className="text-[9px] text-left font-bold text-white/50 hover:text-white px-2 py-1.5 rounded bg-white/5 hover:bg-[var(--violet)]/15 border border-white/5 hover:border-[var(--violet)]/30 transition-all truncate">
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste a job description here..." className="w-full h-28 bg-black/40 border border-white/5 rounded-xl text-xs p-4 text-white/80 focus:outline-none focus:border-[var(--violet)]/50 resize-none leading-relaxed transition-all" />
              </div>
              <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 relative overflow-hidden group hover:border-[var(--cyan)]/40 transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent opacity-30" />
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--cyan)]/20 border border-[var(--cyan)]/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <span className="text-xs font-black text-[var(--cyan)]">2</span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">Company Values</h3>
                </div>
                <textarea value={companyValues} onChange={(e) => setCompanyValues(e.target.value)} placeholder="e.g. 'Innovation', 'Collaboration'..." className="w-full h-28 bg-black/40 border border-white/5 rounded-xl text-xs p-4 text-white/80 focus:outline-none focus:border-[var(--cyan)]/50 resize-none leading-relaxed transition-all" />
              </div>

              {/* ── Configurable Weights Panel ── */}
              <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 relative overflow-hidden transition-all duration-300">
                <div className="flex items-center justify-between cursor-pointer group" onClick={() => setShowWeights(!showWeights)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[var(--rose)]/20 border border-[var(--rose)]/40 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.3)] group-hover:bg-[var(--rose)]/30 transition-colors">
                      <span className="text-xs font-black text-[var(--rose)]">3</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">Scoring Weights</h3>
                      <p className="text-[10px] text-[var(--muted)]">Customize how AI evaluates resumes</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-[var(--muted)] transition-transform duration-300 ${showWeights ? 'rotate-90' : ''}`} />
                </div>

                {showWeights && (
                  <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      {Object.entries(customWeights).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">{key.replace('_', ' ')}</span>
                            <span className="text-[11px] font-mono text-[var(--cyan)] bg-[var(--cyan)]/10 px-1.5 py-0.5 rounded border border-[var(--cyan)]/20">{value}</span>
                          </div>
                          <input
                            type="range"
                            min="0" max="40"
                            value={value}
                            onChange={(e) => setCustomWeights(p => ({ ...p, [key]: parseInt(e.target.value) }))}
                            className="w-full accent-[var(--cyan)] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                      <p className="text-[10px] text-[var(--muted)]">Weights auto-normalize to 100% on the backend.</p>
                      <p className="text-[11px] font-mono font-bold tracking-widest"><span className="text-white/50">RAW TOTAL:</span> <span className={Object.values(customWeights).reduce((a, b) => a + b, 0) === 100 ? "text-[var(--emerald)]" : "text-[var(--cyan)]"}>{Object.values(customWeights).reduce((a, b) => a + b, 0)}</span></p>
                    </div>
                  </div>
                )}
              </div>

              <div onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={(e) => { setDragActive(false); onDrop(e); }} onClick={() => fileRef.current?.click()}
                className={`rounded-2xl border relative overflow-hidden transition-all duration-500 cursor-pointer group flex flex-col min-h-[200px] p-6 ${uploading ? "bg-[var(--emerald)]/5 border-[var(--emerald)]/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]" : dragActive ? "bg-[var(--emerald)]/10 border-[var(--emerald)]/50 transform scale-[1.02]" : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:border-[var(--emerald)]/40 shadow-none"}`}>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--emerald)] to-transparent opacity-30" />
                {uploading ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-20 bg-white/5 border border-white/10 rounded-lg overflow-hidden relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-[var(--emerald)] shadow-[0_0_15px_rgba(16,185,129,1)] animate-[scan_1.5s_ease-in-out_infinite_alternate]" />
                    </div>
                    <p className="mt-4 text-[10px] font-mono text-[var(--emerald)] animate-pulse tracking-widest uppercase font-bold">Inscribing Neural Trace...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[var(--emerald)]/20 border border-[var(--emerald)]/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <span className="text-xs font-black text-[var(--emerald)]">4</span>
                      </div>
                      <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">Upload Resumes</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-[var(--muted)] group-hover:text-[var(--emerald)] transition-all mb-3 group-hover:scale-110" />
                      <p className="text-xs font-bold text-white/40 group-hover:text-white transition-colors uppercase tracking-widest font-black">UPLOAD RESUMES</p>
                      <p className="text-[10px] text-[var(--muted)] mt-1">Drag & Drop or Click to Scan</p>
                    </div>
                    <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                  </>
                )}
              </div>
            </div>

            {/* ── Analytics Panel ── */}
            {showAnalytics && analytics && (
              <div className="rounded-2xl border border-[var(--emerald)]/20 bg-[var(--emerald)]/[0.03] p-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-[var(--emerald)]" />
                  <p className="text-[11px] font-black text-[var(--emerald)] uppercase tracking-[0.3em]">TALENT ANALYTICS</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-center">
                    <p className="text-3xl font-black text-white">{analytics.total}</p>
                    <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest mt-1">Candidates</p>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-center">
                    <p className="text-3xl font-black text-[var(--cyan)]">{analytics.avgScore}</p>
                    <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest mt-1">Avg Score</p>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-center">
                    <p className="text-3xl font-black text-[var(--emerald)]">{analytics.topScore}</p>
                    <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest mt-1">Top Score</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Score Distribution</p>
                  <div className="flex items-end gap-2 h-20">
                    {['0-20', '21-40', '41-60', '61-80', '81-100'].map((label, idx) => (
                      <div key={label} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t" style={{ height: `${Math.max(4, (analytics.scoreDist[idx] / analytics.total) * 100)}%`, background: idx < 2 ? 'var(--rose)' : idx < 4 ? 'var(--cyan)' : 'var(--emerald)' }} />
                        <span className="text-[8px] text-[var(--muted)]">{label}</span>
                        <span className="text-[9px] font-bold text-white/60">{analytics.scoreDist[idx]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Top Skills Across Candidates</p>
                  <div className="space-y-1.5">
                    {analytics.topSkills.map(([skill, count]) => (
                      <div key={skill} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-white/70 w-28 truncate">{skill}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--cyan)] rounded-full transition-all" style={{ width: `${(count / analytics.total) * 100}%` }} />
                        </div>
                        <span className="text-[9px] font-mono text-[var(--muted)] w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 relative overflow-hidden h-[400px]">
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="radar-ring w-24 h-24" />
                    <div className="radar-ring w-24 h-24" />
                    <div className="radar-ring w-24 h-24" />
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative z-10 group overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--cyan)]/20 to-transparent animate-[scan_2s_linear_infinite]" />
                    <Users className="w-6 h-6 text-[var(--cyan)]" />
                  </div>
                </div>
                <p className="text-xs font-black text-white/40 uppercase tracking-[0.5em] animate-pulse relative z-10 ml-2">
                  {(uploading || processingCount > 0) ? "ANALYSING..." : "NO CANDIDATES YET"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-5 pb-2 border-b border-white/5">
                  <div className="flex items-center text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest w-full">
                    <div className="w-10 flex justify-center items-center">
                      <button onClick={() => setSelectedIds(selectedIds.length > 0 && selectedIds.length === candidates.length ? [] : candidates.map(c => c.file_hash!).filter(Boolean))}
                        id="select-all-btn"
                        className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${selectedIds.length > 0 && selectedIds.length === candidates.length ? "bg-[var(--cyan)] border-[var(--cyan)] shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "border-white/10 bg-white/5 hover:border-[var(--cyan)]/50"}`}>
                        {selectedIds.length > 0 && selectedIds.length === candidates.length && <Check className="w-4 h-4 text-black stroke-[4px]" />}
                        {selectedIds.length > 0 && selectedIds.length < candidates.length && <div className="w-2 h-[2px] bg-[var(--cyan)]" />}
                      </button>
                    </div>
                    <span className="w-14 shrink-0 px-4">Rank</span>
                    <span className="flex-1 px-4">Candidate</span>
                    <span className="w-32 text-center">Score / 100</span>
                    {processingCount > 0 && <span className="w-24 text-[var(--cyan)] animate-pulse pl-4">Analyzing...</span>}
                    <span className="w-48 text-right">Primary Skills</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => setShowFraudLog(!showFraudLog)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 uppercase tracking-widest ${showFraudLog ? 'bg-[var(--rose)]/20 text-[var(--rose)] border-[var(--rose)]/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-white/5 text-[var(--muted)] border-white/10 hover:border-white/20'}`}
                    >
                      <ShieldAlert className="w-3 h-3" />
                      Fraud Log
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <Filter className="w-3 h-3 text-[var(--muted)]" />
                    <select
                      value={professionFilter}
                      onChange={(e) => setProfessionFilter(e.target.value)}
                      className="bg-transparent text-[10px] font-bold text-white/70 border border-white/10 rounded px-2 py-1 outline-none uppercase tracking-widest hover:border-[var(--cyan)]/50 transition-colors"
                    >
                      <option value="All" className="bg-[#0f172a] text-white">ALL DOMAINS</option>
                      {Array.from(new Set(candidates.map(c => c.profession).filter(Boolean))).map(prof => (
                        <option key={prof as string} value={prof as string} className="bg-[#0f172a] text-white">{prof as string}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={purge} className="ml-4 shrink-0 text-[10px] font-bold text-[var(--rose)]/60 hover:text-[var(--rose)] px-3 py-1.5 rounded bg-[rgba(244,63,94,0.05)] hover:bg-[rgba(244,63,94,0.1)] border border-[var(--rose)]/10 hover:border-[var(--rose)]/30 transition-all flex items-center gap-1.5">
                    <Trash2 className="w-3 h-3" /> CLEAR ALL
                  </button>
                </div>
                {candidates
                  .filter(c => professionFilter === "All" || c.profession === professionFilter)
                  .filter(c => !showFraudLog || c.prompt_injection_detected || c.is_locked || c.is_duplicate)
                  .map((c, i) => {
                    const isTop3 = i < 3;
                    const rankColors = [
                      'border-[var(--emerald)]/40 bg-[var(--emerald)]/[0.03] shadow-[0_0_20px_rgba(16,185,129,0.1)]',
                      'border-[var(--cyan)]/40 bg-[var(--cyan)]/[0.03] shadow-[0_0_20px_rgba(6,182,212,0.1)]',
                      'border-[var(--violet)]/40 bg-[var(--violet)]/[0.03] shadow-[0_0_20px_rgba(124,58,237,0.1)]'
                    ];
                    return (
                      <div key={c.id || i} onClick={() => { setSelected(c); setChatMessages([]); }}
                        className={`group relative border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300 
                        ${c.prompt_injection_detected
                            ? 'bg-[var(--rose)]/10 border-[var(--rose)]/40 shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-pulse'
                            : isTop3 ? rankColors[i] : 'bg-white/[0.02] border-white/5 hover:bg-[rgba(6,182,212,0.04)] hover:border-[rgba(6,182,212,0.3)]'
                          }`}>
                        <div className="w-10 flex justify-center items-center" onClick={(e) => { e.stopPropagation(); toggleSelect(c.file_hash!); }}>
                          <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${selectedIds.includes(c.file_hash!) ? "bg-[var(--cyan)] border-[var(--cyan)] shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "border-white/10 bg-white/5 group-hover:border-[var(--cyan)]/50"}`}>
                            {selectedIds.includes(c.file_hash!) && <Check className="w-4 h-4 text-black stroke-[4px]" />}
                          </div>
                        </div>
                        <div className="w-14 flex justify-center items-center">
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-[11px] font-black font-mono transition-colors ${i === 0 ? 'bg-[var(--emerald)]/20 border-[var(--emerald)] text-[var(--emerald)] shadow-[0_0_10px_rgba(16,185,129,0.3)]' : i === 1 ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)] shadow-[0_0_10px_rgba(6,182,212,0.3)]' : i === 2 ? 'bg-[var(--violet)]/20 border-[var(--violet)] text-[var(--violet)] shadow-[0_0_10px_rgba(124,58,237,0.3)]' : 'bg-white/5 border-white/10 text-white/40 group-hover:text-[var(--cyan)]'}`}>
                            {i + 1}
                          </div>
                        </div>
                        <div className="flex-1 px-4 truncate">
                          <div className="flex items-center gap-2 mb-1">
                            {c.profession && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--cyan)] bg-[var(--cyan)]/10 px-2 py-0.5 rounded border border-[var(--cyan)]/20 shadow-[0_0_5px_rgba(6,182,212,0.2)]">
                                {c.profession}
                              </span>
                            )}
                            {c.is_fresher && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--emerald)] bg-[var(--emerald)]/10 px-2 py-0.5 rounded border border-[var(--emerald)]/20 shadow-[0_0_5px_rgba(16,185,129,0.2)]">
                                FRESHER
                              </span>
                            )}
                            {!c.is_fresher && c.structured_data?.experience?.years !== undefined && c.structured_data.experience.years > 0 && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--violet)] bg-[var(--violet)]/10 px-2 py-0.5 rounded border border-[var(--violet)]/20 shadow-[0_0_5px_rgba(124,58,237,0.2)]">
                                {c.structured_data.experience.years} YRS EXP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-black truncate ${anonymousMode ? "text-[var(--violet)]" : "text-white"}`}>{candidateName(c, i + 1)}</h4>
                            {c.is_locked && (
                              <div className="px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-sm flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
                                <Target className="w-2.5 h-2.5 text-yellow-500 animate-pulse" />
                                <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">LOCKED</span>
                              </div>
                            )}
                            {c.is_duplicate && (
                              <div className="px-2 py-0.5 rounded-md bg-[var(--rose)]/15 border border-[var(--rose)]/40 backdrop-blur-sm flex items-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                                <ShieldAlert className="w-2.5 h-2.5 text-[var(--rose)] animate-pulse" />
                                <span className="text-[8px] font-black text-[var(--rose)] uppercase tracking-widest">DUPLICATE FOUND</span>
                              </div>
                            )}
                            {(c.prompt_injection_detected && !c.is_duplicate) && (
                              <div className="px-2 py-0.5 rounded-md bg-[var(--rose)]/15 border border-[var(--rose)]/40 backdrop-blur-sm flex items-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                                <Shield className="w-2.5 h-2.5 text-[var(--rose)] animate-pulse" />
                                <span className="text-[8px] font-black text-[var(--rose)] uppercase tracking-widest">MALICIOUS</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--muted)] truncate font-mono mt-0.5 tracking-tighter opacity-60">
                            <span className="text-[var(--cyan)]/50">{c.filename || 'unknown'}</span>
                            <span className="mx-1.5 opacity-30">•</span>
                            <span>ID: {c.file_hash?.slice(0, 8) || 'PENDING'}</span>
                          </p>
                        </div>
                        <div className="w-32 flex flex-col items-center">
                          <span className="text-lg font-black text-[var(--cyan)] leading-none">{c.score}</span>
                          <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden"><div className="h-full bg-[var(--cyan)]" style={{ width: `${c.score}%` }} /></div>
                          {typeof c.completeness === 'number' && (
                            <div className="flex gap-1 mt-2.5" title={`Completeness Score: ${c.completeness}/4`}>
                              {[1, 2, 3, 4].map(star => (
                                <div key={star} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${star <= c.completeness! ? 'bg-[var(--cyan)] shadow-[0_0_5px_rgba(6,182,212,0.8)] scale-110' : 'bg-white/10'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="w-48 flex flex-wrap gap-1 justify-end">
                          {c.prompt_injection_detected ? (
                            <span className="text-[9px] font-black text-[var(--rose)] bg-[var(--rose)]/10 px-2 py-0.5 rounded border border-[var(--rose)]/20 uppercase animate-pulse">! DATA_REDACTED</span>
                          ) : c.skills.slice(0, 3).map((s, idx) => {
                            const colors = [
                              'bg-[var(--cyan)]/10 text-[var(--cyan)] border-[var(--cyan)]/20',
                              'bg-[var(--violet)]/10 text-[var(--violet)] border-[var(--violet)]/20',
                              'bg-[var(--emerald)]/10 text-[var(--emerald)] border-[var(--emerald)]/20'
                            ];
                            return (
                              <span key={s} className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${colors[idx % colors.length]} shadow-[0_0_5px_rgba(0,0,0,0.2)]`}>
                                {s}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
            <div className="rounded-2xl border border-white/5 bg-[#020617] overflow-hidden">
              <button onClick={() => setLogExpanded(!logExpanded)} className="w-full px-5 py-3 flex items-center justify-between border-b border-white/5 hover:bg-white/[0.02]">
                <div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-[var(--cyan)]" /><span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">Neural Logs</span></div>
                {logExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {logExpanded && (
                <div className="p-4 max-h-48 overflow-y-auto font-mono text-[10px] space-y-1 no-scrollbar text-white/40">
                  {logs.map((l, i) => {
                    let cls = "";
                    if (l.includes("🚨") || l.includes("SECURITY_ALERT") || l.includes("MALICIOUS")) {
                      cls = "text-[var(--rose)] font-black animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.2)] bg-[var(--rose)]/5 px-2 py-0.5 rounded-md";
                    } else if (l.startsWith("!")) {
                      cls = "text-[var(--rose)]";
                    } else if (l.startsWith("✓")) {
                      cls = "text-[var(--cyan)] font-bold";
                    } else if (l.startsWith(">")) {
                      cls = "text-white/60";
                    }
                    return <div key={i} className={cls}>{l}</div>;
                  })}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── INSPECTOR ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={() => { setPdfView(false); setSelected(null); }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed inset-y-0 right-0 ${pdfView ? "w-[95vw]" : "w-full max-w-[800px]"} bg-[rgba(3,7,18,0.98)] border-l border-[var(--cyan)]/20 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-40 flex flex-col overflow-hidden`}>
              {/* Header */}
              <div className="p-6 border-b border-white/5 shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className={`text-2xl font-black ${anonymousMode ? "text-[var(--violet)]" : "text-white"}`}>{candidateName(selected!, candidates.indexOf(selected!) + 1)}</h2>
                    <p className="text-[10px] font-mono text-[var(--muted)] mt-1">{selected.filename || 'Resume'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const url = `${window.location.origin}/shared/${selected.file_hash}`;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }} className={`px-4 py-2 rounded-xl text-[10px] font-bold border flex items-center gap-2 transition-all ${copied ? 'bg-[var(--emerald)]/20 border-[var(--emerald)] text-[var(--emerald)]' : 'border-white/10 text-[var(--muted)] hover:text-white hover:bg-white/5'}`}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      {copied ? "COPIED" : "SHARE"}
                    </button>
                    <button onClick={() => setPdfView(!pdfView)} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${pdfView ? 'bg-[var(--cyan)] text-black border-[var(--cyan)]' : 'border-white/10 text-[var(--muted)] hover:text-white hover:bg-white/5'}`}>PDF ANALYZER</button>
                    <button onClick={() => { setPdfView(false); setSelected(null); }} className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white"><X className="w-5 h-5" /></button>
                  </div>
                </div>
                {/* Score + Contact Grid */}
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <div className="bg-[var(--cyan)]/5 border border-[var(--cyan)]/20 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-3xl font-black text-[var(--cyan)] leading-none">{selected.score}</span>
                    <span className="text-[8px] text-[var(--muted)] uppercase font-black tracking-[0.15em] leading-tight">FORENSIC<br />SCORE</span>
                  </div>
                  {selected.email && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-2 overflow-hidden">
                      <Mail className="w-4 h-4 text-[var(--cyan)] shrink-0" />
                      <span className="text-[10px] text-white/60 font-mono truncate">{selected.email}</span>
                    </div>
                  )}
                  {selected.phone && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-[var(--cyan)] shrink-0" />
                      <span className="text-[10px] text-white/60 font-mono truncate">{selected.phone}</span>
                    </div>
                  )}
                  {selected.location && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-2 overflow-hidden">
                      <Search className="w-4 h-4 text-[var(--cyan)] shrink-0" />
                      <span className="text-[10px] text-white/60 font-mono truncate">{selected.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 p-5 border-b border-white/5 bg-black/40 shrink-0">
                <button onClick={() => openEmail("accept")} className="flex-1 py-3 rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald)]/5 text-[var(--emerald)] text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--emerald)]/10 transition-all">
                  <Check className="w-4 h-4" /> ACCEPT
                </button>
                <button onClick={() => openEmail("reject")} className="flex-1 py-3 rounded-xl border border-[var(--rose)]/30 bg-[var(--rose)]/5 text-[var(--rose)] text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--rose)]/10 transition-all">
                  <X className="w-4 h-4" /> REJECT
                </button>
                <button onClick={startInterviewPilot} className="flex-1 py-3 rounded-xl border border-[var(--cyan)]/30 bg-[var(--cyan)]/5 text-[var(--cyan)] text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--cyan)]/10 transition-all">
                  <Brain className="w-4 h-4" /> INTERVIEW
                </button>
                <button onClick={startSmartOutreach} className="flex-1 py-3 rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald)]/5 text-[var(--emerald)] text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--emerald)]/10 transition-all">
                  <Send className="w-4 h-4" /> OUTREACH
                </button>
                <button onClick={() => { setModal("chat"); setChatMessages([]); }} className="flex-1 py-3 rounded-xl border border-[var(--violet)]/30 bg-[var(--violet)]/5 text-[var(--violet)] text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--violet)]/10 transition-all">
                  <MessageSquare className="w-4 h-4" /> CHAT
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 flex overflow-hidden">
                <div className={`flex flex-1 overflow-hidden ${pdfView ? "flex-row" : "flex-col"}`}>
                  {/* PDF Pane */}
                  {pdfView && (
                    <div className="w-1/2 border-r border-white/10 flex flex-col p-4 bg-black/20">
                      <div className="flex-1 rounded-xl overflow-hidden border border-white/10 relative">
                        {selected.file_hash ? (
                          <iframe src={`${API_URL}/pdf/${selected.file_hash}#toolbar=0`} className="w-full h-full border-none" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--muted)]">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p className="text-xs font-mono tracking-widest">RENDERING FEED...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Analysis Pane */}
                  <div className={`${pdfView ? "w-1/2" : "w-full"} overflow-y-auto p-8 space-y-8 no-scrollbar`}>
                    {selected.prompt_injection_detected && (
                      <div className="bg-[var(--rose)]/20 border-2 border-[var(--rose)] p-8 rounded-3xl flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-500 shadow-[0_0_50px_rgba(244,63,94,0.3)]">
                        <div className="w-16 h-16 rounded-full bg-[var(--rose)]/20 flex items-center justify-center border border-[var(--rose)]/50">
                          <Shield className="text-[var(--rose)] w-8 h-8 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-[var(--rose)] uppercase tracking-[0.4em] mb-2">CRITICAL SECURITY BREACH</p>
                          <p className="text-sm text-white font-bold leading-relaxed mb-4">MALICIOUS PROMPT INJECTION DETECTED</p>
                          <p className="text-xs text-white/60 max-w-md mx-auto">This candidate has attempted to manipulate the AI scoring system using hidden instructions. Profile authenticity is compromised and has been automatically rejected.</p>
                        </div>
                      </div>
                    )}

                    {selected.is_locked && (
                      <div className="bg-yellow-500/10 border-2 border-yellow-500/30 p-8 rounded-3xl flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/50">
                          <Target className="text-yellow-500 w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-2">ENCRYPTED SIGNAL</p>
                          <p className="text-sm text-white font-bold leading-relaxed mb-4">DOCUMENT IS PASSWORD PROTECTED</p>
                          <p className="text-xs text-white/60 max-w-md mx-auto">TalentScout could not bypass the encryption on this file. Please request an unlocked PDF version from the candidate for forensic analysis.</p>
                        </div>
                      </div>
                    )}

                    {!selected.is_locked && selected.hidden_signal_detected && (
                      <div className="bg-[var(--rose)]/10 border border-[var(--rose)]/30 p-6 rounded-2xl flex items-center gap-4">
                        <AlertTriangle className="text-[var(--rose)] w-8 h-8 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] font-black text-[var(--rose)] uppercase tracking-[0.2em] mb-1">FORENSIC ALERT: HIDDEN DATA DETECTED</p>
                          <p className="text-xs text-white/80 leading-relaxed">This resume contains text that is invisible to the human eye but readable by machines (Keyword Stuffing). The score has been restricted to visible OCR text only.</p>
                        </div>
                      </div>
                    )}
                    {selected.hireability_summary && (
                      <div className="bg-[var(--violet)]/5 border border-[var(--violet)]/20 p-8 rounded-2xl relative group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--violet)]" />
                        <p className="text-[11px] font-black text-[var(--violet)] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> AI ANALYSIS SYNTHESIS
                        </p>
                        <div className="text-[13px] text-white/90 prose prose-invert prose-compact max-w-none">
                          <ReactMarkdown>{selected.hireability_summary}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      {selected.trust_score != null && (
                        <div className="bg-black/40 border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--cyan)]" />
                          <div className="flex items-center justify-between mb-6">
                            <p className="text-[11px] font-black text-[var(--muted)] uppercase tracking-[0.3em] flex items-center gap-3">
                              <Activity className="w-4 h-4 text-[var(--cyan)]" /> Authenticity Index
                            </p>
                            <span className={`text-4xl font-black ${selected.trust_score >= 80 ? 'text-[var(--emerald)]' : selected.trust_score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{selected.trust_score}%</span>
                          </div>
                          <p className="text-xs text-white/70 italic leading-relaxed border-l-2 border-white/10 pl-6 py-2">{selected.trust_reasoning || "Neural profile verified."}</p>
                          {(selected.github_username || selected.github_stats) && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                              {selected.github_username ? (
                                <a
                                  href={`https://github.com/${selected.github_username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-white/60 hover:text-[var(--cyan)] transition-colors group/gh"
                                >
                                  <Github className="w-4 h-4 group-hover/gh:scale-110 transition-transform" />
                                  <span className="text-xs font-semibold">@{selected.github_username}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/gh:opacity-100 transition-opacity" />
                                </a>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Github className="w-4 h-4 text-white/60" />
                                  <span className="text-xs font-semibold text-white/80">GitHub</span>
                                </div>
                              )}
                              {selected.github_verified || (selected.github_stats?.verified) ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                  <Shield className="w-3 h-3 text-emerald-500" />
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 opacity-70">
                                  <AlertTriangle className="w-3 h-3 text-white/50" />
                                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Unverified</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="bg-black/40 border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--violet)]" />
                        <div className="flex items-center justify-between mb-6">
                          <p className="text-[11px] font-black text-[var(--muted)] uppercase tracking-[0.3em] flex items-center gap-3">
                            <Zap className="w-4 h-4 text-[var(--violet)]" /> Culture Fit Alignment
                          </p>
                          <span className="text-4xl font-black text-[var(--violet)]">{selected.culture_fit}%</span>
                        </div>
                        <div className="space-y-4">
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${selected.culture_fit}%` }} className="h-full bg-[var(--violet)] shadow-[0_0_20px_rgba(139,92,246,0.6)]" />
                          </div>
                          <div className="flex flex-wrap gap-2 pr-4 ml-auto">
                            {selected.is_locked && (
                              <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                <Target className="w-3 h-3 text-yellow-500 animate-pulse" />
                                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">LOCKED</span>
                              </div>
                            )}
                            {selected.prompt_injection_detected && (
                              <div className="px-3 py-1 rounded-full bg-[var(--rose)]/15 border border-[var(--rose)]/40 backdrop-blur-md flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                                <Shield className="w-3 h-3 text-[var(--rose)] animate-pulse" />
                                <span className="text-[10px] font-black text-[var(--rose)] uppercase tracking-widest">! MALICIOUS</span>
                              </div>
                            )}
                            {!selected.is_locked && selected.hidden_signal_detected && (
                              <div className="px-3 py-1 rounded-full bg-[var(--rose)]/10 border border-[var(--rose)]/20 backdrop-blur-sm flex items-center gap-1.5 grayscale opacity-70">
                                <AlertTriangle className="w-3 h-3 text-[var(--rose)]" />
                                <span className="text-[9px] font-black text-[var(--rose)] uppercase tracking-tighter">Forensic Alert</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selected.soft_skills?.map((s, idx) => (
                              <span key={idx} className="text-[9px] font-black text-[var(--violet)] bg-[var(--violet)]/10 px-3 py-1 rounded-full uppercase tracking-widest border border-[var(--violet)]/20">#{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {selected.upsell_recommendations && selected.upsell_recommendations.length > 0 && (
                        <div className="bg-black/40 border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--rose)]" />
                          <p className="text-[11px] font-black text-[var(--muted)] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-[var(--rose)]" /> Neural Training Roadmap
                          </p>
                          <div className="space-y-4">
                            {selected.upsell_recommendations.map((rec: any, idx: number) => (
                              <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[var(--rose)]/30 transition-all">
                                <div className="mt-1 w-1.5 h-1.5 border border-[var(--rose)] rounded-full shrink-0" />
                                <span className="text-[11px] text-white/80 leading-relaxed">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-black/40 border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--emerald)]" />
                        <p className="text-[11px] font-black text-[var(--muted)] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                          <FileText className="w-4 h-4 text-[var(--emerald)]" /> Forensic Technology Stack
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selected.prompt_injection_detected ? (
                            <span className="bg-[var(--rose)]/10 border border-[var(--rose)]/30 px-4 py-2 rounded-xl text-[10px] font-black text-[var(--rose)] uppercase animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                              ! DATA_BREACH_REDACTED
                            </span>
                          ) : (
                            selected.skills.map((s, idx) => (
                              <span key={idx} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white/80 uppercase hover:border-[var(--emerald)]/50 transition-all hover:bg-[var(--emerald)]/5 shadow-sm">{s}</span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {selected.interview_questions && (
                      <div className="space-y-4">
                        <p className="text-[11px] font-black text-[var(--cyan)] uppercase tracking-[0.3em]">Screening Focus</p>
                        <div className="grid grid-cols-1 gap-3">
                          {selected.interview_questions!.slice(0, 5).map((q, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-white/80 italic leading-relaxed">"{q}"</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── RANKING METHODOLOGY ── */}
                    {selected.score_breakdown && (
                      <div className="space-y-6">
                        <div className="bg-black/40 border border-white/5 p-8 rounded-2xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[var(--cyan)] to-[var(--violet)]" />
                          <div className="flex items-center justify-between mb-6">
                            <p className="text-[11px] font-black text-[var(--muted)] uppercase tracking-[0.3em] flex items-center gap-3">
                              <BarChart3 className="w-4 h-4 text-[var(--cyan)]" /> Ranking Methodology
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">12-Factor Weighted Score</span>
                              <span className="text-xs font-black text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">{selected.score}/100</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(selected.score_breakdown).map(([k, v]) => {
                              const pct = v.max > 0 ? (v.score / v.max) * 100 : 0;
                              const tierColor = pct >= 80 ? 'text-[var(--emerald)]' : pct >= 50 ? 'text-[var(--cyan)]' : pct >= 25 ? 'text-yellow-500' : 'text-[var(--rose)]';
                              const tierLabel = pct >= 80 ? 'Excellent' : pct >= 50 ? 'Good' : pct >= 25 ? 'Average' : 'Low';
                              const barColor = pct >= 80 ? 'from-[var(--emerald)] to-[var(--emerald)]' : pct >= 50 ? 'from-[var(--cyan)] to-[var(--violet)]' : pct >= 25 ? 'from-yellow-500 to-yellow-600' : 'from-[var(--rose)] to-[var(--rose)]';
                              return (
                                <div key={k} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl group/bar hover:border-white/15 transition-all">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-black text-white/40 uppercase group-hover/bar:text-[var(--cyan)] transition-colors">{BREAKDOWN_LABELS[k] || k}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[8px] font-black uppercase tracking-widest ${tierColor}`}>{tierLabel}</span>
                                      <span className="text-xs font-black text-white">{v.score}/{v.max}</span>
                                    </div>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-1.5">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
                                      className={`h-full bg-gradient-to-r ${barColor} shadow-[0_0_10px_rgba(6,182,212,0.4)]`} />
                                  </div>
                                  <span className="text-[9px] text-white/30 font-mono">{v.detail}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-5 pt-4 border-t border-white/5">
                            <p className="text-[9px] text-white/20 font-mono leading-relaxed">
                              Formula: Internships(20) + Skills(20) + Projects(15) + CGPA(10) + Achievements(10) + Experience(5) + Extra-Curricular(5) + Degree(3) + Online(3) + Languages(3) + College(2) + School(2) = max 98pts → normalized
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── STRUCTURED DATA EXTRACTION ── */}
                    {selected.structured_data && !selected.prompt_injection_detected && !selected.is_locked && (
                      <div className="space-y-4">
                        <div className="bg-black/40 border border-white/5 p-8 rounded-2xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[var(--emerald)] via-[var(--cyan)] to-[var(--violet)]" />
                          <p className="text-[11px] font-black text-[var(--muted)] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <FileText className="w-4 h-4 text-[var(--emerald)]" /> Structured Data Extraction
                          </p>
                          <div className="space-y-5">

                            {/* Education */}
                            {selected.structured_data.education && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
                                  <span className="text-[10px] font-black text-[var(--cyan)] uppercase tracking-widest">Education</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 ml-4">
                                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                    <span className="text-[8px] text-white/30 uppercase tracking-wider block mb-1">Degree</span>
                                    <span className="text-xs font-bold text-white/80">{selected.structured_data.education.degree || 'N/A'}</span>
                                  </div>
                                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                    <span className="text-[8px] text-white/30 uppercase tracking-wider block mb-1">College</span>
                                    <span className="text-xs font-bold text-white/80 truncate block">{selected.structured_data.education.college || 'N/A'}</span>
                                  </div>
                                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                    <span className="text-[8px] text-white/30 uppercase tracking-wider block mb-1">CGPA</span>
                                    <span className="text-xs font-bold text-white/80">{selected.structured_data.education.cgpa || 'N/A'}</span>
                                  </div>
                                </div>
                                {selected.structured_data.education.details && selected.structured_data.education.details.length > 0 && (
                                  <div className="ml-4 space-y-1 mt-2">
                                    {selected.structured_data.education.details.map((d, i) => (
                                      <p key={i} className="text-[10px] text-white/50 pl-3 border-l border-white/10 leading-relaxed">{d}</p>
                                    ))}
                                  </div>
                                )}
                                {selected.structured_data.education.school_marks && selected.structured_data.education.school_marks.length > 0 && (
                                  <div className="ml-4 mt-2 flex gap-2">
                                    {selected.structured_data.education.school_marks.map((m, i) => (
                                      <span key={i} className="text-[9px] font-mono text-white/50 bg-white/5 px-2 py-1 rounded border border-white/5">
                                        {i === 0 ? '10th' : '12th'}: {m}%
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Internships */}
                            {selected.structured_data.internships && ((selected.structured_data.internships.count || 0) > 0 || (selected.structured_data.internships.details && selected.structured_data.internships.details.length > 0)) && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--violet)]" />
                                  <span className="text-[10px] font-black text-[var(--violet)] uppercase tracking-widest">Internships {selected.structured_data.internships.count > 0 ? `(${selected.structured_data.internships.count})` : ''}</span>
                                </div>
                                {selected.structured_data.internships.details && selected.structured_data.internships.details.length > 0 ? (
                                  <div className="ml-4 space-y-1.5">
                                    {selected.structured_data.internships.details.map((d, i) => (
                                      <div key={i} className="flex items-start gap-2 text-[10px] text-white/60 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                        <span className="text-[var(--violet)] font-black shrink-0">#{i + 1}</span>
                                        <span className="leading-relaxed">{d}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="ml-4 text-[10px] text-white/30 italic">{selected.structured_data.internships.count} internship(s) detected via keyword analysis</p>
                                )}
                              </div>
                            )}

                            {/* Projects */}
                            {selected.structured_data.projects && ((selected.structured_data.projects.count || 0) > 0 || (selected.structured_data.projects.titles && selected.structured_data.projects.titles.length > 0)) && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--emerald)]" />
                                  <span className="text-[10px] font-black text-[var(--emerald)] uppercase tracking-widest">Projects {selected.structured_data.projects.count > 0 ? `(${selected.structured_data.projects.count})` : ''}</span>
                                </div>
                                {selected.structured_data.projects.titles && selected.structured_data.projects.titles.length > 0 ? (
                                  <div className="ml-4 space-y-1.5">
                                    {selected.structured_data.projects.titles.map((t, i) => (
                                      <div key={i} className="flex items-start gap-2 text-[10px] text-white/60 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                        <span className="text-[var(--emerald)] font-black shrink-0">▸</span>
                                        <span className="leading-relaxed font-medium">{t}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="ml-4 text-[10px] text-white/30 italic">{selected.structured_data.projects.count} project(s) detected via section analysis</p>
                                )}
                              </div>
                            )}

                            {/* Experience */}
                            {selected.structured_data.experience && ((selected.structured_data.experience.years || 0) > 0 || (selected.structured_data.experience.count || 0) > 0 || (selected.structured_data.experience.details && selected.structured_data.experience.details.length > 0)) && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
                                  <span className="text-[10px] font-black text-[var(--cyan)] uppercase tracking-widest">Work Experience</span>
                                </div>
                                <div className="ml-4 flex gap-3 mb-2">
                                  {(selected.structured_data.experience.years || 0) > 0 && (
                                    <span className="text-[10px] text-white/60 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg">
                                      <span className="font-bold text-white/80">{selected.structured_data.experience.years}</span> years
                                    </span>
                                  )}
                                  {(selected.structured_data.experience.count || 0) > 0 && (
                                    <span className="text-[10px] text-white/60 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg">
                                      <span className="font-bold text-white/80">{selected.structured_data.experience.count}</span> roles
                                    </span>
                                  )}
                                </div>
                                {selected.structured_data.experience.details && selected.structured_data.experience.details.length > 0 && (
                                  <div className="ml-4 space-y-1.5 mt-1">
                                    {selected.structured_data.experience.details.map((d, i) => (
                                      <div key={i} className="flex items-start gap-2 text-[10px] text-white/60 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                        <span className="text-[var(--cyan)] font-black shrink-0">■</span>
                                        <span className="leading-relaxed">{d}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Certifications */}
                            {selected.structured_data.certifications && selected.structured_data.certifications.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Certifications ({selected.structured_data.certifications.length})</span>
                                </div>
                                <div className="ml-4 flex flex-wrap gap-2">
                                  {selected.structured_data.certifications.map((c, i) => (
                                    <span key={i} className="text-[9px] font-bold text-yellow-500/90 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 uppercase tracking-wider">{c}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Awards */}
                            {selected.structured_data.awards && selected.structured_data.awards.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Awards & Honors ({selected.structured_data.awards.length})</span>
                                </div>
                                <div className="ml-4 space-y-1.5">
                                  {selected.structured_data.awards.map((a, i) => (
                                    <div key={i} className="text-[10px] text-white/60 pl-3 border-l-2 border-amber-400/30 py-1 leading-relaxed">{a}</div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Languages */}
                            {selected.structured_data.languages && selected.structured_data.languages.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Languages ({selected.structured_data.languages.length})</span>
                                </div>
                                <div className="ml-4 flex flex-wrap gap-2">
                                  {selected.structured_data.languages.map((l, i) => (
                                    <span key={i} className="text-[9px] font-bold text-sky-400/90 bg-sky-400/10 px-3 py-1.5 rounded-lg border border-sky-400/20 capitalize">{l}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Publications */}
                            {selected.structured_data.publications && selected.structured_data.publications.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Publications ({selected.structured_data.publications.length})</span>
                                </div>
                                <div className="ml-4 space-y-1.5">
                                  {selected.structured_data.publications.map((p, i) => (
                                    <div key={i} className="text-[10px] text-white/60 pl-3 border-l-2 border-pink-400/30 py-1 leading-relaxed italic">{p}</div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Hobbies & Interests */}
                            {selected.structured_data.hobbies && selected.structured_data.hobbies.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Hobbies & Interests ({selected.structured_data.hobbies.length})</span>
                                </div>
                                <div className="ml-4 flex flex-wrap gap-2">
                                  {selected.structured_data.hobbies.map((h, i) => (
                                    <span key={i} className="text-[9px] font-medium text-orange-400/80 bg-orange-400/10 px-3 py-1.5 rounded-full border border-orange-400/20">{h}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Skill Domains Visualization */}
                            {selected.structured_data.skill_domains && Object.keys(selected.structured_data.skill_domains).length > 0 && (
                              <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
                                  <span className="text-[10px] font-black text-[var(--cyan)] uppercase tracking-widest">Skill Domains Taxonomy</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                                  {Object.entries(selected.structured_data.skill_domains).map(([domain, skills], i) => (
                                    <div key={i} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl hover:border-[var(--cyan)]/30 transition-colors">
                                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-2">{domain}</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {skills.map((s, idx) => (
                                          <span key={idx} className="text-[9px] font-bold text-[var(--cyan)] bg-[var(--cyan)]/10 px-2 py-0.5 rounded border border-[var(--cyan)]/20 uppercase shadow-[0_0_5px_rgba(6,182,212,0.2)]">
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Hackathons */}
                            {((selected.structured_data.hackathons?.details && selected.structured_data.hackathons.details.length > 0) || (selected.structured_data.hackathon_count || 0) > 0) && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                                  <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">Hackathons & Competitive Coding</span>
                                </div>
                                {selected.structured_data.hackathons?.details && selected.structured_data.hackathons.details.length > 0 ? (
                                  <div className="ml-4 space-y-1.5">
                                    {selected.structured_data.hackathons.details.map((h, i) => (
                                      <div key={i} className="flex items-start gap-2 text-[10px] text-white/60 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                        <span className="text-fuchsia-400 font-black shrink-0">❖</span>
                                        <span className="leading-relaxed font-medium">{h}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="ml-4 text-[10px] text-white/60 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                    <span className="font-bold text-fuchsia-400">{selected.structured_data.hackathon_count}</span> competitive coding / hackathon platforms detected
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Online Presence */}
                            {selected.structured_data.online_links && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Online Presence</span>
                                </div>
                                <div className="ml-4 flex gap-2">
                                  {selected.structured_data.online_links.github && (
                                    <span className="text-[9px] font-bold text-white/70 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
                                      <Github className="w-3 h-3" /> GitHub {selected.structured_data.github_username && <span className="text-[var(--cyan)]">@{selected.structured_data.github_username}</span>}
                                    </span>
                                  )}
                                  {selected.structured_data.online_links.linkedin && (
                                    <span className="text-[9px] font-bold text-blue-400/80 bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-400/20">LinkedIn</span>
                                  )}
                                  {selected.structured_data.online_links.portfolio && (
                                    <span className="text-[9px] font-bold text-teal-400/80 bg-teal-400/10 px-3 py-1.5 rounded-lg border border-teal-400/20">Portfolio</span>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MODALS LAYER ── */}
      <AnimatePresence>
        {modal === "email" && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#020617] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative">
              <button onClick={() => setModal(null)} className="absolute top-6 right-6 text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
              <h2 className="text-2xl font-black mb-6 uppercase tracking-wider text-white flex items-center gap-3">
                <Mail className="w-6 h-6 text-[var(--cyan)]" /> {emailType === "accept" ? "Acceptance Dispatch" : "Constructive Rejection"}
              </h2>
              {emailLoading ? <div className="h-48 flex items-center justify-center text-[var(--cyan)] text-xs font-mono animate-pulse uppercase tracking-[0.5em]">Synthesizing Narrative...</div> :
                <textarea value={emailContent} onChange={(e) => setEmailContent(e.target.value)} className="w-full h-80 bg-black/40 border border-white/5 rounded-2xl p-6 text-sm text-white/80 focus:outline-none focus:border-[var(--cyan)]/30 resize-none no-scrollbar transition-all" />
              }
              <div className="flex gap-3 mt-6">
                <button onClick={() => { navigator.clipboard.writeText(emailContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex-1 py-4 border border-white/10 rounded-xl text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5">
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} {copied ? "COPIED" : "COPY"}
                </button>
                <button
                  onClick={handleDirectSend}
                  disabled={sendingEmail || !selected?.email}
                  className="flex-[2] py-4 bg-[var(--cyan)] rounded-xl text-black font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
                >
                  {sendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {sendingEmail ? "RECRUITING..." : selected?.email ? `SEND TO ${selected.email}` : "NO EMAIL FOUND"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === "chat" && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#020617] border border-white/10 rounded-3xl w-full max-w-xl flex flex-col h-[600px] shadow-2xl relative overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-3"><MessageSquare className="w-5 h-5 text-[var(--cyan)]" /> Context Analysis</h2>
                <button onClick={() => setModal(null)}><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${m.role === "user" ? "bg-[var(--cyan)] text-black font-black" : "bg-white/5 border border-white/10 text-white/80"}`}>{m.text}</div>
                  </div>
                ))}
                {chatLoading && <div className="w-8 h-8 rounded-full border-2 border-[var(--cyan)] border-t-transparent animate-spin ml-2" />}
              </div>
              <div className="p-4 border-t border-white/5 flex gap-2">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Ask specific questions..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[var(--cyan)]" />
                <button onClick={sendChat} className="bg-[var(--cyan)] text-black p-3 rounded-xl hover:brightness-110 transition-all"><Send className="w-4 h-4" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === "outreach" && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#020617] border border-[var(--emerald)]/30 rounded-3xl w-full max-w-2xl p-10 relative flex flex-col">
              <button onClick={() => setModal(null)} className="absolute top-8 right-8 text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide flex items-center gap-4"><Send className="w-8 h-8 text-[var(--emerald)]" /> SMART OUTREACH</h2>
              <p className="text-[10px] font-mono text-[var(--muted)] mb-8 tracking-[0.4em] uppercase">Hyper-Personalized Recruiting Signal</p>
              {featureLoading ? <div className="h-64 flex flex-col items-center justify-center gap-4"><Loader2 className="w-12 h-12 text-[var(--emerald)] animate-spin" /><p className="text-[10px] font-mono animate-pulse uppercase tracking-widest text-[var(--emerald)]">SYNTHESIZING FEED...</p></div> : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <textarea value={outreachMessage} onChange={(e) => setOutreachMessage(e.target.value)} className="w-full h-80 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white/80 focus:outline-none resize-none leading-relaxed tracking-wide" />
                  <button onClick={() => { navigator.clipboard.writeText(outreachMessage); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="w-full py-4 bg-[var(--emerald)] rounded-xl text-black font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />} {copied ? "COPIED TO NEURAL CACHE" : "COPY MESSAGE"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === "interview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#020617] border border-[var(--violet)]/30 rounded-3xl w-full max-w-3xl p-10 relative flex flex-col h-[85vh]">
              <button onClick={() => setModal(null)} className="absolute top-8 right-8 text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide flex items-center gap-4"><Brain className="w-8 h-8 text-[var(--violet)]" /> INTERVIEW PILOT</h2>
              <p className="text-[10px] font-mono text-[var(--muted)] mb-8 tracking-[0.4em] uppercase">Technical Screening Blueprint</p>
              {featureLoading ? <div className="flex-1 flex flex-col items-center justify-center gap-4"><Loader2 className="w-12 h-12 text-[var(--violet)] animate-spin" /><p className="text-[10px] font-mono animate-pulse uppercase tracking-widest text-[var(--violet)]">DECONSTRUCTING SIGNAL...</p></div> : interviewScript && (
                <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pr-2">
                  {interviewScript.script.map((s, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl group relative overflow-hidden transition-all hover:bg-white/[0.08]">
                      <div className="absolute top-4 right-6 text-[var(--violet)]/10 font-mono text-4xl font-black">#0{idx + 1}</div>
                      <p className="text-base font-black text-white leading-relaxed mb-4 pr-12">{s.question}</p>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-[9px] font-black text-[var(--emerald)] uppercase tracking-widest mb-1 opacity-60">Ideal Forensic Signature</p>
                        <p className="text-xs text-white/50 italic">{s.target}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === "battle" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="bg-[#020617] border border-[var(--cyan)]/30 rounded-3xl w-full max-w-4xl p-10 relative shadow-[0_0_100px_rgba(6,182,212,0.2)]">
              <button onClick={() => setModal(null)} className="absolute top-8 right-8 text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide flex items-center gap-4"><Zap className="w-8 h-8 text-[var(--cyan)]" /> BATTLE ROYALE</h2>
              <p className="text-[10px] font-mono text-[var(--muted)] mb-10 tracking-[0.4em] uppercase">Neutral High-Volume Comparative Arbitration</p>

              <div className="mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-end gap-6 bg-[var(--cyan)]/5 border border-[var(--cyan)]/20 p-6 rounded-2xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--cyan)]" />
                      <label className="text-[11px] font-black text-white/80 uppercase tracking-[0.2em] block">RECRUITER'S ARBITRATION QUESTION</label>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] mb-3 italic tracking-tight opacity-70">Ask anything (e.g., "Who has more leadership experience?" or "Who is best for a remote culture?"). AI will scan the FULL text of all resumes.</p>
                    <div className="relative group">
                      <input
                        type="text"
                        value={battleQuestion}
                        onChange={(e) => setBattleQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && startBattle()}
                        placeholder="Enter your specific arbitration focus..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs text-white outline-none focus:border-[var(--cyan)] transition-all placeholder:text-white/20"
                      />
                      <button
                        onClick={startBattle}
                        className="absolute right-2 top-2 px-5 py-2 bg-[var(--cyan)] hover:brightness-110 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      >
                        COMMENCE BATTLE
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${showManualEntry ? 'bg-[var(--cyan)] text-black border-[var(--cyan)]' : 'border-white/10 text-[var(--muted)] hover:text-white hover:bg-white/5'}`}
                  >
                    {showManualEntry ? "HIDE MANUAL ENTRY" : "ADD MANUAL CANDIDATE"}
                  </button>
                </div>
              </div>

              {showManualEntry && (
                <div className="mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                  <p className="text-[11px] font-black text-[var(--cyan)] uppercase tracking-[0.3em] mb-4">Manual Factor Entry</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-white/40 uppercase">Name</label>
                      <input type="text" value={manualCandidate.name} onChange={(e) => setManualCandidate({ ...manualCandidate, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--cyan)]/50" />
                    </div>
                    {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[9px] font-bold text-white/40 uppercase truncate block">{label}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={manualCandidate[key]}
                          onChange={(e) => setManualCandidate({ ...manualCandidate, [key]: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--cyan)]/50"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={async () => {
                        setFeatureLoading(true);
                        try {
                          const fileHashes = selectedIds.filter(Boolean);
                          const ids = candidates
                            .filter(c => selectedIds.includes(c.file_hash || ""))
                            .map(c => c.id)
                            .filter((id): id is number => id !== undefined && id !== null);

                          if (fileHashes.length + 1 > 6) {
                            addLog("! Token Limit: Cannot exceed 6 total candidates in Battle Royale.");
                            setFeatureLoading(false);
                            return;
                          }

                          const manualDataPayload = {
                            name: manualCandidate.name,
                            score: Object.entries(manualCandidate).reduce((acc, [k, v]) => k === 'name' ? acc : acc + (typeof v === 'number' ? v : 0), 0),
                            skills: [],
                            experience_years: manualCandidate.experience || 0,
                            project_count: manualCandidate.projects || 0,
                            cgpa: manualCandidate.cgpa || 0,
                            internships: manualCandidate.internships || 0
                          };

                          const res = await compareCandidates(ids, jd, fileHashes, battleQuestion, [manualDataPayload]);
                          setComparison(res);
                        } catch (err) {
                          addLog("! Battle error with manual candidate.");
                        } finally {
                          setFeatureLoading(false);
                        }
                      }}
                      className="px-6 py-2.5 bg-[var(--cyan)] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    >
                      Compare with Manual Data
                    </button>
                  </div>
                </div>
              )}

              {featureLoading ? <div className="h-96 flex flex-col items-center justify-center gap-4"><Loader2 className="w-12 h-12 text-[var(--cyan)] animate-spin" /><p className="text-[10px] font-mono animate-pulse uppercase tracking-widest text-[var(--cyan)]">SIMULATING CONFLICT...</p></div> : comparison && (
                <div className="space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
                  {/* Section 1: Winner Verdict */}
                  <div className="bg-[var(--emerald)]/10 border border-[var(--emerald)]/20 p-8 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><Zap className="w-28 h-28 text-[var(--emerald)]" /></div>
                    <p className="text-[11px] font-black text-[var(--emerald)] uppercase tracking-[0.4em] mb-3">🏆 ARBITRATION VERDICT</p>
                    <h3 className="text-4xl font-black text-white mb-4 tracking-tight leading-none drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">{comparison!.winner}</h3>
                    <div className="p-4 bg-black/40 rounded-xl border border-[var(--emerald)]/20 mb-4">
                      <p className="text-[9px] font-black text-[var(--emerald)] uppercase tracking-widest mb-1 opacity-60">WINNING CRITERIA</p>
                      <p className="text-sm font-serif italic text-white/90 leading-relaxed">"{comparison!.comparison_matrix?.find(m => m.name === comparison!.winner)?.kill_factor || 'Superior technical alignment with JD requirements.'}"</p>
                    </div>
                    {comparison!.runner_up && (
                      <div className="flex items-center gap-3 text-white/40">
                        <span className="text-[9px] font-black uppercase tracking-widest">Runner-up:</span>
                        <span className="text-sm font-bold text-white/60">{comparison!.runner_up}</span>
                      </div>
                    )}
                  </div>

                  {/* Section 2: Dueling Matrix (Horizontal) */}
                  <div className="space-y-4">
                    <p className="text-[11px] font-black text-[var(--muted)] uppercase tracking-[0.3em] px-2">Dueling Matrix (Neural Ranks)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {comparison!.comparison_matrix?.map((m, idx) => (
                        <div key={idx} className={`relative flex flex-col p-6 border transition-all rounded-2xl group/card overflow-hidden ${m.name === comparison!.winner ? 'bg-[var(--emerald)]/10 border-[var(--emerald)]/30 ring-1 ring-[var(--emerald)]/20' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                          {m.name === comparison!.winner && (
                            <div className="absolute -top-6 -right-6 w-16 h-16 bg-[var(--emerald)] opacity-10 blur-xl group-hover/card:opacity-20 transition-opacity" />
                          )}
                          <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border ${m.name === comparison!.winner ? 'bg-[var(--emerald)]/20 border-[var(--emerald)] text-[var(--emerald)]' : 'bg-white/5 border-white/10 text-white/40'}`}>RANK #{m.rank}</span>
                            {m.name === comparison!.winner && <Zap className="w-4 h-4 text-[var(--emerald)]" />}
                          </div>
                          <h4 className={`text-sm font-black uppercase tracking-wider mb-2 ${m.name === comparison!.winner ? 'text-[var(--emerald)]' : 'text-white'}`}>{m.name}</h4>
                          <p className="text-[11px] text-white/60 leading-relaxed line-clamp-4 italic group-hover/card:text-white/80 transition-colors">"{m.kill_factor}"</p>
                          {m.name === comparison!.winner && (
                            <div className="mt-4 pt-4 border-t border-[var(--emerald)]/20">
                              <span className="text-[8px] font-black text-[var(--emerald)] uppercase tracking-widest">Arbitration: COMPLETED</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: AI Reasoning */}
                  <div className="bg-[#0a0f1d] border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 opacity-[0.02]"><Activity className="w-48 h-48" /></div>
                    <p className="text-[11px] font-black text-[var(--violet)] uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> REASONING TRACE</p>
                    <div className="text-sm text-white/70 leading-relaxed relative z-10">
                      {comparison!.arbitration_summary ? (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:italic prose-p:text-white/60">
                          <ReactMarkdown>{comparison!.arbitration_summary}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="italic text-white/40">Synthesizing ranking protocol...</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── How It Works Modal ── */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-8" onClick={() => setShowHowItWorks(false)}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-[#0a0f1d] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.1)]">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Info className="w-6 h-6 text-[var(--cyan)]" />
                    <h2 className="text-xl font-black text-white tracking-wider uppercase">How It Works</h2>
                  </div>
                  <button onClick={() => setShowHowItWorks(false)} className="text-white/40 hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Slide Tabs */}
                <div className="flex gap-2 mb-6">
                  {HOW_IT_WORKS_SLIDES.map((s, idx) => (
                    <button key={idx} onClick={() => setHowItWorksSlide(idx)}
                      className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${howItWorksSlide === idx ? 'bg-white/10 border-[var(--cyan)]/40 text-[var(--cyan)]' : 'bg-white/[0.02] border-white/5 text-white/30 hover:text-white/60'}`}>
                      {s.title.split(' ').slice(0, 2).join(' ')}
                    </button>
                  ))}
                </div>

                {/* Active Slide */}
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {HOW_IT_WORKS_SLIDES[howItWorksSlide].icon}
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">{HOW_IT_WORKS_SLIDES[howItWorksSlide].title}</h3>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed mb-5">{HOW_IT_WORKS_SLIDES[howItWorksSlide].desc}</p>
                  <div className="space-y-2.5">
                    {HOW_IT_WORKS_SLIDES[howItWorksSlide].steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 px-4 py-2.5 bg-black/40 rounded-lg border border-white/5">
                        <span className="text-[9px] font-black text-[var(--cyan)] bg-[var(--cyan)]/15 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                        <span className="text-[11px] text-white/70 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm Purge Modal ── */}
      <AnimatePresence>
        {showConfirmPurge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[110] flex items-center justify-center p-8" onClick={() => setShowConfirmPurge(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-[#0a0f1d] border border-[var(--rose)]/30 rounded-2xl w-full max-w-md p-8 shadow-[0_0_60px_rgba(244,63,94,0.1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--rose)]/15 border border-[var(--rose)]/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-[var(--rose)]" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Clear All Data</h3>
              </div>
              <p className="text-sm text-white/50 mb-6 leading-relaxed">Are you sure you want to permanently delete all candidate data? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmPurge(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-[10px] font-bold text-[var(--muted)] hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">Cancel</button>
                <button onClick={confirmPurge} className="flex-1 py-3 rounded-xl bg-[var(--rose)] text-black text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]">Delete Everything</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── JD Generation Prompt Modal ── */}
      <AnimatePresence>
        {showJdPrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[110] flex items-center justify-center p-8" onClick={() => setShowJdPrompt(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-[#0a0f1d] border border-[var(--violet)]/30 rounded-2xl w-full max-w-lg p-8 shadow-[0_0_60px_rgba(124,58,237,0.1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--violet)]/15 border border-[var(--violet)]/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[var(--violet)]" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">AI Generate JD</h3>
              </div>
              <p className="text-xs text-white/40 mb-4">Describe the role and we'll generate a complete job description.</p>
              <input
                autoFocus
                value={jdPromptText}
                onChange={(e) => setJdPromptText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitJdGen()}
                placeholder="e.g. 'Senior React Developer at a fintech startup with remote work'"
                className="w-full bg-black/40 border border-white/10 rounded-xl text-sm p-4 text-white/80 focus:outline-none focus:border-[var(--violet)]/50 transition-all mb-4 placeholder:text-white/20"
              />
              <div className="flex gap-3">
                <button onClick={() => { setShowJdPrompt(false); setJdPromptText(""); }} className="flex-1 py-3 rounded-xl border border-white/10 text-[10px] font-bold text-[var(--muted)] hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">Cancel</button>
                <button onClick={submitJdGen} disabled={!jdPromptText.trim()} className="flex-1 py-3 rounded-xl bg-[var(--violet)] text-black text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">Generate</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success Toast ── */}
      <AnimatePresence>
        {sentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl bg-[var(--emerald)] text-black font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-[0_0_40px_rgba(16,185,129,0.5)]"
          >
            <CheckCircle2 className="w-5 h-5" />
            {sentSuccess}
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}
