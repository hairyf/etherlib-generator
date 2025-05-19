import 'hardhat/types/config'

declare module 'hardhat/types/config' {
  export interface HttpNetworkUserConfig {
    currency?: {
      name: string
      /** 2-6 characters long */
      symbol: string
      decimals: number
    }
    explorer?: {
      name: string
      url: string
      api?: string
    }
    contracts?: {
      [contractName: string]: any
    }
    icon?: string
    name?: string
    testnet?: boolean
  }
}
