import type { Metadata } from "next";
import LeaderboardPageClient from "@/components/leaderboard-page";

export const metadata: Metadata = {
  title: "Leaderboard | Top Typists | Typing Test Skill",
  description: "See the fastest typists on Typing Test Skill. Top 10 community scores ranked by WPM.",
};

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}
