import { z } from 'zod'
import type { Tool, ToolContext, ToolResult, PermissionLevel, SideEffect } from '../types/tool.js'

export type ToolHandler<I, O> = (input: I, ctx: ToolContext) => Promise<ToolResult<O>>

export interface ToolDescriptor<I = unknown> {
  name: string
  description: string
  inputSchema: z.ZodType<I, z.ZodTypeDef, unknown>
  permission: PermissionLevel
  sideEffect: SideEffect
}

const registry = new Map<string, Tool<unknown, unknown>>()

export function registerTool<I, O>(tool: Tool<I, O>): void {
  if (registry.has(tool.name)) {
    throw new Error(`Tool already registered: ${tool.name}`)
  }
  registry.set(tool.name, tool as unknown as Tool<unknown, unknown>)
}

export function getTool(name: string): Tool<unknown, unknown> | undefined {
  return registry.get(name)
}

export function listTools(): Tool<unknown, unknown>[] {
  return Array.from(registry.values())
}

export function describeTools(): Array<{
  name: string
  description: string
  inputSchema: unknown
  permission: PermissionLevel
  sideEffect: SideEffect
}> {
  return listTools().map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToDescriptor(t.inputSchema),
    permission: t.permission,
    sideEffect: t.sideEffect,
  }))
}

export function clearRegistry(): void {
  registry.clear()
}

// Minimal zod → descriptor conversion (just enough to pass to LLM)
function zodToDescriptor(schema: z.ZodType): unknown {
  try {
    const desc = (schema as unknown as { description?: string }).description
    return { description: desc ?? null }
  } catch {
    return {}
  }
}
