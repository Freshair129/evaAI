/**
 * Bot runtime operates with a restricted tool set:
 * - Read-only knowledge & filesystem queries are allowed.
 * - Write / Edit / Bash / GksPropose / ObsidianLink are denied regardless of
 *   permission mode (defense in depth — the bot has no UI to confirm).
 */

export const BOT_ALLOWED_TOOLS: readonly string[] = [
  'Read',
  'Glob',
  'Grep',
  'GksSearch',
  'GksLookup',
  'ObsidianSearch',
  'GitStatus',
  'GitDiff',
]

export const BOT_DENIED_TOOLS: readonly string[] = [
  'Write',
  'Edit',
  'Bash',
  'GksPropose',
  'ObsidianLink',
]

export function isToolAllowedInBot(toolName: string): boolean {
  if (BOT_DENIED_TOOLS.includes(toolName)) return false
  if (BOT_ALLOWED_TOOLS.includes(toolName)) return true
  // Unknown tool → deny by default
  return false
}
