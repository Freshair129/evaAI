import type { Hit } from './providers/types.js'

/**
 * Structure Template Renderer (Wave 6)
 * 
 * Spec: gks/adrs/ADR--CONTEXT-WINDOW-STRATEGY.md §Stage 6
 */

export interface RenderOptions {
  query: string
  groupBy?: 'type' | 'none'
  showScores?: boolean
}

/**
 * Renders the final [CONTEXT] block from packed hits.
 */
export function renderContext(hits: Hit[], opts: RenderOptions): string {
  if (hits.length === 0) return '[CONTEXT]\nNo relevant knowledge found.\n[END CONTEXT]'

  const lines: string[] = []
  lines.push(`[CONTEXT — retrieved for query: "${opts.query}"]`)
  lines.push('')

  if (opts.groupBy === 'type') {
    const groups = groupBy(hits, h => (h.id.split('--')[0] || 'OTHER'))
    
    // Sort groups by importance
    const order = ['CONCEPT', 'ADR', 'FRAME', 'FLOW', 'ENTITY', 'BLUEPRINT', 'FEAT', 'OTHER']
    for (const type of order) {
      const groupHits = groups.get(type)
      if (groupHits && groupHits.length > 0) {
        lines.push(`### ${type}`)
        groupHits.forEach(h => lines.push(renderHit(h, opts)))
        lines.push('')
      }
    }
  } else {
    hits.forEach(h => {
      lines.push(renderHit(h, opts))
      lines.push('')
    })
  }

  // Relations section (if available in metadata)
  const relations = extractRelations(hits)
  if (relations.length > 0) {
    lines.push('### Relations (graph)')
    relations.forEach(r => lines.push(`- ${r}`))
    lines.push('')
  }

  lines.push('[END CONTEXT]')
  return lines.join('\n')
}

function renderHit(h: Hit, opts: RenderOptions): string {
  const scoreStr = opts.showScores ? ` (score ${h.score.toFixed(2)})` : ''
  const status = (h.meta?.status as string || '').toUpperCase()
  const statusStr = status ? ` [${status}]` : ''
  
  return `- **${h.id}**${scoreStr}${statusStr}\n  ${h.snippet.replace(/\n/g, ' ')}`
}

function groupBy<T, K>(list: T[], keyGetter: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  list.forEach((item) => {
    const key = keyGetter(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return map
}

function extractRelations(hits: Hit[]): string[] {
  const relations = new Set<string>()
  hits.forEach(h => {
    if (h.meta?.relations && Array.isArray(h.meta.relations)) {
      h.meta.relations.forEach((r: any) => {
        relations.add(`${h.id} ${r.type} ${r.target}`)
      })
    }
  })
  return Array.from(relations)
}
