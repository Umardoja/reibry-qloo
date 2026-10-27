"use client";
import { useEffect, useState } from "react";
import type { QlooEntity } from "@/lib/qloo/contracts";

export function TasteDiscoveries({ packId }: { packId: string }) {
  const [items, setItems] = useState<Array<{ id: string; entity: QlooEntity }>>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/taste", { cache: "no-store", signal: AbortSignal.timeout(12000) }).then(async response => {
      if (!response.ok) throw new Error();
      const body = await response.json();
      if (active) { setError(!body.data.persistenceAvailable); setItems(body.data.saved.filter((item: { ready_pack_id: string }) => item.ready_pack_id === packId)); }
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [packId]);
  return <section className="ready-pack-overview" aria-label="Qloo discoveries"><h2>Discovered with Qloo</h2>{error ? <p role="status">Saved discoveries could not be loaded.</p> : items.length ? items.map(item => <article key={item.id}><h3>{item.entity.name}</h3><p>External movie selection · Qloo ID: {item.entity.entity_id}</p></article>) : <p>No external discoveries in this pack.</p>}<a href="/taste">Explore REIBRY Taste →</a></section>;
}
