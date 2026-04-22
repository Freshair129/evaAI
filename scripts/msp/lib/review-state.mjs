import fs from 'fs';
import path from 'path';

/**
 * MSP Review State Tracker
 * Manages the state of artifacts in the inbound queue.
 */

export function getPendingReviews(repoRoot) {
  const inboundDir = path.join(repoRoot, '.msp', 'inbound');
  
  if (!fs.existsSync(inboundDir)) {
    return [];
  }

  const files = fs.readdirSync(inboundDir).filter(f => f.endsWith('.md'));
  
  return files.map(file => {
    const filePath = path.join(inboundDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract basic frontmatter
    let status = 'unknown';
    let phase = 'unknown';
    
    const statusMatch = content.match(/^status:\s*"(.*?)"/m);
    if (statusMatch) status = statusMatch[1];
    
    const phaseMatch = content.match(/^phase:\s*(.*?)$/m);
    if (phaseMatch) phase = phaseMatch[1];
    
    const stat = fs.statSync(filePath);
    
    return {
      id: file.replace('.md', ''),
      path: filePath,
      status,
      phase,
      submittedAt: stat.mtime
    };
  });
}

export function generateReviewReport(repoRoot) {
  const reviews = getPendingReviews(repoRoot);
  
  if (reviews.length === 0) {
    return '✨ No pending artifacts in the inbound queue.';
  }
  
  let report = '📋 Pending Reviews in Inbound Queue:\n';
  report += '───────────────────────────────────\n';
  
  reviews.forEach(r => {
    report += `- ${r.id} (Phase ${r.phase}) [Status: ${r.status}]\n`;
    report += `  Submitted: ${r.submittedAt.toLocaleString()}\n`;
  });
  
  return report;
}
