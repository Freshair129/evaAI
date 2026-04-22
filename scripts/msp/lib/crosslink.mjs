/**
 * Crosslink Extractor Logic
 * Parses frontmatter to extract graph edges (backlinks/forward links)
 */

export function extractEdges(id, meta) {
  const edges = []
  
  // Standard GKS relationship keys
  const keys = [
    'derived_from', 
    'implements', 
    'uses', 
    'requires', 
    'part_of',
    'references',
    'supersedes'
  ]

  // Clean the source ID (remove quotes if any)
  const cleanId = id.replace(/["']/g, '').trim()

  keys.forEach(key => {
    if (meta[key]) {
      // Clean the value (remove [ ], " ', then split)
      const rawVal = meta[key]
      const cleanVal = rawVal.replace(/[\[\]"']/g, '')
      const targets = cleanVal.split(/[, ]+/).filter(Boolean)
      
      targets.forEach(target => {
        edges.push({
          from: cleanId,
          to: target.trim(),
          type: key
        })
      })
    }
  })

  return edges
}
