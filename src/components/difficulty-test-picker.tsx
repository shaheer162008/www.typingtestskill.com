"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Clock, Play } from "lucide-react";
import { useFirestoreLessons } from "@/lib/firestore-lessons";

export default function DifficultyTestPicker({ mode, difficulty }: { mode: "test" | "practice"; difficulty: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [duration, setDuration] = useState(1);
  
  // We pass 'mode' and rely on local filtering since useFirestoreLessons reads everything.
  // Actually, wait, useFirestoreLessons currently only filters by legacy categoryIds.
  // Let's modify the component to fetch all and filter manually, OR use the hook.
  // To not break existing code, we can just use the hook and then filter here.
  const { lessons: allLessons, loading, error } = useFirestoreLessons("all");
  
  const filteredLessons = allLessons.filter(l => l.mode === mode && l.difficulty === difficulty);
  const visibleLessons = filteredLessons.map((item, i) => ({ 
    id: item.id, 
    title: item.title, 
    label: `Lesson ${String(i + 1).padStart(2, "0")}`, 
    preview: item.text, 
    description: item.focus ?? `${difficulty} difficulty practice.` 
  }));
  
  const lesson = visibleLessons[Math.min(activeIndex, Math.max(visibleLessons.length - 1, 0))];
  const startHref = lesson ? `/test?mode=${mode}&difficulty=${difficulty}&duration=${duration}&lesson=${lesson.id}` : "#";
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
                {loading ? "Connecting..." : error ?? `${lesson?.label ?? ""} · ${difficulty} level`}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-primary/80">
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary/40 mb-3">Passage Preview</p>
            <p className="text-lg leading-relaxed tracking-[-0.01em]">
              {lesson?.preview ? lesson.preview.substring(0, 120) + "..." : "Lesson preview will appear here."}
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 border-t border-white/10 pt-6">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold uppercase tracking-widest text-primary/50 mb-2">Select Duration</label>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 10, 15, 20, 25, 30].map((min) => (
                  <button 
                    key={min}
                    onClick={() => setDuration(min)}
                    className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${duration === min ? 'bg-primary text-black shadow-md' : 'border border-white/10 text-primary/60 hover:text-primary hover:border-white/25'}`}
                  >
                    <Clock className="w-3 h-3" /> {min}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col items-end">
              <Link 
                href={startHref} 
                className={`group w-full sm:w-auto flex items-center justify-center gap-2 bg-white px-8 py-3.5 rounded-lg text-sm font-bold text-black transition-all hover:bg-primary shadow-[0_0_20px_rgba(255,255,255,0.1)] ${!lesson ? "pointer-events-none opacity-50" : ""}`}
              >
                <Play className="w-4 h-4 fill-current" />
                Start Test
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
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
