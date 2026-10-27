export function providerPolicy(env: { NODE_ENV?: string; AI_PROVIDER?: string; AI_ALLOW_MOCK_FALLBACK?: string }, allowFallback = true) {
  const provider = env.AI_PROVIDER || (env.NODE_ENV === "production" ? "" : "mock");
  if (!["mock", "nvidia", "gemini"].includes(provider) || (env.NODE_ENV === "production" && provider === "mock")) throw new Error("AI provider unavailable or not configured");
  return { provider, fallbackEnabled: env.NODE_ENV !== "production" && allowFallback && env.AI_ALLOW_MOCK_FALLBACK === "true" };
}
