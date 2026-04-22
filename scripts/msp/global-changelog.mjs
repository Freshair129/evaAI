import { execSync } from 'node:child_process';
import { join } from 'node:path';

async function main() {
  const event = process.argv[2];
  const payload = process.argv[3] ? JSON.parse(process.argv[3]) : {};

  console.log(`Global Changelog Event: ${event}`);
  
  if (event === 'task_complete') {
    const { type, message } = payload;
    try {
      execSync(`node scripts/msp/append-changelog.mjs ${type} "${message}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Failed to append global changelog: ${e.message}`);
    }
  }
}

main();
