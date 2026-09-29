import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DifficultyTestPicker from "@/components/difficulty-test-picker";
import { Keyboard } from "lucide-react";

export const metadata: Metadata = {
  title: "Beginner Typing Test | Typing Test Skill",
  description: "Start your beginner-level typing test. Improve your foundational typing speed and accuracy.",
};

export default function BeginnerTestPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-primary">
      <Navbar />

      {/* Hero / Picker Section */}
      <section className="relative overflow-hidden border-b border-white/10 pt-24 pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
              <Keyboard className="h-8 w-8" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl text-white">
              Beginner Typing Test
            </h1>
            <p className="mx-auto max-w-xl text-primary/60">
              Select your preferred lesson and test duration below to begin evaluating your foundational typing skills.
            </p>
          </div>

          <DifficultyTestPicker mode="test" difficulty="beginner" />
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-primary/70">
        <div className="prose prose-invert prose-p:leading-relaxed max-w-none">
          <h2 className="text-2xl font-bold text-white">Mastering the Basics</h2>
          <p>
            The beginner typing tests are specifically curated to feature common English words with minimal complex punctuation. By focusing on these core keystrokes, you can build muscle memory that translates to significantly faster overall typing speeds.
          </p>
          <h3 className="text-xl font-bold text-white mt-8">Tips for Beginners:</h3>
          <ul>
            <li><strong>Posture matters:</strong> Sit up straight with your feet flat on the floor.</li>
            <li><strong>Don't look down:</strong> Trust your fingers and try to memorize the home row position.</li>
            <li><strong>Accuracy over speed:</strong> It's better to type slowly and accurately. Speed will naturally follow as you make fewer mistakes.</li>
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  );
}
