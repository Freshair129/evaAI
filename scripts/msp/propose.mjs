import fs from 'fs';
import path from 'path';
import readline from 'node:readline/promise';
import { stdin as input, stdout as output } from 'node:process';

/**
 * MSP Propose CLI
 * Helps agents and humans create new atomic points following standards.
 */

const REPO_ROOT = fs.existsSync(path.join(process.cwd(), 'registry.yaml')) 
  ? process.cwd() 
  : path.join(process.cwd(), '..');

const TYPE_MAP = {
  'ADR': { path: 'gks/adrs', prefix: 'ADR--' },
  'CONCEPT': { path: 'gks/concepts', prefix: 'CONCEPT--' },
  'FEAT': { path: 'gks/features', prefix: 'FEAT--' },
  'IDEA': { path: 'gks/ideas', prefix: 'IDEA--' },
  'BLUEPRINT': { path: 'gks/blueprints', prefix: 'BLUEPRINT--' },
  'ENTITY': { path: 'gks/entities', prefix: 'ENTITY--' }
};

async function propose() {
  const rl = readline.createInterface({ input, output });
  
  console.log('✨ MSP Proposal Wizard');
  console.log('─────────────────────');

  try {
    const type = (await rl.question('Type (ADR, CONCEPT, FEAT, IDEA): ')).toUpperCase();
    const config = TYPE_MAP[type];
    if (!config) {
      console.error(`❌ Unknown type: ${type}`);
      process.exit(1);
    }

    const name = (await rl.question('Short Name (e.g., HYBRID-RETRIEVAL): ')).toUpperCase().replace(/\s+/g, '-');
    const id = `${config.prefix}${name}`;
    
    // Instead of writing directly to GKS, write to the inbound queue
    const inboundDir = path.join(REPO_ROOT, '.msp', 'inbound');
    const filePath = path.join(inboundDir, `${id}.md`);

    if (fs.existsSync(filePath) || fs.existsSync(path.join(REPO_ROOT, config.path, `${id}.md`))) {
      console.error(`❌ File already exists in inbound or GKS: ${id}`);
      process.exit(1);
    }

    const template = `---
id: "${id}"
phase: 1
type: "${type.toLowerCase()}"
status: "raw"
vault_id: "EVA-AGENT-001"
crosslinks:
  derived_from: []
  implements: []
---

# ${id} — [Enter Title Here]

> **Status:** Proposed
> **Date:** ${new Date().toISOString().split('T')[0]}

## 🎯 Context & Problem
[Describe why this is needed]

## 💡 Proposed Solution
[Describe the idea]

## 🔗 References
- 
`;

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, template);
    
    console.log(`✅ Created proposal: ${filePath}`);
    console.log(`👉 Run 'npm run msp:index' to update your local index.`);

  } finally {
    rl.close();
  }
}

propose();
