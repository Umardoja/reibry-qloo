export async function withDeadline<T>(operation: Promise<T>, timeoutMs = 12000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Session check timed out")), timeoutMs); })]);
  } finally { clearTimeout(timer); }
}
