import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { etherscan } from '../../src/plugins/etherscan'

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

describe('plugins/etherscan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadCachedFile.mockResolvedValue(undefined)
    mockWriteCachedFile.mockResolvedValue(undefined)
    mockMkdir.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns plugin with name etherscan', () => {
    const plugin = etherscan({
      apiKey: 'key',
      chainId: 1,
      contracts: [{ name: 'Counter', address: '0x00000000219ab540356cbb839cbe05303d7705fa' }],
    })
    expect(plugin.name).toBe('etherscan')
  })

  it('fetches ABI from Etherscan API and returns contracts and addresses', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: '1', message: 'OK', result: JSON.stringify(sampleAbi) }),
    })

    const plugin = etherscan({
      apiKey: 'my-key',
      chainId: 1,
      contracts: [{ name: 'Counter', address }],
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Counter).toEqual(sampleAbi)
    expect(result?.addresses?.Counter).toEqual({ 1: address })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/chainId=1&module=contract&action=getabi&address=/),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(mockWriteCachedFile).toHaveBeenCalledWith(
      `etherscan_Counter_${address}`,
      sampleAbi,
      expect.any(Number),
    )
  })

  it('uses cache when available', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockReadCachedFile.mockResolvedValue(sampleAbi)

    const plugin = etherscan({
      apiKey: 'key',
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

    const plugin = etherscan({
      apiKey: 'key',
      chainId: 100,
      contracts: [{ name: 'Community', address: { 100: addr100, 137: addr100 } }],
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Community).toEqual(sampleAbi)
    expect(result?.addresses?.Community).toEqual({ 100: addr100 })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`address=${addr100}`),
      expect.any(Object),
    )
  })

  it('throws when status is "0" (API error)', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: '0', message: 'NOTOK', result: 'Invalid API Key' }),
    })

    const plugin = etherscan({
      apiKey: 'key',
      chainId: 1,
      contracts: [{ name: 'Counter', address }],
    })

    await expect(plugin.resolve?.()).rejects.toThrow('Invalid API Key')
  })

  it('throws when address missing for chainId', async () => {
    const plugin = etherscan({
      apiKey: 'key',
      chainId: 1,
      contracts: [{ name: 'Counter', address: { 10: '0x00000000219ab540356cbb839cbe05303d7705fa' } }],
    })

    await expect(plugin.resolve?.()).rejects.toThrow(
      /No address for chainId 1\. Set address\[1\] for this contract\./,
    )
  })

  it('when tryFetchProxyImplementation is true and non-proxy, falls back to getabi', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: '1',
          message: 'OK',
          result: [{ ABI: JSON.stringify(sampleAbi), Implementation: '', Proxy: '0' }],
        }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ status: '1', message: 'OK', result: JSON.stringify(sampleAbi) }),
      })

    const plugin = etherscan({
      apiKey: 'key',
      chainId: 1,
      tryFetchProxyImplementation: true,
      contracts: [{ name: 'Counter', address }],
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Counter).toEqual(sampleAbi)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringMatching(/action=getsourcecode/))
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/action=getabi/),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('when tryFetchProxyImplementation is true and proxy, uses implementation ABI and does not call getabi', async () => {
    const address = '0x00000000219ab540356cbb839cbe05303d7705fa'
    const implAddress = '0ximplementation000000000000000000000000'
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        status: '1',
        message: 'OK',
        result: [{ ABI: JSON.stringify(sampleAbi), Implementation: implAddress, Proxy: '1' }],
      }),
    })

    const plugin = etherscan({
      apiKey: 'key',
      chainId: 1,
      tryFetchProxyImplementation: true,
      contracts: [{ name: 'Counter', address }],
    })
    const result = await plugin.resolve?.()

    expect(result?.contracts?.Counter).toEqual(sampleAbi)
    expect(result?.addresses?.Counter).toEqual({ 1: address })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/action=getsourcecode/))
  })
})
