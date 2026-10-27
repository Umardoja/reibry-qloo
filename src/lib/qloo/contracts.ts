import { z } from "zod";

export const entitySchema = z.object({
  entity_id: z.uuid().transform(id => id.toLowerCase()), name: z.string().trim().min(1).max(500),
  types: z.array(z.string().max(100)).max(30),
  disambiguation: z.string().max(1000).optional(),
  properties: z.object({ description: z.string().max(20000).optional(), release_year: z.union([z.number(), z.string()]).optional() }).optional(),
});
// Qloo Insights documents type/subtype; search can return the types array.
export const wireEntitySchema = entitySchema.extend({
  types: z.array(z.string().max(100)).max(30).optional(),
  subtype: z.string().max(100).optional(),
  disambiguation: z.string().max(1000).optional(),
}).refine(entity => Boolean(entity.subtype || entity.types?.length), "Entity type is required")
  .transform(entity => entitySchema.parse({ ...entity, ...(entity.properties ? { properties: { ...entity.properties, ...(entity.properties.description ? { description: entity.properties.description.slice(0, 1200) } : {}) } } : {}), types: entity.subtype ? [entity.subtype] : entity.types }));
export type QlooEntity = z.infer<typeof entitySchema>;
export const interestType = z.enum(["movie", "artist"]);
export const searchInput = z.object({ query: z.string().trim().min(1).max(160), type: interestType }).strict();
export const insightsInput = z.object({
  filterType: z.literal("urn:entity:movie"),
  entityIds: z.array(z.uuid()).min(1).max(5).refine(ids => new Set(ids).size === ids.length),
}).strict();
export const preferenceSchema = z.object({ memoryId: z.uuid(), query: searchInput.shape.query, type: interestType }).strict();
export const tasteRequest = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("resolve"), preferencesConfirmed: z.literal(true), preferences: z.array(preferenceSchema).min(1).max(5).refine(p => new Set(p.map(x => x.memoryId)).size === p.length) }).strict(),
  z.object({ operation: z.literal("discover"), matchesConfirmed: z.literal(true), receipt: z.string().max(100000), entityIds: insightsInput.shape.entityIds }).strict(),
  z.object({ operation: z.literal("save"), confirmed: z.literal(true), receipt: z.string().max(100000), entityId: z.uuid(), readyPackId: z.uuid().nullable() }).strict(),
]);
export type TasteRequest = z.infer<typeof tasteRequest>;
