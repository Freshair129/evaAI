import fs from 'fs';
import path from 'path';

/**
 * Re-indexer Utility for GKS v3
 * Scans directories registered in registry.yaml and builds atomic_index.jsonl
 */

const REPO_ROOT = process.cwd();
const REGISTRY_PATH = path.join(REPO_ROOT, 'registry.yaml');
const INDEX_OUTPUT = path.join(REPO_ROOT, 'gks', '00_index', 'atomic_index.jsonl');

// Simple Frontmatter Parser (Regex-based to avoid dependencies)
function parseFrontmatter(content) {
    const fmMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
    if (!fmMatch) return {};
    
    const fmLines = fmMatch[1].split('\n');
    const metadata = {};
    fmLines.forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val) {
            metadata[key.trim()] = val.join(':').trim();
        }
    });
    return metadata;
}

function scanGksFolders() {
    console.log('🔍 Scanning GKS infrastructure...');
    
    // In a real implementation, we would parse registry.yaml here. 
    // For this pilot, we use the registered paths from our spec.
    const foldersToScan = [
        'gks/ideas', 'gks/concepts', 'gks/adrs', 'gks/algorithms', 
        'gks/entities', 'gks/features', 'gks/flows', 'gks/frameworks',
        'gks/modules', 'gks/parameters', 'gks/blueprints', 'gks/audits'
    ];

    const indexEntries = [];

    foldersToScan.forEach(relPath => {
        const fullPath = path.join(REPO_ROOT, relPath);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.md') || f.endsWith('.yaml'));
            files.forEach(file => {
                const filePath = path.join(fullPath, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const meta = parseFrontmatter(content);
                
                if (meta.id) {
                    indexEntries.push({
                        id: meta.id,
                        path: path.relative(REPO_ROOT, filePath).replace(/\\/g, '/'),
                        phase: meta.phase || 'unknown',
                        status: meta.status || 'raw',
                        vault_id: meta.vault_id || 'unassigned',
                        last_updated: fs.statSync(filePath).mtime.toISOString()
                    });
                }
            });
        }
    });

    console.log(`✅ Found ${indexEntries.length} atomic points.`);
    return indexEntries;
}

function writeIndex(entries) {
    const content = entries.map(e => JSON.stringify(e)).join('\n');
    fs.mkdirSync(path.dirname(INDEX_OUTPUT), { recursive: true });
    fs.writeFileSync(INDEX_OUTPUT, content + '\n');
    console.log(`💾 Index updated at: ${INDEX_OUTPUT}`);
}

try {
    const entries = scanGksFolders();
    writeIndex(entries);
} catch (error) {
    console.error('❌ Indexing failed:', error.message);
}
