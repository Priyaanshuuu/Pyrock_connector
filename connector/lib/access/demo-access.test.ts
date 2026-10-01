import { describe, expect, it } from "vitest";
import { createSampleAdapter } from "../data/sample-adapter";
import { sampleFixtures } from "../data/sample-fixtures";
import { createDemoAccess } from "./demo-access";

describe("server-controlled demo identity and site access", () => {
  it("does not assume an owner when server identity is missing or unrecognised", async () => {
    const adapter = createSampleAdapter();
    for (const value of [undefined, "", "unknown", "demo-owner "]) {
      const access = createDemoAccess(adapter, () => value);
      expect((await access.getIdentity()).ok).toBe(false);
      expect((await access.listPermittedSites()).ok).toBe(false);
      expect(await access.resolveSite({ siteId: "site-a" })).toMatchObject({
        ok: false, error: { code: "unauthenticated" },
      });
    }
  });

  it("allows the owner to resolve both sites by ID and name", async () => {
    const access = createDemoAccess(createSampleAdapter(), () => "demo-owner");
    expect(await access.getIdentity()).toEqual({
      ok: true, user: { id: "demo-owner", name: "Fictional owner" },
    });
    expect(await access.listPermittedSites()).toMatchObject({
      ok: true, sites: [{ id: "site-a" }, { id: "site-b" }],
    });
    for (const id of ["site-a", "site-b"]) {
      expect(await access.resolveSite({ siteId: id })).toMatchObject({
        ok: true, user: { id: "demo-owner" }, site: { id },
      });
    }
    expect(await access.resolveSite({ siteName: "  FICTIONAL site a  " })).toMatchObject({
      ok: true, site: { id: "site-a" },
    });
    expect(await access.resolveSite({ siteId: "unknown" })).toMatchObject({
      ok: false, error: { code: "access_denied" },
    });
  });

  it("allows the supervisor only Site A and hides Site B details", async () => {
    const access = createDemoAccess(createSampleAdapter(), () => "demo-supervisor");
    expect(await access.listPermittedSites()).toMatchObject({ ok: true, sites: [{ id: "site-a" }] });
    expect(await access.resolveSite({ siteId: "site-a" })).toMatchObject({ ok: true, site: { id: "site-a" } });
    const forbidden = await access.resolveSite({ siteId: "site-b" });
    const unknown = await access.resolveSite({ siteId: "unknown" });
    expect(forbidden).toEqual(unknown);
    expect(forbidden).toMatchObject({ ok: false, error: { code: "access_denied" } });
    expect(JSON.stringify(forbidden)).not.toContain("site-b");
    expect(await access.resolveSite({ siteName: "Fictional Site B" })).toEqual(unknown);
  });

  it("does not fetch a forbidden site by guessed ID", async () => {
    const adapter = createSampleAdapter();
    const fetched: string[] = [];
    const original = adapter.getSite;
    adapter.getSite = async (id) => {
      fetched.push(id);
      return original(id);
    };
    const access = createDemoAccess(adapter, () => "demo-supervisor");
    expect(await access.resolveSite({ siteId: "site-b" })).toMatchObject({
      ok: false, error: { code: "access_denied" },
    });
    expect(fetched).toEqual([]);
    await access.resolveSite({ siteName: "Fictional Site B" });
    expect(fetched).toEqual(["site-a"]);
  });

  it("rejects caller-supplied identity, conflicting selectors, and empty names", async () => {
    const access = createDemoAccess(createSampleAdapter(), () => "demo-supervisor");
    for (const input of [
      { siteId: "site-a", userId: "demo-owner" },
      { siteId: "site-a", siteName: "Fictional Site B" },
      { siteName: " " },
      { siteId: 123 },
      {},
    ]) {
      expect(await access.resolveSite(input)).toMatchObject({
        ok: false, error: { code: "invalid_input" },
      });
    }
  });

  it("reports ambiguity only among sites the user may access", async () => {
    const fixtures = structuredClone(sampleFixtures);
    fixtures.sites[0].name = "Shared Site";
    fixtures.sites[1].name = "Shared Site";
    const adapter = createSampleAdapter(fixtures);
    const owner = createDemoAccess(adapter, () => "demo-owner");
    const supervisor = createDemoAccess(adapter, () => "demo-supervisor");
    expect(await owner.resolveSite({ siteName: "shared site" })).toMatchObject({
      ok: false, error: { code: "ambiguous_site" },
    });
    expect(await supervisor.resolveSite({ siteName: "shared site" })).toMatchObject({
      ok: true, site: { id: "site-a" },
    });
  });

  it("reloads identity and site permissions for every request", async () => {
    const adapter = createSampleAdapter();
    const original = adapter.getDemoUser;
    let selected: unknown = "demo-owner";
    let revokeSiteB = false;
    adapter.getDemoUser = async (id) => {
      const user = await original(id);
      if (user && revokeSiteB) user.allowedSiteIds = user.allowedSiteIds.filter((site) => site !== "site-b");
      return user;
    };
    const access = createDemoAccess(adapter, () => selected);
    expect(await access.resolveSite({ siteId: "site-b" })).toMatchObject({ ok: true });
    selected = "demo-supervisor";
    expect(await access.resolveSite({ siteId: "site-b" })).toMatchObject({
      ok: false, error: { code: "access_denied" },
    });
    selected = "demo-owner";
    revokeSiteB = true;
    expect(await access.resolveSite({ siteId: "site-b" })).toMatchObject({
      ok: false, error: { code: "access_denied" },
    });
    selected = undefined;
    expect(await access.resolveSite({ siteId: "site-a" })).toMatchObject({
      ok: false, error: { code: "unauthenticated" },
    });
  });

  it("omits deleted permitted sites and never treats a missing ID as access", async () => {
    const adapter = createSampleAdapter();
    const original = adapter.getSite;
    adapter.getSite = async (id) => id === "site-b" ? null : original(id);
    const access = createDemoAccess(adapter, () => "demo-owner");
    expect(await access.listPermittedSites()).toMatchObject({ ok: true, sites: [{ id: "site-a" }] });
    expect(await access.resolveSite({ siteId: "site-b" })).toMatchObject({
      ok: false, error: { code: "access_denied" },
    });
  });

  it("fails closed when the adapter returns the wrong site or malformed user", async () => {
    const adapter = createSampleAdapter();
    adapter.getSite = async () => ({ id: "site-b", name: "Fictional Site B" });
    const access = createDemoAccess(adapter, () => "demo-supervisor");
    expect(await access.resolveSite({ siteId: "site-a" })).toMatchObject({
      ok: false, error: { code: "data_unavailable" },
    });
    adapter.getDemoUser = async () => ({ id: "demo-owner", name: "Wrong user", allowedSiteIds: ["site-a"] });
    expect(await access.resolveSite({ siteId: "site-a" })).toMatchObject({
      ok: false, error: { code: "data_unavailable" },
    });
  });

  it("returns a safe retryable result on adapter failure", async () => {
    const adapter = createSampleAdapter();
    adapter.getDemoUser = async () => { throw new Error("Private upstream details"); };
    const access = createDemoAccess(adapter, () => "demo-owner");
    const result = await access.resolveSite({ siteId: "site-a" });
    expect(result).toMatchObject({ ok: false, error: { code: "upstream_failure", retryable: true } });
    expect(JSON.stringify(result)).not.toContain("Private upstream details");
  });

  it("does not use demo identity with a live adapter", async () => {
    const adapter = createSampleAdapter();
    Object.defineProperty(adapter, "mode", { value: "live" });
    const access = createDemoAccess(adapter, () => "demo-owner");
    expect(await access.resolveSite({ siteId: "site-a" })).toMatchObject({
      ok: false, error: { code: "unauthenticated" },
    });
  });
});
