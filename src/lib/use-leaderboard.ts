"use client";

import { useEffect, useState } from "react";

export type LeaderboardEntry = {
  id: string;
  uid: string;
  rawWpm: number;
  netWpm?: number;
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
    let cancelled = false;
    setLoading(true);
    
    fetch(`/api/leaderboard?durationMinutes=${durationMinutes}&limit=${maxEntries}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && Array.isArray(data)) {
          setEntries(data);
        }
      })
      .catch(err => {
        console.error("Failed to fetch leaderboard:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [maxEntries, durationMinutes]);

  return { entries, loading };
}
