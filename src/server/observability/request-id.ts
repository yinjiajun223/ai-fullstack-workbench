export function createRequestId(prefix = "req"): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
