import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getSession, POST as selectIdentity } from "../../app/api/demo/session/route";
import { POST as resolveSite } from "../../app/api/demo/resolve-site/route";
import { POST as getBalance } from "../../app/api/tools/get_material_balance/route";

afterEach(() => vi.unstubAllEnvs());

const sessionSecret = "fictional-demo-test-key-with-at-least-32-characters";

const base = "http://localhost:3000";
const jsonPost = (path: string, body: unknown, cookie?: string, origin?: string) => new Request(`${base}${path}`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    ...(cookie ? { cookie } : {}),
    ...(origin ? { origin } : {}),
  },
  body: JSON.stringify(body),
});

describe("controlled fictional reviewer selection", () => {
  it("starts without an identity and offers only the two demo reviewers", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "");
    vi.stubEnv("PYROCK_DEMO_SESSION_SECRET", sessionSecret);
    const response = await getSession(new Request(`${base}/api/demo/session`));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.identity).toBeNull();
    expect(body.sites).toEqual([]);
    expect(body.choices.map((choice: { id: string }) => choice.id)).toEqual(["demo-owner", "demo-supervisor"]);
  });

  it("uses an opaque server session for tools and permitted-site lookup", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "");
    vi.stubEnv("PYROCK_DEMO_SESSION_SECRET", sessionSecret);
    const selected = await selectIdentity(jsonPost("/api/demo/session", { identity: "demo-supervisor" }, undefined, base));
    expect(selected.status).toBe(200);
    expect(await selected.json()).toMatchObject({ identity: { id: "demo-supervisor" }, sites: [{ id: "site-a" }] });
    const setCookie = selected.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    const cookie = setCookie.split(";")[0];
    expect(cookie).not.toContain("demo-supervisor");

    const session = await getSession(new Request(`${base}/api/demo/session`, { headers: { cookie } }));
    expect(await session.json()).toMatchObject({ identity: { id: "demo-supervisor" }, sites: [{ id: "site-a" }] });
    const allowed = await getBalance(jsonPost("/api/tools/get_material_balance", { siteId: "site-a", materialId: "cement" }, cookie));
    const denied = await getBalance(jsonPost("/api/tools/get_material_balance", { siteId: "site-b", materialId: "cement" }, cookie));
    expect(allowed.status).toBe(200);
    expect(denied.status).toBe(403);
    expect(await denied.json()).toMatchObject({ ok: false, error: { code: "access_denied" } });

    const found = await resolveSite(jsonPost("/api/demo/resolve-site", { siteName: "fictional site a" }, cookie));
    const hidden = await resolveSite(jsonPost("/api/demo/resolve-site", { siteName: "fictional site b" }, cookie));
    expect(found.status).toBe(200);
    expect(await found.json()).toMatchObject({ ok: true, site: { id: "site-a" } });
    expect(hidden.status).toBe(403);
    expect(await hidden.json()).toMatchObject({ ok: false, error: { code: "access_denied" } });
  });

  it("ignores a forged session even if a server fallback identity exists", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-owner");
    vi.stubEnv("PYROCK_DEMO_SESSION_SECRET", sessionSecret);
    const forged = "pyrock_demo_session=demo-owner";
    const response = await getBalance(jsonPost("/api/tools/get_material_balance", {
      siteId: "site-a", materialId: "cement",
    }, forged));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "unauthenticated" } });
  });

  it("rejects unrecognised identities and cross-origin selection", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "");
    vi.stubEnv("PYROCK_DEMO_SESSION_SECRET", sessionSecret);
    const invalid = await selectIdentity(jsonPost("/api/demo/session", { identity: "arbitrary-user" }, undefined, base));
    const extra = await selectIdentity(jsonPost("/api/demo/session", { identity: "demo-owner", userId: "other" }, undefined, base));
    const foreign = await selectIdentity(jsonPost("/api/demo/session", { identity: "demo-owner" }, undefined, "https://example.com"));
    expect(invalid.status).toBe(400);
    expect(extra.status).toBe(400);
    expect(foreign.status).toBe(403);
    expect(foreign.headers.get("set-cookie")).toBeNull();
  });
});
