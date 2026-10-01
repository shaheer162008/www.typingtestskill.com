"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { ArrowLeft, ArrowRight, Award, BarChart3, CheckCircle2, Gauge, LockKeyhole, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/components/auth-provider";
import CertificateActions from "@/components/certificate-actions";
import { db } from "@/lib/firebase-client";
import { getCertificateTier } from "@/lib/certificate-tiers";

type Result = {
  id: string;
  mode: "test" | "practice" | "words";
  durationMinutes?: number | null;
  wordCount?: number | null;
  rawWpm?: number;
  netWpm?: number;
  cpm?: number;
  accuracy?: number;
  correctWords?: number;
  incorrectWords?: number;
  consistency?: number;
  backspaceCount?: number;
  mistakes?: Array<{ index: number; expected: string; actual: string; type: string }>;
  elapsedMs?: number;
  createdAt?: number;
  reviewStatus?: string;
  certificateId?: string | null;
};

type Certificate = { certificateId: string; name: string; rawWpm: number; netWpm?: number; accuracy: number; tierLabel?: string; issuedAt: number; categoryId?: string; durationMinutes?: number | null; wordCount?: number | null };

function formatDuration(milliseconds?: number) {
  if (!milliseconds) return "—";
  const totalSeconds = Math.round(milliseconds / 1000);
  return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
}

function resultLabel(result: Result) {
  return result.mode === "words" ? `${result.wordCount}-word test` : `${result.durationMinutes}-minute ${result.mode}`;
}

