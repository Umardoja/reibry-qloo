import "server-only";
import { createQlooClient, QlooError } from "./client";

export function qlooClient() {
  if (process.env.QLOO_LIVE_ENABLED !== "true") throw new QlooError("QLOO_LIVE_NOT_AUTHORIZED");
  return createQlooClient({ key: process.env.QLOO_API_KEY, timeoutMs: Number(process.env.QLOO_TIMEOUT_MS || 8000) });
}
export function qlooReceiptSecret() {
  const key = process.env.QLOO_RECEIPT_SECRET;
  if (!key || key.length < 32 || key.startsWith("replace_")) throw new QlooError("QLOO_NOT_CONFIGURED");
  return key;
}
