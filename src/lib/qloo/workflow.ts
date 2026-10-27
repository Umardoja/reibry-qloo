import { tasteRequest, type QlooEntity } from "./contracts.ts";
import { signReceipt, verifyReceipt, type Receipt } from "./receipts.ts";

export interface TasteDependencies {
  userId: string; secret: string;
  ownedMemoryIds(ids: string[]): Promise<string[]>;
  search(input: { query: string; type: "movie" | "artist" }): Promise<QlooEntity[]>;
  insights(input: { filterType: "urn:entity:movie"; entityIds: string[] }): Promise<QlooEntity[]>;
  save(input: { readyPackId: string | null; entity: QlooEntity; interests: QlooEntity[]; memoryIds: string[] }): Promise<string>;
}
export class TasteValidationError extends Error {}
export async function discoverTasteRecommendations(raw: unknown, dependencies: TasteDependencies) {
  const input = tasteRequest.parse(raw);
  const { userId, secret } = dependencies;
  async function requireOwnership(ids: string[]) {
    const owned = new Set(await dependencies.ownedMemoryIds(ids));
    if (ids.some(id => !owned.has(id))) throw new TasteValidationError("Selected Memories are no longer available.");
  }
  if (input.operation === "resolve") {
    const memoryIds = input.preferences.map(p => p.memoryId);
    await requireOwnership(memoryIds);
    // Saved text is never an instruction. Only user-reviewed short labels leave REIBRY.
    const groups = [];
    for (const preference of input.preferences) groups.push(await dependencies.search({ query: preference.query, type: preference.type }));
    const receipt: Receipt = { userId, stage: "resolved", expires: Date.now() + 15 * 60000, memoryIds, groups, interests: [], candidates: [], provenance: "qloo-live" };
    return { stage: "resolved" as const, groups, receipt: signReceipt(receipt, secret) };
  }
  let receipt: Receipt;
  try { receipt = verifyReceipt(input.receipt, secret, userId, input.operation === "discover" ? "resolved" : "discovered"); }
  catch { throw new TasteValidationError("These choices expired or changed. Start discovery again."); }
  await requireOwnership(receipt.memoryIds);
  if (input.operation === "discover") {
    if (input.entityIds.length !== receipt.groups.length || input.entityIds.some((id, index) => !receipt.groups[index].some(e => e.entity_id === id))) throw new TasteValidationError("Confirm one matching entity for each interest.");
    const interests = input.entityIds.map((id, index) => receipt.groups[index].find(e => e.entity_id === id)!);
    const candidates = await dependencies.insights({ filterType: "urn:entity:movie", entityIds: input.entityIds });
    return { stage: "discovered" as const, candidates, interests, provenance: "qloo-live" as const, receipt: signReceipt({ ...receipt, stage: "discovered", groups: [], interests, candidates, expires: Date.now() + 15 * 60000 }, secret) };
  }
  const entity = receipt.candidates.find(e => e.entity_id === input.entityId);
  if (!entity) throw new TasteValidationError("Choose a recommendation returned by Qloo.");
  const readyPackId = await dependencies.save({ readyPackId: input.readyPackId, entity, interests: receipt.interests, memoryIds: receipt.memoryIds });
  return { stage: "saved" as const, readyPackId, entity };
}
