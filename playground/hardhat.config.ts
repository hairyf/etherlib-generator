/// <reference types="etherlib-generator/hardhat-network" />

import type { HardhatUserConfig } from 'hardhat/config'
import { configVariable } from 'hardhat/config'

const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      icon: 'https://sepolia.dev/icon.svg',
      name: 'Sepolia',
      testnet: true,
      type: 'http',
      chainType: 'l1',
      url: 'Your RPC URL',
      accounts: [configVariable('SEPOLIA_PRIVATE_KEY')],
      chainId: 11155111,
      currency: {
        name: 'Sepolia Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      contracts: {
        USDT: '0x..',
      },
      explorer: {
        name: 'Sepolia Etherscan',
        url: '...',
        api: '...',
      },
    },
  },
}

export default config
