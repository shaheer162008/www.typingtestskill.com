import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const revalidate = 60; // Cache the leaderboard for 60 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const durationMinutes = parseInt(searchParams.get("durationMinutes") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const db = getAdminDb();
    
    // Fetch top results. We fetch a bit more than the limit so we can deduplicate by user.
    const resultsSnapshot = await db.collection("testResults")
      .where("mode", "==", "test")
      .where("durationMinutes", "==", durationMinutes)
      .where("reviewStatus", "==", "clear")
      .orderBy("netWpm", "desc")
      .limit(limit * 5)
      .get();

    const bestByUser = new Map();
    for (const doc of resultsSnapshot.docs) {
      const data = doc.data();
      if (!data.uid) continue;
      
      const existing = bestByUser.get(data.uid);
      if (!existing || data.netWpm > existing.netWpm) {
        bestByUser.set(data.uid, { id: doc.id, ...data });
      }
    }

    // Sort the deduplicated results and take the top 'limit'
    const topResults = Array.from(bestByUser.values())
      .sort((a, b) => b.netWpm - a.netWpm)
      .slice(0, limit);

    if (topResults.length === 0) {
      return Response.json([]);
    }

    // Fetch user profiles for the top results
    const uids = topResults.map((r) => r.uid);
    // Firestore 'in' query supports up to 30 items
    const chunks = [];
    for (let i = 0; i < uids.length; i += 30) {
      chunks.push(uids.slice(i, i + 30));
    }

    const usersMap = new Map();
    for (const chunk of chunks) {
      const usersSnapshot = await db.collection("users").where("__name__", "in", chunk).get();
      for (const doc of usersSnapshot.docs) {
        usersMap.set(doc.id, doc.data());
      }
    }

    // Merge and format
    const leaderboard = topResults.map((r) => {
      const user = usersMap.get(r.uid);
      return {
        id: r.id,
        uid: r.uid,
        rawWpm: r.rawWpm,
        netWpm: r.netWpm ?? r.rawWpm,
        accuracy: r.accuracy,
        mode: r.mode,
        difficulty: r.difficulty,
        durationMinutes: r.durationMinutes,
        wordCount: r.wordCount,
        createdAt: r.createdAt,
        name: user?.name || user?.displayName || "Anonymous",
        photoURL: user?.photoURL || null,
      };
    }).filter(entry => entry.name !== "Anonymous" && entry.name.trim().length > 0);

    return Response.json(leaderboard);
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return Response.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
