import "server-only";
import { z } from "zod";
import { siteSchema, toolFailureSchema, type Site, type ToolFailure } from "../contracts";
import type { DataAdapter } from "../data/adapter";
import { demoUserSchema, type DemoUser } from "../data/sample-schema";

const demoIdentitySchema = z.enum(["demo-owner", "demo-supervisor"]);
export const siteSelectionSchema = z.union([
  z.strictObject({ siteId: siteSchema.shape.id }),
  z.strictObject({ siteName: z.string().trim().min(1).max(256) }),
]);
export type SiteSelection = z.infer<typeof siteSelectionSchema>;
export type DemoIdentity = Pick<DemoUser, "id" | "name">;
export type IdentityResult = { ok: true; user: DemoIdentity } | ToolFailure;
export type PermittedSitesResult = { ok: true; sites: Site[] } | ToolFailure;
export type SiteAccessResult = { ok: true; user: DemoIdentity; site: Site } | ToolFailure;

export interface DemoAccess {
  getIdentity(): Promise<IdentityResult>;
  listPermittedSites(): Promise<PermittedSitesResult>;
  resolveSite(selection: unknown): Promise<SiteAccessResult>;
}

function failure(code: ToolFailure["error"]["code"], message: string, retryable = false): ToolFailure {
  return toolFailureSchema.parse({ ok: false, error: { code, message, retryable } });
}

const unauthenticated = () => failure("unauthenticated", "No valid demo identity is configured.");
const denied = () => failure("access_denied", "Site is unavailable or access is denied.");
const malformed = () => failure("data_unavailable", "Access records could not be validated.");
const upstreamFailure = () => failure("upstream_failure", "Access records could not be retrieved.", true);
const publicIdentity = (user: DemoUser): DemoIdentity => ({ id: user.id, name: user.name });

// The optional provider is trusted server configuration/test wiring, never request data.
// Read it on every call: changing identity must not reuse another user's permissions.
export function createDemoAccess(
  adapter: DataAdapter,
  readServerIdentity: () => unknown = () => process.env.PYROCK_DEMO_USER_ID,
): DemoAccess {
  async function currentUser(): Promise<{ ok: true; user: DemoUser } | ToolFailure> {
    if (adapter.mode !== "sample") return unauthenticated();
    const identity = demoIdentitySchema.safeParse(readServerIdentity());
    if (!identity.success) return unauthenticated();
    const record = await adapter.getDemoUser(identity.data);
    if (record === null) return unauthenticated();
    const user = demoUserSchema.safeParse(record);
    if (!user.success || user.data.id !== identity.data) return malformed();
    return { ok: true, user: user.data };
  }

  async function permittedSites(user: DemoUser): Promise<PermittedSitesResult> {
    const sites: Site[] = [];
    for (const id of new Set(user.allowedSiteIds)) {
      const record = await adapter.getSite(id);
      // A deleted site is no longer selectable, even if an old permission remains.
      if (record === null) continue;
      const site = siteSchema.safeParse(record);
      if (!site.success || site.data.id !== id) return malformed();
      sites.push(site.data);
    }
    return { ok: true, sites };
  }

  return {
    async getIdentity() {
      try {
        const result = await currentUser();
        return result.ok ? { ok: true, user: publicIdentity(result.user) } : result;
      } catch {
        return upstreamFailure();
      }
    },
    async listPermittedSites() {
      try {
        const result = await currentUser();
        return result.ok ? await permittedSites(result.user) : result;
      } catch {
        return upstreamFailure();
      }
    },
    async resolveSite(selection) {
      try {
        const identity = await currentUser();
        if (!identity.ok) return identity;
        const input = siteSelectionSchema.safeParse(selection);
        if (!input.success) return failure("invalid_input", "Provide either a site ID or a site name.");
        if ("siteId" in input.data) {
          const id = input.data.siteId;
          // Reject guessed IDs before querying any inaccessible site record.
          if (!identity.user.allowedSiteIds.includes(id)) return denied();
          const record = await adapter.getSite(id);
          if (record === null) return denied();
          const site = siteSchema.safeParse(record);
          if (!site.success || site.data.id !== id) return malformed();
          return { ok: true, user: publicIdentity(identity.user), site: site.data };
        }
        const permitted = await permittedSites(identity.user);
        if (!permitted.ok) return permitted;
        const name = input.data.siteName.toLowerCase();
        const matches = permitted.sites.filter((site) => site.name.toLowerCase() === name);
        if (matches.length === 0) return denied();
        if (matches.length > 1)
          return failure("ambiguous_site", "More than one permitted site matches. Select a site ID from your permitted sites.");
        return { ok: true, user: publicIdentity(identity.user), site: matches[0] };
      } catch {
        return upstreamFailure();
      }
    },
  };
}
