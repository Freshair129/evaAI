import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { loadConfig } from '../config/index.js'
import { getBrain } from '../brains/registry.js'
import { collectText } from '../lib/streaming.js'

/**
 * Summarizer with Cache (Wave 6)
 * 
 * Spec: gks/adrs/ADR--CONTEXT-WINDOW-STRATEGY.md §Stage 4
 */

export interface SummarizeOptions {
  query?: string
  targetTokens?: number
  forceLLM?: boolean
}

/**
 * Summarize a document snippet or body.
 * Tries structured summary first, then heuristic, then LLM with cache.
 */
export async function summarize(text: string, opts: SummarizeOptions = {}): Promise<string> {
  const threshold = 800 // tokens
  const target = opts.targetTokens || 200
  
  // 1. Quick check: is it already small?
  const approxTokens = Math.ceil(text.length / 4)
  if (approxTokens <= threshold && !opts.forceLLM) return text

  // 2. Look for structured summary (Markdown heading "Summary")
  const structured = extractStructuredSummary(text)
  if (structured) return structured

  // 3. Heuristic summary (Headings + First sentences)
  if (approxTokens < threshold * 2 && !opts.forceLLM) {
    return extractHeuristicSummary(text)
  }

  // 4. LLM Summary with Cache
  return summarizeWithLLM(text, opts.query || '', target)
}

function extractStructuredSummary(text: string): string | null {
  // Look for "# Summary" or "## Summary" section
  const match = text.match(/^#+ Summary\n([\s\S]*?)(?=\n#|$)/m)
  if (match && match[1]) return match[1].trim()
  
  // Look for frontmatter summary
  const fmMatch = text.match(/^summary: "(.*)"$/m) || text.match(/^summary: (.*)$/m)
  if (fmMatch && fmMatch[1]) return fmMatch[1].trim()
  
  return null
}

function extractHeuristicSummary(text: string): string {
  const lines = text.split('\n')
  const summaryLines: string[] = []
  
  let currentCount = 0
  for (const line of lines) {
    if (line.startsWith('#')) {
      summaryLines.push(line)
    } else if (line.trim().length > 20 && summaryLines.length < 5) {
      summaryLines.push(line.split(/[.!?]/)[0] + '.')
    }
    
    currentCount += line.length / 4
    if (currentCount > 300) break
  }
  
  return summaryLines.join('\n')
}

async function summarizeWithLLM(text: string, query: string, target: number): Promise<string> {
  const cacheKey = createHash('sha256').update(text + query).digest('hex')
  const cfg = loadConfig()
  const cacheDir = resolve(cfg.paths.cacheDir || '.eva/cache', 'summaries')
  const cachePath = resolve(cacheDir, `${cacheKey}.txt`)

  if (existsSync(cachePath)) {
    return readFileSync(cachePath, 'utf8')
  }

  // Ensure cache dir exists
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }

  // Call LLM (using 'limbic' as it's typically used for summary/NLU)
  const brain = getBrain('limbic')
  const prompt = `Summarize the following document for the query "${query}". 
Limit the response to approximately ${target} words. 
Focus on technical details and facts.

DOCUMENT:
${text}`

  try {
    const iter = brain.invoke({
      system: 'You are a technical summarizer. Be concise and fact-oriented.',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
    
    const summary = await collectText(iter)
    writeFileSync(cachePath, summary, 'utf8')
    return summary
  } catch (e) {
    console.error('Summarization failed, falling back to heuristic:', e)
    return extractHeuristicSummary(text)
  }
}
