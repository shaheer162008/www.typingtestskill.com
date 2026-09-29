"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Crown, Medal, Trophy } from "lucide-react";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { useLeaderboard } from "@/lib/use-leaderboard";

const DURATIONS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function LeaderboardPageClient() {
  const [selectedDuration, setSelectedDuration] = useState(1);
  const { entries, loading } = useLeaderboard(10, selectedDuration);

  return (
    <div className="min-h-screen bg-[#080908] text-primary">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="border-b border-primary/10 px-6 py-20 sm:px-8 md:px-10 md:py-28">
          <div className="mx-auto max-w-7xl">
            <p className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary/50">
              <Trophy className="h-4 w-4" aria-hidden="true" /> Community leaderboard
            </p>
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <h1 className="max-w-3xl text-5xl font-medium leading-[0.92] tracking-[-0.06em] sm:text-7xl">
                  Find your next target.
                </h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-primary/55 sm:text-lg">
                  See the fastest typists for each test duration, then go beat them.
                </p>
              </div>
              <Link
                href="/typing-test"
                className="group inline-flex items-center gap-3 self-start bg-primary px-5 py-3 text-sm font-medium text-black transition-transform hover:-translate-y-0.5 lg:self-end"
              >
                Set a score
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Leaderboard Table */}
        <section className="px-6 py-16 sm:px-8 md:px-10 md:py-24">
          <div className="mx-auto max-w-5xl">

            {/* Duration Selector */}
            <div className="mb-8">
              <p className="mb-4 text-xs uppercase tracking-[0.16em] text-primary/40">Select test duration</p>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                      selectedDuration === d
                        ? "bg-primary text-black shadow-[0_0_20px_rgba(225,224,204,0.15)]"
                        : "border border-primary/15 text-primary/50 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="border border-primary/15 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-primary/10 p-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium">Top 10 · {selectedDuration}-minute typing test</span>
                </div>
                <span className="text-xs text-primary/40">Best WPM per typist</span>
              </div>

              <div className="hidden grid-cols-[5rem_1fr_8rem_8rem_8rem] gap-4 border-b border-primary/10 px-7 py-4 text-[10px] uppercase tracking-[0.16em] text-primary/35 sm:grid">
                <span>Rank</span>
                <span>Typist</span>
                <span>Speed</span>
                <span>Accuracy</span>
                <span>Difficulty</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 text-sm text-primary/40">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary mr-3" />
                  Loading leaderboard…
                </div>
              ) : entries.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-primary/40 mb-2">No scores yet for {selectedDuration}-minute tests.</p>
                  <p className="text-xs text-primary/25">Be the first to set a record!</p>
                </div>
              ) : (
                entries.map((entry, index) => (
                  <div
                    key={entry.uid}
                    className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-primary/10 px-5 py-5 last:border-0 sm:grid-cols-[5rem_1fr_8rem_8rem_8rem] sm:px-7"
                  >
                    <span className={`flex items-center gap-2 text-sm font-medium ${index === 0 ? "text-primary" : index === 1 ? "text-primary/75" : index === 2 ? "text-primary/65" : "text-primary/50"}`}>
                      {index === 0 ? <Crown className="hidden h-4 w-4 sm:block" aria-hidden="true" /> : null}
                      {index === 1 ? <Medal className="hidden h-4 w-4 sm:block" aria-hidden="true" /> : null}
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex min-w-0 items-center gap-3">
                      {entry.photoURL ? (
                        <Image src={entry.photoURL} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover border border-primary/15" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-xs font-medium text-primary/70">
                          {getInitials(entry.name)}
                        </span>
                      )}
                      <span className="truncate font-medium">{entry.name}</span>
                    </div>
                    <span className="text-sm font-medium sm:text-left">{entry.rawWpm} <span className="text-xs text-primary/40">WPM</span></span>
                    <span className="hidden text-sm text-primary/65 sm:block">{entry.accuracy}%</span>
                    <span className="hidden text-xs text-primary/45 capitalize sm:block">{entry.difficulty ?? "—"}</span>
                  </div>
                ))
              )}

              {entries.length > 0 && (
                <div className="border-t border-primary/10 p-5 sm:px-7 text-xs text-primary/30">
                  Showing top {entries.length} typists for the {selectedDuration}-minute test, sorted by best WPM.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
