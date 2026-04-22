import fs from 'fs';
import path from 'path';
import { extractEdges } from './lib/crosslink.mjs';

/**
 * GKS Wave 3 Indexer
 * Automates Atomic Index, Backlinks, and Vector preparation.
 */

const REPO_ROOT = fs.existsSync(path.join(process.cwd(), 'registry.yaml')) 
  ? process.cwd() 
  : path.join(process.cwd(), '..');
const GKS_ROOT = path.join(REPO_ROOT, 'gks');
const VECTOR_DIR = path.join(REPO_ROOT, '.brain', 'msp', 'projects', 'evaAI', 'vector');
const ATOMIC_INDEX_PATH = path.join(GKS_ROOT, '00_index', 'atomic_index.jsonl');

function parseFrontmatter(content) {
  const fmMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
  if (!fmMatch) return {};
  
  const metadata = {};
  const lines = fmMatch[1].split('\n');
  lines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const val = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      metadata[key] = val;
    }
  });
  return metadata;
}

function runIndexer() {
  console.log('🚀 Starting MSP Indexer Pipeline...');

  const foldersToScan = [
    'ideas', 'concepts', 'adrs', 'algorithms', 
    'entities', 'features', 'flows', 'frameworks',
    'modules', 'parameters', 'blueprints', 'audits'
  ];

  const atomicEntries = [];
  const allEdges = [];

  foldersToScan.forEach(subDir => {
    const fullDir = path.join(GKS_ROOT, subDir);
    if (!fs.existsSync(fullDir)) return;

    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.md'));
    console.log(`📂 Scanning ${subDir}... found ${files.length} files`);
    files.forEach(file => {
      const filePath = path.join(fullDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const meta = parseFrontmatter(content);

      if (meta.id) {
        const relPath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
        
        // 1. Prepare Atomic Entry
        atomicEntries.push({
          id: meta.id,
          path: relPath,
          phase: meta.phase || 'unknown',
          status: meta.status || 'raw',
          vault_id: meta.vault_id || 'unassigned',
          last_updated: fs.statSync(filePath).mtime.toISOString()
        });

        // 2. Extract Graph Edges
        const edges = extractEdges(meta.id, meta);
        allEdges.push(...edges);
      }
    });
  });

  // Write Atomic Index
  fs.mkdirSync(path.dirname(ATOMIC_INDEX_PATH), { recursive: true });
  fs.writeFileSync(ATOMIC_INDEX_PATH, atomicEntries.map(e => JSON.stringify(e)).join('\n') + '\n');
  console.log(`✅ Atomic Index updated: ${atomicEntries.length} entries.`);

  // Write Graph Edges (Backlinks & Backref)
  fs.mkdirSync(VECTOR_DIR, { recursive: true });
  
  // Forward links (from -> to)
  fs.writeFileSync(path.join(VECTOR_DIR, 'backlinks.jsonl'), allEdges.map(e => JSON.stringify(e)).join('\n') + '\n');
  
  // Backward links (to -> from)
  const reverseEdges = allEdges.map(e => ({ from: e.to, to: e.from, type: e.type }));
  fs.writeFileSync(path.join(VECTOR_DIR, 'backref.jsonl'), reverseEdges.map(e => JSON.stringify(e)).join('\n') + '\n');
  
  console.log(`✅ Graph Edges updated: ${allEdges.length} links.`);
  console.log('🏁 Indexing complete.');
}

try {
  runIndexer();
} catch (error) {
  console.error('❌ Indexing failed:', error);
  process.exit(1);
}