function formatDateTime(value?: number) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function DashboardPro() {
  const { user, loading: authLoading } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [page, setPage] = useState(0);
  const [certificatePage, setCertificatePage] = useState(0);
  const [certificateTab, setCertificateTab] = useState<"earned" | "locked">("earned");
  const [timeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [newCertificatePopup, setNewCertificatePopup] = useState<Certificate | null>(null);
  const previousCertCount = useRef<number | null>(null);

  useEffect(() => {
    if (certificates.length === 0) return;
    if (previousCertCount.current !== null && certificates.length > previousCertCount.current) {
      setNewCertificatePopup(certificates[0]);
      setCertificatePage(0);
      setCertificateTab("earned");
    }
    previousCertCount.current = certificates.length;
  }, [certificates]);

  useEffect(() => {
    if (!user) return;
    const unsubResults = onSnapshot(collection(db, "testResults"), (snapshot) => setResults(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Result)).filter((result) => (result as Result & { uid?: string }).uid === user.uid).sort((first, second) => (second.createdAt ?? 0) - (first.createdAt ?? 0))));
    const unsubCertificates = onSnapshot(collection(db, "certificates"), (snapshot) => setCertificates(snapshot.docs.map((item) => item.data() as Certificate).filter((certificate) => (certificate as Certificate & { uid?: string }).uid === user.uid).sort((first, second) => second.issuedAt - first.issuedAt)));
    return () => { unsubResults(); unsubCertificates(); };
  }, [user]);

  const visibleItems = results;
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const pageItems = visibleItems.slice(page * pageSize, page * pageSize + pageSize);
  const bestSpeed = results.length ? Math.max(...results.map((result) => result.netWpm ?? result.rawWpm ?? 0)) : 0;
  const bestAccuracy = results.length ? Math.max(...results.map((result) => result.accuracy ?? 0)) : 0;
  const averageNet = results.length ? Math.round(results.reduce((sum, result) => sum + (result.netWpm ?? 0), 0) / results.length) : 0;
  const certificateCount = Math.max(1, certificates.length);
  const visibleCertificate = certificates[Math.min(certificatePage, certificateCount - 1)];
  const nextTier = getCertificateTier(bestSpeed);
  const hasEarnedCertificate = certificates.length > 0;

  if (authLoading) return <div className="min-h-screen bg-[#080908] text-primary"><Navbar /><main className="mx-auto max-w-7xl px-6 py-12 text-primary/60">Loading your dashboard…</main></div>;
  if (!user) return <div className="min-h-screen bg-[#080908] text-primary"><Navbar /><main className="mx-auto max-w-7xl px-6 py-12"><h1 className="text-4xl font-medium">Sign in to view your dashboard.</h1><Link href="/login" className="mt-6 inline-flex bg-primary px-5 py-3 text-sm font-semibold text-black">Sign in</Link></main></div>;

  const summaryStats = [
    { label: "Best raw speed", value: bestSpeed ? `${bestSpeed} WPM` : "—", icon: Gauge },
    { label: "Best accuracy", value: bestAccuracy ? `${bestAccuracy}%` : "—", icon: Target },
    { label: "Average net speed", value: averageNet ? `${averageNet} WPM` : "—", icon: BarChart3 },
    { label: "Certificates", value: certificates.length, icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#080908] text-primary">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col justify-between gap-5 border-b border-primary/10 pb-7 sm:flex-row sm:items-end"><div><p className="text-xs uppercase tracking-[0.2em] text-primary/45">Personal dashboard</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.06em] sm:text-6xl">Your typing, measured clearly.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-primary/55">Realtime results, detailed analysis, and certificates issued from your verified sessions.</p></div><Link href="/typing-test" className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-black">Start another test <ArrowRight className="h-4 w-4" /></Link></header>

        <section className="grid gap-3 py-7 sm:grid-cols-2 lg:grid-cols-4" aria-label="Your performance summary">{summaryStats.map((stat) => { const Icon = stat.icon; return <article key={stat.label} className="border border-primary/15 bg-white/[0.025] p-5"><Icon className="h-5 w-5 text-primary/55" aria-hidden="true" /><p className="mt-7 text-[10px] uppercase tracking-[0.16em] text-primary/40">{stat.label}</p><p className="mt-2 text-3xl font-medium tracking-[-0.04em]">{stat.value}</p></article>; })}</section>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="border border-primary/15 bg-white/[0.015] p-5 sm:p-6" aria-labelledby="history-title"><div className="flex flex-col justify-between gap-4 border-b border-primary/10 pb-4 sm:flex-row sm:items-end"><div><p className="text-[10px] uppercase tracking-[0.18em] text-primary/40">Completed history</p><h2 id="history-title" className="mt-2 text-2xl font-medium">Recent tests</h2><p className="mt-2 text-xs text-primary/40">Times shown in {timeZone}</p></div></div>
            <div className="divide-y divide-primary/10">{pageItems.length ? pageItems.map((item) => <button type="button" key={item.id} onClick={() => setSelectedResult(item as Result)} className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:bg-primary/[0.04]"><div><p className="text-sm font-medium">{resultLabel(item as Result)}</p><p className="mt-1 text-xs text-primary/45">{formatDateTime(item.createdAt)} · {(item as Result).mistakes?.length ?? 0} character mistakes</p></div><div className="text-right"><p className="font-variant-numeric text-lg font-medium">{(item as Result).netWpm ?? "—"} net WPM</p><p className="text-xs text-primary/45">{(item as Result).accuracy ?? 0}% accuracy</p></div><ArrowRight className="h-4 w-4 text-primary/35" /></button>) : <p className="py-10 text-sm text-primary/50">Your verified test results will appear here.</p>}</div>
            <div className="mt-4 flex items-center justify-between border-t border-primary/10 pt-4"><span className="text-xs text-primary/40">Page {Math.min(page + 1, pageCount)} of {pageCount}</span><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} aria-label="Previous page" className="border border-primary/15 p-2 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button><button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1} aria-label="Next page" className="border border-primary/15 p-2 disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button></div></div>
          </section>

          <aside className="space-y-8">
            <section className="border border-primary/15 bg-[#f7f5ec] p-5 text-[#171716] sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Typing Test Skill</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-black/40">
                    {certificateTab === "earned" && hasEarnedCertificate
                      ? `Certificate ${certificatePage + 1} of ${certificates.length}`
                      : certificateTab === "earned"
                        ? "No certificates"
                        : "Certificate path"}
                  </p>
                </div>
                <Award className="h-7 w-7" strokeWidth={1.4} />
              </div>

              <div className="mt-5 flex border-b border-black/15">
                <button type="button" onClick={() => setCertificateTab("earned")} className={`px-3 py-2 text-xs ${certificateTab === "earned" ? "border-b-2 border-black font-semibold" : "text-black/45"}`}>
                  Earned
                </button>
                <button type="button" onClick={() => setCertificateTab("locked")} className={`px-3 py-2 text-xs ${certificateTab === "locked" ? "border-b-2 border-black font-semibold" : "text-black/45"}`}>
                  Locked certificates
                </button>
              </div>

              {certificateTab === "earned" && visibleCertificate ? (
                <>
                  <div className="py-8">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">This certifies that</p>
                    <h2 className="mt-2 text-3xl font-medium tracking-[-0.05em]">{visibleCertificate.name}</h2>
                    <div className="mt-4 h-px w-20 bg-black/25" />
                    <p className="mt-4 text-sm font-medium text-black/70">{visibleCertificate.tierLabel ?? "Typing certificate"}</p>
                    <p className="mt-2 text-sm text-black/55">{visibleCertificate.netWpm ?? visibleCertificate.rawWpm} net WPM · {visibleCertificate.accuracy}% accuracy</p>
                    <p className="mt-2 text-xs text-black/50">{visibleCertificate.wordCount ? `${visibleCertificate.wordCount}-word test` : `${visibleCertificate.durationMinutes}-minute typing test`}</p>
                    <p className="mt-2 text-xs text-black/50">Completed {formatDateTime(visibleCertificate.issuedAt)} ({timeZone})</p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-black/15 pt-4 text-[10px] uppercase tracking-[0.12em] text-black/45">
                    <span>ID {visibleCertificate.certificateId}</span>
                    <CheckCircle2 className="h-4 w-4 text-black/70" />
                  </div>

                  {certificates.length > 1 && (
                    <div className="mt-5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setCertificatePage((current) => Math.max(0, current - 1))}
                        disabled={certificatePage === 0}
                        aria-label="Previous certificate"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-black/20 text-black/70 transition hover:bg-black/5 disabled:opacity-30"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-semibold text-black/70">
                        Certificate {certificates.length - certificatePage} of {certificates.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCertificatePage((current) => Math.min(certificates.length - 1, current + 1))}
                        disabled={certificatePage >= certificates.length - 1}
                        aria-label="Next certificate"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-black/20 text-black/70 transition hover:bg-black/5 disabled:opacity-30"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="mt-5 border-t border-black/15 pt-4">
                    <CertificateActions certificateId={visibleCertificate.certificateId} />
                  </div>
                </>
              ) : certificateTab === "earned" ? (
                <div className="py-8 text-sm text-black/60">
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="h-5 w-5 text-black/45" />
                    <p className="text-lg font-medium text-black">No certificate yet.</p>
                  </div>
                  <p className="mt-4 leading-6 text-black/60">
                    Complete a valid timed or word test with the required accuracy to unlock your first certificate.
                  </p>
                </div>
              ) : (
                <div className="py-6 text-sm text-black/60">
                  <p className="text-lg font-medium text-black">Your next certificate: {nextTier.label}</p>
                  <p className="mt-2 leading-6 text-black/60">
                    Reach {nextTier.minWpm}+ net WPM with at least <strong className="text-black">90% accuracy</strong> in a qualifying test.
                  </p>
                  <div className="mt-5 h-2 bg-black/15">
                    <div
                      className="h-2 bg-black transition-[width]"
                      style={{ width: `${Math.min(100, nextTier.minWpm ? (bestSpeed / nextTier.minWpm) * 100 : 0)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-black/50">Current best: {bestSpeed || 0} net WPM</p>
                  
                  <div className="mt-6 border-t border-black/15 pt-5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-black/40 mb-3">Certificate Tiers (Min 90% Accuracy)</p>
                    <ul className="space-y-2 text-xs text-black/60">
                      <li className="flex justify-between"><span>Beginner</span> <span className="font-semibold text-black">1 - 14 WPM</span></li>
                      <li className="flex justify-between"><span>Intermediate</span> <span className="font-semibold text-black">15 - 24 WPM</span></li>
                      <li className="flex justify-between"><span>Advanced</span> <span className="font-semibold text-black">25 - 34 WPM</span></li>
                      <li className="flex justify-between"><span>Expert</span> <span className="font-semibold text-black">35 - 49 WPM</span></li>
                      <li className="flex justify-between"><span>Master</span> <span className="font-semibold text-black">50 - 74 WPM</span></li>
                      <li className="flex justify-between"><span>Grandmaster</span> <span className="font-semibold text-black">75+ WPM</span></li>
                    </ul>
                  </div>

                  <Link href="/typing-test" className="mt-6 block text-center bg-black px-4 py-3 text-xs font-semibold text-primary transition hover:bg-black/80">
                    Start an eligible test
                  </Link>
                </div>
              )}
            </section>

            <section className="border border-primary/15 p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary/40">Certificate status</p>
              <p className="mt-3 text-sm leading-6 text-primary/55">
                {certificates.length ? `${certificates.length} permanent certificate${certificates.length === 1 ? "" : "s"} issued.` : "No permanent certificates issued yet."}
              </p>
              <Link href="/certificates" className="mt-4 inline-flex text-xs text-primary underline decoration-primary/25 underline-offset-4 hover:text-primary/80">
                Verify certificates
              </Link>
            </section>

            <section className="border border-primary/15 p-5 bg-white/[0.015]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary/40">Quick Navigation</p>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link href="/typing-test" className="flex items-center justify-between group">
                  <span className="text-primary/70 transition group-hover:text-primary">Take a Test</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary/30 transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
                <Link href="/typing-practice" className="flex items-center justify-between group">
                  <span className="text-primary/70 transition group-hover:text-primary">Practice Mode</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary/30 transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
                <Link href="/leaderboard" className="flex items-center justify-between group">
                  <span className="text-primary/70 transition group-hover:text-primary">Global Leaderboard</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary/30 transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
                <Link href="/word-typing" className="flex items-center justify-between group">
                  <span className="text-primary/70 transition group-hover:text-primary">Word Typing</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary/30 transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </div>
            </section>
          </aside>
        </div>

        {selectedResult && <section className="mt-8 border border-primary/15 bg-white/[0.02] p-5 sm:p-6" aria-labelledby="analysis-title"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-primary/40">Detailed analysis</p><h2 id="analysis-title" className="mt-2 text-2xl font-medium">{resultLabel(selectedResult)}</h2></div><button type="button" onClick={() => setSelectedResult(null)} className="text-xs text-primary/55 underline underline-offset-4">Close</button></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Raw WPM", selectedResult.rawWpm ?? "—"], ["Net WPM", selectedResult.netWpm ?? "—"], ["CPM", selectedResult.cpm ?? "—"], ["Completion time", formatDuration(selectedResult.elapsedMs)], ["Correct words", selectedResult.correctWords ?? "—"], ["Incorrect words", selectedResult.incorrectWords ?? "—"], ["Consistency", selectedResult.consistency ? `${selectedResult.consistency}%` : "—"], ["Backspaces", selectedResult.backspaceCount ?? "—"]].map(([label, value]) => <div key={String(label)} className="border border-primary/10 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-primary/40">{label}</p><p className="mt-2 text-xl font-medium">{value}</p></div>)}</div><div className="mt-6"><p className="text-xs uppercase tracking-[0.16em] text-primary/40">Mistake breakdown</p>{selectedResult.mistakes?.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{selectedResult.mistakes.slice(0, 20).map((mistake, index) => <div key={`${mistake.index}-${index}`} className="border border-red-300/20 bg-red-300/[0.04] px-3 py-2 text-xs text-red-100">Position {mistake.index + 1}: expected “{mistake.expected || "space"}”, typed “{mistake.actual || "space"}”</div>)}</div> : <p className="mt-3 text-sm text-emerald-200">No recorded character mistakes.</p>}</div></section>}
      </main>

      {newCertificatePopup && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-3 border border-emerald-500/30 bg-black p-5 text-emerald-50 shadow-2xl shadow-emerald-900/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-semibold">New Certificate Unlocked!</p>
            </div>
            <button type="button" onClick={() => setNewCertificatePopup(null)} className="text-primary/50 hover:text-primary">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs leading-5 text-emerald-100/70">
            Congratulations! You just unlocked the <strong className="font-semibold text-emerald-400">{newCertificatePopup.tierLabel}</strong> certificate with {newCertificatePopup.netWpm ?? newCertificatePopup.rawWpm} net WPM and {newCertificatePopup.accuracy}% accuracy.
          </p>
        </div>
      )}
    </div>
  );
}
