# etherlib-generator

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

Manage and generate different ethereum library codes from config(ABIs, networks, chains, address)

![library][hardhat-src]
![library][viem-src]
![library][ethers-src]
![library][wagmi-src]

## Features ✨

- **Simplified Contract Interaction** - Generate type-safe contract interfaces from ABIs
- **Multi-Library Support** - Generate code for different Ethereum libraries (Viem, Ethers.js)
- **Chain Management** - Configure and manage multiple blockchain networks
- **Address Management** - Organize contract addresses across different chains
- **Plugin System** - Extensible architecture with plugins for different libraries and frameworks
- **Type Safety** - Full TypeScript support for enhanced developer experience

## Installation 📦

```bash
# npm
pnpm add etherlib-generator
```

## Quick Start 🏁

### 1. Create Configuration File

Create an `etherlib.config.ts` file in your project root:

```ts
import { defineConfig } from 'etherlib-generator'
import { hardhat, viem } from 'etherlib-generator/plugins'

import { erc20Abi } from 'viem'
import { mainnet } from 'viem/chains'

export default defineConfig({
  // Output directory for generated code
  output: 'src/generated',

  // Plugins for code generation
  plugins: [
    hardhat(),
    viem(),
  ],
})
```

### 2. Generate Code

Run the following command to generate code based on your configuration:

```bash
npx etherlib generate
```

### 3. Use Generated Code（viem）

Import and use the generated code in your application:

```ts
import { chain, chains, client, getContractCounter } from './src/generated'

// Set up current chain
chain.proxy.update(chains.ethereum)
// Set up your client or wallet
client.proxy.update(createPublicClient({/* your options */}))
wallet.proxy.update(createWalletClient({/* your options */}))

// Use the generated contract functions

// auto find chain address, client
const counter = getContractCounter()
// or manually set the address and client
const counter = getContractCounter({
  address: '0xYourContractAddress',
  client: createPublicClient({/* ... */}), // or { client, wallet }
})

// Call contract functions
const num = await counter.read.x()
```

## Hardhat Network Expansion

Expand the network field by importing `etherlib-generator/hardhat-network` to reference the chain network in the Hardhat configuration.

```ts
/// <reference types="etherlib-generator/hardhat-network" />

import type { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      type: 'http',
      chainType: 'l1',
      url: 'Your RPC URL',
      chainId: 11155111,
      accounts: [configVariable('SEPOLIA_PRIVATE_KEY')],
      // more options...
      icon: 'https://sepolia.dev/icon.svg',
      name: 'Sepolia',
      testnet: true,
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
```

## Configuration Options 🛠️

### Output

Specify where generated code should be saved:

### Fragments

Define contract ABIs

```ts
const config = defineConfig({
  // ...
  fragments: {
    ERC20: erc20Abi,
    MyToken: [/* abi content */],
  }
  // ...
})
```

### Addresses

Configure contract addresses by chain ID:

```ts
const config = defineConfig({
  addresses: {
    1: { // Ethereum Mainnet
      MyToken: '0x1234567890123456789012345678901234567890',
    },
    5: { // Goerli
      MyToken: '0x0987654321098765432109876543210987654321',
    },
  }
  // ...
})
```

### Chains

Configure blockchain chain networks:

```ts
const config = defineConfig({
  // ...
  chains: {
    ethereum: mainnet,
    sepolia: {
      name: 'Sepolia',
      id: 11155111,
      rpc: 'https://rpc.sepolia.org',
      testnet: true,
    },
  }
  // ...
})
```

### Plugins

Add plugins for different libraries:

```ts
const config = defineConfig({
  // ...
  plugins: [
    hardhat(),
    viem(), // or // ethers()
  ]
  // ...
})
```

## CLI Commands 💻

- `etherlib generate`: Generate code based on your configuration
- `etherlib --help`: Show help information

## Learn More 📚

Check out the [playground](https://github.com/hairyf/etherlib-generator/tree/main/playground) directory for more examples.

## License

[MIT](./LICENSE) License © [Hairyf](https://github.com/hairyf)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/etherlib-generator?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/etherlib-generator
[npm-downloads-src]: https://img.shields.io/npm/dm/etherlib-generator?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/etherlib-generator
[bundle-src]: https://img.shields.io/bundlephobia/minzip/etherlib-generator?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=etherlib-generator
[license-src]: https://img.shields.io/github/license/hairyf/etherlib-generator.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hairyf/etherlib-generator/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/etherlib-generator
[hardhat-src]: https://img.shields.io/badge/hardhat-v3+-CCB200.svg
[viem-src]: https://img.shields.io/badge/viem-v2+-ffc517.svg
[ethers-src]: https://img.shields.io/badge/ethers-v6+-2535a0.svg
[wagmi-src]: https://img.shields.io/badge/wagmi-v2+-a8b1ff.svg
