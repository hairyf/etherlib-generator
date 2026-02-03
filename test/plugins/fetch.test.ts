import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetch as fetchPlugin } from '../../src/plugins/fetch'

const sampleAbi = [
  { type: 'function' as const, name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
]

const mockFetch = vi.fn()
const mockReadCachedFile = vi.fn()
const mockWriteCachedFile = vi.fn()
const mockRequest = vi.fn()

vi.stubGlobal('fetch', mockFetch)
vi.mock('../../src/plugins/utils', () => ({
  readCachedFile: (key: string) => mockReadCachedFile(key),
  writeCachedFile: (key: string, content: unknown) => mockWriteCachedFile(key, content),
}))

describe('plugins/fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadCachedFile.mockResolvedValue(undefined)
    mockWriteCachedFile.mockResolvedValue(undefined)
    mockRequest.mockResolvedValue({
      url: 'https://api.example.com/abi/Counter',
      init: {},
    })
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve(sampleAbi),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns plugin with default name "fetch" when name not provided', () => {
    const plugin = fetchPlugin({
      chainId: 1,
      contracts: { Counter: '0x00000000219ab540356cbb839cbe05303d7705fa' },
      request: mockRequest,
    })
    expect(plugin.name).toBe('fetch')
  })

  it('returns plugin with custom name when provided', () => {
    const plugin = fetchPlugin({
      name: 'CustomFetch',
      chainId: 1,
      contracts: { Counter: '0x00000000219ab540356cbb839cbe05303d7705fa' },
      request: mockRequest,
    })
    expect(plugin.name).toBe('CustomFetch')
  })

  it('fetches ABI via request() and returns contracts and addresses', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    const plugin = fetchPlugin({
      chainId: 1,
      contracts: { Counter: address },
      request: mockRequest,
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Counter).toEqual(sampleAbi)
    expect(result?.addresses?.Counter).toEqual({ 1: address })
    expect(mockRequest).toHaveBeenCalledWith('Counter', address)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/abi/Counter',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(mockWriteCachedFile).toHaveBeenCalledWith(
      `Counter_${address}`,
      sampleAbi,
    )
  })

  it('uses cache when available', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockReadCachedFile.mockResolvedValue(sampleAbi)

    const plugin = fetchPlugin({
      chainId: 1,
      contracts: { Counter: address },
      request: mockRequest,
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Counter).toEqual(sampleAbi)
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockWriteCachedFile).not.toHaveBeenCalled()
  })

  it('supports custom parse function', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    const customAbi = [{ type: 'function' as const, name: 'custom', inputs: [], outputs: [] }]
    const parse = vi.fn().mockResolvedValue(customAbi)
    mockFetch.mockResolvedValue({ text: () => Promise.resolve('custom-format') })

    const plugin = fetchPlugin({
      chainId: 1,
      contracts: { Counter: address },
      request: mockRequest,
      parse,
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Counter).toEqual(customAbi)
    expect(parse).toHaveBeenCalledWith({ response: expect.any(Object) })
  })

  it('passes request init to fetch', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockRequest.mockResolvedValue({
      url: 'https://api.example.com/abi',
      init: { headers: { 'X-Custom': 'value' } },
    })

    const plugin = fetchPlugin({
      chainId: 1,
      contracts: { Counter: address },
      request: mockRequest,
    })
    await plugin.resolve?.()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/abi',
      expect.objectContaining({
        headers: { 'X-Custom': 'value' },
        signal: expect.any(AbortSignal),
      }),
    )
  })
})
