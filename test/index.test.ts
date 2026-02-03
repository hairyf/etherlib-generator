import { describe, expect, it } from 'vitest'
import { defineConfig } from '../src'

describe('etherlib-generator', () => {
  it('exports defineConfig from main entry', () => {
    expect(typeof defineConfig).toBe('function')
    const config = defineConfig({ output: 'out' })
    expect(config).toEqual({ output: 'out' })
  })
})
