import { randomUUID } from "node:crypto";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getCertificateTier } from "@/lib/certificate-tiers";

export const runtime = "nodejs";

type KeyEvent = { key: string; at: number };

type TestSession = {
  nonce: string;
  uid: string | null;
  targetText: string;
  mode: "test" | "practice" | "words";
  difficulty?: "easy" | "medium" | "hard";
  durationMinutes: number | null;
  wordCount: number | null;
  createdAt: number;
  expiresAt: number;
  status: string;
};

function calculateResult(session: TestSession, events: KeyEvent[]) {
  const typed: string[] = [];
  const mistakes: Array<{ index: number; expected: string; actual: string; type: string }> = [];
  let backspaceCount = 0;
  let pasteDetected = false;
  const secondBuckets = new Map<number, number>();

  for (const event of events) {
    const elapsedSecond = Math.floor((event.at - events[0].at) / 1000);
    secondBuckets.set(elapsedSecond, (secondBuckets.get(elapsedSecond) ?? 0) + 1);
    if (event.key === "Backspace") {
      backspaceCount += 1;
      typed.pop();
      continue;
    }
    if (event.key === "Paste" || event.key.length !== 1) {
      pasteDetected = true;
      continue;
    }
    const expected = session.targetText[typed.length] ?? "";
    if (event.key !== expected) mistakes.push({ index: typed.length, expected, actual: event.key, type: event.key === " " ? "extra-space-or-word-boundary" : "character" });
    typed.push(event.key);
  }

  const text = typed.join("");
  let elapsedMs = Math.max(1, events.at(-1)!.at - events[0].at);
  if (session.durationMinutes && session.mode !== "words" && text.length < session.targetText.length) {
    elapsedMs = session.durationMinutes * 60000;
  }
  
  const typedWords = text.split(" ");
  const expectedWords = session.targetText.split(" ");
  let correctChars = 0;
  for (let i = 0; i < typedWords.length; i++) {
    const typedWord = typedWords[i];
    const expectedWord = expectedWords[i] || "";
    const maxLength = Math.max(typedWord.length, expectedWord.length);
    for (let j = 0; j < maxLength; j++) {
      if (j < typedWord.length && typedWord[j] === expectedWord[j]) {
        correctChars++;
      }
    }
    if (i < typedWords.length - 1) correctChars++;
  }
  const incorrectChars = Math.max(0, text.length - correctChars);
  const minutes = elapsedMs / 60000;
  const rawWpm = Math.round((text.length / 5) / minutes);
  const netWpm = Math.max(0, Math.round(((text.length - incorrectChars) / 5) / minutes));
  const cpm = Math.round(text.length / minutes);
  const accuracy = text.length ? Math.round((correctChars / text.length) * 100) : 0;
  const wordResults = text.trim() ? text.trim().split(/\s+/) : [];
  const targetWordList = session.targetText.trim().split(/\s+/);
  const correctWords = wordResults.reduce((total, word, index) => total + (word === targetWordList[index] ? 1 : 0), 0);
  const speedValues = [...secondBuckets.values()];
  const mean = speedValues.length ? speedValues.reduce((sum, value) => sum + value, 0) / speedValues.length : 0;
  const variance = speedValues.length ? speedValues.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / speedValues.length : 0;
  const consistency = mean ? Math.max(0, Math.round(100 - (Math.sqrt(variance) / mean) * 100)) : 0;
  const suspicious = pasteDetected || events.some((event, index) => index > 0 && event.at - events[index - 1].at < 8) || rawWpm > 300;

  return {
    typedText: text,
    rawWpm,
    netWpm,
    cpm,
    accuracy,
    correctWords,
    incorrectWords: Math.max(0, targetWordList.length - correctWords),
    consistency,
    backspaceCount,
    mistakes,
    suspicious,
    pasteDetected,
    elapsedMs,
    completed: session.mode === "words" ? text.length >= session.targetText.length : text.length >= session.targetText.length || elapsedMs >= session.durationMinutes! * 60000,
  };
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Sign in is required to submit an official result." }, { status: 401 });
    const user = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const body = await request.json() as { sessionId?: string; nonce?: string; events?: KeyEvent[] };
    const events = body.events;
    if (!body.sessionId || !body.nonce || !Array.isArray(events) || events.length < 2 || events.length > 10000) return Response.json({ error: "Invalid telemetry payload." }, { status: 400 });
    if (events.some((event) => typeof event.key !== "string" || typeof event.at !== "number" || !Number.isFinite(event.at))) return Response.json({ error: "Invalid keystroke event." }, { status: 400 });
    if (events.some((event, index) => index > 0 && event.at < events[index - 1].at)) return Response.json({ error: "Keystroke timestamps must be ordered." }, { status: 400 });

    const sessionRef = getAdminDb().collection("testSessions").doc(body.sessionId);
    const sessionSnapshot = await sessionRef.get();
    if (!sessionSnapshot.exists) return Response.json({ error: "Test session was not found." }, { status: 404 });
    const session = sessionSnapshot.data() as TestSession;
    if (session.nonce !== body.nonce || session.uid !== user.uid || session.status !== "open" || Date.now() > session.expiresAt) return Response.json({ error: "Test session is invalid or expired." }, { status: 409 });

    const result = calculateResult(session, events);
    const resultRef = getAdminDb().collection("testResults").doc();
    await resultRef.set({ ...result, uid: user.uid, sessionId: body.sessionId, mode: session.mode, difficulty: session.difficulty ?? "medium", durationMinutes: session.durationMinutes, wordCount: session.wordCount, createdAt: Date.now(), reviewStatus: result.suspicious ? "pending" : "clear" });
    await sessionRef.update({ status: "submitted", resultId: resultRef.id });

    let certificateId: string | null = null;
    if (!result.suspicious && result.completed) {
      const criteriaSnapshot = await getAdminDb().collection("settings").doc("certificateCriteria").get();
      const criteria = criteriaSnapshot.data() as { minRawWpm?: number; minAccuracy?: number; eligibleModes?: string[] } | undefined;
      const eligibleModes = criteria?.eligibleModes ?? ["test", "words"];
      if (eligibleModes.includes(session.mode) && result.netWpm >= (criteria?.minRawWpm ?? 0) && result.accuracy >= (criteria?.minAccuracy ?? 90)) {
        const profile = await getAdminAuth().getUser(user.uid);
        const tier = getCertificateTier(result.netWpm);
        certificateId = `TTS-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
        await getAdminDb().collection("certificates").doc(certificateId).set({
          certificateId,
          uid: user.uid,
          name: profile.displayName ?? "Typing Test Skill learner",
          categoryId: session.mode === "words" ? `words-${session.wordCount}` : `${session.mode}-${session.durationMinutes}`,
          mode: session.mode,
          difficulty: session.difficulty ?? "medium",
          durationMinutes: session.durationMinutes,
          wordCount: session.wordCount,
          rawWpm: result.rawWpm,
          netWpm: result.netWpm,
          accuracy: result.accuracy,
          tier: tier.id,
          tierLabel: tier.label,
          resultId: resultRef.id,
          issuedAt: Date.now(),
          permanent: true,
        });
        await resultRef.update({ certificateId });
      }
    }

    return Response.json({ resultId: resultRef.id, ...result, certificateId, reviewStatus: result.suspicious ? "pending" : "clear" });
  } catch (error) {
    console.error("test submission failed", error);
    return Response.json({ error: "Test submission service is not configured." }, { status: 503 });
  }
}
