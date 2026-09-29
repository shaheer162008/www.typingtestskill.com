"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";

export type LeaderboardEntry = {
  id: string;
  uid: string;
  rawWpm: number;
  accuracy: number;
  mode: string;
  difficulty?: string;
  durationMinutes?: number;
  wordCount?: number;
  createdAt: number;
  name: string;
  photoURL: string | null;
};

export function useLeaderboard(maxEntries: number, durationMinutes: number) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let results: Array<{ id: string; uid: string; rawWpm: number; accuracy: number; mode: string; difficulty?: string; durationMinutes?: number; wordCount?: number; createdAt: number; reviewStatus?: string }> = [];
    let users: Map<string, { name?: string; photoURL?: string }> = new Map();

    function merge() {
      // Only show "test" mode with matching duration and non-suspicious
      const filtered = results.filter(
        r => r.mode === "test" && r.durationMinutes === durationMinutes && r.reviewStatus !== "pending"
      );

      // Best WPM per user
      const bestByUser = new Map<string, typeof filtered[0]>();
      for (const r of filtered) {
        const existing = bestByUser.get(r.uid);
        if (!existing || r.rawWpm > existing.rawWpm) {
          bestByUser.set(r.uid, r);
        }
      }

      const sorted = Array.from(bestByUser.values())
        .filter(r => {
          const u = users.get(r.uid);
          // Only show users who have a real name saved (logged-in users via Google/email)
          return u?.name && u.name.trim().length > 0;
        })
        .sort((a, b) => b.rawWpm - a.rawWpm)
        .slice(0, maxEntries);

      const merged: LeaderboardEntry[] = sorted.map(r => {
        const u = users.get(r.uid);
        return {
          id: r.id,
          uid: r.uid,
          rawWpm: r.rawWpm,
          accuracy: r.accuracy,
          mode: r.mode,
          difficulty: r.difficulty,
          durationMinutes: r.durationMinutes,
          wordCount: r.wordCount,
          createdAt: r.createdAt,
          name: u?.name || "Anonymous",
          photoURL: u?.photoURL || null,
        };
      });

      setEntries(merged);
      setLoading(false);
    }

    const unsubResults = onSnapshot(
      collection(db, "testResults"),
      (snap) => {
        results = snap.docs.map(d => ({ id: d.id, ...d.data() } as typeof results[0]));
        merge();
      },
      () => setLoading(false)
    );

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        users = new Map();
        snap.docs.forEach(d => {
          const data = d.data();
          users.set(d.id, { name: data.name || data.displayName, photoURL: data.photoURL });
        });
        merge();
      }
    );

    return () => { unsubResults(); unsubUsers(); };
  }, [maxEntries, durationMinutes]);

  return { entries, loading };
}
