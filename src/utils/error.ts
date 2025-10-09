// utils/error.ts
export function extractDirectionsMessage(err: unknown): string {
  // 1) common API shapes
  const any = err as any;
  if (any?.response?.data?.message) return String(any.response.data.message);
  if (any?.data?.message) return String(any.data.message);
  if (any?.cause?.message) return String(any.cause.message);

  // 2) plain Error with JSON at the end:
  const msg = typeof err === "string" ? err : String(any?.message ?? err);
  const jsonTail = msg.match(/\{.*\}$/)?.[0];
  if (jsonTail) {
    try {
      const j = JSON.parse(jsonTail);
      if (j?.message) return String(j.message);
    } catch {
      /* ignore */
    }
  }
  return msg || "Unknown error";
}
