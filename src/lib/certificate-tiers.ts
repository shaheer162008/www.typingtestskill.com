export type CertificateTier = {
  id: "beginner" | "intermediate" | "advanced" | "expert" | "master" | "grandmaster";
  label: string;
  minWpm: number;
  maxWpm: number | null;
  description: string;
};

export const certificateTiers: CertificateTier[] = [
  { id: "grandmaster", label: "Grandmaster", minWpm: 75, maxWpm: null, description: "Elite speed. Unmatched precision." },
  { id: "master", label: "Master", minWpm: 50, maxWpm: 74, description: "Top tier. Consistency is your advantage." },
  { id: "expert", label: "Expert", minWpm: 35, maxWpm: 49, description: "Solid technique. Ready for certification." },
  { id: "advanced", label: "Advanced", minWpm: 25, maxWpm: 34, description: "Building speed. Daily practice pays off." },
  { id: "intermediate", label: "Intermediate", minWpm: 15, maxWpm: 24, description: "Focus on accuracy first, speed later." },
  { id: "beginner", label: "Beginner", minWpm: 0, maxWpm: 14, description: "Just starting out. Building the foundation." },
];

export function getCertificateTier(rawWpm: number) {
  return certificateTiers.find((tier) => rawWpm >= tier.minWpm && (tier.maxWpm === null || rawWpm <= tier.maxWpm)) ?? certificateTiers.at(-1)!;
}
