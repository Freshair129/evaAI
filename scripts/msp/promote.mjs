import fs from 'fs';
import path from 'path';
import readline from 'node:readline/promise';
import { stdin as input, stdout as output } from 'node:process';
import { execSync } from 'child_process';

/**
 * MSP Promote CLI
 * Moves approved artifacts from the inbound queue into the active GKS vault.
 */

const REPO_ROOT = fs.existsSync(path.join(process.cwd(), 'registry.yaml')) 
  ? process.cwd() 
  : path.join(process.cwd(), '..');

const INBOUND_DIR = path.join(REPO_ROOT, '.msp', 'inbound');

const TYPE_MAP = {
  'ADR': 'gks/adrs',
  'CONCEPT': 'gks/concepts',
  'FEAT': 'gks/features',
  'IDEA': 'gks/ideas',
  'BLUEPRINT': 'gks/blueprints',
  'ENTITY': 'gks/entities',
  'FLOW': 'gks/flows',
  'FRAME': 'gks/frameworks',
  'API': 'gks/apis',
  'MOD': 'gks/modules',
  'PARAMS': 'gks/parameters',
  'ALGO': 'gks/algorithms'
};

async function promote() {
  if (!fs.existsSync(INBOUND_DIR)) {
    console.log('✨ No inbound queue found.');
    return;
  }

  const files = fs.readdirSync(INBOUND_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('✨ Inbound queue is empty.');
    return;
  }

  const rl = readline.createInterface({ input, output });
  
  console.log('🚀 MSP Promote Wizard');
  console.log('─────────────────────');
  
  files.forEach((file, index) => {
    console.log(`[${index + 1}] ${file}`);
  });
  console.log(`[0] Promote ALL`);

  try {
    const selection = await rl.question('\nSelect file to promote (number, or 0 for all): ');
    const num = parseInt(selection, 10);
    
    let toPromote = [];
    if (num === 0) {
      toPromote = files;
    } else if (num > 0 && num <= files.length) {
      toPromote = [files[num - 1]];
    } else {
      console.error('❌ Invalid selection.');
      process.exit(1);
    }

    for (const file of toPromote) {
      const typePrefix = file.split('--')[0];
      const targetSubdir = TYPE_MAP[typePrefix];
      
      if (!targetSubdir) {
        console.warn(`⚠️ Warning: Unknown prefix '${typePrefix}' for ${file}. Skipping.`);
        continue;
      }

      const sourcePath = path.join(INBOUND_DIR, file);
      const targetPath = path.join(REPO_ROOT, targetSubdir, file);
      
      // Update frontmatter status to APPROVED (or stable)
      let content = fs.readFileSync(sourcePath, 'utf8');
      content = content.replace(/^status:\s*".*"/m, 'status: "stable"');
      content = content.replace(/^> \*\*Status:\*\*.*$/m, '> **Status:** Approved');
      
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, content);
      fs.unlinkSync(sourcePath);
      
      console.log(`✅ Promoted: ${file} -> ${targetSubdir}/`);
    }

    console.log('\n🔄 Re-indexing GKS...');
    try {
      execSync('npm run msp:index', { cwd: path.join(REPO_ROOT, 'eva-cli'), stdio: 'inherit' });
      console.log('✅ Index updated successfully.');
    } catch (err) {
      console.error('❌ Failed to update index.');
    }

  } finally {
    rl.close();
  }
}

promote();
