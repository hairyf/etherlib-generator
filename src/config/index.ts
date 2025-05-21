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
  output: string
  addresses?: Addresses
  fragments?: Fragments
  chains?: UserChains
  plugins?: Plugin[]
}

export function defineConfig(config: Arrayable<Config> | (() => Awaitable<Arrayable<Config>>)): Arrayable<Config> | Awaitable<Arrayable<Config>> {
  return typeof config === 'function' ? config() : config
}
