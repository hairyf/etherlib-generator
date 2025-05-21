import { defineConfig } from 'etherlib-generator'
import { ethers, hardhat } from 'etherlib-generator/plugins'

import { erc20Abi, erc721Abi } from 'viem'
import { mainnet } from 'viem/chains'

// This is a configuration file for the Ethereum Library Generator.
const config = defineConfig({
  output: 'dist',
  addresses: {
    Rocket: {
      1: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    },
  },
  fragments: {
    ERC20: erc20Abi,
    ERC721: erc721Abi,
  },
  chains: {
    ethereum: mainnet,
    custom: {
      name: 'Custom Chain',
      icon: 'https://...',
      testnet: false,
      id: 1,
      explorer: { name: 'Etherscan', url: 'https:...', api: 'https:...' },
      currency: { decimals: 18, name: 'Custom', symbol: 'CUSTOM' },
      rpc: 'https:...',
    },
  },
  plugins: [
    hardhat(),
    ethers(),
  ],
})

export default config
