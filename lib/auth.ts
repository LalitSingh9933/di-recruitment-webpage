import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
export { verifyPassword } from "@/lib/passwords";

const COOKIE = "di_admin_session";
type Session = { id: number; email: string; exp: number; passwordVersion: string };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32)
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

// Sign the identity and expiry so a browser cannot alter the session payload.
export async function createSession(id: number, email: string) {
  const admin = await prisma.admin.findFirst({ where: { id, email, active: true } });
  if (!admin) throw new Error("Administrator account is unavailable.");
  const payload = Buffer.from(
    JSON.stringify({
      id,
      email,
      exp: Date.now() + 8 * 60 * 60 * 1000,
      passwordVersion: sign("password:" + admin.passwordHash),
    }),
  ).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  // Verify the signature before trusting any decoded session fields.
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (
      !Number.isInteger(session.id) ||
      session.id < 1 ||
      session.exp <= Date.now() ||
      !Number.isFinite(session.exp)
    )
      return null;
    const admin = await prisma.admin.findFirst({
      where: { id: session.id, active: true },
    });
    // Password changes invalidate all old cookies without exposing the stored hash.
    if (
      !admin ||
      admin.email !== session.email ||
      session.passwordVersion !== sign("password:" + admin.passwordHash)
    )
      return null;
    return session;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
