import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import WordTestPicker from "@/components/word-test-picker";
import { TextSelect } from "lucide-react";

export const metadata: Metadata = {
  title: "100 Words Typing Test | Typing Test Skill",
  description: "Take a fast 100-word typing test.",
};

export default function Word100Page() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-primary">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 pt-24 pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <TextSelect className="h-8 w-8" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl text-white">
              100 Words Test
            </h1>
            <p className="mx-auto max-w-xl text-primary/60">
              Select your preferred lesson below.
            </p>
          </div>

          <WordTestPicker wordCount={100} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
