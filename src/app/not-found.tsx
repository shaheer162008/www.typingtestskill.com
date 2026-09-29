import Link from "next/link";
import { ArrowLeft, ArrowRight, Home, SearchX } from "lucide-react";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080908] text-primary">
      <Navbar />
      <main className="relative flex min-h-[calc(100svh-84px)] items-center overflow-hidden px-6 py-20 sm:px-8 md:px-10">
        <div className="pointer-events-none absolute right-[-10rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute bottom-[-14rem] left-[-10rem] h-[30rem] w-[30rem] rounded-full border border-primary/10" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.8fr] lg:gap-24">
          <div>
            <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary/50">
              <SearchX className="h-4 w-4" aria-hidden="true" />
              Error 404
            </p>
            <h1 className="max-w-3xl text-6xl font-medium leading-[0.9] tracking-[-0.07em] sm:text-8xl lg:text-[9rem]">Lost in the keys.</h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-primary/55 sm:text-lg">
              This page is not part of the current typing passage. Head back home or start a fresh test instead.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/" className="group inline-flex items-center gap-3 bg-primary px-5 py-3 text-sm font-medium text-black transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#080908]">
                <Home className="h-4 w-4" aria-hidden="true" />
                Back home
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link href="/typing-test/1-minute" className="inline-flex items-center gap-2 border border-primary/20 px-5 py-3 text-sm font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Take a 1-minute test
              </Link>
            </div>
          </div>

          <div className="border border-primary/15 bg-white/[0.02] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-primary/40">Try one of these</p>
            <nav className="mt-6" aria-label="Helpful links">
              <Link href="/typing-practice" className="group flex items-center justify-between border-b border-primary/10 py-4 text-sm transition-colors hover:text-primary/70">
                Typing practice
                <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link href="/word-typing" className="group flex items-center justify-between border-b border-primary/10 py-4 text-sm transition-colors hover:text-primary/70">
                Word typing test
                <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link href="/blogs" className="group flex items-center justify-between py-4 text-sm transition-colors hover:text-primary/70">
                Typing guides
                <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </nav>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
