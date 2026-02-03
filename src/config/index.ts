import type { Arrayable, Awaitable, Fn } from '@hairy/utils'
import type { Abi, Address } from 'viem'
import type { Chain, ViemChain } from './viem'

export type { Chain }

export interface Addresses {
  [contractName: string]: {
    [chainId: string]: Address
  }
}
export interface Fragments {
  [contractName: string]: any
}
export interface Contracts {
  [contractName: string]: Abi
}

/**
 * Wagmi-cli compatible contract config: name + ABI + optional address(es).
 * @see https://wagmi.sh/cli/config#contractconfig
 */
export interface ContractConfig {
  /** Contract ABI (viem Abi). */
  abi: Abi
  /** Optional. Single address or `{ [chainId]: address }` for multi-chain. */
  address?: Address | Record<number, Address>
  /** Unique contract name (used for generated symbols and deduplication). */
  name: string
}

export interface BasicCurrency {
  name: string
  /** 2-6 characters long */
  symbol: string
  decimals: number
}

export interface BasicExplorer {
  name: string
  url: string
  api?: string
}

export interface SimpleChain {
  name?: string
  id?: number
  rpc: string
  icon?: string
  testnet?: boolean
  currency?: BasicCurrency
  explorer?: BasicExplorer
  contracts?: Contracts
}

export interface UserChains {
  [alias: string]: ViemChain | SimpleChain
}

export interface Chains {
  [alias: string]: Chain
}

export interface Output {
  id: string
  imports?: string
  prepend?: string
  content?: string
}

export interface PluginBuildConfig {
  contracts: Contracts
  addresses: Addresses
  chains: UserChains
}

export interface PluginBuildResolved {
  addresses: Addresses
  contracts: Contracts
  chains: Chains
}

export interface PluginGenerateConfig {
  outputs: Output[]
}

export interface Plugin {
  name: string
  resolve?: Fn<Awaitable<Partial<PluginBuildConfig>>>
  validate?: Fn<Awaitable<void>>
  run?: (config: PluginBuildResolved) => Awaitable<Output[]>
}

export interface Config {
  /**
   * output generated files directory
   */
  output: string | string[]
  /**
   * will remove all existing files in the output directory
   *
   * @default true
   */
  clean?: boolean
  /**
   * Contracts addresses used for generating code
   *
   * @example
   *
   * ```ts
   * export default defineConfig({
   *  addresses: {
   *    Rocket: {
   *     1: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
   *     2: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
   *    },
   *  },
   * })
   */
  addresses?: Addresses
  /**
   * Contract ABI used for generating code
   *
   * @example
   *
   * ```ts
   * import { erc20Abi, erc721Abi } from 'viem'
   *
   * export default defineConfig({
   *  fragments: {
   *    ERC20: erc20Abi,
   *    ERC721: erc721Abi,
   *    yourCustomAbi: []
   *  },
   * })
   */
  fragments?: Fragments
  /**
   * Merged with fragments and plugin contracts.
   *
   * @example
   *
   * ```ts
   * import { defineConfig } from 'etherlib-generator'
   * import { erc20Abi } from 'viem'
   *
   * export default defineConfig({
   *  contracts: [
   *    { name: 'Counter', abi: counterAbi, address: { 1: '0x...', 5: '0x...' } },
   *    { name: 'ERC20', abi: erc20Abi },
   *  ],
   * })
   * ```
   */
  contracts?: ContractConfig[]
  /**
   * Supported chains
   *
   * @example
   *
   * ```ts
   * import { mainnet, optimism } from 'viem/chains'
   *
   * export default defineConfig({
   *  chains: {
   *    // complex options
   *    ethereum: mainnet,
   *    optimism: optimism,
   *    // simple options
   *    custom: {
   *      name: 'Custom Chain',
   *      icon: 'https://...',
   *      testnet: false,
   *      id: 1,
   *      explorer: { name: 'Etherscan', url: 'https:...', api: 'https:...' },
   *      currency: { decimals: 18, name: 'Custom', symbol: 'CUSTOM' },
   *      rpc: 'https:...',
   *    }
   *  },
   * })
   * ```
   */
  chains?: UserChains
  /**
   * Extension plugins for reading and generating code
   *
   * @example
   * ```ts
   * import { hardhat, ethers } from 'etherlib-generator/plugins'
   *
   * export default defineConfig({
   *  plugins: [
   *   hardhat(),
   *   ethers(),
   *  ],
   * })
   * ```
   */
  plugins?: Plugin[]
}

export function defineConfig(config: Arrayable<Config> | (() => Awaitable<Arrayable<Config>>)): Arrayable<Config> | Awaitable<Arrayable<Config>> {
  return typeof config === 'function' ? config() : config
}
