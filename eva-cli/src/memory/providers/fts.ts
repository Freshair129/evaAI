import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import fg from 'fast-glob'
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

/**
 * RipgrepFtsProvider — Keyword search using ripgrep or JS fallback.
 * 
 * Spec: gks/adrs/ADR--HYBRID-RETRIEVAL.md §Provider B: RipgrepFtsProvider
 */
export class RipgrepFtsProvider implements RetrievalProvider {
  readonly kind: ProviderKind = 'fts'
  readonly cost = 'O(N)'

  private gksRoot: string

  constructor() {
    const cfg = loadConfig()
    this.gksRoot = cfg.paths.gksRoot
  }

  capability(_q: Query): Capability {
    // FTS is always a candidate for keyword search
    return 'may_hit'
  }

  async search(q: Query, opts?: SearchOpts): Promise<Hit[]> {
    const hasRg = await this.checkRipgrep()
    const limit = opts?.topK ?? 10
    
    let rawHits: Array<{ path: string, line: number, content: string }> = []
    
    if (hasRg) {
      rawHits = await this.runRipgrep(q.text, limit)
    } else {
      rawHits = await this.runJsFallback(q.text, limit)
    }

    // Group hits by file to avoid returning the same file multiple times
    const fileHits = new Map<string, { path: string, count: number, snippets: string[] }>()
    
    for (const h of rawHits) {
      const existing = fileHits.get(h.path)
      if (existing) {
        existing.count++
        if (existing.snippets.length < 3) existing.snippets.push(h.content.trim())
      } else {
        fileHits.set(h.path, {
          path: h.path,
          count: 1,
          snippets: [h.content.trim()]
        })
      }
    }

    return Array.from(fileHits.values()).map(fh => {
      // Normalize path relative to workspace root if possible
      const relPath = fh.path.replace(resolve(this.gksRoot, '..') + '/', '')
      
      // Calculate score based on count (capped at 0.9 to leave room for exact ID hits)
      const score = Math.min(0.5 + (fh.count * 0.05), 0.9)
      
      return {
        source: this.kind,
        id: this.extractIdFromPath(fh.path) ?? relPath,
        path: relPath,
        score,
        snippet: fh.snippets.join(' ... '),
        evidence: {
          keywordCount: fh.count
        }
      } as Hit
    })
  }

  async health(): Promise<ProviderHealth> {
    const hasRg = await this.checkRipgrep()
    return { 
      ok: true, 
      message: hasRg ? 'Ripgrep available' : 'Using JS fallback (slower)' 
    }
  }

  private async checkRipgrep(): Promise<boolean> {
    return new Promise((r) => {
      const p = spawn('rg', ['--version'])
      p.on('error', () => r(false))
      p.on('exit', (code) => r(code === 0))
    })
  }

  private async runRipgrep(pattern: string, limit: number): Promise<Array<{ path: string, line: number, content: string }>> {
    return new Promise((res) => {
      const args = ['-n', '--no-heading', '--color=never', '--max-count', String(limit * 5), pattern, '.']
      const p = spawn('rg', args, { cwd: this.gksRoot })
      let out = ''
      p.stdout.on('data', (c) => (out += c.toString()))
      p.on('exit', () => {
        const lines = out.split('\n').filter(Boolean)
        const parsed = lines.map(l => {
          const parts = l.split(':')
          if (parts.length < 3) return null
          const filePath = parts[0]
          const lineNum = parts[1]
          if (!filePath || !lineNum) return null
          
          const path = resolve(this.gksRoot, filePath)
          const line = parseInt(lineNum, 10)
          const content = parts.slice(2).join(':')
          return { path, line, content }
        }).filter((h): h is { path: string, line: number, content: string } => h !== null)
        res(parsed)
      })
      p.on('error', () => res([]))
    })
  }

  private async runJsFallback(pattern: string, limit: number): Promise<Array<{ path: string, line: number, content: string }>> {
    const regex = new RegExp(pattern, 'i')
    const files = await fg('**/*.md', {
      cwd: this.gksRoot,
      absolute: true,
      onlyFiles: true,
      ignore: ['**/node_modules/**', '**/.git/**'],
    })

    const results: Array<{ path: string, line: number, content: string }> = []
    for (const f of files) {
      if (results.length >= limit * 5) break
      try {
        const content = readFileSync(f, 'utf8')
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (line && regex.test(line)) {
            results.push({ path: f, line: i + 1, content: line })
            if (results.length >= limit * 5) break
          }
        }
      } catch {
        continue
      }
    }
    return results
  }

  private extractIdFromPath(path: string): string | null {
    // Simple heuristic: read first few lines for "id: ..."
    try {
      const content = readFileSync(path, 'utf8').slice(0, 500)
      const match = content.match(/^id:\s*["']?([A-Z0-9--]+)["']?/m)
      return match && match[1] ? (match[1] as string) : null
    } catch {
      return null
    }
  }
}
