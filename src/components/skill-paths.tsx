"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Keyboard,
  Timer,
  Type,
} from "lucide-react";

const paths = [
  {
    number: "01",
    title: "Typing Test",
    description: "Timed tests for measuring speed, accuracy, and real-time performance.",
    options: ["1", "2", "3", "5", "10", "15", "30 min"],
    href: "/typing-test",
    icon: Keyboard,
    accent: "border border-primary/20 bg-black/40 text-primary",
  },
  {
    number: "02",
    title: "Typing Practice",
    description: "Practice at your pace with focused sessions built for steady improvement.",
    options: ["1", "2", "3", "5", "10", "15", "30 min"],
    href: "/typing-practice",
    icon: Timer,
    accent: "border border-primary/20 bg-white/5 text-primary",
  },
  {
    number: "03",
    title: "Word Typing",
    description: "Challenge yourself with word-based tests where every keystroke counts.",
    options: ["25", "50", "75", "100 words"],
    href: "/word-typing",
    icon: Type,
    accent: "border border-primary/20 bg-white/5 text-primary",
  },
];

export default function SkillPaths() {
  return (
    <section className="relative overflow-hidden border-t border-primary/10 bg-black px-4 py-24 text-primary sm:px-6 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex flex-col justify-between gap-6 border-b border-primary/15 pb-8 md:flex-row md:items-end"
        >
          <div className="max-w-2xl">
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-primary/55">
              Your next move
            </p>
            <h2 className="max-w-xl text-4xl font-medium leading-[0.95] tracking-tighter sm:text-5xl md:text-7xl">
              Find the rhythm that takes you further.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-primary/55 md:pb-1">
            Start where you are. Choose a path, keep showing up, and let every session
            make the next one stronger.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path, index) => {
            const Icon = path.icon;

            return (
              <motion.a
                key={path.href}
                href={path.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="group flex min-h-64 flex-col border border-primary/15 bg-white/2 p-6 transition-colors hover:border-primary/50 hover:bg-white/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-7"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs text-primary/40">{path.number}</span>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full ${path.accent}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </span>
                </div>
                <div className="mt-auto flex items-end justify-between gap-4 pt-16">
                  <div>
                    <h3 className="text-2xl font-medium tracking-[-0.04em]">{path.title}</h3>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-primary/55">
                      {path.description}
                    </p>
                    {path.options ? (
                      <div className="mt-4 flex flex-wrap gap-1.5" aria-label={`${path.title} options`}>
                        {path.options.map((option) => (
                          <span
                            key={option}
                            className="border border-primary/15 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-primary/55"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <ArrowUpRight className="mb-1 h-5 w-5 shrink-0 text-primary/45 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
