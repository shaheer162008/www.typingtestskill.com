import Link from "next/link";
import { ArrowRight, TextSelect } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word Typing | Select Word Count | Typing Test Skill",
  description: "Take a typing test with a fixed word count. Select 25, 50, 75, 100, 125, or 150 words.",
};

const wordCounts = [25, 50, 75, 100, 125, 150];

export default function WordTypingHubPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-primary">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 pt-24 pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <p className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Fixed Length Mode
          </p>
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
            Choose Your <span className="text-white">Word Count.</span>
          </h1>
          <p className="mx-auto mb-16 max-w-2xl text-lg text-primary/60">
            Take a test based on a specific number of words rather than a time limit. Perfect for burst typing and accuracy focus.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
            {wordCounts.map((count) => {
              return (
                <Link 
                  key={count} 
                  href={`/word-typing/${count}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-white/30 hover:bg-white/[0.03]"
                >
                  <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[50px] transition-all duration-500 group-hover:opacity-100 opacity-0 bg-primary/10`} />
                  
                  <div className="relative z-10">
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                      <TextSelect className="h-6 w-6" />
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-white">{count} Words</h3>
                    <p className="text-sm leading-relaxed text-primary/50">Complete a fixed {count}-word challenge.</p>
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

      <section className="mx-auto max-w-4xl px-6 py-24 text-primary/70">
        <div className="prose prose-invert prose-p:leading-relaxed prose-a:text-primary max-w-none">
          <h2 className="mb-6 text-3xl font-bold text-white tracking-tight">Why Choose Word Count Mode?</h2>
          <p className="mb-8">
            Word count typing tests measure how fast you can type a fixed amount of text, which is an excellent way to practice burst speeds and train consistency over exact distances.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
