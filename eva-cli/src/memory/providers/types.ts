/**
 * RetrievalProvider interface + shared types for hybrid retrieval.
 *
 * Spec: gks/adrs/ADR--HYBRID-RETRIEVAL.md §Provider contracts
 * Task: gks/14_devlog/task/MSP-TSK-260421001-001.md
 *
 * These types exist independently of src/types/memory.ts (which has
 * the older RetrievalQuery/Hit shapes). During Wave 5 migration, the
 * two will be reconciled; for now both coexist to preserve backward
 * compat with MemoryStore.retrieve().
 */

export type ProviderKind = 'atomic' | 'fts' | 'vector' | 'graph'

export type QueryMode = 'auto' | 'exact' | 'keyword' | 'semantic' | 'graph' | 'explain' | 'design' | 'code' | 'debug' | 'search'

export type Capability = 'miss' | 'may_hit' | 'definite_hit'

export interface QueryFilters {
  phase?: number | undefined
  type?: string | undefined
  status?: string | undefined
  scope?: 'project' | 'global' | 'all' | undefined
  tags?: string[] | undefined
}

export interface QueryRelations {
  seedIds?: string[] | undefined
  expandBacklinks?: boolean | undefined
  expandForwardlinks?: boolean | undefined
  depth?: number | undefined
}

export interface QueryBudget {
  maxHits?: number | undefined
  maxLatencyMs?: number | undefined
}

export interface Query {
  text: string
  mode?: QueryMode | undefined
  filters?: QueryFilters | undefined
  relations?: QueryRelations | undefined
  budget?: QueryBudget | undefined
}

export interface HitEvidence {
  exactMatch?: boolean | undefined
  keywordCount?: number | undefined
  cosineScore?: number | undefined
  graphDistance?: number | undefined
}

export interface Hit {
  source: ProviderKind
  id: string
  path?: string | undefined
  score: number
  snippet: string
  meta?: Record<string, unknown> | undefined
  evidence?: HitEvidence | undefined
}

export interface SearchOpts {
  deadline?: number | undefined
  signal?: AbortSignal | undefined
  topK?: number | undefined
}

export interface ProviderHealth {
  ok: boolean
  latencyMs?: number | undefined
  message?: string | undefined
}

export interface RetrievalProvider {
  readonly kind: ProviderKind
  readonly cost: 'O(1)' | 'O(N)' | 'O(log N)' | 'O(N*D)'
  capability(q: Query): Capability
  search(q: Query, opts?: SearchOpts): Promise<Hit[]>
  health(): Promise<ProviderHealth>
}
