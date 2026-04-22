import type { Hit, Query, ProviderKind } from './providers/types.js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadConfig } from '../config/index.js'

const DEFAULT_WEIGHTS = {
  semantic: 0.45,
  keyword: 0.20,
  graph: 0.20,
  recency: 0.10,
  type: 0.05
}

const STATUS_MULTIPLIERS: Record<string, number> = {
  stub: 0.7,
  raw: 1.0,
  stable: 1.1,
  verified: 1.2,
  deprecated: 0.6
}

const TYPE_BOOSTS: Record<string, Record<string, number>> = {
  explain: { CONCEPT: 1.0, ADR: 0.7, FRAME: 0.8, FLOW: 0.6, ENTITY: 0.5, BLUEPRINT: 0.3, PARAMS: 0.3, FEAT: 0.6, other: 0.2 },
  design: { CONCEPT: 0.6, ADR: 1.0, FRAME: 0.9, FLOW: 0.7, ENTITY: 0.6, BLUEPRINT: 0.4, PARAMS: 0.3, FEAT: 0.5, other: 0.2 },
  code: { CONCEPT: 0.3, ADR: 0.5, FRAME: 0.6, FLOW: 0.6, ENTITY: 0.7, BLUEPRINT: 1.0, PARAMS: 0.8, FEAT: 0.7, other: 0.2 },
  debug: { CONCEPT: 0.4, ADR: 0.6, FRAME: 0.5, FLOW: 1.0, ENTITY: 0.8, BLUEPRINT: 0.6, PARAMS: 0.5, FEAT: 0.7, other: 0.2 },
  search: { CONCEPT: 0.6, ADR: 0.6, FRAME: 0.6, FLOW: 0.6, ENTITY: 0.6, BLUEPRINT: 0.6, PARAMS: 0.6, FEAT: 0.6, other: 0.5 },
  default: { CONCEPT: 0.7, ADR: 0.7, FRAME: 0.7, FLOW: 0.6, ENTITY: 0.5, BLUEPRINT: 0.5, PARAMS: 0.4, FEAT: 0.6, other: 0.2 }
}

interface DocContext {
  id: string
  providerScores: Partial<Record<ProviderKind, number>>
  bestHit: Hit
}

/**
 * rerank — Weighted Sum Reranker (Wave 6)
 * 
 * Final Score = (baseScore * statusMultiplier) * diversityPenalty
 */
export function rerank(providerHits: Hit[][], q: Query): Hit[] {
  if (providerHits.length === 0) return []

  const merged = new Map<string, DocContext>()
  const maxKeywordScore = calculateMaxKeywordScore(providerHits)

  // 1. Merge hits by ID
  providerHits.forEach((hits) => {
    hits.forEach((hit) => {
      const ctx = merged.get(hit.id) || { id: hit.id, providerScores: {}, bestHit: hit }
      
      // Keep best version of the hit (prefer providers with snippets)
      if (hit.snippet && (!ctx.bestHit.snippet || hit.score > ctx.bestHit.score)) {
        ctx.bestHit = hit
      }

      // Normalize and store provider-specific scores
      let score = hit.score
      if (hit.source === 'fts') {
        score = maxKeywordScore > 0 ? hit.score / maxKeywordScore : 0
      } else if (hit.source === 'vector') {
        score = Math.max(0, hit.score) // Clamp negative cosine
      }

      ctx.providerScores[hit.source] = Math.max(ctx.providerScores[hit.source] || 0, score)
      merged.set(hit.id, ctx)
    })
  })

  // 2. Load Graph context if needed
  const graphContext = q.relations?.seedIds?.length ? loadGraphStats() : null

  // 3. Calculate Final Scores
  const rankedHits: Hit[] = Array.from(merged.values()).map(ctx => {
    const sSemantic = ctx.providerScores.vector || 0
    const sKeyword = ctx.providerScores.fts || ctx.providerScores.atomic || 0
    const sGraph = calculateGraphScore(ctx.id, q, graphContext)
    const sRecency = calculateRecencyScore(ctx.bestHit)
    const sType = calculateTypeBoost(ctx.bestHit, q)

    const baseScore = 
      (DEFAULT_WEIGHTS.semantic * sSemantic) +
      (DEFAULT_WEIGHTS.keyword  * sKeyword)  +
      (DEFAULT_WEIGHTS.graph    * sGraph)    +
      (DEFAULT_WEIGHTS.recency  * sRecency)  +
      (DEFAULT_WEIGHTS.type     * sType)

    const status = (ctx.bestHit.meta?.status as string || 'raw').toLowerCase()
    const multiplier = STATUS_MULTIPLIERS[status] || 1.0

    return {
      ...ctx.bestHit,
      score: baseScore * multiplier,
      meta: {
        ...ctx.bestHit.meta,
        scoreBreakdown: { sSemantic, sKeyword, sGraph, sRecency, sType }
      }
    }
  })

  // 4. Sort and apply Diversity Penalty
  rankedHits.sort((a, b) => b.score - a.score)
  applyDiversityPenalty(rankedHits)

  // 5. Final Sort after penalty
  return rankedHits.sort((a, b) => b.score - a.score)
}

function calculateMaxKeywordScore(providerHits: Hit[][]): number {
  let max = 0
  providerHits.forEach(hits => {
    hits.forEach(h => {
      if (h.source === 'fts' && h.score > max) max = h.score
    })
  })
  return max
}

function calculateGraphScore(id: string, q: Query, stats: any): number {
  if (!q.relations?.seedIds?.length) return 0
  
  const seeds = q.relations.seedIds
  let directLink = 0
  if (seeds.includes(id)) directLink = 1.0 // It IS a seed
  // TODO: More sophisticated graph scoring when T8a is implemented
  
  return directLink * 0.6 // Simplified for now
}

function calculateRecencyScore(hit: Hit): number {
  const lastUpdated = hit.meta?.last_updated as string || hit.meta?.mtime as string
  if (!lastUpdated) return 0.8 // Default for unknown

  const ageInDays = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
  const lambda = 0.02
  return Math.exp(-lambda * Math.max(0, ageInDays))
}

function calculateTypeBoost(hit: Hit, q: Query): number {
  const intent = (q.mode as string) || 'default'
  const type = hit.id.split('--')[0] || 'other'
  
  const intentBoosts = TYPE_BOOSTS[intent] || TYPE_BOOSTS.default
  return intentBoosts[type] || intentBoosts.other
}

function applyDiversityPenalty(hits: Hit[]) {
  const selected: Hit[] = []
  const threshold = 0.9
  const penalty = 0.7

  for (const hit of hits) {
    let tooSimilar = false
    // Since we don't always have embeddings here, we might skip this or use ID-based similarity
    // In a real implementation, we'd use the vector provider or cached embeddings
    if (hit.source === 'vector') {
      for (const s of selected) {
        // Mock cosine check - in reality this would use vector math
        if (hit.meta?.cluster === s.meta?.cluster && hit.meta?.cluster !== undefined) {
          tooSimilar = true
          break
        }
      }
    }

    if (tooSimilar) {
      hit.score *= penalty
    }
    selected.push(hit)
  }
}

function loadGraphStats(): any {
  // Placeholder for T8a
  return null
}
