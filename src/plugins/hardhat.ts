import type { Addresses, Fragments, Plugin, SimpleChain, UserChains } from '../config'
import { readdir, readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import process from 'node:process'
import { loadConfig } from 'c12'
import { glob } from 'glob'

export interface HardhatPluginConfig {
  /**
   * Project's artifacts directory.
   *
   * Same as your project's `artifacts` [path configuration](https://hardhat.org/hardhat-runner/docs/config#path-configuration) option.
   *
   * @default 'artifacts/'
   */
  artifacts?: string | undefined

  /**
   *  Project's ignition deploy directory.
   *
   * @default 'ignition/'
   */
  ignition?: string | undefined

  /**
   * Project's hardhat config file.
   *
   * @default 'hardhat.config.ts'
   */
  config?: string | undefined

  /**
   * Path to Hardhat project.
   *
   * @default process.cwd()
   */
  project?: string
}

async function readJsonFile(filePath: string, defaultValue?: any): Promise<any> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  }
  catch {
    return defaultValue
  }
}

export function hardhat(config: HardhatPluginConfig = {}): Plugin {
  const {
    config: hardhatConfig = 'hardhat.config.ts',
    artifacts = 'artifacts',
    ignition = 'ignition',
    project = process.cwd(),
  } = config
  function getArtifactPaths(artifactsDirectory: string): Promise<string[]> {
    const pattern = ['*.json'].map(x => `${artifactsDirectory}/**/${x}`)
    const ignore = ['build-info/**', '*.dbg.json'].map(x => `${artifactsDirectory}/**/${x}`)
    return glob(pattern, { dot: true, ignore })
  }
  // eslint-disable-next-line ts/explicit-function-return-type
  async function getContract(artifactPath: string) {
    const artifact = await readJsonFile(artifactPath)
    return { abi: artifact.abi, name: artifact.contractName }
  }

  return {
    name: 'hardhat',
    async resolve() {
      const { config } = await loadConfig({ configFile: basename(hardhatConfig) })
      const contracts: Fragments = {}
      const networks: UserChains = {}
      const addresses: Addresses = {}

      for (const alias in config.networks || {}) {
        if (!config.networks[alias].url)
          continue
        if (config.networks[alias].url?._type === 'ConfigurationVariable')
          throw new Error(`Missing RPC URL for ${alias}, Not support reading configVariable in hardhat config.`)
        const chain: SimpleChain = {
          currency: config.networks[alias].currency,
          explorer: config.networks[alias].explorer,
          name: config.networks[alias].name,
          rpc: config.networks[alias].url,
          id: config.networks[alias].chainId,
          contracts: config.networks[alias].contracts,
          icon: config.networks[alias].icon,
          testnet: config.networks[alias].testnet,
        }
        networks[alias] = chain
      }

      const artifactsDirectory = join(project, artifacts)
      const artifactPaths = await getArtifactPaths(artifactsDirectory)
      for (const artifactPath of artifactPaths) {
        const { abi, name } = await getContract(artifactPath)
        name && abi && (contracts[name] = abi)
      }

      const ignitionDirectory = join(project, ignition)
      const deployChains = await readdir(join(ignitionDirectory, 'deployments')).catch(() => [] as string[])
      for (const dir of deployChains) {
        const [name, chain] = dir.split('-')
        if (name !== 'chain')
          continue
        const deployedPath = join(ignitionDirectory, 'deployments', dir, 'deployed_addresses.json')
        const deployedAddresses = await readJsonFile(deployedPath, {})
        for (const key in deployedAddresses) {
          const [_module, contract] = key.split('#')
          addresses[contract] ??= {}
          addresses[contract][chain] = deployedAddresses[key]
        }
      }
      return {
        chains: networks,
        addresses,
        contracts,
      }
    },
  }
}
