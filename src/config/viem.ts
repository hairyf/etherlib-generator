import type { Chain as _ViemChain, Address, ChainContract, Prettify } from 'viem'

export interface ViemChain extends Omit<_ViemChain, 'contracts'> {
  contracts?:
    | Prettify<
      {
        [name: string]:
          | ChainContract
          | { [sourceId: number]: ChainContract | undefined }
          | Address
          | undefined
      } & {
        ensRegistry?: ChainContract | undefined
        ensUniversalResolver?: ChainContract | undefined
        multicall3?: ChainContract | undefined
        universalSignatureVerifier?: ChainContract | undefined
      }
    >
    | undefined
}

export interface Chain extends Omit<_ViemChain, 'contracts'> {
  icon?: string
  contracts?:
    | Prettify<
      {
        [name: string]:
          | ChainContract
          | undefined
      } & {
        ensRegistry?: ChainContract | undefined
        ensUniversalResolver?: ChainContract | undefined
        multicall3?: ChainContract | undefined
        universalSignatureVerifier?: ChainContract | undefined
      }
    >
    | undefined
}
