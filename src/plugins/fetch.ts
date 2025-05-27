import type { Awaitable } from '@hairy/utils'
import type { Abi, Address } from 'viem'
import type { Addresses, Contracts, Plugin } from '../config'
import { readCachedFile, writeCachedFile } from './utils'

export interface FetchContracts {
  [name: string]: Address
}

export interface FetchConfig {
  /**
   * Name of source.
   */
  name?: string

  /**
   * Chain ID to addresses for.
   */
  chainId: number
  /**
   * Contracts to fetch ABIs for.
   */
  contracts: FetchContracts
  /**
   * Function for returning a request to fetch ABI from.
   */
  request: (name: string, address: Address) => Awaitable<{ url: RequestInfo, init?: RequestInit }>
  /**
   * Function for parsing ABI from fetch response.
   *
   * @default ({ response }) => response.json()
   */
  parse?:
  | ((config: { response: Response }) => Awaitable<Abi>)
  | undefined
}

export function fetch(config: FetchConfig): Plugin {
  const {
    parse = ({ response }) => response.json(),
  } = config
  return {
    name: config.name || 'fetch',
    resolve: async () => {
      const contracts: Contracts = {}
      const addresses: Addresses = {}

      for (const name in config.contracts) {
        const address = config.contracts[name]
        if (config.chainId)
          addresses[name] = { [config.chainId]: address }
        const cached = await readCachedFile(`${name}_${address}`)
        if (cached) {
          contracts[name] = cached
          continue
        }
        const { url, init } = await config.request(name, address)
        const controller = new globalThis.AbortController()
        const timeout = setTimeout(
          () => controller.abort(),
          5_000,
        )
        const response = await globalThis.fetch(url, {
          ...init,
          signal: controller.signal,
        })
        clearTimeout(timeout)
        contracts[name] = await parse({ response })
        await writeCachedFile(`${name}_${address}`, contracts[name])
      }

      return { contracts, addresses }
    },
  }
}
