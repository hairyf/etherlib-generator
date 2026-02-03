import type { Abi, Address } from 'viem'
import type { Addresses, ContractConfig, Contracts, Plugin } from '../config'
import { mkdir } from 'node:fs/promises'

import { z } from 'zod'
import { fromZodError } from '../errors'
import { readCachedFile, writeCachedFile } from './utils'

/** Etherscan-supported chain IDs (Etherscan v2 API). */
export type EtherscanChainId =
  | 1
  | 11155111
  | 17000
  | 560048
  | 56
  | 97
  | 137
  | 80002
  | 8453
  | 84532
  | 42161
  | 42170
  | 421614
  | 59144
  | 59141
  | 81457
  | 168587773
  | 10
  | 11155420
  | 43114
  | 43113
  | 199
  | 1029
  | 42220
  | 11142220
  | 25
  | 252
  | 2522
  | 100
  | 5000
  | 5003
  | 43521
  | 1284
  | 1285
  | 1287
  | 204
  | 5611
  | 534352
  | 534351
  | 167000
  | 167012
  | 324
  | 300
  | 50
  | 51
  | 33139
  | 33111
  | 480
  | 4801
  | 50104
  | 531050104
  | 146
  | 14601
  | 130
  | 1301
  | 2741
  | 11124
  | 80094
  | 80069
  | 1923
  | 1924
  | 10143
  | 999
  | 747474
  | 737373
  | 1329
  | 1328

export type EtherscanContractInput = Omit<ContractConfig, 'abi'> & {
  address: Address | Record<number, Address>
}

export interface EtherscanConfig<TChainId extends number = EtherscanChainId> {
  /**
   * Etherscan API key.
   * Create or manage keys at https://etherscan.io/myapikey
   */
  apiKey: string
  /**
   * Chain ID for the Etherscan API.
   * If contract address is a record, this chainId is used to select the address.
   */
  chainId: TChainId
  /**
   * Contracts to fetch ABIs for (name + address, no abi).
   */
  contracts: EtherscanContractInput[]
  /**
   * Duration in milliseconds to cache ABIs.
   * @default 1_800_000 (30m)
   */
  cacheDuration?: number
  /**
   * Try to resolve proxy implementation and use its ABI.
   * @default false
   */
  tryFetchProxyImplementation?: boolean
}

const GetAbiResponse = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('1'),
    message: z.literal('OK'),
    result: z.string().transform(val => JSON.parse(val) as Abi),
  }),
  z.object({
    status: z.literal('0'),
    message: z.literal('NOTOK'),
    result: z.string(),
  }),
])

const GetSourceCodeResponse = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('1'),
    message: z.literal('OK'),
    result: z.array(
      z.discriminatedUnion('Proxy', [
        z.object({
          ABI: z.string().transform(val => JSON.parse(val) as Abi),
          Implementation: z.string(),
          Proxy: z.literal('1'),
        }),
        z.object({
          ABI: z.string().transform(val => JSON.parse(val) as Abi),
          Implementation: z.string(),
          Proxy: z.literal('0'),
        }),
      ]),
    ),
  }),
  z.object({
    status: z.literal('0'),
    message: z.literal('NOTOK'),
    result: z.string(),
  }),
])

const BASE_URL = 'https://api.etherscan.io/v2/api'

function buildUrl(options: {
  action: 'getabi' | 'getsourcecode'
  address: string
  apiKey: string
  chainId: number
}): string {
  const { action, address, apiKey, chainId } = options
  return `${BASE_URL}?chainId=${chainId}&module=contract&action=${action}&address=${address}${apiKey ? `&apikey=${apiKey}` : ''}`
}

function getResolvedAddress(
  address: Address | Record<number, Address>,
  chainId: number,
): string {
  if (typeof address === 'string')
    return address
  const a = address[chainId]
  if (!a)
    throw new Error(`No address for chainId ${chainId}. Set address[${chainId}] for this contract.`)
  return a
}

function getCacheKey(name: string, address: string): string {
  return `etherscan_${name}_${address}`
}

/**
 * Fetches contract ABIs from Etherscan API.
 * Uses Etherscan v2 API (chainId + getabi / getsourcecode).
 */
export function etherscan<TChainId extends number = EtherscanChainId>(
  config: EtherscanConfig<TChainId>,
): Plugin {
  const {
    apiKey,
    chainId,
    contracts: contractInputs,
    cacheDuration = 1_800_000,
    tryFetchProxyImplementation = false,
  } = config

  return {
    name: 'etherscan',
    async resolve() {
      await mkdir('.cache', { recursive: true })
      const contracts: Contracts = {}
      const addresses: Addresses = {}

      for (const input of contractInputs) {
        const resolvedAddress = getResolvedAddress(input.address, chainId)
        addresses[input.name] = { [chainId]: resolvedAddress as Address }

        const cacheKey = getCacheKey(input.name, resolvedAddress)
        const cached = await readCachedFile(cacheKey)
        if (cached) {
          contracts[input.name] = cached
          continue
        }

        let fetchAddress = resolvedAddress
        let abi: Abi | undefined

        if (tryFetchProxyImplementation) {
          const url = buildUrl({
            action: 'getsourcecode',
            address: resolvedAddress,
            apiKey,
            chainId,
          })
          const res = await globalThis.fetch(url)
          const json = await res.json()
          const parsed = await GetSourceCodeResponse.safeParseAsync(json)
          if (!parsed.success)
            throw fromZodError(parsed.error, { prefix: 'Etherscan getsourcecode' })
          if (parsed.data.status === '0')
            throw new Error(parsed.data.result)
          const first = parsed.data.result[0]
          if (first?.Proxy === '1' && first?.Implementation) {
            fetchAddress = first.Implementation
            abi = first.ABI
          }
        }

        if (!abi) {
          const url = buildUrl({
            action: 'getabi',
            address: fetchAddress,
            apiKey,
            chainId,
          })
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 10_000)
          const res = await globalThis.fetch(url, { signal: controller.signal })
          clearTimeout(timeout)
          const json = await res.json()
          const parsed = await GetAbiResponse.safeParseAsync(json)
          if (!parsed.success)
            throw fromZodError(parsed.error, { prefix: 'Etherscan getabi' })
          if (parsed.data.status === '0')
            throw new Error(parsed.data.result)
          abi = parsed.data.result
        }

        contracts[input.name] = abi
        await writeCachedFile(cacheKey, abi, Date.now() + cacheDuration)
      }

      return { contracts, addresses }
    },
  }
}
