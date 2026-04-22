import { ModeSelector } from '../src/orchestrator/mode-selector.js';
import { SingleShotExecutor } from '../src/orchestrator/modes/single-shot.js';
import type { Intent } from '../src/types/intent.js';

async function testModeSelector() {
  const selector = new ModeSelector();
  const intent: Intent = {
    taskType: 'write_adr',
    urgency: 'normal',
    emotion: 'neutral',
    entities: [],
    rewrittenQuery: 'write an ADR for multi-agent',
    confidence: 0.9
  };

  const { mode } = selector.select(intent, 0.9);
  console.log(`Intent 'write_adr' -> Mode: ${mode} (Expected: debate)`);
  
  const intent2: Intent = {
    taskType: 'chat_casual',
    urgency: 'normal',
    emotion: 'neutral',
    entities: [],
    rewrittenQuery: 'hello',
    confidence: 0.9
  };
  const { mode: mode2 } = selector.select(intent2, 0.9);
  console.log(`Intent 'chat_casual' -> Mode: ${mode2} (Expected: single_shot)`);

  const { mode: mode3 } = selector.select(intent2, 0.3);
  console.log(`Low confidence (0.3) -> Mode: ${mode3} (Expected: debate)`);
}

testModeSelector().catch(console.error);
