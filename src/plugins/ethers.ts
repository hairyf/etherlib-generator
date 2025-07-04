import type { Contracts, Output, Plugin } from '../config'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { camelCase, pascalCase } from 'change-case'
import dedent from 'dedent'
import { ensureDir, readFileSync, remove } from 'fs-extra'
import { glob } from 'glob'
import { nanoid } from 'nanoid'
import { runTypeChain, glob as tGlob } from 'typechain'

async function directoryToOutputs(directory: string): Promise<Output[]> {
  const files = await glob(['**/*'], { cwd: directory, nodir: true })
  return files.map((file) => {
    const filePath = path.join(directory, file)
    const content = readFileSync(filePath, 'utf-8')
    return { id: file, content }
  })
}

export function ethers(): Plugin {
  return {
    name: 'ethers',
    async run(config) {
      const typechainOutputs = await outputTypechain(config.contracts)
      const typechainIndexTS = typechainOutputs.find(output => output.id === 'typechain/index.ts')
      const contracts = Object.keys(config.contracts).filter(name => typechainIndexTS?.content?.includes(`${name}__factory`))
      const imports = [
        '/* Autogenerated file. Do not edit manually. */',
        '/* tslint:disable */',
        '/* eslint-disable */',
        `import { type InterfaceAbi, type Signer, JsonRpcProvider, BrowserProvider, Wallet, Contract } from 'ethers'`,
        `import { set, get, proxy, type GetContractAtConfig, type ConnectionAccountConfig, type GetContractConfig, type TypedFragment } from './library'`,
        typechainIndexTS && `import {\n${contracts
          .map(name => `  ${name}__factory, type ${name}`)
          .join(',\n',
          )}\n} from './typechain'`,
      ]

      const content: (string | string[])[] = [
        `export const client = proxy<JsonRpcProvider>('client')`,
        `export const wallet = proxy<Signer>('wallet')`,
        `export const chain = proxy<typeof chains[keyof typeof chains]>('chain')`,
        '',
        `export const chains = ${JSON.stringify(config.chains)} as const`,
        '',
        dedent`
        export const connection = proxy('connection', {
          connect(chain: typeof chains[keyof typeof chains], account?: ConnectionAccountConfig) {
            const client = new JsonRpcProvider(chain.rpcUrls.default.http[0])
        
            this.client.proxy.update(client)
            this.chain.proxy.update(chain)
        
            if (account?.type === 'eip-1193')
              return (async () => {
                const provider = new BrowserProvider(account.value)
                const wallet = await provider.getSigner()
                this.wallet.proxy.update(wallet)
        
                if (provider._network.chainId !== BigInt(chain.id)) {
                  await switchEthereumChain().catch(error => {
                    if (error.code === 4902)
                      addEthereumChain().then(switchEthereumChain)
                  })
                }
                async function switchEthereumChain() {
                  await provider.send('wallet_switchEthereumChain', [{ chainId: \`0x\${chain.id.toString(16)}\` }])
                }
                async function addEthereumChain() {
                  await provider.send('wallet_addEthereumChain', [{
                    chainId: \`0x\${chain.id.toString(16)}\`,
                    chainName: chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    rpcUrls: chain.rpcUrls.default.http,
                    blockExplorerUrls: [chain.blockExplorers?.default?.url].filter(Boolean),
                  }])
                }
              })()
            if (account?.type === 'provideKey')
              this.wallet.proxy.update(new Wallet(account.value, client))
          },
          update(chain?: typeof chains[keyof typeof chains], client?: JsonRpcProvider, wallet?: Signer) {
            if (chain) this.chain.proxy.update(chain)
            if (client) this.client.proxy.update(client)
            if (wallet) this.wallet.proxy.update(wallet)
          },
          client,
          wallet,
          chain,
        })
        `,

        '',
        `export const addresses = ${JSON.stringify(config.addresses)} as const`,
        '',

        contracts
          .map((name) => {
            return `export const ${camelCase(`${name}Abi`)} = set<TypedFragment<typeof ${name}__factory.abi, ${name}>>(${name}__factory.abi, 'name', '${name}')`
          })
          .join('\n'),
        '',
        `export function getContract<Fragment, Instance>(config: GetContractConfig<Fragment, Instance>): Instance {`,
        `    const contract = new Contract(`,
        `    config.address || get(chain, \`contracts.\${get(config.abi, 'name')}.address\`),`,
        `    config.abi as InterfaceAbi,`,
        `    config.runner || client,`,
        `  )`,
        `  return contract as Instance`,
        `}`,
        '',
        contracts.map((name) => {
          return [
            '/**',
            ` * Wraps __{@link get${pascalCase(name)}}__ with \`abi\` set to __{@link ${camelCase(`${name}Abi`)}}__`,
            ' */',
            `export function get${pascalCase(name)}(config: GetContractAtConfig = {}): ${name} {`,
            `  return ${name}__factory.connect(config.address || get(chain, 'contracts.${name}.address'), config.runner || client)`,
            `}`,
          ].join('\n')
        }).join('\n\n'),
      ]

      const outputs: Output[] = [
        ...typechainOutputs,
        ...await outputLibrary(),
        {
          id: 'index.ts',
          imports: imports.join('\n'),
          content: content.flat().join('\n'),
        },
      ]

      return outputs
    },
  }
}

