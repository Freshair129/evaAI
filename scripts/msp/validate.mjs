import fs from 'fs';
import path from 'path';
import { validateEntry, validateEdges } from './lib/validator.mjs';

/**
 * MSP Validation CLI
 * Runs a full audit of the GKS Knowledge Base.
 */

const REPO_ROOT = fs.existsSync(path.join(process.cwd(), 'registry.yaml')) 
  ? process.cwd() 
  : path.join(process.cwd(), '..');
const GKS_ROOT = path.join(REPO_ROOT, 'gks');
const ATOMIC_INDEX_PATH = path.join(GKS_ROOT, '00_index', 'atomic_index.jsonl');
const VECTOR_DIR = path.join(REPO_ROOT, '.brain', 'msp', 'projects', 'evaAI', 'vector');
const BACKLINKS_PATH = path.join(VECTOR_DIR, 'backlinks.jsonl');

function runValidation() {
  console.log('🔍 Running MSP Governance Audit...');

  if (!fs.existsSync(ATOMIC_INDEX_PATH)) {
    console.error('❌ Atomic Index not found. Run "npm run msp:index" first.');
    process.exit(1);
  }

  const entries = fs.readFileSync(ATOMIC_INDEX_PATH, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  const allIds = new Set(entries.map(e => e.id));
  
  let errorCount = 0;

  // 1. Validate Entries
  entries.forEach(entry => {
    const errors = validateEntry(entry, allIds);
    if (errors.length > 0) {
      console.log(`\n📄 ${entry.id} (${entry.path})`);
      errors.forEach(e => console.log(`   ❌ ${e}`));
      errorCount += errors.length;
    }
  });

  // 2. Validate Edges
  if (fs.existsSync(BACKLINKS_PATH)) {
    const edges = fs.readFileSync(BACKLINKS_PATH, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
    const edgeErrors = validateEdges(edges, allIds);
    if (edgeErrors.length > 0) {
      console.log(`\n🔗 Relationship Errors:`);
      edgeErrors.forEach(e => console.log(`   ❌ ${e}`));
      errorCount += edgeErrors.length;
    }
  }

  console.log('\n─────────────────────');
  if (errorCount === 0) {
    console.log('✅ Audit Passed! All standards enforced.');
  } else {
    console.log(`❌ Audit Failed! Found ${errorCount} violations.`);
    process.exit(1);
  }
}

runValidation();
