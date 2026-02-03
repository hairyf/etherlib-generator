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
- **Multi-Library Support** - Generate code for Viem, Ethers.js, or Wagmi (with React hooks)
- **Multiple ABI Sources** - Resolve ABIs from Hardhat, Foundry, Etherscan, Sourcify, block explorers, or custom fetch
- **Chain Management** - Configure and manage multiple blockchain networks
- **Address Management** - Organize contract addresses across different chains
- **Plugin System** - Source plugins (resolve) + generator plugins (run); mix and match as needed
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

  // Manually add contract ABIs
  fragments: {},
  // Manually add contract addresses
  addresses: {},
  // Manually add chain networks
  chains: {},

  plugins: [
    // Source: hardhat() | foundry() | etherscan() | sourcify() | blockExplorer() | fetch()
    hardhat(),
    // Generator: viem() | ethers() | wagmi()
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
import { chains, client, connection, getContractCounter } from './src/generated'

// Indicate chain(only query)
connection.connect(chains.ethereum)

// Indicate chain and account(metamask/eip-1193)
connection.connect(chains.ethereum, { type: 'eip-1193', value: window.ethereum })

// Indicate chain and account(provideKey)
connection.connect(chains.ethereum, { type: 'provideKey', value: 'your-private-key' })

const blockNumber = await client.getBlockNumber()

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

`connection` represents the current session being used. It is connected via the `connection.connect()` method, specifying the chain and account to be used, which will affect the global usage without the need to manually create `client/wallet` or pass configuration information when using contracts later.

`connection` is implemented based on `proxy`, which is a special object that allows you to dynamically update configurations through `proxy` at runtime. This allows you to use the same contract instances in different environments without having to recreate them each time.

```ts
import { chain, chains, client, getContractCounter } from './src/generated'

// Set up current chain
chain.proxy.update(chains.ethereum)
// Set up your client or wallet
client.proxy.update(createPublicClient({/* your options */}))
wallet.proxy.update(createWalletClient({/* your options */}))

const blockNumber = await client.getBlockNumber()

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

```ts
import { client, getContractCounter } from './src/generated'

const counter = getContractCounter()

client.proxy.update(createPublicClient({/* ethereum */}))
const ethereumBlockNumber = await client.getBlockNumber()
counter.read.x() // call ethereum counter contract

client.proxy.update(createPublicClient({/* sepolia */}))
const sepoliaBlockNumber = await client.getBlockNumber()
counter.read.x() // call sepolia counter contract
```

Updating the chain will help contracts automatically find the correct contract address

```ts
import { chain, chains } from './src/generated'

chain.proxy.update(chains.sepolia)

// find chains.sepolia.contracts.Counter.address
const counter = getContractCounter()
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

Plugins are split into **source plugins** (resolve ABIs, addresses, chains) and **generator plugins** (emit library code). Use one or more source plugins, then one or more generator plugins.

```ts
const config = defineConfig({
  // ...
  plugins: [
    // Source: collect from Hardhat / Foundry / Etherscan / Sourcify / block explorer / custom fetch
    hardhat(),
    // foundry(), etherscan({ ... }), sourcify({ ... }), blockExplorer({ ... }), fetch({ ... }),
    // Generators: emit code for viem / ethers / wagmi
    viem(), // or ethers() or wagmi()
  ]
  // ...
})
```

#### Source plugins (resolve)

| Plugin | Description |
|--------|-------------|
| **hardhat** | Read artifacts, Ignition deployments, and network config from a Hardhat project (`artifacts/`, `ignition/`, `hardhat.config`). |
| **foundry** | Read artifacts and optional broadcast deployments from a Foundry project (`out/`, optional `broadcast/`). Supports `forge build` and exclusions. |
| **etherscan** | Fetch ABIs from Etherscan v2 API by chain and contract addresses. Optional proxy implementation resolution. |
| **blockExplorer** | Fetch ABIs from any block explorer API (custom `baseUrl`). Use for Routescan, Blockscout, or other explorers. |
| **sourcify** | Fetch ABIs from [Sourcify](https://docs.sourcify.dev/docs/chains) by chain ID and contract addresses. |
| **fetch** | Custom source: you provide `request(name, address)` and optional `parse(response)` to load ABIs from any URL or API. |

#### Generator plugins (run)

| Plugin | Description |
|--------|-------------|
| **viem** | Generate viem-style helpers: `createGetContract`, `createReadContract`, `createWriteContract`, `createWatchContractEvent`, etc., plus `connection` / `chain` / `client` / `addresses`. |
| **ethers** | Generate ethers.js code (TypeChain-based) and contract factories. |
| **wagmi** | Generate wagmi-style code including React hooks (`createUseReadContract`, `createUseWriteContract`, etc.) and shared config. |

Example with multiple sources and one generator:

```ts
import { defineConfig } from 'etherlib-generator'
import { blockExplorer, etherscan, fetch, foundry, hardhat, sourcify, viem } from 'etherlib-generator/plugins'

export default defineConfig({
  output: 'src/generated',
  fragments: {},
  addresses: {},
  chains: {},
  plugins: [
    hardhat(),
    foundry({ project: 'packages/contracts' }),
    // etherscan({ apiKey: process.env.ETHERSCAN_API_KEY!, chainId: 1, contracts: [...] }),
    // sourcify({ chainId: 1, contracts: [...] }),
    // blockExplorer({ baseUrl: 'https://api.etherscan.io', contracts: [...], chainId: 1 }),
    // fetch({ chainId: 1, contracts: { Foo: '0x...' }, request: (name, addr) => ({ url: `.../${addr}` }) }),
    viem(),
  ],
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
