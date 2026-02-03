import { describe, expect, it } from 'vitest'
import { viem } from '../../src/plugins/viem'

const sampleAbi = [
  { type: 'function' as const, name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' as const },
]

const minimalRunConfig = {
  contracts: { Counter: sampleAbi },
  addresses: { Counter: { 1: '0x00000000219ab540356cbb839cbe05303d7705fa' } },
  chains: {
    mainnet: {
      id: 1,
      name: 'Mainnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } },
    } as any,
  },
}

describe('plugins/viem', () => {
  it('returns plugin with name viem', () => {
    const plugin = viem()
    expect(plugin.name).toBe('viem')
  })

  it('run() returns outputs with config.ts, index.ts, utils.ts, library.ts', async () => {
    const plugin = viem()
    const outputs = await plugin.run?.(minimalRunConfig)

    expect(outputs).toBeDefined()
    expect(Array.isArray(outputs)).toBe(true)
    const ids = outputs!.map(o => o.id)
    expect(ids).toContain('config.ts')
    expect(ids).toContain('index.ts')
    expect(ids).toContain('utils.ts')
    expect(ids).toContain('library.ts')
  })

  it('run() config.ts contains chains and addresses', async () => {
    const plugin = viem()
    const outputs = await plugin.run?.(minimalRunConfig)
    const configOutput = outputs!.find(o => o.id === 'config.ts')

    expect(configOutput?.content).toBeDefined()
    expect(configOutput!.content).toContain('mainnet')
    expect(configOutput!.content).toContain('Counter')
    expect(configOutput!.content).toContain('createPublicClient')
    expect(configOutput!.content).toContain('createWalletClient')
  })

  it('run() index.ts contains createGetContract and contract helpers', async () => {
    const plugin = viem()
    const outputs = await plugin.run?.(minimalRunConfig)
    const indexOutput = outputs!.find(o => o.id === 'index.ts')

    expect(indexOutput?.content).toBeDefined()
    expect(indexOutput!.content).toContain('createGetContract')
    expect(indexOutput!.content).toContain('getCounter')
    expect(indexOutput!.content).toContain('readCounterBalanceOf')
    expect(indexOutput!.content).toContain('counterAbi')
  })

  it('run() handles empty contracts', async () => {
    const plugin = viem()
    const outputs = await plugin.run?.({
      ...minimalRunConfig,
      contracts: {},
    })

    expect(outputs).toBeDefined()
    expect(outputs!.length).toBeGreaterThan(0)
    const indexOutput = outputs!.find(o => o.id === 'index.ts')
    expect(indexOutput?.content).toContain('createGetContract()')
  })
})
