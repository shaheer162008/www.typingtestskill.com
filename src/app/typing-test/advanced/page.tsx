import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DifficultyTestPicker from "@/components/difficulty-test-picker";
import { Flame } from "lucide-react";

export const metadata: Metadata = {
  title: "Advanced Typing Test | Typing Test Skill",
  description: "Push your limits with advanced typing tests.",
};

export default function AdvancedTestPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-primary">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 pt-24 pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-[120px]" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
              <Flame className="h-8 w-8" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl text-white">
              Advanced Typing Test
            </h1>
            <p className="mx-auto max-w-xl text-primary/60">
              Select your preferred lesson and test duration below.
            </p>
          </div>

          <DifficultyTestPicker mode="test" difficulty="advanced" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-primary/70">
        <div className="prose prose-invert prose-p:leading-relaxed max-w-none">
          <h2 className="text-2xl font-bold text-white">Pushing the Limits</h2>
          <p>Advanced tests include heavy punctuation, numbers, and complex formatting. Perfect for developers, writers, and data entry specialists who need accuracy across the entire keyboard.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
