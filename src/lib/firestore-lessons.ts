"use client";

import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";

export type FirestoreLesson = {
  id: string;
  mode: "test" | "practice" | "words";
  wordCount?: number | null;
  difficulty?: string | null;
  createdAt?: number;
  title: string;
  text: string;
};

export function useFirestoreLessons(categoryId: string) {
  const [lessons, setLessons] = useState<FirestoreLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lessonsQuery = query(collection(db, "lessons"));
    
    return onSnapshot(lessonsQuery, (snapshot) => {
      let fetchedLessons = snapshot.docs.map((lesson) => ({ 
        id: lesson.id, 
        ...lesson.data() 
      } as FirestoreLesson));
      
      // Map legacy category ID to the new flat collection fields
      if (categoryId.startsWith("words-")) {
        const count = parseInt(categoryId.split("-")[1], 10);
        fetchedLessons = fetchedLessons.filter(l => l.mode === "words" && l.wordCount === count);
      } else if (categoryId.startsWith("timed-")) {
        // Tests no longer have duration, they use difficulty
        fetchedLessons = fetchedLessons.filter(l => l.mode === "test");
      } else if (categoryId.startsWith("practice-")) {
        // Practice mode
        fetchedLessons = fetchedLessons.filter(l => l.mode === "practice");
      }
      
      // Sort by newest first
      fetchedLessons.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      setLessons(fetchedLessons);
      setLoading(false);
    }, () => {
      setLessons([]);
      setLoading(false);
      setError("Unable to load lessons from Firestore.");
    });
  }, [categoryId]);

  return { lessons, loading, error };
}
