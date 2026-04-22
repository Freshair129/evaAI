import type { Hit, Query } from './providers/types.js'
import { calculateDensity } from './density.js'
import { summarize } from './summarizer.js'
import { renderContext } from './structure-template.js'

/**
 * Context Packer Pipeline (Wave 6)
 * 
 * Orchestrates the 6-stage optimization pipeline.
 * 
 * Spec: gks/adrs/ADR--CONTEXT-WINDOW-STRATEGY.md
 */

export interface PackOptions {
  totalBudget?: number
  modelName?: string
}

export interface PackedResult {
  content: string
  tokenCount: number
  stats: {
    originalHits: number
    packedHits: number
    summarizedCount: number
    mergedCount: number
  }
}

/**
 * Packs ranked hits into a structured context string within token budget.
 */
export async function packContext(hits: Hit[], q: Query, opts: PackOptions = {}): Promise<PackedResult> {
  // Stage 1: Budget Split
  const budget = calculateBudget(opts)
  
  // Stage 2: Top-K per Type (assumed handled by reranker, but we filter here too)
  let selected = filterByTypeCaps(hits, q)

  // Stage 3: Information Density (Re-sort if near budget limit)
  const currentTokens = selected.reduce((sum, h) => sum + Math.ceil(h.snippet.length / 4), 0)
  if (currentTokens > budget * 0.8) {
    selected = sortByDensityContribution(selected)
  }

  // Stage 4: Summarization
  let summarizedCount = 0
  const processedHits = await Promise.all(selected.map(async (h) => {
    const tokens = Math.ceil(h.snippet.length / 4)
    if (tokens > 800) {
      summarizedCount++
      const summary = await summarize(h.snippet, { query: q.text })
      return { ...h, snippet: summary }
    }
    return h
  }))

  // Stage 5: Dedup / Merge
  // Simplified: already partially handled by reranker diversity penalty
  const finalHits: Hit[] = []
  let tokensUsed = 0
  for (const h of processedHits) {
    const hTokens = Math.ceil(h.snippet.length / 4)
    if (tokensUsed + hTokens <= budget) {
      finalHits.push(h)
      tokensUsed += hTokens
    }
  }

  // Stage 6: Structure
  const content = renderContext(finalHits, { 
    query: q.text, 
    groupBy: 'type', 
    showScores: true 
  })

  return {
    content,
    tokenCount: Math.ceil(content.length / 4),
    stats: {
      originalHits: hits.length,
      packedHits: finalHits.length,
      summarizedCount,
      mergedCount: 0
    }
  }
}

function calculateBudget(opts: PackOptions): number {
  // Defaults from ADR
  const total = opts.totalBudget || 8000
  if (total > 100000) return total - 30000 // Large model reserve
  return 5000 // Default context budget for 8k model
}

function filterByTypeCaps(hits: Hit[], q: Query): Hit[] {
  const caps: Record<string, number> = {
    CONCEPT: 3, ADR: 2, FRAME: 2, FLOW: 2, ENTITY: 2, BLUEPRINT: 2, FEAT: 2, other: 1
  }

  // Intent override
  const intent = (q.mode as string) || 'default'
  if (intent === 'code') { caps.BLUEPRINT = 4; caps.CONCEPT = 1 }
  else if (intent === 'design') { caps.ADR = 4; caps.FRAME = 3 }

  const result: Hit[] = []
  const counts: Record<string, number> = {}

  for (const h of hits) {
    const type = h.id.split('--')[0] || 'other'
    counts[type] = (counts[type] || 0) + 1
    if (counts[type] <= (caps[type] || caps.other)) {
      result.push(h)
    }
  }
  return result
}

function sortByDensityContribution(hits: Hit[]): Hit[] {
  return [...hits].sort((a, b) => {
    const da = calculateDensity(a.snippet).density
    const db = calculateDensity(b.snippet).density
    return db - da
  })
}
