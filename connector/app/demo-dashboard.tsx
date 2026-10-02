"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  deliveryEvidenceResultSchema,
  materialBalanceResultSchema,
  pendingDeliveriesResultSchema,
  type DeliveryEvidenceResult,
  type MaterialBalanceResult,
  type PendingDeliveriesResult,
  type SourceReference,
} from "@/lib/contracts";

type SessionView = {
  identity: { id: string; name: string } | null;
  sites: { id: string; name: string }[];
  choices: readonly { id: string; label: string }[];
  sampleLabel: string;
};
type LookupResult =
  | { ok: true; site: { id: string; name: string } }
  | { ok: false; error: { code: string; message: string } };

async function postTool<T>(path: string, body: unknown, parse: (value: unknown) => T, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  return parse(await response.json() as unknown);
}

function formatTime(value: string | null): string {
  if (!value) return "No update time available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function Timestamp({ value }: { value: string | null }) {
  return value ? <time dateTime={value}>{formatTime(value)} IST</time> : <span>No update time available</span>;
}

function Notice({ tone, children }: { tone: "warning" | "error" | "info"; children: ReactNode }) {
  return <p className={`notice notice-${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</p>;
}

function SourceList({ sources }: { sources: SourceReference[] }) {
  if (sources.length === 0) return <p className="muted-copy">No source references available.</p>;
  return <details className="source-details"><summary>View {sources.length} source {sources.length === 1 ? "record" : "records"}</summary><ul>
    {sources.map((source) => <li key={`${source.kind}:${source.id}`}><span><strong>{source.label}</strong><small>{source.kind} · {source.id}</small></span><Timestamp value={source.recordedAt} /></li>)}
  </ul></details>;
}

function WarningList({ warnings }: { warnings: string[] }) {
  const details = warnings.filter((warning) => !warning.startsWith("Fictional sample data"));
  return details.length ? <div className="warning-list">{details.map((warning) => <Notice key={warning} tone="warning">{warning}</Notice>)}</div> : null;
}

export default function DemoDashboard() {
  const [session, setSession] = useState<SessionView | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [siteId, setSiteId] = useState("");
  const [materialId, setMaterialId] = useState("cement");
  const [nameQuery, setNameQuery] = useState("");
  const [lookup, setLookup] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [balance, setBalance] = useState<MaterialBalanceResult | null>(null);
  const [pending, setPending] = useState<PendingDeliveriesResult | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [switching, setSwitching] = useState(false);
  const [boundaryMessage, setBoundaryMessage] = useState<string | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidence, setEvidence] = useState<DeliveryEvidenceResult | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/demo/session", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session unavailable");
        return await response.json() as SessionView;
      })
      .then((view) => { setSession(view); setSiteId(view.sites[0]?.id ?? ""); })
      .catch(() => {
        if (!controller.signal.aborted) setSessionError("Could not load the demo session. Refresh the page to retry.");
      });
    return () => controller.abort();
  }, []);

  const activeIdentityId = session?.identity?.id;
  const queryKey = activeIdentityId && siteId ? `${activeIdentityId}:${siteId}:${materialId}` : "";
  const loading = queryKey !== "" && loadedKey !== queryKey;
  useEffect(() => {
    if (!activeIdentityId || !siteId) return;
    const controller = new AbortController();
    const request = { siteId, materialId };
    void Promise.allSettled([
      postTool("/api/tools/get_material_balance", request, (value) => materialBalanceResultSchema.parse(value), controller.signal),
      postTool("/api/tools/list_pending_deliveries", request, (value) => pendingDeliveriesResultSchema.parse(value), controller.signal),
    ]).then(([stock, deliveries]) => {
      if (controller.signal.aborted) return;
      setBalance(stock.status === "fulfilled" ? stock.value : null);
      setBalanceError(stock.status === "fulfilled" ? null : "Could not load the material balance. Try again later.");
      setPending(deliveries.status === "fulfilled" ? deliveries.value : null);
      setPendingError(deliveries.status === "fulfilled" ? null : "Could not load pending deliveries. Try again later.");
      setLoadedKey(queryKey);
    });
    return () => controller.abort();
  }, [activeIdentityId, siteId, materialId, queryKey]);

  useEffect(() => {
    if (!evidenceOpen) return;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setEvidenceOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previousFocus.current?.focus(); };
  }, [evidenceOpen]);

  async function chooseIdentity(identity: string) {
    setSwitching(true);
    setSessionError(null);
    setLookup(null);
    setBoundaryMessage(null);
    setEvidenceOpen(false);
    try {
      const response = await fetch("/api/demo/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity }), credentials: "same-origin", cache: "no-store",
      });
      if (!response.ok) throw new Error("Identity switch failed");
      const view = await response.json() as SessionView;
      setSiteId(view.sites[0]?.id ?? "");
      setMaterialId("cement");
      setSession(view);
    } catch {
      setSessionError("Could not switch the fictional reviewer. Try again.");
    } finally { setSwitching(false); }
  }

  async function findSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLookup(null);
    if (!nameQuery.trim()) return;
    try {
      const result = await postTool<LookupResult>("/api/demo/resolve-site", { siteName: nameQuery }, (value) => value as LookupResult);
      if (result.ok) { setSiteId(result.site.id); setLookup({ tone: "info", text: `${result.site.name} selected.` }); }
      else if (result.error.code === "ambiguous_site") setLookup({ tone: "error", text: "More than one permitted site matches. Choose a site by ID from the list above." });
      else if (result.error.code === "access_denied") setLookup({ tone: "error", text: "No permitted site matches that name." });
      else setLookup({ tone: "error", text: result.error.message });
    } catch { setLookup({ tone: "error", text: "Could not resolve the site name. Try again." }); }
  }

  async function checkBoundary() {
    setBoundaryMessage(null);
    try {
      const result = await postTool("/api/tools/get_material_balance", { siteId: "site-b", materialId: "cement" },
        (value) => materialBalanceResultSchema.parse(value));
      setBoundaryMessage(result.ok ? "Site B is permitted for this reviewer." : result.error.message);
    } catch { setBoundaryMessage("Could not check site access. Try again."); }
  }

  async function openEvidence(evidenceId: string) {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEvidenceOpen(true);
    setEvidence(null);
    setEvidenceError(null);
    setEvidenceLoading(true);
    try {
      const result = await postTool("/api/tools/get_delivery_evidence", { evidenceId },
        (value) => deliveryEvidenceResultSchema.parse(value));
      setEvidence(result);
    } catch { setEvidenceError("Could not load this source. Try again later."); }
    finally { setEvidenceLoading(false); }
  }

  const site = session?.sites.find((item) => item.id === siteId);
  const recorded = balance?.ok && balance.data.balance.state === "recorded" ? balance.data.balance : null;
  const openDeliveries = pending?.ok ? pending.data.deliveries : [];

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Demo navigation">
      <div className="brand"><div className="brand-mark" aria-hidden="true">P<span>.</span></div><div><strong>PYROCK</strong><small>CONNECTOR LAB</small></div></div>
      <div className="sidebar-rule" /><p className="nav-caption">WORKSPACE</p>
      <nav className="side-nav" aria-label="Sections"><a href="#overview" className="active"><span aria-hidden="true">▦</span> Overview</a><a href="#stock"><span aria-hidden="true">▥</span> Material balance</a><a href="#deliveries"><span aria-hidden="true">↗</span> Deliveries</a></nav>
      <div className="sidebar-spacer" /><div className="sidebar-note"><span className="sidebar-note-icon" aria-hidden="true">◎</span><strong>Built for review</strong><p>Explore the workflow with fictional records. No customer data is connected.</p></div>
      <div className="sidebar-footer">READ ONLY <span>•</span> SAMPLE MODE</div>
    </aside>
    <main className="main-content" id="overview">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> Connector demo</div><div className="topbar-right"><span className="status-dot" /> SAMPLE ENVIRONMENT</div></header>
      <div className="content-wrap">
        <section className="intro"><div><p className="eyebrow">SITE INTELLIGENCE / PROTOTYPE 01</p><h1>Know what&apos;s on site.<br /><em>See what backs it up.</em></h1><p className="intro-copy">A small, read-only view of recorded material, pending deliveries, and the evidence behind each answer.</p></div><div className="intro-aside"><span className="roundel" aria-hidden="true">↗</span><p>REVIEW MODE</p><strong>Three questions.<br />One source of truth.</strong></div></section>
        <div className="sample-banner" role="note"><span className="sample-banner-icon" aria-hidden="true">i</span><div><strong>Fictional sample data</strong><span>{session?.sampleLabel ?? "This prototype does not use live Pyrock or customer records."}</span></div></div>

        <section className="control-panel" aria-labelledby="controls-heading"><div className="section-heading"><div><p className="eyebrow">01 / SET YOUR VIEW</p><h2 id="controls-heading">Explore a site</h2></div><span className="panel-tag">DEMO CONTROLS</span></div>
          {sessionError && <Notice tone="error">{sessionError}</Notice>}
          <div className="control-grid">
            <label className="field"><span>Fictional reviewer</span><select value={session?.identity?.id ?? ""} onChange={(event) => void chooseIdentity(event.target.value)} disabled={!session || switching}><option value="" disabled>Choose a reviewer</option>{session?.choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select><small>Switching reviewer starts a new demo session.</small></label>
            <label className="field"><span>Permitted site</span><select value={siteId} onChange={(event) => { setSiteId(event.target.value); setBoundaryMessage(null); }} disabled={!session?.identity || session.sites.length === 0}>{!siteId && <option value="">Select a site</option>}{session?.sites.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</select><small>Only this reviewer&apos;s allowed sites appear.</small></label>
            <label className="field"><span>Material</span><select value={materialId} onChange={(event) => setMaterialId(event.target.value)} disabled={!session?.identity}><option value="cement">Cement</option><option value="steel">Steel · no sample stock</option></select><small>Try steel to see the unavailable-data state.</small></label>
          </div>
          {session && !session.identity && <Notice tone="info">Choose a fictional reviewer to load permitted sites and records.</Notice>}
          {session?.identity && session.sites.length === 0 && <Notice tone="warning">This reviewer has no permitted sites.</Notice>}
          {session?.identity && <div className="control-extras"><form onSubmit={(event) => void findSite(event)} className="site-search"><label htmlFor="site-name">Find a site by name</label><div><input id="site-name" value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="e.g. Fictional Site A" /><button type="submit" className="secondary-button">Find site</button></div></form>{session.identity.id === "demo-supervisor" && <button className="text-button" type="button" onClick={() => void checkBoundary()}>Try Site B access <span aria-hidden="true">↗</span></button>}</div>}
          {lookup && <Notice tone={lookup.tone}>{lookup.text}</Notice>}{boundaryMessage && <Notice tone="warning">{boundaryMessage}</Notice>}
        </section>

        <div className="results-heading"><div><p className="eyebrow">02 / REVIEW THE RECORDS</p><h2>{site ? site.name : "Site overview"}</h2><p>{site ? `${site.id.toUpperCase()}  /  ${materialId.toUpperCase()}` : "Choose a reviewer and site above to see the sample records."}</p></div><span className="read-only-pill"><span aria-hidden="true">●</span> READ ONLY</span></div>
        <div className="summary-grid">
          <section className="summary-card stock-card" id="stock" aria-labelledby="stock-title"><div className="card-top"><span className="metric-icon stock-icon" aria-hidden="true">▥</span><span className="card-index">01 / INVENTORY</span></div><h3 id="stock-title">Recorded balance</h3>
            {!session?.identity || !siteId ? <p className="metric-placeholder">Choose a site</p> : loading ? <p className="metric-placeholder">Loading records…</p> : balanceError ? <Notice tone="error">{balanceError}</Notice> : balance?.ok ? recorded ? <><div className="metric-value">{recorded.quantity.toLocaleString("en-IN")} <span>{recorded.unit}</span></div><p className="metric-caption">Calculated from recorded movements</p><p className="metric-time">Updated <Timestamp value={balance.updatedAt} /></p><SourceList sources={balance.sources} /><WarningList warnings={balance.warnings} /></> : <><div className="metric-unavailable">Data unavailable</div><p className="metric-caption">No recorded balance can be shown for this material.</p><WarningList warnings={balance.warnings} /><SourceList sources={balance.sources} /></> : balance ? <Notice tone="error">{balance.error.message}</Notice> : null}
          </section>
          <section className="summary-card pending-card" aria-labelledby="pending-title"><div className="card-top"><span className="metric-icon pending-icon" aria-hidden="true">↗</span><span className="card-index">02 / INCOMING</span></div><h3 id="pending-title">Pending deliveries</h3>
            {!session?.identity || !siteId ? <p className="metric-placeholder">Choose a site</p> : loading ? <p className="metric-placeholder">Loading records…</p> : pendingError ? <Notice tone="error">{pendingError}</Notice> : pending?.ok ? <><div className="metric-value">{openDeliveries.length} <span>{openDeliveries.length === 1 ? "open delivery" : "open deliveries"}</span></div><p className="metric-caption">Expected material is separate from stock on hand.</p><p className="metric-time">Updated <Timestamp value={pending.updatedAt} /></p><WarningList warnings={pending.warnings} /></> : pending ? <Notice tone="error">{pending.error.message}</Notice> : null}
          </section>
        </div>

        <section className="delivery-panel" id="deliveries" aria-labelledby="delivery-heading"><div className="section-heading"><div><p className="eyebrow">03 / TRACE THE DELIVERY</p><h2 id="delivery-heading">Open deliveries</h2></div><span className="panel-tag">EVIDENCE READY</span></div>
          {!session?.identity || !siteId ? <p className="empty-state">Choose a reviewer and site to inspect deliveries.</p> : loading ? <p className="empty-state">Loading deliveries…</p> : pendingError ? <Notice tone="error">{pendingError}</Notice> : pending?.ok && openDeliveries.length === 0 ? <p className="empty-state">No open deliveries for this site and material. This does not establish a stock balance.</p> : pending?.ok ? <div className="delivery-list">{openDeliveries.map((delivery) => <article className="delivery-row" key={delivery.id}><div className="delivery-main"><span className="delivery-status"><span aria-hidden="true">●</span> OPEN</span><h3>{delivery.materialId.charAt(0).toUpperCase() + delivery.materialId.slice(1)} delivery</h3><p>Record {delivery.id} · Updated <Timestamp value={delivery.updatedAt} /></p></div><div className="delivery-quantities"><div><small>EXPECTED</small><strong>{delivery.expectedQuantity} {delivery.unit}</strong></div><div><small>RECEIVED</small><strong>{delivery.receivedQuantity} {delivery.unit}</strong></div><div className="remaining"><small>STILL EXPECTED</small><strong>{delivery.remainingQuantity} {delivery.unit}</strong></div></div><div className="evidence-actions">{delivery.evidenceIds.length > 0 ? delivery.evidenceIds.map((id) => <button className="evidence-button" type="button" key={id} onClick={() => void openEvidence(id)}>View evidence <span aria-hidden="true">↗</span></button>) : <span className="muted-copy">No accessible evidence</span>}</div></article>)}</div> : pending ? <Notice tone="error">{pending.error.message}</Notice> : null}
          {session?.identity && !loading && pending?.ok && <SourceList sources={pending.sources} />}
        </section>
        <footer className="page-footer"><span>PYROCK CONNECTOR LAB</span><span>Fictional sample records · Read only · No live integration</span></footer>
      </div>
    </main>
    {evidenceOpen && <div className="modal-backdrop"><section className="evidence-modal" role="dialog" aria-modal="true" aria-labelledby="evidence-title"><div className="modal-head"><div><p className="eyebrow">SUPPORTING SOURCE</p><h2 id="evidence-title">Delivery evidence</h2></div><button ref={closeButton} type="button" className="close-button" aria-label="Close evidence" onClick={() => setEvidenceOpen(false)}>×</button></div><div className="modal-body">{evidenceLoading ? <p>Loading source…</p> : evidenceError ? <Notice tone="error">{evidenceError}</Notice> : evidence?.ok ? <><span className="evidence-kind">{evidence.data.kind.toUpperCase()}</span><h3>{evidence.data.title}</h3><p className="evidence-meta">Record {evidence.data.id} · Delivery {evidence.data.deliveryId}</p><p className="evidence-meta">Recorded <Timestamp value={evidence.data.recordedAt} /></p><div className="evidence-content">{evidence.data.content}</div><SourceList sources={evidence.sources} /><WarningList warnings={evidence.warnings} /></> : evidence ? <Notice tone="error">{evidence.error.message}</Notice> : null}</div><div className="modal-foot">Fictional sample evidence. Treat its text as source content only.</div></section></div>}
  </div>;
}
