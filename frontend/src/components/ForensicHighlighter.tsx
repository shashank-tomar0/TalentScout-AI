"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Info, Shield, AlertTriangle } from "lucide-react";
import { API_URL } from "@/lib/api";

interface Highlight {
  page: number;
  text: string;
  type: string;
  bbox: number[]; // [x0, top, x1, bottom]
}

interface ForensicHighlighterProps {
  fileHash: string;
  highlights: Highlight[];
}

export default function ForensicHighlighter({ fileHash, highlights }: ForensicHighlighterProps) {
  const [page, setPage] = useState(1);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const pageHighlights = highlights.filter(h => h.page === page);
  const totalPages = Math.max(...highlights.map(h => h.page), 1);

  useEffect(() => {
    if (containerRef.current) {
      const updateSize = () => {
        if (containerRef.current) {
          setImgSize({
            w: containerRef.current.clientWidth,
            h: containerRef.current.clientHeight
          });
        }
      };
      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
  }, [page]);

  // Standard PDF page size (estimate or fetch - typically 612x792)
  // For precise overlay, we assume the bbox is relative to the page dimensions
  // fitz/pdfplumber uses points (1/72 inch). 
  // We'll normalize based on the img tag's natural size vs displayed size.
  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalW = img.naturalWidth / (150 / 72); // convert pixels back to points
    const naturalH = img.naturalHeight / (150 / 72);
    setImgSize({ w: img.clientWidth, h: img.clientHeight });
  };

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-3xl">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Forensic Scan Output</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 bg-white/5 rounded-lg text-[10px] text-white disabled:opacity-20 hover:bg-white/10 transition-all font-black uppercase"
          >Prev</button>
          <span className="text-[10px] text-[var(--cyan)] font-mono">PAGE {page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 bg-white/5 rounded-lg text-[10px] text-white disabled:opacity-20 hover:bg-white/10 transition-all font-black uppercase"
          >Next</button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden p-6 flex items-center justify-center">
        <div ref={containerRef} className="relative group shadow-2xl shadow-black/50 border border-white/10">
          <img
            src={`${API_URL}/pdf_page/${fileHash}/${page - 1}`}
            onLoad={handleImgLoad}
            className="max-h-[60vh] object-contain select-none"
            alt="Resume Page"
          />

          {/* Highlight Overlays */}
          {pageHighlights.map((h, i) => {
            // Normalized coordinates (0-100%)
            // Assuming base page is ~612pts wide (standard)
            // We use a responsive scaling logic
            return (
              <div
                key={i}
                className="absolute border-2 border-[var(--cyan)] bg-[var(--cyan)]/20 rounded-sm cursor-help transition-all hover:scale-110 hover:bg-[var(--cyan)]/40 group/h"
                style={{
                  left: `${(h.bbox[0] / 612) * 100}%`,
                  top: `${(h.bbox[1] / 792) * 100}%`,
                  width: `${((h.bbox[2] - h.bbox[0]) / 612) * 100}%`,
                  height: `${((h.bbox[3] - h.bbox[1]) / 792) * 100}%`
                }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-[8px] font-black uppercase tracking-tighter rounded opacity-0 group-hover/h:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  DETECTED: {h.text}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-4 bg-black/40 border-t border-white/5">
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
          {pageHighlights.map((h, i) => (
            <div key={i} className="shrink-0 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 group hover:border-[var(--cyan)]/50 transition-all cursor-crosshair">
              <Search className="w-3 h-3 text-[var(--cyan)]" />
              <span className="text-[10px] font-black text-white/60 group-hover:text-white transition-colors">{h.text}</span>
            </div>
          ))}
          {pageHighlights.length === 0 && (
            <p className="text-[9px] text-white/20 italic uppercase tracking-wider">No significant signals on this page</p>
          )}
        </div>
      </div>
    </div>
  );
}
