/** Only local paths are allowed back in; an absolute URL is not a destination. */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}
