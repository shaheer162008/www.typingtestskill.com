"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/navbar";
import { getDifficultyLabel, normalizeDifficulty, type DifficultyLevel, type TypingMode } from "@/lib/typing-modes";
import { getTargetText } from "@/lib/typing-passage";
import { useAuth } from "@/components/auth-provider";
import { useFirestoreLessons } from "@/lib/firestore-lessons";
import { useRouter } from "next/navigation";
import ResultModal from "@/components/result-modal";

const keyboardRows = [
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"],
  ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
  ["Space"],
];

const keyWidth: Record<string, number> = { Space: 6 };

type TypingTestPageProps = { mode: TypingMode; durationMinutes?: number; wordCount?: number; lessonId?: string; difficulty?: string | null };

function getWpm(correctChars: number, elapsedMs: number) {
  if (elapsedMs <= 0) return 0;
  return Math.max(0, Math.round(correctChars / 5 / (elapsedMs / 60000) || 0));
}

export default function TypingTestPage({ mode, durationMinutes, wordCount, lessonId, difficulty }: TypingTestPageProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const lastLineOffset = useRef(0);
  const [typed, setTyped] = useState("");
  const [lockBoundary, setLockBoundary] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const savedResultRef = useRef(false);
  const submittedResultRef = useRef(false);
  const sessionRef = useRef<{ sessionId: string; nonce: string } | null>(null);
  const telemetryRef = useRef<Array<{ key: string; at: number }>>([]);
  const { user } = useAuth();
  const router = useRouter();
  const normalizedDifficulty: DifficultyLevel = normalizeDifficulty(difficulty);
  const categoryId = mode === "words" ? `words-${wordCount}` : `${mode === "practice" ? "practice" : "timed"}-${durationMinutes}-minute`;
  const { lessons: firestoreLessons } = useFirestoreLessons(categoryId);
  const selectedLesson = firestoreLessons.find((lesson) => lesson.id === lessonId);
  const targetText = useMemo(() => {
    return selectedLesson?.text ?? getTargetText(mode, durationMinutes, wordCount, normalizedDifficulty);
  }, [durationMinutes, mode, normalizedDifficulty, selectedLesson?.text, wordCount]);
  const timeLimitMs = durationMinutes ? durationMinutes * 60000 : null;
  const finishedByTime = Boolean(timeLimitMs && elapsedMs >= timeLimitMs);
  const completed = mode === "words" ? typed.length >= targetText.length : finishedByTime || typed.length >= targetText.length;

  useEffect(() => {
    if (completed && !showResultModal) {
      setShowResultModal(true);
    }
  }, [completed, showResultModal]);

  useEffect(() => {
    if (!completed) {
      inputRef.current?.focus();
    }
  }, [completed]);

  useEffect(() => {
    sessionRef.current = null;
    telemetryRef.current = [];
    submittedResultRef.current = false;
    if (!user) return;
    let cancelled = false;
    void user.getIdToken().then((token) => fetch("/api/tests/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mode, durationMinutes, wordCount, lessonId, difficulty: normalizedDifficulty }),
    })).then(async (response) => {
      if (!response.ok || cancelled) return;
      const session = await response.json() as { sessionId: string; nonce: string };
      sessionRef.current = session;
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [durationMinutes, lessonId, mode, user, wordCount]);

  useEffect(() => {
    if (!startedAt || completed) return;
    const timer = window.setInterval(() => {
      const nextElapsed = Date.now() - startedAt;
      setElapsedMs(timeLimitMs ? Math.min(nextElapsed, timeLimitMs) : nextElapsed);
    }, 250);
    return () => window.clearInterval(timer);
  }, [completed, startedAt, timeLimitMs]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.length === 1 || event.key === "Backspace") {
        setPressedKey(event.key === " " ? "Space" : event.key.toUpperCase());
        window.setTimeout(() => setPressedKey(null), 160);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const charEl = currentCharRef.current;
    const box = scrollBoxRef.current;
    if (!charEl || !box) return;
    if (charEl.offsetTop !== lastLineOffset.current) {
      box.scrollTop = Math.max(0, charEl.offsetTop - 18);
      lastLineOffset.current = charEl.offsetTop;
    }
  }, [typed]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const blocked = (event.key === "Backspace" && typed.length <= lockBoundary) || (event.key === " " && typed.endsWith(" "));
    if (blocked) {
      event.preventDefault();
      return;
    }
    if (event.key.length === 1 || event.key === "Backspace") telemetryRef.current.push({ key: event.key, at: Date.now() });
  };

  const handleChange = (value: string) => {
    if (completed || value.length < lockBoundary || value.length > targetText.length || value.includes("  ")) return;
    if (!startedAt && value.length > 0) setStartedAt(Date.now());
    setTyped(value);
    if (value.endsWith(" ") && value.length > lockBoundary) setLockBoundary(value.length);
  };

  const resetTest = () => {
    setTyped("");
    setLockBoundary(0);
    setStartedAt(null);
    setElapsedMs(0);
    savedResultRef.current = false;
    submittedResultRef.current = false;
    sessionRef.current = null;
    telemetryRef.current = [];
    lastLineOffset.current = 0;
    if (scrollBoxRef.current) scrollBoxRef.current.scrollTop = 0;
    inputRef.current?.focus();
  };

  const { charStatuses, currentCursorIndex, lockedTargetIndex, correctChars } = useMemo(() => {
    const statuses = new Array(targetText.length).fill("untyped");
    const typedWords = typed.split(" ");
    const targetWords = targetText.split(" ");
    let targetCharIndex = 0;
    let correct = 0;
    let locked = 0;

    for (let i = 0; i < typedWords.length; i++) {
      const typedWord = typedWords[i];
      const targetWord = targetWords[i];
      if (targetWord === undefined) break;

      const maxLength = Math.max(typedWord.length, targetWord.length);
      for (let j = 0; j < maxLength; j++) {
        if (j < typedWord.length && typedWord[j] === targetWord[j]) correct++;
        
        if (j < targetWord.length) {
          if (j < typedWord.length) {
            statuses[targetCharIndex + j] = typedWord[j] === targetWord[j] ? "correct" : "wrong";
          } else {
            statuses[targetCharIndex + j] = (i < typedWords.length - 1) ? "wrong" : "untyped";
          }
        }
      }
      
      targetCharIndex += targetWord.length;
      if (targetCharIndex < targetText.length) {
        if (i < typedWords.length - 1) {
           statuses[targetCharIndex] = "correct";
           correct++;
        }
        targetCharIndex++;
      }
      
      if (i < typedWords.length - 1) {
        locked += targetWord.length + 1;
      }
    }
    
    let exactCursor = 0;
    for (let i = 0; i < typedWords.length - 1; i++) exactCursor += (targetWords[i]?.length ?? 0) + 1;
    exactCursor += typedWords[typedWords.length - 1].length;

    return { 
      charStatuses: statuses, 
      currentCursorIndex: Math.min(exactCursor, targetText.length), 
      lockedTargetIndex: locked,
      correctChars: correct
    };
  }, [typed, targetText]);

  const mistakes = Math.max(0, typed.length - correctChars);
  const accuracy = typed.length === 0 ? 100 : Math.max(0, Math.round((correctChars / Math.max(1, typed.length)) * 100));
  const wpm = getWpm(correctChars, elapsedMs);
  const displayedTime = timeLimitMs ? Math.ceil(Math.max(0, timeLimitMs - elapsedMs) / 1000) : Math.floor(elapsedMs / 1000);
  const stats = [
    { label: "WPM", value: wpm },
    { label: "Accuracy", value: `${accuracy}%` },
    { label: timeLimitMs ? "Left" : "Time", value: `${displayedTime}s` },
    { label: "Mistakes", value: mistakes },
  ];

  useEffect(() => {
    if (!completed || !user || !sessionRef.current || submittedResultRef.current || telemetryRef.current.length < 2) return;
    submittedResultRef.current = true;
    void user.getIdToken().then((token) => fetch("/api/tests/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...sessionRef.current, events: telemetryRef.current }),
    })).catch(() => { submittedResultRef.current = false; });
  }, [completed, user]);

  useEffect(() => {
    if (!completed || !typed.length || savedResultRef.current) return;
    savedResultRef.current = true;
    const results = JSON.parse(window.localStorage.getItem("typing-test-results") ?? "[]") as Array<Record<string, unknown>>;
    results.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      mode,
      durationMinutes,
      wordCount,
      wpm,
      accuracy,
      mistakes,
      completedAt: new Date().toISOString(),
      certificateId: null,
      difficulty: normalizedDifficulty,
      name: "Typing Test Skill learner",
    });
    window.localStorage.setItem("typing-test-results", JSON.stringify(results.slice(0, 20)));
    window.dispatchEvent(new Event("typing-test-result"));
  }, [accuracy, completed, durationMinutes, mode, mistakes, typed.length, wordCount, wpm]);

  if (completed) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-[#080808] text-primary">
        <div className="shrink-0">
          <Navbar />
        </div>

        <main className="mx-auto flex w-full max-w-[1360px] min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-9 lg:py-5">
          <p className="mb-3 shrink-0 text-[10px] uppercase tracking-[0.18em] text-primary/45">Typing test</p>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-5">
            <aside className="hidden min-h-0 flex-col rounded-2xl border border-primary/15 bg-white/[0.025] p-4 sm:p-5 lg:flex opacity-50 pointer-events-none">
              <div className="mb-3 shrink-0 text-[10px] uppercase tracking-[0.18em] text-primary/45">Live stats</div>
              <div className="grid shrink-0 grid-cols-2 gap-2.5">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-black/55 px-2 py-4 text-center">
                    <div className="mt-2 font-variant-numeric tabular-nums text-xl font-medium">{stat.value}</div>
                    <div className="text-[9px] uppercase tracking-[0.14em] text-primary/40">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="min-h-0 flex-1" />

              <div className="shrink-0 border-t border-primary/10 pt-4">
                <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-primary/45">Keyboard</div>
                <div className="flex flex-col gap-1.5">
                  {keyboardRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1">
                      {row.map((key) => (
                        <div
                          key={key}
                          style={{ flexGrow: keyWidth[key] ?? 1, flexBasis: 0 }}
                          className={`flex h-8 items-center justify-center rounded-md border text-[9px] font-medium transition-colors ${
                            pressedKey === key ? "border-primary bg-primary text-black" : "border-primary/15 bg-black text-primary/70"
                          }`}
                        >
                          {key}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section className="flex min-h-0 flex-col opacity-50 pointer-events-none">
              <div className="mb-3 flex shrink-0 items-center justify-between text-[10px] uppercase tracking-[0.16em] text-primary/40">
                <span>Session complete</span>
                <span>{typed.length}/{targetText.length} chars</span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-primary/15 bg-white/[0.025] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.2)] sm:p-6">
                <div
                  className="relative flex min-h-0 flex-1 cursor-text flex-col rounded-xl border border-primary/10 bg-black/25 px-5 py-5 transition-colors sm:px-6 sm:py-6"
                >
                  <div
                    ref={scrollBoxRef}
                    className="min-h-0 flex-1 overflow-hidden text-[18px] font-medium leading-[34px] text-primary/50 sm:text-[19px] sm:leading-[34px]"
                  >
                    {targetText.split("").map((char, index) => {
                      const typedChar = typed[index];
                      const isCorrect = typedChar !== undefined && typedChar === char;
                      const isWrong = typedChar !== undefined && typedChar !== char;

                      let className = "relative rounded-sm";
                      if (isWrong) {
                        className += " bg-red-500/30 text-red-300 underline decoration-red-400 decoration-2 underline-offset-[3px]";
                      } else if (isCorrect) {
                        className += " text-white";
                      } else {
                        className += " text-primary/50";
                      }

                      return (
                        <span key={index} className={className}>
                          {char}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3 text-xs text-primary/40">
                  <span>Strict mode · completed words stay locked</span>
                </div>
              </div>
            </section>
          </div>
        </main>

        {showResultModal && (
          <ResultModal
            wpm={wpm}
            accuracy={accuracy}
            mistakes={mistakes}
            elapsedMs={elapsedMs}
            mode={mode}
            durationMinutes={durationMinutes}
            wordCount={wordCount}
            difficulty={normalizedDifficulty}
            completedAt={new Date()}
            onClose={() => router.push(mode === "words" ? `/word-typing/${wordCount}` : mode === "test" ? `/typing-test/${normalizedDifficulty}` : `/typing-practice/${normalizedDifficulty}`)}
            onRetry={resetTest}
          />
        )}
      </div>
    );
  }

  return (
    // Whole page is locked to the viewport height — no page-level scroll at any breakpoint.
    <div className="flex h-dvh flex-col overflow-hidden bg-[#080808] text-primary">
      <div className="shrink-0">
        <Navbar />
      </div>

      <main className="mx-auto flex w-full max-w-[1360px] min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-9 lg:py-5">
        <p className="mb-3 shrink-0 text-[10px] uppercase tracking-[0.18em] text-primary/45">Typing test</p>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-5">
          {/* Left column: stats box on top, keyboard pinned to the bottom — same height as the passage box */}
          <aside className="hidden min-h-0 flex-col rounded-2xl border border-primary/15 bg-white/[0.025] p-4 sm:p-5 lg:flex">
            <div className="mb-3 shrink-0 text-[10px] uppercase tracking-[0.18em] text-primary/45">Live stats</div>
            <div className="grid shrink-0 grid-cols-2 gap-2.5">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-black/55 px-2 py-4 text-center">
                  <div className="mt-2 font-variant-numeric tabular-nums text-xl font-medium">{stat.value}</div>
                  <div className="text-[9px] uppercase tracking-[0.14em] text-primary/40">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Spacer pushes the keyboard down to the bottom of the card, filling remaining height */}
            <div className="min-h-0 flex-1" />

            <div className="shrink-0 border-t border-primary/10 pt-4">
              <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-primary/45">Keyboard</div>
              <div className="flex flex-col gap-1.5">
                {keyboardRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1">
                    {row.map((key) => (
                      <div
                        key={key}
                        style={{ flexGrow: keyWidth[key] ?? 1, flexBasis: 0 }}
                        className={`flex h-8 items-center justify-center rounded-md border text-[9px] font-medium transition-colors ${
                          pressedKey === key ? "border-primary bg-primary text-black" : "border-primary/15 bg-black text-primary/70"
                        }`}
                      >
                        {key}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right column: passage box fills all remaining height, no internal scrollbar visible */}
          <section className="flex min-h-0 flex-col">
            <div className="mb-3 flex shrink-0 items-center justify-between text-[10px] uppercase tracking-[0.16em] text-primary/40">
              <span>{completed ? "Session complete" : startedAt ? "In progress" : "Ready when you are"}</span>
              <span>{typed.length}/{targetText.length} chars</span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-primary/15 bg-white/[0.025] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.2)] sm:p-6">
              <div
                className="relative flex min-h-0 flex-1 cursor-text flex-col rounded-xl border border-primary/10 bg-black/25 px-5 py-5 transition-colors focus-within:border-primary/35 sm:px-6 sm:py-6"
                onClick={() => inputRef.current?.focus()}
              >
                <div
                  ref={scrollBoxRef}
                  className="min-h-0 flex-1 overflow-hidden text-[18px] font-medium leading-[34px] text-primary/50 sm:text-[19px] sm:leading-[34px]"
                >
                  {targetText.split("").map((char, index) => {
                    const status = charStatuses[index];
                    const isCurrent = index === currentCursorIndex && !completed;
                    const isLocked = index < lockedTargetIndex;
                    const isCorrect = status === "correct";
                    const isWrong = status === "wrong";

                    // Untyped text stays clearly legible (no more low-opacity haze), correct
                    // text turns solid white, and mistakes get both a red fill AND an
                    // underline so the error is obvious even for colour-blind readers.
                    let className = "relative rounded-sm";
                    if (isWrong) {
                      className += isLocked
                        ? " bg-red-500/30 text-red-300 underline decoration-red-400 decoration-2 underline-offset-[3px]"
                        : " bg-red-500/20 text-red-300 underline decoration-red-400/70 decoration-2 underline-offset-[3px]";
                    } else if (isCorrect) {
                      className += " text-white";
                    } else {
                      className += " text-primary/50";
                    }

                    return (
                      <span key={index} ref={isCurrent ? currentCharRef : null} className={className}>
                        {isCurrent && (
                          <span
                            aria-hidden
                            className="absolute -left-[1px] top-[1px] bottom-[1px] w-[2px] rounded-full bg-primary animate-[caret-blink_1s_steps(2,jump-none)_infinite]"
                          />
                        )}
                        {char}
                      </span>
                    );
                  })}
                </div>
                <style jsx global>{`
                  @keyframes caret-blink {
                    0%,
                    49% {
                      opacity: 1;
                    }
                    50%,
                    100% {
                      opacity: 0;
                    }
                  }
                `}</style>
                {typed.length === 0 && <p className="pointer-events-none mt-5 shrink-0 text-xs text-primary/35">Click the passage, then start typing</p>}
                <textarea
                  ref={inputRef}
                  value={typed}
                  onChange={(event) => handleChange(event.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={(event) => event.preventDefault()}
                  onDrop={(event) => event.preventDefault()}
                  aria-label="Typing input"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  disabled={completed}
                  className="absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-0 text-transparent caret-transparent outline-none"
                />
              </div>

              <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3 text-xs text-primary/40">
                <span>Strict mode · completed words stay locked</span>
                <button type="button" onClick={resetTest} className="rounded-lg border border-primary/20 px-3 py-1.5 text-primary transition hover:bg-primary/10">
                  Reset session
                </button>
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}