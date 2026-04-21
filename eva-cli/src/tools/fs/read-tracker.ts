/**
 * Tracks which files have been Read in the current session.
 * Write/Edit tools require a prior Read of the same path
 * to prevent blind overwrites (same policy as Claude Code).
 */
const readSet = new Map<string, Set<string>>()

export function markRead(sessionId: string, path: string): void {
  let set = readSet.get(sessionId)
  if (!set) {
    set = new Set()
    readSet.set(sessionId, set)
  }
  set.add(path)
}

export function hasRead(sessionId: string, path: string): boolean {
  return readSet.get(sessionId)?.has(path) ?? false
}

export function clearReadsForSession(sessionId: string): void {
  readSet.delete(sessionId)
}
