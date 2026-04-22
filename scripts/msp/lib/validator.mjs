import fs from 'fs';
import path from 'path';

/**
 * MSP Governance Validator
 * Checks for rule violations in Atomic Knowledge.
 */

export function validateEntry(entry, allIds) {
  const errors = [];

  // 1. Phase vs Status compatibility
  // Phase 1 should be 'raw' or 'draft'
  // Phase 2 can be 'accepted'
  // Phase 3 can be 'implemented'
  
  const phase = parseInt(entry.phase, 10);
  const status = entry.status.toLowerCase();

  if (phase === 1 && status === 'implemented') {
    errors.push(`Phase 1 cannot be 'implemented'. Status should be 'raw' or 'draft'.`);
  }
  
  if (phase === 2 && status === 'raw') {
    errors.push(`Phase 2 should at least be 'draft' or 'accepted'.`);
  }

  // 2. ID Format (Standard GKS)
  if (!/^[A-Z]+--[A-Z0-9-]+$/.test(entry.id)) {
    errors.push(`Invalid ID format: ${entry.id}. Must follow TYPE--NAME pattern.`);
  }

  return errors;
}

export function validateEdges(edges, allIds) {
  const errors = [];
  
  edges.forEach(edge => {
    if (!allIds.has(edge.to)) {
      errors.push(`Dead link: ${edge.from} -> ${edge.to} (Target ID not found in index)`);
    }
  });

  return errors;
}
