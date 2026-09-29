"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Activity, ArrowUpRight, Crown, Medal, Zap } from "lucide-react";
import { useLeaderboard } from "@/lib/use-leaderboard";

const DURATIONS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function LeaderboardPreview() {
  const [selectedDuration, setSelectedDuration] = useState(1);
  const { entries, loading } = useLeaderboard(5, selectedDuration);

  return (
    <section className="border-t border-primary/10 bg-black px-4 py-24 text-primary sm:px-6 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <p className="text-xs uppercase tracking-[0.18em] text-primary/55">Live leaderboard</p>
            </div>
            <h2 className="max-w-2xl text-4xl font-medium leading-[0.95] tracking-tighter sm:text-5xl md:text-7xl">
              A little competition makes speed addictive.
            </h2>
          </motion.div>
          <p className="max-w-xs text-sm leading-relaxed text-primary/55 md:pb-1">
            See what the community is typing right now, then set a target for your next run.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="border border-primary/15 bg-white/2"
        >
          {/* Header + Duration Selector */}
          <div className="flex flex-col gap-4 border-b border-primary/10 p-5 sm:px-7 sm:py-5">
            <div className="flex items-center gap-2 text-sm text-primary/60">
              <Activity className="h-4 w-4 text-primary" strokeWidth={1.7} />
              <span>Top 5 typists · {selectedDuration}-minute test</span>
            </div>
            {/* Duration Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDuration(d)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    selectedDuration === d
                      ? "bg-primary text-black"
                      : "border border-primary/15 text-primary/50 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Table Header */}
          <div className="hidden grid-cols-[4rem_1fr_6rem_7rem] gap-4 border-b border-primary/10 px-7 py-4 text-[10px] uppercase tracking-[0.16em] text-primary/35 sm:grid">
            <span>Rank</span>
            <span>Typist</span>
            <span>Speed</span>
            <span>Accuracy</span>
          </div>

          {/* Rows */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-primary/40">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary mr-3" />
                Loading…
              </div>
            ) : entries.length === 0 ? (
              <div className="py-12 text-center text-sm text-primary/40">
                No scores yet for {selectedDuration}-minute tests. Be the first!
              </div>
            ) : (
              entries.map((entry, index) => (
                <motion.div
                  key={entry.uid}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-primary/10 px-5 py-4 last:border-b-0 sm:grid-cols-[4rem_1fr_6rem_7rem] sm:gap-4 sm:px-7 sm:py-5"
                >
                  <div className={`flex items-center gap-2 text-sm font-medium ${index === 0 ? "text-primary" : index === 1 ? "text-primary/75" : index === 2 ? "text-primary/65" : "text-primary/55"}`}>
                    {index === 0 ? <Crown className="hidden h-4 w-4 sm:block" strokeWidth={1.7} /> : null}
                    {index === 1 ? <Medal className="hidden h-4 w-4 sm:block" strokeWidth={1.7} /> : null}
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    {entry.photoURL ? (
                      <Image src={entry.photoURL} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover border border-primary/15" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-xs font-medium text-primary/70">
                        {getInitials(entry.name)}
                      </span>
                    )}
                    <span className="truncate text-sm font-medium text-primary">{entry.name}</span>
                  </div>
                  <span className="text-right text-sm font-medium text-primary sm:text-left">{entry.rawWpm} <span className="text-xs text-primary/40">WPM</span></span>
                  <span className="hidden text-sm text-primary/65 sm:block">{entry.accuracy}%</span>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col items-start justify-between gap-5 border-t border-primary/10 p-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
            <div className="flex items-center gap-2 text-sm text-primary/50">
              <Zap className="h-4 w-4 text-primary" strokeWidth={1.7} />
              <span>Your next personal best starts with one test.</span>
            </div>
            <Link
              href="/leaderboard"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/70"
            >
              View full leaderboard
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
