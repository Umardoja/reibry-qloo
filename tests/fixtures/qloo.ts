// Hand-authored synthetic protocol fixtures. NOT recordings of live Qloo output.
export const userId = "00000000-0000-4000-8000-000000000001";
export const otherUserId = "00000000-0000-4000-8000-000000000002";
export const memoryId = "00000000-0000-4000-8000-000000000003";
export const packId = "00000000-0000-4000-8000-000000000004";
export const movie = { entity_id: "10000000-0000-4000-8000-000000000001", name: "Synthetic Seed Film", types: ["urn:entity:movie"], properties: { release_year: 2001, description: "Synthetic fixture description." } };
export const ambiguous = { ...movie, entity_id: "10000000-0000-4000-8000-000000000002", name: "Synthetic Seed Film (remake)" };
export const recommendation = { ...movie, entity_id: "10000000-0000-4000-8000-000000000003", name: "Synthetic Discovery" };
export const artist = { entity_id: "10000000-0000-4000-8000-000000000004", name: "Synthetic Artist", types: ["urn:entity:artist"] };
