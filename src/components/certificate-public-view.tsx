"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, Download, Home, Share2 } from "lucide-react";
import Navbar from "@/components/navbar";

type Certificate = { certificateId: string; name: string; rawWpm: number; accuracy: number; tierLabel?: string; issuedAt: number; durationMinutes?: number | null; wordCount?: number | null };

function formatDate(value: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default function CertificatePublicView({ certificateId }: { certificateId: string }) {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/certificates/verify?id=${encodeURIComponent(certificateId)}`)
      .then(async (response) => {
        const data = await response.json() as { valid: boolean; certificate?: Certificate; error?: string };
        if (!response.ok || !data.valid) {
          setErrorMessage(data.error ?? "Invalid certificate ID.");
          setCertificate(null);
        } else {
          setCertificate(data.certificate ?? null);
          setErrorMessage(null);
        }
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Network error");
        setCertificate(null);
      })
      .finally(() => setLoading(false));
  }, [certificateId]);

  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const copyLink = async () => { await navigator.clipboard.writeText(shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const downloadPng = () => {
    if (!certificate) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 900;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#f7f5ec";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#171716";
    context.lineWidth = 4;
    context.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    context.fillStyle = "#171716";
    context.font = "700 24px Georgia";
    context.fillText("TYPING TEST SKILL", 90, 120);
    context.font = "18px Georgia";
    context.fillText("CERTIFICATE OF TYPING EXCELLENCE", 90, 160);
    context.font = "18px Georgia";
    context.fillText("This certifies that", 90, 300);
    context.font = "500 64px Georgia";
    context.fillText(certificate.name, 90, 390);
    context.font = "500 34px Georgia";
    context.fillText(certificate.tierLabel ?? "Typing certificate", 90, 490);
    context.font = "22px Georgia";
    context.fillText(`${certificate.rawWpm} raw WPM  |  ${certificate.accuracy}% accuracy`, 90, 550);
    context.fillText(certificate.wordCount ? `${certificate.wordCount}-word test` : `${certificate.durationMinutes}-minute typing test`, 90, 600);
    context.font = "18px Georgia";
    context.fillText(`Completed ${formatDate(certificate.issuedAt)}`, 90, 680);
    context.fillText(`Certificate ID: ${certificate.certificateId}`, 90, 740);
    const link = document.createElement("a");
    link.download = `${certificate.certificateId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return <div className="min-h-screen bg-[#080908] text-primary"><Navbar /><main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-16"><div className="mb-8 flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-primary/45">Public certificate</p><h1 className="mt-2 text-3xl font-medium tracking-[-0.05em] sm:text-5xl">Verification record</h1></div><Link href="/" aria-label="Back home" className="border border-primary/15 p-3"><Home className="h-4 w-4" /></Link></div>{loading ? <div className="border border-primary/15 p-10 text-primary/55">Checking certificate…</div> : certificate ? <><section id="certificate-card" className="bg-[#f7f5ec] p-2 text-[#171716] shadow-2xl sm:p-4"><div className="border border-black/25 p-6 sm:p-12"><div className="flex items-start justify-between"><div><p className="text-xs font-bold tracking-[0.2em]">TYPING TEST SKILL</p><p className="mt-2 text-xs uppercase tracking-[0.16em] text-black/45">Certificate of typing excellence</p></div><Award className="h-9 w-9" strokeWidth={1.3} /></div><div className="py-16"><p className="text-xs uppercase tracking-[0.18em] text-black/45">This certifies that</p><h2 className="mt-3 text-4xl font-medium tracking-[-0.05em] sm:text-6xl">{certificate.name}</h2><div className="mt-5 h-px w-24 bg-black/25" /><p className="mt-5 text-lg font-medium">{certificate.tierLabel ?? "Typing certificate"}</p><p className="mt-2 text-sm text-black/55">{certificate.rawWpm} raw WPM · {certificate.accuracy}% accuracy</p><p className="mt-2 text-sm text-black/55">{certificate.wordCount ? `${certificate.wordCount}-word test` : `${certificate.durationMinutes}-minute typing test`}</p><p className="mt-2 text-sm text-black/55">Completed {formatDate(certificate.issuedAt)}</p></div><div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/20 pt-5 text-xs uppercase tracking-[0.12em] text-black/45"><span>{certificate.certificateId}</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Permanent verified record</span></div></div></section><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={downloadPng} className="inline-flex items-center gap-2 bg-primary px-4 py-3 text-sm font-semibold text-black"><Download className="h-4 w-4" /> Download PNG</button><button type="button" onClick={() => void copyLink()} className="inline-flex items-center gap-2 border border-primary/20 px-4 py-3 text-sm"><Share2 className="h-4 w-4" /> {copied ? "Link copied" : "Copy share link"}</button></div></> : <section className="border border-red-300/25 bg-red-300/[0.05] p-8 text-red-100"><p className="text-lg font-medium">Certificate not found</p><p className="mt-2 text-sm text-red-100/70">{errorMessage ? `Error: ${errorMessage}` : "This public verification link is invalid or the certificate ID does not exist."}</p><Link href="/certificates" className="mt-5 inline-flex text-sm underline underline-offset-4">Verify another ID</Link></section>}</main></div>;
}
