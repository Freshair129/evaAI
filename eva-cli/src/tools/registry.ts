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
    inputSchema: zodToJsonSchema(t.inputSchema),
    permission: t.permission,
    sideEffect: t.sideEffect,
  }))
}

export function clearRegistry(): void {
  registry.clear()
}

// ── Zod → JSON Schema (subset: object, string, number, boolean, array, optional, enum) ──
export function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return convertNode(schema)
}

function convertNode(schema: z.ZodType): Record<string, unknown> {
  const inner = unwrap(schema)

  if (inner instanceof z.ZodObject) {
    const shape = inner.shape as Record<string, z.ZodType>
    const properties: Record<string, unknown> = {}
    const required: string[] = []

    for (const [key, val] of Object.entries(shape)) {
      const isOptional = val instanceof z.ZodOptional || val instanceof z.ZodDefault
      properties[key] = convertNode(val)
      if (!isOptional) required.push(key)
    }

    const out: Record<string, unknown> = { type: 'object', properties }
    if (required.length) out.required = required
    if (inner.description) out.description = inner.description
    return out
  }

  if (inner instanceof z.ZodString) {
    const out: Record<string, unknown> = { type: 'string' }
    if (inner.description) out.description = inner.description
    return out
  }

  if (inner instanceof z.ZodNumber) {
    const out: Record<string, unknown> = { type: 'number' }
    if (inner.description) out.description = inner.description
    return out
  }

  if (inner instanceof z.ZodBoolean) {
    const out: Record<string, unknown> = { type: 'boolean' }
    if (inner.description) out.description = inner.description
    return out
  }

  if (inner instanceof z.ZodArray) {
    const out: Record<string, unknown> = {
      type: 'array',
      items: convertNode(inner.element),
    }
    if (inner.description) out.description = inner.description
    return out
  }

  if (inner instanceof z.ZodEnum) {
    const values = (inner as z.ZodEnum<[string, ...string[]]>).options
    const out: Record<string, unknown> = { type: 'string', enum: values }
    if (inner.description) out.description = inner.description
    return out
  }

  if (inner instanceof z.ZodLiteral) {
    return { const: (inner as z.ZodLiteral<unknown>).value }
  }

  if (inner instanceof z.ZodUnion) {
    const members = (inner as z.ZodUnion<[z.ZodType, ...z.ZodType[]]>).options
    return { anyOf: members.map((m: z.ZodType) => convertNode(m)) }
  }

  // Fallback
  return { type: 'object' }
}

// Unwrap Optional / Default / Describe wrappers
function unwrap(schema: z.ZodType): z.ZodType {
  if (schema instanceof z.ZodOptional) return unwrap(schema.unwrap())
  if (schema instanceof z.ZodDefault) return unwrap(schema.removeDefault())
  if (schema instanceof z.ZodNullable) return unwrap(schema.unwrap())
  if (schema instanceof z.ZodBranded) return unwrap((schema as unknown as { _def: { type: z.ZodType } })._def.type)
  return schema
}
