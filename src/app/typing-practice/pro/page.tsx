import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DifficultyTestPicker from "@/components/difficulty-test-picker";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Pro Typing Practice | Typing Test Skill",
  description: "Start your pro-level typing practice.",
};

export default function ProPracticePage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-primary">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 pt-24 pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/5 blur-[120px]" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-400">
              <Trophy className="h-8 w-8" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl text-white">
              Pro Typing Practice
            </h1>
            <p className="mx-auto max-w-xl text-primary/60">
              Select your preferred lesson below to begin practicing at your own pace.
            </p>
          </div>

          <DifficultyTestPicker mode="practice" difficulty="pro" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-primary/70">
        <div className="prose prose-invert prose-p:leading-relaxed max-w-none">
          <h2 className="text-2xl font-bold text-white">The Ultimate Challenge</h2>
          <p>Pro difficulty is designed to test every corner of the keyboard with complex symbol arrangements, code snippets, and highly obscure vocabulary.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
