import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { entitySchema } from "./contracts.ts";

const receiptSchema = z.object({
  userId: z.uuid(), stage: z.enum(["resolved", "discovered"]), expires: z.number(),
  memoryIds: z.array(z.uuid()).min(1).max(5),
  groups: z.array(z.array(entitySchema).max(5)).max(5),
  interests: z.array(entitySchema).max(5), candidates: z.array(entitySchema).max(8),
  provenance: z.literal("qloo-live"),
}).strict();
export type Receipt = z.infer<typeof receiptSchema>;
export function signReceipt(value: Receipt, secret: string) {
  const payload = Buffer.from(JSON.stringify(receiptSchema.parse(value))).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function verifyReceipt(token: string, secret: string, userId: string, stage: Receipt["stage"], now = Date.now()) {
  if (token.length > 100000) throw new Error("Invalid receipt");
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) throw new Error("Invalid receipt");
  const expected = createHmac("sha256", secret).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("Invalid receipt");
  const value = receiptSchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString()));
  if (value.userId !== userId || value.stage !== stage || value.expires <= now) throw new Error("Expired or invalid receipt");
  return value;
}
