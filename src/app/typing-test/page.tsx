import Link from "next/link";
import { ArrowRight, Trophy, Keyboard, Zap, Flame } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Typing Test | Select Difficulty | Typing Test Skill",
  description: "Test your typing speed and accuracy. Select your difficulty level—Beginner, Intermediate, Advanced, or Pro—and start your custom typing test today.",
};

const difficulties = [
  { id: "beginner", name: "Beginner", desc: "Perfect for warming up or just starting out.", icon: Keyboard, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { id: "intermediate", name: "Intermediate", desc: "Test your skills with average difficulty paragraphs.", icon: Zap, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  { id: "advanced", name: "Advanced", desc: "Complex words and punctuation for experienced typists.", icon: Flame, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { id: "pro", name: "Pro", desc: "The ultimate challenge. Extreme punctuation and vocabulary.", icon: Trophy, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
];

export default function TypingTestHubPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-primary">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10 pt-24 pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <p className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Evaluate Your Speed
          </p>
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
            Choose Your <span className="text-white">Difficulty.</span>
          </h1>
          <p className="mx-auto mb-16 max-w-2xl text-lg text-primary/60">
            Select a difficulty level that matches your current typing skills. 
            Once you choose a level, you can select specific tests and durations tailored to that difficulty.
          </p>

          {/* Difficulty Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
            {difficulties.map((diff) => {
              const Icon = diff.icon;
              return (
                <Link 
                  key={diff.id} 
                  href={`/typing-test/${diff.id}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-white/30 hover:bg-white/[0.03]"
                >
                  <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[50px] transition-all duration-500 group-hover:opacity-100 opacity-0 ${diff.bg}`} />
                  
                  <div className="relative z-10">
                    <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${diff.bg} ${diff.border} ${diff.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-white capitalize">{diff.name}</h3>
                    <p className="text-sm leading-relaxed text-primary/50">{diff.desc}</p>
                  </div>
                  
                  <div className="relative z-10 mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                    <span className="text-sm font-semibold text-primary group-hover:text-white transition-colors">Start Test</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-black">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-primary/70">
        <div className="prose prose-invert prose-p:leading-relaxed prose-a:text-primary max-w-none">
          <h2 className="mb-6 text-3xl font-bold text-white tracking-tight">Why Take a Categorized Typing Test?</h2>
          <p className="mb-8">
            Taking a typing test based on difficulty levels rather than just random words helps you systematically measure and improve your typing proficiency. Whether you are preparing for a data entry job, practicing for academic purposes, or striving to become an elite e-sports gamer, understanding your base skill level is the first step towards mastery.
          </p>
          
          <div className="grid gap-12 md:grid-cols-2 mt-12">
            <div>
              <h3 className="mb-4 text-xl font-bold text-white">Beginner & Intermediate</h3>
              <p>
                Our lower difficulty tests focus on the most common English vocabulary and basic punctuation. These tests are designed to build your muscle memory and establish a strong, error-free foundation without overwhelming you with complex symbols.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-xl font-bold text-white">Advanced & Pro</h3>
              <p>
                As you move up to our Advanced and Pro tiers, the algorithms introduce heavier punctuation, numbers, capitalized words, and obscure vocabulary. The Pro level tests are designed for elite typists seeking to validate speeds above 120 WPM in real-world, complex scenarios.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
