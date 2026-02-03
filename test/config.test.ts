import { describe, expect, it } from 'vitest'
import { defineConfig } from '../src/config'

describe('defineConfig', () => {
  it('returns config object when passed object', () => {
    const config = { output: 'out' }
    expect(defineConfig(config)).toBe(config)
  })

  it('returns config array when passed array', () => {
    const config = [{ output: 'out1' }, { output: 'out2' }]
    expect(defineConfig(config)).toBe(config)
  })

  it('returns result of function when passed function (lazy config)', () => {
    const fn = () => ({ output: 'out' })
    expect(defineConfig(fn)).toEqual({ output: 'out' })
  })

  it('returns promise when passed async function', async () => {
    const fn = async () => ({ output: 'out' })
    const result = defineConfig(fn)
    expect(result).toBeInstanceOf(Promise)
    expect(await result).toEqual({ output: 'out' })
  })
})
