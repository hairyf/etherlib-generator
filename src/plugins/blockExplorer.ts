import type { Address } from 'viem'
import type { Addresses, ContractConfig, Contracts, Plugin } from '../config'
import { camelCase } from 'scule'
import { z } from 'zod'
import { fromZodError } from '../errors'
import { readCachedFile, writeCachedFile } from './utils'

/**
 * Contract config without ABI (used for block explorer fetch).
 */
export type BlockExplorerContractConfig = Omit<ContractConfig, 'abi'>

export interface BlockExplorerConfig {
  /**
   * API key for block explorer. Appended to the request URL as query param `&apikey=${apiKey}`.
   */
  apiKey?: string
  /**
   * Base URL for block explorer (e.g. https://api.etherscan.io).
   */
  baseUrl: string
  /**
   * Duration in milliseconds to cache ABIs.
   *
   * @default 1_800_000 // 30m in ms
   */
  cacheDuration?: number
  /**
   * Chain ID for block explorer. Appended to the request URL as query param `&chainId=${chainId}`.
   * Also used when contract address is a string to set addresses[name][chainId].
   */
  chainId?: number
  /**
   * Contracts to fetch ABIs for (name + address, no abi).
   */
  contracts: BlockExplorerContractConfig[]
  /**
   * Function to get address from contract config (e.g. single address or from multi-chain record).
   */
  getAddress?: (config: { address: NonNullable<ContractConfig['address']> }) => Address
  /**
   * Name of source.
   *
   * @default 'Block Explorer'
   */
  name?: string
}

const BlockExplorerResponse = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('1'),
    message: z.literal('OK'),
    result: z
      .string()
      .transform(val => JSON.parse(val) as ContractConfig['abi']),
  }),
  z.object({
    status: z.literal('0'),
    message: z.literal('NOTOK'),
    result: z.string(),
  }),
])

/**
 * Fetches contract ABIs from block explorers that support the Etherscan-style
 * `?module=contract&action=getabi&address=...` API.
 */
export function blockExplorer(config: BlockExplorerConfig): Plugin {
  const {
    apiKey,
    baseUrl,
    cacheDuration = 1_800_000,
    chainId = 1,
    contracts: contractList,
    getAddress = ({ address }) => {
      if (typeof address === 'string')
        return address
      return Object.values(address)[0]!
    },
    name = 'Block Explorer',
  } = config

  return {
    name,
    resolve: async () => {
      const contracts: Contracts = {}
      const addresses: Addresses = {}

      for (const contract of contractList) {
        const { name: contractName, address: contractAddress } = contract
        if (!contractAddress)
          throw new Error(`address is required for contract ${contractName}`)

        const address = getAddress({ address: contractAddress })
        const cacheKey = `${camelCase(name)}:${typeof contractAddress === 'string' ? contractAddress : JSON.stringify(contractAddress)}`

        const cached = await readCachedFile(cacheKey)
        if (cached) {
          contracts[contractName] = cached
          addresses[contractName] = typeof contractAddress === 'string'
            ? { [chainId]: contractAddress }
            : Object.fromEntries(
                Object.entries(contractAddress).map(([id, addr]) => [id, addr]),
              )
          continue
        }

        const url = `${baseUrl}?${chainId ? `chainId=${chainId}&` : ''}module=contract&action=getabi&address=${address}${apiKey ? `&apikey=${apiKey}` : ''}`

        const controller = new globalThis.AbortController()
        const timeout = setTimeout(() => controller.abort(), 5_000)
        const response = await globalThis.fetch(url, {
          signal: controller.signal,
        })
        clearTimeout(timeout)

        const json = await response.json()
        const parsed = await BlockExplorerResponse.safeParseAsync(json)
        if (!parsed.success)
          throw fromZodError(parsed.error, { prefix: 'Invalid response' })
        if (parsed.data.status === '0')
          throw new Error(parsed.data.result)

        const abi = parsed.data.result
        contracts[contractName] = abi
        addresses[contractName] = typeof contractAddress === 'string'
          ? { [chainId]: contractAddress }
          : Object.fromEntries(
              Object.entries(contractAddress).map(([id, addr]) => [id, addr]),
            )

        await writeCachedFile(cacheKey, abi, Date.now() + cacheDuration)
      }

      return { contracts, addresses }
    },
  }
}
