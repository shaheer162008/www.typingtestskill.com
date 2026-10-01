import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

async function verifyCertificate(certificateId: string | undefined) {
  if (!certificateId) return Response.json({ valid: false, error: "Certificate ID is required." }, { status: 400 });
  
  // Clean up the ID in case the user pasted a full URL
  let parsedId = certificateId.trim().toUpperCase();
  if (parsedId.includes("/CERTIFICATES/")) {
    parsedId = parsedId.split("/CERTIFICATES/").pop() || parsedId;
  }
  // Remove any trailing slashes or query parameters just in case
  parsedId = parsedId.split("?")[0].replace(/\/$/, "");

  const snapshot = await getAdminDb().collection("certificates").doc(parsedId).get();
  if (!snapshot.exists) return Response.json({ valid: false });
  const certificate = snapshot.data() as { name?: string; certificateId?: string; rawWpm?: number; accuracy?: number; tier?: string; tierLabel?: string; issuedAt?: number; permanent?: boolean; durationMinutes?: number | null; wordCount?: number | null };
  return Response.json({ valid: true, certificate: { certificateId: certificate.certificateId, name: certificate.name, rawWpm: certificate.rawWpm, accuracy: certificate.accuracy, tier: certificate.tier, tierLabel: certificate.tierLabel, issuedAt: certificate.issuedAt, permanent: certificate.permanent === true, durationMinutes: certificate.durationMinutes, wordCount: certificate.wordCount } });
}

export async function GET(request: Request) {
  try {
    return await verifyCertificate(new URL(request.url).searchParams.get("id") ?? undefined);
  } catch (error) {
    console.error("certificate verification failed", error);
    return Response.json({ valid: false, error: "Certificate verification service is not configured." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { certificateId?: string; name?: string };
    return await verifyCertificate(body.certificateId);
  } catch (error) {
    console.error("certificate verification failed", error);
    return Response.json({ valid: false, error: "Certificate verification service is not configured." }, { status: 503 });
  }
}
