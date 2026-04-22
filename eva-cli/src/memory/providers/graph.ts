import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadConfig } from '../../config/index.js'
import type { 
  RetrievalProvider, 
  Query, 
  Hit, 
  Capability, 
  ProviderHealth, 
  SearchOpts,
  ProviderKind
} from './types.js'

interface Edge {
  from: string
  to: string
  type: string
}

/**
 * BacklinkGraphProvider — Relation-based traversal.
 * 
 * Backed by backlinks.jsonl (from -> to) and backref.jsonl (to -> from).
 * 
 * Spec: gks/adrs/ADR--HYBRID-RETRIEVAL.md §Provider D: BacklinkGraphProvider
 */
export class BacklinkGraphProvider implements RetrievalProvider {
  readonly kind: ProviderKind = 'graph'
  readonly cost = 'O(1)' // Lookup cost per seed

  private forward = new Map<string, Edge[]>()
  private backward = new Map<string, Edge[]>()
  private loaded = false

  capability(q: Query): Capability {
    // Graph provider only activates if relations are specified
    if (q.relations?.seedIds && q.relations.seedIds.length > 0) {
      return 'definite_hit'
    }
    if (q.mode === 'graph') return 'may_hit'
    return 'miss'
  }

  async search(q: Query, _opts?: SearchOpts): Promise<Hit[]> {
    this.ensureLoaded()
    
    const seeds = q.relations?.seedIds ?? []
    if (seeds.length === 0) return []

    const results = new Map<string, Hit>()
    const depth = q.relations?.depth ?? 1
    const expandBacklinks = q.relations?.expandBacklinks ?? true
    const expandForwardlinks = q.relations?.expandForwardlinks ?? false

    for (const seed of seeds) {
      this.traverse(seed, depth, expandBacklinks, expandForwardlinks, results)
    }

    // Remove seeds from results to avoid duplication if they were already in context
    for (const seed of seeds) {
      results.delete(seed)
    }

    return Array.from(results.values())
  }

  async health(): Promise<ProviderHealth> {
    try {
      this.ensureLoaded()
      return { ok: true, message: `Graph loaded with ${this.forward.size} nodes` }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) }
    }
  }

  private ensureLoaded() {
    if (this.loaded) return
    
    const cfg = loadConfig()
    const vectorDir = resolve(cfg.paths.vectorDir)
    
    const backlinksPath = resolve(vectorDir, 'backlinks.jsonl')
    const backrefPath = resolve(vectorDir, 'backref.jsonl')

    if (existsSync(backlinksPath)) {
      this.loadEdges(backlinksPath, this.forward)
    }
    if (existsSync(backrefPath)) {
      this.loadEdges(backrefPath, this.backward)
    }

    this.loaded = true
  }

  private loadEdges(path: string, map: Map<string, Edge[]>) {
    const content = readFileSync(path, 'utf8')
    content.split('\n').filter(Boolean).forEach(line => {
      try {
        const edge = JSON.parse(line) as Edge
        
        const keyForMap = edge.from && path.includes('backlinks') ? edge.from : edge.to
        
        let list = map.get(keyForMap)
        if (!list) {
          list = []
          map.set(keyForMap, list)
        }
        list.push(edge)
      } catch {
        // skip malformed lines
      }
    })
  }

  private traverse(
    currentId: string, 
    depth: number, 
    back: boolean, 
    forward: boolean, 
    results: Map<string, Hit>,
    visited = new Set<string>()
  ) {
    if (depth <= 0 || visited.has(currentId)) return
    visited.add(currentId)

    // Expand forward (outbound links)
    if (forward) {
      const edges = this.forward.get(currentId) ?? []
      for (const edge of edges) {
        this.addResult(edge.to, edge.type, 'forward', results)
        this.traverse(edge.to, depth - 1, back, forward, results, visited)
      }
    }

    // Expand backward (inbound links / backlinks)
    if (back) {
      const edges = this.backward.get(currentId) ?? []
      for (const edge of edges) {
        this.addResult(edge.from, edge.type, 'backward', results)
        this.traverse(edge.from, depth - 1, back, forward, results, visited)
      }
    }
  }

  private addResult(id: string, type: string, direction: 'forward' | 'backward', results: Map<string, Hit>) {
    const existing = results.get(id)
    if (existing) return

    results.set(id, {
      source: this.kind,
      id: id,
      score: 0.5, // Base score for related items
      snippet: `[Related via ${direction} ${type}]`,
      evidence: {
        graphDistance: 1 // For now, only 1-hop results are easily tracked here
      },
      meta: {
        relationType: type,
        direction: direction
      }
    })
  }
}
