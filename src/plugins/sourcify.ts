import type { Abi, Address } from 'viem'
import type { Addresses, ContractConfig, Contracts, Plugin } from '../config'
import { mkdir } from 'node:fs/promises'

import { z } from 'zod'
import { fromZodError } from '../errors'
import { readCachedFile, writeCachedFile } from './utils'

/** Sourcify-supported chain IDs. @see https://docs.sourcify.dev/docs/chains */
export type SourcifyChainId = number

export type SourcifyContractInput = Omit<ContractConfig, 'abi'> & {
  address: Address | Record<number, Address>
}

export interface SourcifyConfig<TChainId extends number = SourcifyChainId> {
  /**
   * Chain ID for the Sourcify API.
   * If contract address is a record, this chainId is used to select the address.
   * @see https://docs.sourcify.dev/docs/chains
   */
  chainId: TChainId
  /**
   * Contracts to fetch ABIs for (name + address, no abi).
   */
  contracts: SourcifyContractInput[]
  /**
   * Duration in milliseconds to cache ABIs.
   * @default 1_800_000 (30m)
   */
  cacheDuration?: number
}

const SourcifyResponse = z.object({
  abi: z.unknown().transform(val => val as Abi),
})

const BASE_URL = 'https://sourcify.dev/server/v2/contract'

function buildUrl(chainId: number, address: string): string {
  return `${BASE_URL}/${chainId}/${address}?fields=abi`
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
  return `sourcify_${name}_${address}`
}

/**
 * Fetches contract ABIs from Sourcify server.
 * No API key required. Response must have `abi`; 404 throws "Contract not found in Sourcify repository."
 */
export function sourcify<TChainId extends number = SourcifyChainId>(
  config: SourcifyConfig<TChainId>,
): Plugin {
  const {
    chainId,
    contracts: contractInputs,
    cacheDuration = 1_800_000,
  } = config

  return {
    name: 'sourcify',
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

        const url = buildUrl(chainId, resolvedAddress)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10_000)
        const res = await globalThis.fetch(url, { signal: controller.signal })
        clearTimeout(timeout)

        if (res.status === 404)
          throw new Error('Contract not found in Sourcify repository.')

        const json = await res.json()
        const parsed = await SourcifyResponse.safeParseAsync(json)
        if (!parsed.success)
          throw fromZodError(parsed.error, { prefix: 'Sourcify' })
        if (!parsed.data.abi)
          throw new Error('Contract not found in Sourcify repository.')

        contracts[input.name] = parsed.data.abi
        await writeCachedFile(cacheKey, parsed.data.abi, Date.now() + cacheDuration)
      }

      return { contracts, addresses }
    },
  }
}
