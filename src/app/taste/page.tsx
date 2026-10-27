"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageContainer, StatePanel } from "@/components/ui/primitives";
import type { QlooEntity } from "@/lib/qloo/contracts";
import "./taste.css";

type Memory = { id: string; title: string; category: string | null };
type Preference = { memoryId: string; query: string; type: "movie" | "artist" };
type Saved = { id: string; ready_pack_id: string; entity: QlooEntity; interests: QlooEntity[] };
type Bootstrap = { memories: Memory[]; packs: { id: string; title: string }[]; saved: Saved[]; liveEnabled: boolean; persistenceAvailable: boolean };

async function api(input?: unknown) {
  const response = await fetch("/api/taste", { method: input ? "POST" : "GET", cache: "no-store", headers: input ? { "Content-Type": "application/json" } : undefined, body: input ? JSON.stringify(input) : undefined, signal: AbortSignal.timeout(90000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || "Taste is unavailable. Please try again.");
  return body.data;
}
export default function TastePage() { return <RequireAuth><TasteExperience /></RequireAuth>; }
function TasteExperience() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [groups, setGroups] = useState<QlooEntity[][] | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [receipt, setReceipt] = useState("");
  const [results, setResults] = useState<QlooEntity[] | null>(null);
  const [interests, setInterests] = useState<QlooEntity[]>([]);
  const [proposal, setProposal] = useState<QlooEntity | null>(null);
  const [packId, setPackId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { let active = true; api().then(d => { if (active) setData(d); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, []);
  async function run(action: () => Promise<void>) { setBusy(true); setError(""); setNotice(""); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); } }
  function resetDiscovery() { setGroups(null); setResults(null); setProposal(null); setReceipt(""); setChoices([]); }
  function toggle(memory: Memory) { resetDiscovery(); setPreferences(p => p.some(x => x.memoryId === memory.id) ? p.filter(x => x.memoryId !== memory.id) : p.length < 5 ? [...p, { memoryId: memory.id, query: memory.title.slice(0, 160), type: "movie" }] : p); }
  return <PageContainer className="taste-page">
    <header className="taste-hero"><span className="section-label">REIBRY TASTE · A LITTLE BEYOND THE FAMILIAR</span><h1>Saved inspiration.<br /><em>New discoveries.</em></h1><p>Movie night is this weekend. Find something new through the films and music you already love.</p><div className="taste-tags"><span>Your Memories</span><span>→</span><span>Qloo discovery</span><span>→</span><span>Your Ready Pack</span></div></header>
    <div aria-live="polite">{busy && <StatePanel>Working on your choices…</StatePanel>}{notice && <StatePanel>{notice}</StatePanel>}</div>
    {error && <StatePanel tone="error">{error}{!data && <button className="btn-ghost" onClick={() => run(async () => setData(await api()))}>Retry</button>}</StatePanel>}
    {!data && !error && <StatePanel>Loading your saved inspiration…</StatePanel>}
    {data && <>
      {!data.liveEnabled && <StatePanel>Qloo discovery is not enabled. An approved API key and explicit live-access authorization are required. No sample recommendations are shown.</StatePanel>}
      {!data.persistenceAvailable && <StatePanel>Ready Pack discovery storage is not configured yet. Saving requires the local Taste migration.</StatePanel>}
      <section className="taste-section" aria-labelledby="taste-prefs"><div className="taste-section-heading"><span>01</span><div><h2 id="taste-prefs">Start with what you saved</h2><p>Select up to five Memories, then review the movie or music artist to look up.</p></div></div>
        {!data.memories.length ? <StatePanel>No saved Memories yet. <Link href="/capture">Save some inspiration</Link> to begin.</StatePanel> : <fieldset disabled={busy}><legend className="sr-only">Choose saved Memories</legend><div className="taste-grid">{data.memories.map(memory => <label className="taste-memory" key={memory.id}><input type="checkbox" checked={preferences.some(p => p.memoryId === memory.id)} disabled={!preferences.some(p => p.memoryId === memory.id) && preferences.length >= 5} onChange={() => toggle(memory)} /><span><small>{memory.category || "Saved Memory"}</small><strong>{memory.title}</strong></span></label>)}</div></fieldset>}
        {preferences.length > 0 && <fieldset className="taste-review" disabled={busy}><legend>Confirm the interests you want to share with Qloo</legend><p>Only these short search labels are sent. Edit titles to name a specific film or music artist; your full Memories stay in REIBRY.</p>{preferences.map((p, i) => <div className="taste-preference" key={p.memoryId}><label>Interest {i + 1}<input maxLength={160} value={p.query} onChange={e => { resetDiscovery(); setPreferences(current => current.map(x => x.memoryId === p.memoryId ? { ...x, query: e.target.value } : x)); }} /></label><label>Look for<select value={p.type} onChange={e => { resetDiscovery(); setPreferences(current => current.map(x => x.memoryId === p.memoryId ? { ...x, type: e.target.value as Preference["type"] } : x)); }}><option value="movie">Movie</option><option value="artist">Music artist</option></select></label></div>)}<button className="taste-primary" disabled={!data.liveEnabled || preferences.some(p => !p.query.trim())} onClick={() => run(async () => { resetDiscovery(); const resolved = await api({ operation: "resolve", preferencesConfirmed: true, preferences }); setGroups(resolved.groups); setChoices(resolved.groups.map(() => "")); setReceipt(resolved.receipt); })}>Confirm interests & find matches</button></fieldset>}
      </section>
      {groups && <section className="taste-section" aria-labelledby="taste-matches"><div className="taste-section-heading"><span>02</span><div><h2 id="taste-matches">Is this what you meant?</h2><p>Choose the right match for every interest. Even a single match needs your confirmation.</p></div></div><fieldset disabled={busy || results !== null}>{groups.map((entities, i) => <fieldset key={i}><legend>{preferences[i]?.query}</legend>{!entities.length && <StatePanel>No matches. Correct the search label above and try again.</StatePanel>}{entities.map(entity => <label className="taste-match" key={entity.entity_id}><input type="radio" name={`interest-${i}`} value={entity.entity_id} checked={choices[i] === entity.entity_id} onChange={() => setChoices(c => c.map((x, n) => n === i ? entity.entity_id : x))} /><span><strong>{entity.name}</strong>{entity.properties?.release_year && <span> · {entity.properties.release_year}</span>}<small>{entity.disambiguation}</small><small>{entity.entity_id}</small>{entity.properties?.description && <p>{entity.properties.description.slice(0, 240)}</p>}</span></label>)}</fieldset>)}<button className="taste-primary" disabled={choices.some(x => !x) || new Set(choices).size !== choices.length} onClick={() => run(async () => { const discovered = await api({ operation: "discover", matchesConfirmed: true, receipt, entityIds: choices }); setResults(discovered.candidates); setInterests(discovered.interests); setReceipt(discovered.receipt); })}>Confirm matches & discover movies</button></fieldset>{new Set(choices.filter(Boolean)).size < choices.filter(Boolean).length && <StatePanel>These Memories match the same entity. Keep one of them above.</StatePanel>}</section>}
      {results && <section className="taste-section" aria-labelledby="taste-results"><div className="taste-section-heading"><span>03</span><div><h2 id="taste-results">Something new for movie night</h2><p>Discovered with Qloo, using your confirmed interests: {interests.map(e => e.name).join(", ")}. This is the request context, not a claim about why Qloo ranked each film.</p></div></div>{!results.length && <StatePanel>Qloo returned no new movie recommendations. Try different interests.</StatePanel>}<div className="taste-grid">{results.map(entity => <article className="taste-result" key={entity.entity_id}><span className="taste-badge">Discovered with Qloo</span><h3>{entity.name}</h3>{entity.properties?.release_year && <p>{entity.properties.release_year}</p>}{entity.properties?.description && <p>{entity.properties.description.slice(0, 420)}</p>}<small>Qloo ID: {entity.entity_id}</small><button className="btn-ghost" disabled={busy} onClick={() => { setProposal(entity); setNotice(""); }}>Choose for my Ready Pack</button></article>)}</div></section>}
      {proposal && <section className="taste-confirm" aria-labelledby="taste-confirm"><h2 id="taste-confirm">Add “{proposal.name}” to your plans?</h2><p>This saves one external Qloo discovery in your Ready Pack. It does not create a saved Memory. A new Movie night plan has no date until you set one.</p><label>Destination<select disabled={busy} value={packId} onChange={e => setPackId(e.target.value)}><option value="">Movie night (create or reuse)</option>{data.packs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label><div className="taste-actions"><button className="taste-primary" disabled={busy || !data.persistenceAvailable} onClick={() => run(async () => { const saved = await api({ operation: "save", confirmed: true, receipt, entityId: proposal.entity_id, readyPackId: packId || null }); setProposal(null); setNotice(`Saved ${saved.entity.name} to your Ready Pack.`); setData(await api()); })}>Confirm & save selection</button><button className="btn-ghost" disabled={busy} onClick={() => setProposal(null)}>Cancel</button></div></section>}
      <section className="taste-section"><h2>Your saved discoveries</h2><p>Confirmed choices, kept with your Ready Packs.</p>{!data.saved.length && <p>No discoveries saved yet.</p>}<div className="taste-grid">{data.saved.map(saved => <article className="taste-result" key={saved.id}><span className="taste-badge">Discovered with Qloo · Saved selection</span><h3>{saved.entity.name}</h3><small>{saved.entity.entity_id}</small><Link href={`/plans/${saved.ready_pack_id}`}>Open Ready Pack →</Link></article>)}</div></section>
    </>}
  </PageContainer>;
}

