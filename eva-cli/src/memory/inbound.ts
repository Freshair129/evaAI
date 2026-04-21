import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { loadConfig } from '../config/index.js'

export interface InboundArtifact {
  kind: 'idea' | 'concept' | 'adr' | 'flow' | 'entity' | 'feat' | 'params'
  id: string
  content: string
  reviewer?: string
  notes?: string
}

export interface InboundResult {
  path: string
  reviewId: string
}

export function proposeInbound(artifact: InboundArtifact): InboundResult {
  const cfg = loadConfig()
  const dir = resolve(cfg.paths.inboundDir)
  mkdirSync(dir, { recursive: true })

  const reviewId = `REV-${Date.now()}-${randomUUID().slice(0, 8)}`
  const filename = `${artifact.id}.md`
  const path = resolve(dir, filename)

  if (existsSync(path)) {
    throw new Error(`Inbound artifact already exists: ${path}`)
  }

  const header = [
    `<!-- inbound review: ${reviewId} -->`,
    `<!-- kind: ${artifact.kind} -->`,
    artifact.reviewer ? `<!-- reviewer: ${artifact.reviewer} -->` : '',
    artifact.notes ? `<!-- notes: ${artifact.notes} -->` : '',
    '',
  ]
    .filter(Boolean)
    .join('\n')

  writeFileSync(path, header + artifact.content)
  return { path, reviewId }
}
