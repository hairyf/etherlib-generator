import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generate } from '../src/generate'

const mockLoadConfig = vi.hoisted(() => vi.fn())
vi.mock('unconfig', () => ({
  loadConfig: (opts: unknown) => mockLoadConfig(opts),
}))

const mockEnsureDir = vi.hoisted(() => vi.fn())
const mockRemove = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn())
vi.mock('fs-extra', () => ({
  ensureDir: (path: string) => mockEnsureDir(path),
  remove: (path: string) => mockRemove(path),
}))
vi.mock('node:fs/promises', () => ({
  writeFile: (path: string, data: string) => mockWriteFile(path, data),
}))

describe('generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnsureDir.mockResolvedValue(undefined)
    mockRemove.mockResolvedValue(undefined)
    mockWriteFile.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws ValidationError when options are invalid', async () => {
    mockLoadConfig.mockResolvedValue({ config: { output: 'out' }, sources: ['etherlib.config.ts'] })
    await expect(generate({ config: 123 } as never)).rejects.toThrow('Invalid option')
  })

  it('throws when config is not found (no sources)', async () => {
    mockLoadConfig.mockResolvedValue({ config: undefined, sources: [] })
    await expect(generate()).rejects.toThrow('Config not found')
  })

  it('throws when config has no output', async () => {
    mockLoadConfig.mockResolvedValue({
      config: { plugins: [] },
      sources: ['etherlib.config.ts'],
    })
    await expect(generate()).rejects.toThrow('output is required.')
  })

  it('runs plugins and writes output files', async () => {
    const outputFiles = [
      { id: 'Contract.ts', content: 'export {}', imports: '', prepend: '' },
    ]
    mockLoadConfig.mockResolvedValue({
      config: {
        output: 'dist',
        plugins: [
          {
            name: 'test-plugin',
            validate: vi.fn().mockResolvedValue(undefined),
            run: vi.fn().mockResolvedValue(outputFiles),
          },
        ],
      },
      sources: ['etherlib.config.ts'],
    })

    await generate()

    expect(mockRemove).toHaveBeenCalledWith('dist')
    expect(mockEnsureDir).toHaveBeenCalled()
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('Contract.ts'),
      expect.any(String),
    )
  })

  it('accepts valid options (config, root)', async () => {
    mockLoadConfig.mockResolvedValue({
      config: { output: 'out', plugins: [] },
      sources: ['custom.config.ts'],
    })
    await expect(generate({ config: 'custom.config.ts', root: process.cwd() })).resolves.toBeUndefined()
  })

  it('normalizes chains array: alias from chain.name (first letter lowercase)', async () => {
    const run = vi.fn().mockResolvedValue([])
    const mainnetLike = {
      name: 'Ethereum',
      id: 1,
      rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } },
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    }
    mockLoadConfig.mockResolvedValue({
      config: {
        output: 'dist',
        chains: [mainnetLike],
        plugins: [
          {
            name: 'assert-chains',
            validate: vi.fn().mockResolvedValue(undefined),
            run,
          },
        ],
      },
      sources: ['etherlib.config.ts'],
    })

    await generate()

    const handled = run.mock.calls[0][0]
    expect(handled.chains.ethereum).toBeDefined()
    expect(handled.chains.ethereum.name).toBe('Ethereum')
    expect(handled.chains.ethereum.id).toBe(1)
  })

  it('normalizes chains array: fallback alias when chain.name is missing', async () => {
    const run = vi.fn().mockResolvedValue([])
    const chainWithoutName = {
      id: 31337,
      rpc: 'http://127.0.0.1:8545',
      name: undefined,
      currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    }
    mockLoadConfig.mockResolvedValue({
      config: {
        output: 'dist',
        chains: [chainWithoutName],
        plugins: [
          {
            name: 'assert-chains',
            validate: vi.fn().mockResolvedValue(undefined),
            run,
          },
        ],
      },
      sources: ['etherlib.config.ts'],
    })

    await generate()

    const handled = run.mock.calls[0][0]
    expect(handled.chains.chain0).toBeDefined()
    expect(handled.chains.chain0.id).toBe(31337)
  })
})