async function outputTypechain(contracts: Contracts): Promise<Output[]> {
  const cachePath = path.join(import.meta.dirname, '.cache', nanoid())
  const fragmentsPath = path.join(cachePath, 'fragments')
  const typechainPath = path.join(cachePath, 'typechain')

  await remove(cachePath)
  await ensureDir(cachePath)
  await ensureDir(fragmentsPath)
  await ensureDir(typechainPath)

  for (const name in contracts) {
    await writeFile(
      path.join(fragmentsPath, `${name}.json`),
      JSON.stringify(contracts[name]),
    )
  }

  const allFiles = tGlob(fragmentsPath, [`${cachePath}/**/*.json`])

  await runTypeChain({
    outDir: typechainPath,
    filesToProcess: allFiles,
    target: 'ethers-v6',
    cwd: cachePath,
    allFiles,
  })

  const outputs = await directoryToOutputs(typechainPath)
  for (const output of outputs)
    output.id = `typechain/${output.id}`

  await remove(cachePath)

  return outputs
}

async function outputLibrary(): Promise<Output[]> {
  return [{
    id: 'library.ts',
    content: dedent`
    /* Autogenerated file. Do not edit manually. */
    /* tslint:disable */
    /* eslint-disable */
    import type { ContractRunner } from 'ethers'
    
    export interface TypedConstraint<T> {}
    export type TypedFragment<Fragment, Instance> = Fragment & TypedConstraint<Instance>
    
    export interface GetContractConfig<Fragment, Instance> {
      abi: TypedFragment<Fragment, Instance>
      address?: string
      runner?: ContractRunner
    }
    
    export interface GetContractAtConfig {
      address?: string
      runner?: ContractRunner
    }
    
    export type ConnectionAccountConfig =
      { type: 'eip-1193', value?: any } |
      { type: 'provideKey', value: string }

    export type Proxyed<T extends object> = T & { proxy: { update: (object?: T) => void, resolve: () => T | undefined } }

    export function proxy<T extends object>(name: string, initObject?: T): Proxyed<T> {
      initObject && Reflect.set(initObject, 'proxyUpdated', true)
      let target: any = initObject || { proxyUpdated: false }
      const proxy = new Proxy({} as T, {
        get: (_, p) => {
          if (p === 'proxy') return { update, resolve }
          if (!Reflect.get(target, 'proxyUpdated'))
            throw new Error(\`Proxy not updated. Call \${name}.proxy.update() to update the proxy.\`)
          return typeof target?.[p] === 'function' ? target?.[p].bind(target) : target?.[p]
        },
        set: (_, p, v) => { target[p] = v; return true },
      })
      function update(object?: T): void {
        if (object) { Reflect.set(object, 'proxyUpdated', true); target = object }
        else { target = undefined }
      }
      function resolve(): T | undefined {
        return Reflect.get(target, 'proxyUpdated') ? target : undefined
      }
      return proxy as Proxyed<T>
    }
    
    export function get(target: any, keys: string): any {
      return keys.split('.').reduce((acc, key) => acc?.[key], target)
    }
    
    export function set<T extends object>(target: T, property: string, value: any): T {
      Reflect.set(target, property, value)
      return target as T
    }
`,
  }] as Output[]
}
