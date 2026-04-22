import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  const type = process.argv[2] || 'feat';
  const message = process.argv[3];
  
  if (!message) {
    console.error('Usage: node append-changelog.mjs <type> <message>');
    process.exit(1);
  }

  const workspace = process.cwd();
  const logPath = join(workspace, 'CHANGELOG.jsonl');
  
  const entry = {
    date: new Date().toISOString(),
    type,
    message,
    author: 'MSP-AGT-RWANG-IDE'
  };

  appendFileSync(logPath, JSON.stringify(entry) + '\n');
  console.log(`Appended to CHANGELOG: ${message}`);
}

main();
