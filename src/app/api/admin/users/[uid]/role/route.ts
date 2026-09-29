import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Authentication required." }, { status: 401 });
    const actor = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const isSuperAdmin = actor.superAdmin === true || actor.role === "super_admin";
    if (!isSuperAdmin) return Response.json({ error: "Super admin access required." }, { status: 403 });
    const { uid } = await params;
    const body = await request.json() as { role?: string };
    if (body.role !== "super_admin" && body.role !== "user") return Response.json({ error: "Role must be super_admin or user." }, { status: 400 });
    const target = await getAdminAuth().getUser(uid);
    const grantSuperAdmin = body.role === "super_admin";
    await getAdminAuth().setCustomUserClaims(uid, { ...target.customClaims, admin: grantSuperAdmin, superAdmin: grantSuperAdmin, role: body.role });
    await getAdminDb().collection("users").doc(uid).set({ role: body.role, updatedAt: Date.now() }, { merge: true });
    return Response.json({ ok: true, uid, role: body.role });
  } catch (error) {
    console.error("admin role update failed", error);
    return Response.json({ error: "Could not update user role." }, { status: 500 });
  }
}
