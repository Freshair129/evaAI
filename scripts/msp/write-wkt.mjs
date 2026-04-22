import { writeFileSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('Usage: node write-wkt.mjs <sessionId>');
    process.exit(1);
  }

  const workspace = process.cwd();
  const sessionPath = join(workspace, '.brain/msp/projects/evaAI/sessions', `${sessionId}.json`);
  
  try {
    const session = JSON.parse(readFileSync(sessionPath, 'utf8'));
    const wktId = `MSP-WKT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${sessionId.split('-').pop()}`;
    const targetPath = join(workspace, 'gks/14_devlog/walkthrough', `${wktId}.md`);

    const content = `# Walkthrough — ${session.id}

## Summary
${session.summary || 'Auto-drafted walkthrough from session.'}

## Outcomes
${(session.outcomes || []).map(o => `- ${o}`).join('\n')}

## Traces
${(session.traces || []).map(t => `- [${t.status}] ${t.stepId} (${t.metrics.latencyMs}ms)`).join('\n')}

---
*Drafted by MSP-AGT-RWANG-IDE*
`;

    writeFileSync(targetPath, content);
    console.log(`Drafted walkthrough to: ${targetPath}`);
  } catch (e) {
    console.error(`Failed to draft walkthrough: ${e.message}`);
  }
}

main();
