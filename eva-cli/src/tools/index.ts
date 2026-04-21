import { registerTool, listTools, getTool, clearRegistry, describeTools } from './registry.js'
import { readTool } from './fs/read.js'
import { writeTool } from './fs/write.js'
import { editTool } from './fs/edit.js'
import { globTool } from './fs/glob.js'
import { grepTool } from './fs/grep.js'
import { bashTool } from './bash.js'
import { gksSearchTool } from './knowledge/gks-search.js'
import { gksLookupTool } from './knowledge/gks-lookup.js'
import { gksProposeTool } from './knowledge/gks-propose.js'
import { obsidianSearchTool } from './knowledge/obsidian-search.js'
import type { Tool } from './types.js'

let bootstrapped = false

export function bootstrapTools(): void {
  if (bootstrapped) return
  const defaults: Tool<unknown, unknown>[] = [
    readTool as unknown as Tool<unknown, unknown>,
    writeTool as unknown as Tool<unknown, unknown>,
    editTool as unknown as Tool<unknown, unknown>,
    globTool as unknown as Tool<unknown, unknown>,
    grepTool as unknown as Tool<unknown, unknown>,
    bashTool as unknown as Tool<unknown, unknown>,
    gksSearchTool as unknown as Tool<unknown, unknown>,
    gksLookupTool as unknown as Tool<unknown, unknown>,
    gksProposeTool as unknown as Tool<unknown, unknown>,
    obsidianSearchTool as unknown as Tool<unknown, unknown>,
  ]
  for (const t of defaults) registerTool(t)
  bootstrapped = true
}

export function resetTools(): void {
  clearRegistry()
  bootstrapped = false
}

export {
  registerTool,
  listTools,
  getTool,
  clearRegistry,
  describeTools,
  readTool,
  writeTool,
  editTool,
  globTool,
  grepTool,
  bashTool,
  gksSearchTool,
  gksLookupTool,
  gksProposeTool,
  obsidianSearchTool,
}

export { writeAudit, hashArgs } from './audit.js'
export { markRead, hasRead, clearReadsForSession } from './fs/read-tracker.js'
