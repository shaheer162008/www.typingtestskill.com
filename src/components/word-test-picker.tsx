"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Play } from "lucide-react";
import { useFirestoreLessons } from "@/lib/firestore-lessons";

export default function WordTestPicker({ wordCount }: { wordCount: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const { lessons: allLessons, loading, error } = useFirestoreLessons("all");
  
  const filteredLessons = allLessons.filter(l => l.mode === "words" && l.wordCount === wordCount);
  const visibleLessons = filteredLessons.map((item, i) => ({ 
    id: item.id, 
    title: item.title, 
    label: `Lesson ${String(i + 1).padStart(2, "0")}`, 
    preview: item.text, 
    description: item.title
  }));
  
  const lesson = visibleLessons[Math.min(activeIndex, Math.max(visibleLessons.length - 1, 0))];
  const startHref = lesson ? `/test?mode=words&wordCount=${wordCount}&lesson=${lesson.id}` : "#";
  const move = (dir: number) => setActiveIndex((curr) => (curr + dir + visibleLessons.length) % visibleLessons.length);

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="relative border border-primary/20 bg-[#0a0a0a] p-1.5 shadow-[0_24px_90px_rgba(0,0,0,0.35)] sm:p-2 rounded-2xl">
        <div className="border border-white/10 rounded-xl p-5 sm:p-8 bg-[#0c0c0c]">
          
          <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-6">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/50">
                Choose a lesson
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {loading ? "Loading..." : lesson?.title ?? "No lessons available"}
              </h2>
              <p className="mt-1 text-xs text-primary/40">
                {loading ? "Connecting..." : error ?? `${lesson?.label ?? ""} · ${wordCount} words`}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-primary/80">
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary/40 mb-3">Passage Preview</p>
            <p className="text-lg leading-relaxed tracking-[-0.01em]">
              {lesson?.preview ? lesson.preview.substring(0, 120) + "..." : "Lesson preview will appear here."}
            </p>
          </div>

          <div className="mt-6 flex justify-end border-t border-white/10 pt-6">
            <Link 
              href={startHref} 
              className={`group w-full sm:w-auto flex items-center justify-center gap-2 bg-white px-10 py-3.5 rounded-lg text-sm font-bold text-black transition-all hover:bg-primary shadow-[0_0_20px_rgba(255,255,255,0.1)] ${!lesson ? "pointer-events-none opacity-50" : ""}`}
            >
              <Play className="w-4 h-4 fill-current" />
              Start Test
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <button type="button" onClick={() => move(-1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-primary/50 hover:bg-white/5 hover:text-primary transition-all">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              {visibleLessons.map((item, index) => (
                <button 
                  key={item.label} 
                  type="button" 
                  onClick={() => setActiveIndex(index)} 
                  className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-primary" : "w-2 bg-primary/20 hover:bg-primary/50"}`} 
                />
              ))}
            </div>
            <button type="button" onClick={() => move(1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-primary/50 hover:bg-white/5 hover:text-primary transition-all">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
