import type { SimpleChain } from '../../src/config'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hardhat } from '../../src/plugins/hardhat'

const sampleAbi = [
  { type: 'function' as const, name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
]

const mockLoadConfig = vi.fn()
const mockGlob = vi.fn()
const mockReadFile = vi.fn()
const mockReaddir = vi.fn()

vi.mock('c12', () => ({
  loadConfig: (options: unknown) => mockLoadConfig(options),
}))
vi.mock('glob', () => ({
  glob: (pattern: unknown, options: unknown) => mockGlob(pattern, options),
}))
vi.mock('node:fs/promises', () => ({
  readFile: (path: unknown, ...args: unknown[]) => mockReadFile(path, ...args),
  readdir: (path: unknown) => mockReaddir(path),
}))

describe('plugins/hardhat', () => {
  const project = '/fake/project'

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadConfig.mockResolvedValue({
      config: {
        networks: {
          mainnet: {
            url: 'https://eth.llamarpc.com',
            chainId: 1,
            name: 'Mainnet',
          },
        },
      },
    })
    mockGlob.mockResolvedValue([`${project}/artifacts/Contract.json`])
    mockReadFile.mockImplementation((path: string) => {
      if (path.includes('Contract.json'))
        return Promise.resolve(JSON.stringify({ abi: sampleAbi, contractName: 'Contract' }))
      if (path.includes('deployed_addresses.json'))
        return Promise.resolve(JSON.stringify({ 'Module#Counter': '0x1234567890123456789012345678901234567890' }))
      return Promise.reject(new Error('Unknown path'))
    })
    mockReaddir.mockResolvedValue(['chain-31337'])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns plugin with name hardhat', () => {
    const plugin = hardhat()
    expect(plugin.name).toBe('hardhat')
  })

  it('resolves chains from hardhat config networks', async () => {
    const plugin = hardhat({ project })
    const result = await plugin.resolve?.()

    expect(result?.chains?.mainnet).toBeDefined()
    expect(result?.chains?.mainnet?.id).toBe(1)
    expect(result?.chains?.mainnet?.name).toBe('Mainnet')
    expect((result?.chains?.mainnet as SimpleChain)?.rpc).toBe('https://eth.llamarpc.com')
    expect(mockLoadConfig).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'hardhat.config', cwd: project, configFile: 'hardhat.config' }),
    )
  })

  it('resolves contracts from artifacts directory', async () => {
    const plugin = hardhat({ project, artifacts: 'artifacts' })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Contract).toEqual(sampleAbi)
    expect(mockGlob).toHaveBeenCalled()
    expect(mockReadFile).toHaveBeenCalledWith(
      expect.stringContaining('Contract.json'),
      'utf8',
    )
  })

  it('resolves addresses from ignition deployed_addresses.json', async () => {
    const plugin = hardhat({ project, ignition: 'ignition' })
    const result = await plugin.resolve?.()

    expect(result?.addresses?.Counter).toBeDefined()
    expect(result?.addresses?.Counter?.['31337']).toBe('0x1234567890123456789012345678901234567890')
    expect(mockReaddir).toHaveBeenCalledWith(expect.stringContaining('deployments'))
    expect(mockReadFile).toHaveBeenCalledWith(
      expect.stringContaining('deployed_addresses.json'),
      'utf8',
    )
  })

  it('skips network without url', async () => {
    mockLoadConfig.mockResolvedValue({
      config: {
        networks: {
          mainnet: { url: 'https://eth.llamarpc.com', chainId: 1, name: 'Mainnet' },
          other: { chainId: 2, name: 'Other' },
        },
      },
    })

    const plugin = hardhat({ project })
    const result = await plugin.resolve?.()

    expect(result?.chains?.mainnet).toBeDefined()
    expect(result?.chains?.other).toBeUndefined()
  })

  it('throws when network uses ConfigurationVariable for url', async () => {
    mockLoadConfig.mockResolvedValue({
      config: {
        networks: {
          mainnet: {
            url: { _type: 'ConfigurationVariable' },
            chainId: 1,
            name: 'Mainnet',
          },
        },
      },
    })

    const plugin = hardhat({ project })
    await expect(plugin.resolve?.()).rejects.toThrow(
      /Missing RPC URL for mainnet.*Not support reading configVariable/,
    )
  })

  it('uses custom artifacts and ignition paths', async () => {
    const plugin = hardhat({
      project,
      artifacts: 'custom-artifacts',
      ignition: 'custom-ignition',
    })
    await plugin.resolve?.()

    expect(mockGlob).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('custom-artifacts')]),
      expect.any(Object),
    )
    expect(mockReaddir).toHaveBeenCalledWith(
      expect.stringContaining('custom-ignition'),
    )
  })
})
