import { defineConfig } from 'etherlib-generator'
import { ethers, hardhat } from 'etherlib-generator/plugins'
import { erc20Abi } from 'viem'

// This is a configuration file for the Ethereum Library Generator.
const config = defineConfig([
  {
    output: 'dist',
    fragments: {
      ERC20: erc20Abi,
      ERC721: erc20Abi,
    },
    plugins: [
      hardhat(),
      ethers(),
    ],
  },
])

export default config
