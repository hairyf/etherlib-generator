import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sourcify } from '../../src/plugins/sourcify'

const sampleAbi = [
  { type: 'function' as const, name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
]

const mockFetch = vi.fn()
const mockReadCachedFile = vi.fn()
const mockWriteCachedFile = vi.fn()
const mockMkdir = vi.fn()

vi.stubGlobal('fetch', mockFetch)
vi.mock('../../src/plugins/utils', () => ({
  readCachedFile: (key: string) => mockReadCachedFile(key),
  writeCachedFile: (key: string, content: unknown, timestamp?: number) => mockWriteCachedFile(key, content, timestamp),
}))
vi.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
}))

describe('plugins/sourcify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadCachedFile.mockResolvedValue(undefined)
    mockWriteCachedFile.mockResolvedValue(undefined)
    mockMkdir.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns plugin with name sourcify', () => {
    const plugin = sourcify({ chainId: 1, contracts: [] })
    expect(plugin.name).toBe('sourcify')
  })

  it('fetches ABI from Sourcify URL and returns contracts and addresses', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ abi: sampleAbi }),
    })

    const plugin = sourcify({
      chainId: 1,
      contracts: [{ name: 'Counter', address }],
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Counter).toEqual(sampleAbi)
    expect(result?.addresses?.Counter).toEqual({ 1: address })
    expect(mockFetch).toHaveBeenCalledWith(
      `https://sourcify.dev/server/v2/contract/1/${address}?fields=abi`,
      { signal: expect.any(AbortSignal) },
    )
    expect(mockWriteCachedFile).toHaveBeenCalledWith(
      `sourcify_Counter_${address}`,
      sampleAbi,
      expect.any(Number),
    )
  })

  it('uses cache when available', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockReadCachedFile.mockResolvedValue(sampleAbi)

    const plugin = sourcify({
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
      status: 200,
      json: () => Promise.resolve({ abi: sampleAbi }),
    })

    const plugin = sourcify({
      chainId: 100,
      contracts: [{ name: 'Community', address: { 100: addr100, 137: addr100 } }],
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Community).toEqual(sampleAbi)
    expect(result?.addresses?.Community).toEqual({ 100: addr100 })
    expect(mockFetch).toHaveBeenCalledWith(
      `https://sourcify.dev/server/v2/contract/100/${addr100}?fields=abi`,
      { signal: expect.any(AbortSignal) },
    )
  })

  it('throws on 404 with "Contract not found in Sourcify repository."', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockFetch.mockResolvedValue({ status: 404 })

    const plugin = sourcify({
      chainId: 1,
      contracts: [{ name: 'Counter', address }],
    })

    await expect(plugin.resolve?.()).rejects.toThrow('Contract not found in Sourcify repository.')
  })

  it('throws when address missing for chainId', async () => {
    const plugin = sourcify({
      chainId: 1,
      contracts: [{ name: 'Counter', address: { 10: '0x00000000219ab540356cbb839cbe05303d7705fa' } }],
    })

    await expect(plugin.resolve?.()).rejects.toThrow(
      /No address for chainId 1\. Set address\[1\] for this contract\./,
    )
  })
})
