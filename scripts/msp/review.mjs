import fs from 'fs';
import path from 'path';
import { generateReviewReport } from './lib/review-state.mjs';

/**
 * MSP Review CLI
 * Prints the current state of the inbound queue.
 */

const REPO_ROOT = fs.existsSync(path.join(process.cwd(), 'registry.yaml')) 
  ? process.cwd() 
  : path.join(process.cwd(), '..');

function review() {
  console.log(generateReviewReport(REPO_ROOT));
}

review();
