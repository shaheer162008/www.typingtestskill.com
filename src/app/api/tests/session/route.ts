import { randomBytes, randomUUID } from "node:crypto";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getTargetText } from "@/lib/typing-passage";
import { normalizeDifficulty, type DifficultyLevel, type TypingMode } from "@/lib/typing-modes";

export const runtime = "nodejs";

const validModes: TypingMode[] = ["test", "practice", "words"];

export async function POST(request: Request) {
  try {
    const body = await request.json() as { mode?: TypingMode; durationMinutes?: number; wordCount?: number; lessonId?: string; difficulty?: string };
    const mode = body.mode;
    if (!mode || !validModes.includes(mode)) return Response.json({ error: "Invalid mode." }, { status: 400 });

    const difficulty: DifficultyLevel = normalizeDifficulty(body.difficulty);
    const durationMinutes = mode === "words" ? undefined : body.durationMinutes;
    const wordCount = mode === "words" ? body.wordCount : undefined;
    if (mode === "words" && ![25, 50, 75, 100].includes(wordCount ?? 0)) return Response.json({ error: "Invalid word count." }, { status: 400 });
    if (mode !== "words" && (!Number.isInteger(durationMinutes) || (durationMinutes ?? 0) < 1)) return Response.json({ error: "Invalid duration." }, { status: 400 });

    const authorization = request.headers.get("authorization");
    const user = authorization?.startsWith("Bearer ") ? await getAdminAuth().verifyIdToken(authorization.slice(7)) : null;
    const sessionId = randomUUID();
    const nonce = randomBytes(24).toString("hex");
    let targetText = getTargetText(mode, durationMinutes, wordCount, difficulty);
    if (body.lessonId) {
      const lessonSnapshot = await getAdminDb().collection("lessons").doc(body.lessonId).get();
      if (lessonSnapshot.exists) targetText = String(lessonSnapshot.data()?.text ?? targetText);
    }
    const createdAt = Date.now();
    await getAdminDb().collection("testSessions").doc(sessionId).set({
      sessionId,
      nonce,
      uid: user?.uid ?? null,
      mode,
      difficulty,
      durationMinutes: durationMinutes ?? null,
      wordCount: wordCount ?? null,
      lessonId: body.lessonId ?? null,
      targetText,
      createdAt,
      expiresAt: createdAt + 2 * 60 * 60 * 1000,
      status: "open",
    });

    return Response.json({ sessionId, nonce, targetText, difficulty, expiresAt: createdAt + 2 * 60 * 60 * 1000 });
  } catch (error) {
    console.error("test session creation failed", error);
    return Response.json({ error: "Test session service is not configured." }, { status: 503 });
  }
}
