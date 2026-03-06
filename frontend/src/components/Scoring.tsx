"use client";
import { useEffect, useRef } from "react";

const WEIGHTS = [
  { name: "Prior Internships", pct: 20 },
  { name: "Technical Skills", pct: 20 },
  { name: "Projects", pct: 15 },
  { name: "CGPA / Academic", pct: 10 },
  { name: "Quantifiable Achievements", pct: 10 },
  { name: "Work Experience", pct: 5 },
  { name: "Extra-Curricular", pct: 5 },
  { name: "Degree Quality", pct: 3 },
  { name: "Online Presence", pct: 3 },
  { name: "Language Fluency", pct: 3 },
  { name: "College Tier", pct: 2 },
  { name: "School Marks", pct: 2 }
];
const RADAR_VALUES = [0.85, 0.9, 0.75, 0.82, 0.6, 0.5, 0.7, 0.65, 0.8, 0.7, 0.55, 0.9];
const RADAR_LABELS = ["Internships", "Skills", "Projects", "CGPA", "Awards", "Work Exp", "Extra", "Degree", "Online", "Languages", "College", "School"];

function RadarChart() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const cx = 190, cy = 190, r = 130, n = RADAR_LABELS.length;
    ctx.clearRect(0, 0, 380, 380);
    // grid
    for (let level = 1; level <= 5; level++) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * r * (level / 5), y = cy + Math.sin(a) * r * (level / 5);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1; ctx.stroke();
    }
    // spokes
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1; ctx.stroke();
    }
    // data
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * r * RADAR_VALUES[i], y = cy + Math.sin(a) * r * RADAR_VALUES[i];
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, "rgba(6,182,212,0.35)"); grad.addColorStop(1, "rgba(124,58,237,0.15)");
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = "#06B6D4"; ctx.lineWidth = 2; ctx.stroke();
    // labels
    ctx.font = "500 11px Outfit, sans-serif"; ctx.fillStyle = "#64748B"; ctx.textAlign = "center";
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      ctx.fillText(RADAR_LABELS[i], cx + Math.cos(a) * (r + 22), cy + Math.sin(a) * (r + 22) + 4);
    }
    // dots
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * RADAR_VALUES[i], cy + Math.sin(a) * r * RADAR_VALUES[i], 4, 0, Math.PI * 2);
      ctx.fillStyle = "#06B6D4"; ctx.fill();
    }
  }, []);
  return <canvas ref={ref} width={380} height={380} style={{ maxWidth: 380 }} />;
}

export default function Scoring() {
  return (
    <section id="scoring" style={{ padding: "120px 60px" }}>
      <div className="container">
        <p className="section-label reveal">Scoring Engine</p>
        <h2 className="section-title reveal reveal-d1">Transparent. Weighted.<br />Anti-gamed.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", marginTop: 60 }}>
          {/* Left: weight bars */}
          <div>
            <p className="section-sub reveal reveal-d2" style={{ marginBottom: 24 }}>
              Every resume scored against 12 research-backed factors. Weights are fixed and cannot be inflated by resume verbosity.
            </p>
            <div className="reveal reveal-d2" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 8, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", fontSize: "0.78rem", color: "var(--rose)", fontFamily: "var(--font-mono)", marginBottom: 28 }}>
              ⚡ Anti-overfitting: word count is never a scoring signal
            </div>
            <div className="reveal reveal-d3" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {WEIGHTS.map((w: any, i: number) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{w.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--cyan)" }}>{w.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 100, width: `${(w.pct / 20) * 100}%`, background: "linear-gradient(90deg, var(--cyan), var(--violet))", transformOrigin: "left", animation: "growWidth 1.2s ease both" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Right: radar */}
          <div className="reveal reveal-d2" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <RadarChart />
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
              Sample candidate radar — each axis represents one scoring dimension. Normalized and capped to prevent inflation.
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes growWidth { from{transform:scaleX(0)} to{transform:scaleX(1)} }`}</style>
    </section>
  );
}
