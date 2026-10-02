import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const demoIdentitySchema = z.enum(["demo-owner", "demo-supervisor"]);
export type DemoIdentityId = z.infer<typeof demoIdentitySchema>;

export const demoIdentityChoices = [
  { id: "demo-owner", label: "Owner · Sites A and B" },
  { id: "demo-supervisor", label: "Supervisor · Site A" },
] as const;

const cookieName = "pyrock_demo_session";
const lifetimeSeconds = 8 * 60 * 60;
const tokenSchema = z.strictObject({
  identity: demoIdentitySchema,
  expiresAt: z.number().int().positive(),
  nonce: z.string().uuid(),
});

function cookieToken(request: Request): string | null {
  const pair = request.headers.get("cookie")?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  return pair ? pair.slice(cookieName.length + 1) : null;
}

export function readDemoIdentity(request: Request): DemoIdentityId | undefined {
  const token = cookieToken(request);
  if (token !== null) {
    const secret = process.env.PYROCK_DEMO_SESSION_SECRET;
    if (!secret || token.length > 1024) return undefined;
    const parts = token.split(".");
    if (parts.length !== 2) return undefined;
    const expected = createHmac("sha256", secret).update(parts[0]).digest();
    const supplied = Buffer.from(parts[1], "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return undefined;
    try {
      const raw = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as unknown;
      const session = tokenSchema.safeParse(raw);
      return session.success && session.data.expiresAt > Date.now() ? session.data.identity : undefined;
    } catch {
      return undefined;
    }
  }
  const configured = demoIdentitySchema.safeParse(process.env.PYROCK_DEMO_USER_ID);
  return configured.success ? configured.data : undefined;
}

export function createDemoSession(identity: DemoIdentityId, request: Request): string {
  const secret = process.env.PYROCK_DEMO_SESSION_SECRET;
  if (!secret) throw new Error("Demo session signing key is unavailable");
  const payload = Buffer.from(JSON.stringify({
    identity,
    expiresAt: Date.now() + lifetimeSeconds * 1000,
    nonce: randomUUID(),
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  const token = `${payload}.${signature}`;
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${lifetimeSeconds}${secure}`;
}
