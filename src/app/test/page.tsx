import TypingTestPage from "@/components/typing-test-page";
import { redirect } from "next/navigation";

type TestPageProps = {
  searchParams: Promise<{ mode?: string; duration?: string; wordCount?: string; lesson?: string; difficulty?: string }>;
};

export default async function TestPage({ searchParams }: TestPageProps) {
  const { mode, duration, wordCount, lesson, difficulty } = await searchParams;
  const minutes = Number(duration);
  const words = Number(wordCount);

  if (mode === "words" && [25, 50, 75, 100, 125, 150].includes(words)) {
    return <TypingTestPage mode="words" wordCount={words} lessonId={lesson} difficulty={difficulty} />;
  }

  if ((mode !== "test" && mode !== "practice") || !Number.isInteger(minutes) || minutes < 1) {
    redirect("/typing-test");
  }

  return <TypingTestPage mode={mode} durationMinutes={minutes} lessonId={lesson} difficulty={difficulty} />;
}