import type { BrainAdapter, BrainId } from '../types/brain.js'
import { createCortex, selectCortexModel } from './cortex/model-router.js'
import type { CortexSelectionContext } from './cortex/model-router.js'
import { QwenMotor, type MotorModelId } from './motor/qwen.js'
import { TyphoonLimbic } from './limbic/typhoon.js'

export interface GetBrainOptions {
  cortex?: CortexSelectionContext
  motorModel?: MotorModelId
}

const cache = new Map<string, BrainAdapter>()

function cacheKey(id: BrainId, variant: string): string {
  return `${id}:${variant}`
}

export function getBrain(id: BrainId, options: GetBrainOptions = {}): BrainAdapter {
  if (id === 'cortex') {
    const model = selectCortexModel(options.cortex ?? {})
    const key = cacheKey('cortex', model)
    const cached = cache.get(key)
    if (cached) return cached
    const adapter = createCortex(model)
    cache.set(key, adapter)
    return adapter
  }

  if (id === 'motor') {
    const model = options.motorModel ?? 'qwen-coder-14b'
    const key = cacheKey('motor', model)
    const cached = cache.get(key)
    if (cached) return cached
    const adapter = new QwenMotor(model)
    cache.set(key, adapter)
    return adapter
  }

  if (id === 'limbic') {
    const key = cacheKey('limbic', 'typhoon')
    const cached = cache.get(key)
    if (cached) return cached
    const adapter = new TyphoonLimbic()
    cache.set(key, adapter)
    return adapter
  }

  throw new Error(`Unknown brain id: ${id}`)
}

export function listBrains(): BrainId[] {
  return ['cortex', 'motor', 'limbic']
}

export function clearBrainCache(): void {
  cache.clear()
}
