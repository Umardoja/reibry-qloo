// Fixed, bounded tool. No saved content is evaluated as instructions.
export { discoverTasteRecommendations } from "../qloo/workflow.ts";
export function isTasteDiscoveryIntent(text: string) {
  return /\b(movie night|film night|qloo|reibry taste)\b/i.test(text) || (/\b(discover|recommend|something new)\b/i.test(text) && /\b(movie|film)\b/i.test(text));
}
export function prepareTasteDiscovery(memories: Array<{ id: string; title: string; category?: string | null }>) {
  const relevant = memories.filter(m => /movie|film|music|cinema|entertainment/i.test(`${m.title} ${m.category || ""}`)).slice(0, 8);
  return { intent: "DISCOVER_TASTE", tool: "discoverTasteRecommendations", requiresPreferenceConfirmation: true, href: "/taste", candidateMemoryIds: relevant.map(m => m.id), message: "Let’s discover a new movie with Qloo. Open REIBRY Taste to choose your saved interests, confirm the entity matches, and review recommendations before saving anything." };
}
