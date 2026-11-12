import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/admin/db";
import { verifyPassword } from "@/lib/admin/password";

export const COOKIE = "yonetim_oturum";
const SESSION_DAYS = 7;
const IP_LIMIT = 5; // 15 dakikada IP başına
const USER_LIMIT = 10; // 15 dakikada kullanıcı adı başına
const WINDOW_MS = 15 * 60 * 1000;

export type Admin = { id: string; username: string };

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

/** İstemci IP'si: sadece platformun kendi başlığına güvenilir (Netlify). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-nf-client-connection-ip") ?? "yerel";
}

async function isSecureContext(): Promise<boolean> {
  const host = ((await headers()).get("host") ?? "").split(":")[0];
  return !(host === "localhost" || host === "127.0.0.1" || host === "[::1]");
}

export async function getAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 200) return null;
  const { data } = await adminDb()
    .from("admin_sessions")
    .select("expires_at, admin_users(id, username)")
    .eq("token_hash", sha(token))
    .maybeSingle();
  if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
  const u = data.admin_users as unknown as { id: string; username: string } | null;
  return u ? { id: u.id, username: u.username } : null;
}

/** Her panel sayfası ve her sunucu işlemi bunu çağırır; oturum veritabanından doğrulanır. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/yonetim/giris");
  return admin;
}

export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const { error } = await adminDb()
    .from("admin_sessions")
    .insert({ token_hash: sha(token), user_id: userId, expires_at: expires.toISOString() });
  if (error) throw new Error("Oturum açılamadı.");
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: await isSecureContext(),
    sameSite: "lax",
    path: "/yonetim",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await adminDb().from("admin_sessions").delete().eq("token_hash", sha(token));
  jar.delete({ name: COOKIE, path: "/yonetim" });
}

export async function endOtherSessions(userId: string): Promise<void> {
  const token = (await cookies()).get(COOKIE)?.value;
  let q = adminDb().from("admin_sessions").delete().eq("user_id", userId);
  if (token) q = q.neq("token_hash", sha(token));
  await q;
}

async function countAttempts(kind: "ip" | "username", key: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await adminDb()
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("key", key)
    .gte("created_at", since);
  return count ?? 0;
}

export type LoginResult = { ok: true } | { ok: false; message: string };

const DUMMY_HASH = "scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");

export async function login(username: string, password: string): Promise<LoginResult> {
  const user = username.trim().toLowerCase().slice(0, 40);
  const ip = (await clientIp()).slice(0, 100);
  const userKey = user.slice(0, 100);

  if ((await countAttempts("ip", ip)) >= IP_LIMIT || (await countAttempts("username", userKey)) >= USER_LIMIT) {
    return { ok: false, message: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." };
  }

  const { data } = await adminDb().from("admin_users").select("id, password_hash").eq("username", user).maybeSingle();
  const valid = await verifyPassword(password, data?.password_hash ?? DUMMY_HASH);
  if (!data || !valid) {
    await adminDb()
      .from("login_attempts")
      .insert([
        { kind: "ip", key: ip },
        { kind: "username", key: userKey },
      ]);
    return { ok: false, message: "Kullanıcı adı ya da şifre hatalı." };
  }
  await adminDb().from("login_attempts").delete().eq("kind", "username").eq("key", userKey);
  await startSession(data.id);
  return { ok: true };
}
