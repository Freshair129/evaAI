import { parse as parseYaml } from 'yaml'

export interface FrontmatterResult {
  frontmatter: Record<string, unknown>
  body: string
}

const FM_REGEX = /^---\s*\n([\s\S]*?)\n---\s*(?:\n([\s\S]*))?$/

export function parseFrontmatter(content: string): FrontmatterResult {
  const match = content.match(FM_REGEX)
  if (!match) return { frontmatter: {}, body: content }

  try {
    const fm = (parseYaml(match[1] ?? '') as Record<string, unknown>) ?? {}
    return { frontmatter: fm, body: match[2] ?? '' }
  } catch {
    return { frontmatter: {}, body: match[2] ?? content }
  }
}

export function stripQuotes(value: unknown): string {
  if (typeof value !== 'string') return String(value ?? '')
  return value.replace(/^["']|["']$/g, '')
}
