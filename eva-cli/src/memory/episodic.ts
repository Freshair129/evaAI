import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { EpisodicMemory } from '../types/memory.js'
import { loadConfig } from '../config/index.js'
import { parseFrontmatter } from './frontmatter.js'

function memoryDir(): string {
  return loadConfig().paths.memoryDir
}

export function writeEpisodic(memory: EpisodicMemory): string {
  const dir = memoryDir()
  mkdirSync(dir, { recursive: true })
  const filename = `${memory.sessionId}.md`
  const path = resolve(dir, filename)

  const frontmatter = [
    '---',
    `id: "SESS--${memory.sessionId}"`,
    `session_id: "${memory.sessionId}"`,
    `started_at: "${memory.startedAt}"`,
    `ended_at: "${memory.endedAt}"`,
    `duration_min: ${memory.durationMin}`,
    `tokens_total: ${memory.tokensTotal}`,
    `cost_usd: ${memory.costUsd}`,
    `tags: [${memory.tags.map((t) => `"${t}"`).join(', ')}]`,
    `linked_atoms: [${memory.linkedAtoms.map((a) => `"${a}"`).join(', ')}]`,
    `emotion_summary: "${memory.emotionSummary.replace(/"/g, '\\"')}"`,
    `outcomes:`,
    ...memory.outcomes.map((o) => `  - "${o.replace(/"/g, '\\"')}"`),
    '---',
    '',
    memory.summary,
    '',
  ].join('\n')

  writeFileSync(path, frontmatter)
  return path
}

export function readEpisodic(sessionId: string): EpisodicMemory | null {
  const path = resolve(memoryDir(), `${sessionId}.md`)
  if (!existsSync(path)) return null

  const content = readFileSync(path, 'utf8')
  const { frontmatter, body } = parseFrontmatter(content)

  return {
    sessionId: String(frontmatter.session_id ?? sessionId),
    startedAt: String(frontmatter.started_at ?? ''),
    endedAt: String(frontmatter.ended_at ?? ''),
    durationMin: Number(frontmatter.duration_min ?? 0),
    tokensTotal: Number(frontmatter.tokens_total ?? 0),
    costUsd: Number(frontmatter.cost_usd ?? 0),
    tags: Array.isArray(frontmatter.tags) ? (frontmatter.tags as string[]) : [],
    linkedAtoms: Array.isArray(frontmatter.linked_atoms)
      ? (frontmatter.linked_atoms as string[])
      : [],
    emotionSummary: String(frontmatter.emotion_summary ?? ''),
    outcomes: Array.isArray(frontmatter.outcomes) ? (frontmatter.outcomes as string[]) : [],
    summary: body.trim(),
  }
}

export function listEpisodic(): string[] {
  const dir = memoryDir()
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort()
}
