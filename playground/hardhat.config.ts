/// <reference types="etherlib-generator/hardhat-network" />

import type { HardhatUserConfig } from 'hardhat/config'
import hardhatIgnitionViewPlugin from '@nomicfoundation/hardhat-ignition-viem'
import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem'
import { configVariable } from 'hardhat/config'

const config: HardhatUserConfig = {
  plugins: [
    hardhatIgnitionViewPlugin,
    hardhatToolboxViemPlugin,
  ],
  solidity: {
    version: '0.8.28',
    remappings: ['forge-std/=npm/forge-std@1.9.4/src/'],
  },
  networks: {
    hardhatMainnet: {
      type: 'edr',
      chainType: 'l1',
    },
    hardhatOptimism: {
      type: 'edr',
      chainType: 'optimism',
    },
    sepolia: {
      icon: 'https://sepolia.dev/icon.svg',
      name: 'Sepolia',
      testnet: true,
      type: 'http',
      chainType: 'l1',
      url: 'SEPOLIA_RPC_URL',
      accounts: [configVariable('SEPOLIA_PRIVATE_KEY')],
    },
  },
}

export default config
