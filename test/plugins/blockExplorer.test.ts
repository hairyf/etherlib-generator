import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { blockExplorer } from '../../src/plugins/blockExplorer'

const sampleAbi = [
  { type: 'function' as const, name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
]

const mockFetch = vi.fn()
const mockReadCachedFile = vi.fn()
const mockWriteCachedFile = vi.fn()

vi.stubGlobal('fetch', mockFetch)
vi.mock('../../src/plugins/utils', () => ({
  readCachedFile: (key: string) => mockReadCachedFile(key),
  writeCachedFile: (key: string, content: unknown, timestamp?: number) => mockWriteCachedFile(key, content, timestamp),
}))

describe('plugins/blockExplorer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadCachedFile.mockResolvedValue(undefined)
    mockWriteCachedFile.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns plugin with default name "Block Explorer"', () => {
    const plugin = blockExplorer({
      baseUrl: 'https://api.example.com',
      contracts: [{ name: 'Counter', address: '0x00000000219ab540356cbb839cbe05303d7705fa' }],
    })
    expect(plugin.name).toBe('Block Explorer')
  })

  it('returns plugin with custom name when provided', () => {
    const plugin = blockExplorer({
      baseUrl: 'https://api.example.com',
      name: 'CustomExplorer',
      contracts: [{ name: 'Counter', address: '0x00000000219ab540356cbb839cbe05303d7705fa' }],
    })
    expect(plugin.name).toBe('CustomExplorer')
  })

  it('fetches ABI from block explorer URL and returns contracts and addresses', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: '1', message: 'OK', result: JSON.stringify(sampleAbi) }),
    })

    const plugin = blockExplorer({
      baseUrl: 'https://api.example.com',
      chainId: 1,
      contracts: [{ name: 'Counter', address }],
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Counter).toEqual(sampleAbi)
    expect(result?.addresses?.Counter).toEqual({ 1: address })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com?chainId=1&module=contract&action=getabi&address=0x00000000219ab540356cbb839cbe05303d7705fa',
      { signal: expect.any(AbortSignal) },
    )
    expect(mockWriteCachedFile).toHaveBeenCalledWith(
      expect.stringContaining(address),
      sampleAbi,
      expect.any(Number),
    )
  })

  it('appends apiKey to URL when provided', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: '1', message: 'OK', result: JSON.stringify(sampleAbi) }),
    })

    const plugin = blockExplorer({
      baseUrl: 'https://api.example.com',
      apiKey: 'my-api-key',
      chainId: 1,
      contracts: [{ name: 'Counter', address }],
    })
    await plugin.resolve?.()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('apikey=my-api-key'),
      expect.any(Object),
    )
  })

  it('uses cache when available', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockReadCachedFile.mockResolvedValue(sampleAbi)

    const plugin = blockExplorer({
      baseUrl: 'https://api.example.com',
      chainId: 1,
      contracts: [{ name: 'Counter', address }],
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Counter).toEqual(sampleAbi)
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockWriteCachedFile).not.toHaveBeenCalled()
  })

  it('supports multichain address (Record<chainId, address>)', async () => {
    const addr100 = '0xC4c622862a8F548997699bE24EA4bc504e5cA865'
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: '1', message: 'OK', result: JSON.stringify(sampleAbi) }),
    })

    const plugin = blockExplorer({
      baseUrl: 'https://api.example.com',
      chainId: 100,
      contracts: [{ name: 'Community', address: { 100: addr100, 137: addr100 } }],
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Community).toEqual(sampleAbi)
    expect(result?.addresses?.Community).toEqual({ 100: addr100, 137: addr100 })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(addr100),
      expect.any(Object),
    )
  })

  it('uses getAddress when provided for custom address resolution', async () => {
    const addr = '0xC4c622862a8F548997699bE24EA4bc504e5cA865'
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: '1', message: 'OK', result: JSON.stringify(sampleAbi) }),
    })
    const getAddress = vi.fn(({ address }: { address: Record<number, string> }) => address[137])

    const plugin = blockExplorer({
      baseUrl: 'https://api.example.com',
      chainId: 137,
      getAddress,
      contracts: [{ name: 'Polygon', address: { 100: '0xother', 137: addr } }],
    })
    await plugin.resolve?.()

    expect(getAddress).toHaveBeenCalledWith({ address: { 100: '0xother', 137: addr } })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(addr),
      expect.any(Object),
    )
  })

  it('throws when status is "0" (API error)', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: '0', message: 'NOTOK', result: 'Contract source code not verified' }),
    })

    const plugin = blockExplorer({
      baseUrl: 'https://api.example.com',
      chainId: 1,
      contracts: [{ name: 'Counter', address }],
    })

    await expect(plugin.resolve?.()).rejects.toThrow('Contract source code not verified')
  })

  it('throws when contract has no address', async () => {
    const plugin = blockExplorer({
      baseUrl: 'https://api.example.com',
      contracts: [{ name: 'Counter' } as any],
    })

    await expect(plugin.resolve?.()).rejects.toThrow(/address is required for contract Counter/)
  })
})
