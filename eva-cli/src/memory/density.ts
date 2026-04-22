import type { Hit } from './providers/types.js'

/**
 * Information Density Scorer (Wave 6)
 * 
 * density = info_units / token_count
 * 
 * Spec: gks/adrs/ADR--CONTEXT-WINDOW-STRATEGY.md §Stage 3
 */

export interface DensityMetrics {
  infoUnits: number
  tokenCount: number
  density: number
}

/**
 * Calculate information density for a given text snippet or full document body.
 */
export function calculateDensity(text: string): DensityMetrics {
  if (!text) return { infoUnits: 0, tokenCount: 0, density: 0 }

  const infoUnits = estimateInfoUnits(text)
  const tokenCount = estimateTokens(text)
  const density = tokenCount > 0 ? infoUnits / tokenCount : 0

  return { infoUnits, tokenCount, density }
}

/**
 * estimateInfoUnits — Heuristic to count "atomic facts"
 * count(headings) * 1.5 + count(list_items) * 1.0 + count(code_blocks) * 2.0 + ...
 */
function estimateInfoUnits(text: string): number {
  let score = 0

  // 1. Headings (#)
  const headings = (text.match(/^#+ /gm) || []).length
  score += headings * 1.5

  // 2. List items (*, -, 1.)
  const listItems = (text.match(/^[*-] /gm) || []).length + (text.match(/^\d+\. /gm) || []).length
  score += listItems * 1.0

  // 3. Code blocks (```)
  const codeBlocks = (text.match(/```/g) || []).length / 2
  score += codeBlocks * 2.0

  // 4. Tables (|...|)
  const tables = (text.match(/^\|/gm) || []).length / 2 // Approximate rows/2
  score += tables * 3.0

  // 5. ID References ([[TYPE--ID]])
  const idRefs = (text.match(/\[\[[A-Z0-9_-]+\]\]/g) || []).length
  score += idRefs * 0.5

  // 6. Body paragraphs
  const paragraphs = text.split(/\n\n+/).filter(Boolean).length
  score += Math.log(paragraphs + 1) * 2.0

  return score
}

/**
 * estimateTokens — Approx 4 chars per token for English, ~1-2 for Thai
 * Simplified: length / 4 as base, adjusted for script
 */
function estimateTokens(text: string): number {
  // Rough adjustment: Thai characters take more tokens per length in some models
  // but for simplicity we'll follow the ADR's length/4
  return Math.ceil(text.length / 4)
}

/**
 * Rank hits by density to find the "best value" hits
 */
export function sortByDensity(hits: Hit[]): Hit[] {
  return [...hits].sort((a, b) => {
    const da = calculateDensity(a.snippet).density
    const db = calculateDensity(b.snippet).density
    return db - da
  })
}
