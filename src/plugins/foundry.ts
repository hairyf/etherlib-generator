import type { Address } from 'viem'
import type { Addresses, Plugin } from '../config'
import { execSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import process from 'node:process'
import dedent from 'dedent'
import { glob } from 'glob'
import { z } from 'zod'
import { gray } from '../utils/colors'

export const foundryDefaultExcludes = [
  'Base.sol/**',
  'Common.sol/**',
  'Components.sol/**',
  'IERC165.sol/**',
  'IERC20.sol/**',
  'IERC721.sol/**',
  'IMulticall2.sol/**',
  'MockERC20.sol/**',
  'MockERC721.sol/**',
  'Script.sol/**',
  'StdAssertions.sol/**',
  'StdChains.sol/**',
  'StdCheats.sol/**',
  'StdError.sol/**',
  'StdInvariant.sol/**',
  'StdJson.sol/**',
  'StdMath.sol/**',
  'StdStorage.sol/**',
  'StdStyle.sol/**',
  'StdToml.sol/**',
  'StdUtils.sol/**',
  'Test.sol/**',
  'Vm.sol/**',
  'build-info/**',
  'console.sol/**',
  'console2.sol/**',
  'safeconsole.sol/**',
  '**.s.sol/*.json',
  '**.t.sol/*.json',
]

export interface FoundryPluginConfig {
  /**
   * Project's artifacts directory.
   *
   * Same as your project's `--out` (`-o`) option.
   *
   * @default foundry.config#out | 'out'
   */
  artifacts?: string

  /**
   * Set contracts in `run-latest.json` files in the `broadcast/` directory as deployments.
   *
   * @default false
   */
  includeBroadcasts?: boolean

  /** Mapping of addresses to attach to artifacts. */
  deployments?: Record<string, string | Record<number, string>>

  /** Artifact files to exclude. */
  exclude?: string[]

  /** [Forge](https://book.getfoundry.sh/forge) configuration */
  forge?: {
    /**
     * Remove build artifacts and cache directories on start up.
     *
     * @default false
     */
    clean?: boolean
    /**
     * Build Foundry project before fetching artifacts.
     *
     * @default true
     */
    build?: boolean
    /**
     * Path to `forge` executable command
     *
     * @default "forge"
     */
    path?: string
  }

  /** Artifact files to include. */
  include?: string[]

  /** Optional prefix to prepend to artifact names. */
  namePrefix?: string

  /** Path to foundry project. */
  project?: string
}

const FoundryConfigSchema = z.object({
  out: z.string().default('out'),
  src: z.string().default('src'),
})

/** Resolves ABIs from [Foundry](https://github.com/foundry-rs/foundry) project. */
export function foundry(config: FoundryPluginConfig = {}): Plugin {
  const {
    artifacts,
    includeBroadcasts = false,
    deployments = {},
    exclude = foundryDefaultExcludes,
    forge: {
      clean = false,
      build = true,
      path: forgeExecutable = 'forge',
    } = {},
    include = ['*.json'],
    namePrefix = '',
  } = config

  let allDeployments = { ...deployments }

  function getContractName(artifactPath: string, usePrefix = true): string {
    const filename = basename(artifactPath)
    const extension = extname(artifactPath)
    return `${usePrefix ? namePrefix : ''}${filename.replace(extension, '')}`
  }

  async function getContract(
    artifactPath: string,
    contractDeployments: Record<string, string | Record<number, string>> = allDeployments,
  ): Promise<{ abi: any, address?: string | Record<number, string>, name: string }> {
    const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
    const baseName = getContractName(artifactPath, false)
    const address = contractDeployments[baseName]
    return {
      abi: artifact.abi,
      address,
      name: getContractName(artifactPath),
    }
  }

  function getArtifactPaths(artifactsDirectory: string): Promise<string[]> {
    const patterns = include.map(x => `${artifactsDirectory}/**/${x}`)
    const ignore = exclude.map(x => `${artifactsDirectory}/**/${x}`)
    return glob(patterns, { dot: true, ignore })
  }

  async function getBroadcastDeployments(broadcastRoot: string): Promise<Record<string, Record<number, string>>> {
    const result: Record<string, Record<number, string>> = {}
    const broadcastPattern = 'broadcast/**/run-latest.json'
    const broadcastFiles = await glob(broadcastPattern, {
      cwd: broadcastRoot,
      absolute: true,
    })

    for (const broadcastFile of broadcastFiles) {
      try {
        const broadcast = JSON.parse(await readFile(broadcastFile, 'utf8'))
        const pathParts = broadcastFile.replace(/\\/g, '/').split('/')
        const chainIdPart = pathParts[pathParts.length - 2]
        if (!chainIdPart)
          continue
        const chainId = Number.parseInt(chainIdPart, 10)
        if (Number.isNaN(chainId))
          continue

        const transactions = broadcast.transactions || []
        for (const tx of transactions) {
          if (tx.transactionType !== 'CREATE' && tx.transactionType !== 'CREATE2')
            continue
          if (tx.contractName && tx.contractAddress) {
            const { contractName, contractAddress } = tx
            result[contractName] ??= {}
            result[contractName][chainId] = contractAddress
          }
          const additionalContracts = tx.additionalContracts || []
          for (const additional of additionalContracts) {
            if (additional.contractName && additional.contractAddress) {
              const { contractName, contractAddress } = additional
              result[contractName] ??= {}
              result[contractName][chainId] = contractAddress
            }
          }
        }
      }
      catch {
        // Ignore parse errors for individual broadcast files
      }
    }

    return result
  }

  const project = resolve(process.cwd(), config.project ?? '')

  let foundryConfig: z.infer<typeof FoundryConfigSchema> = {
    out: 'out',
    src: 'src',
  }
  try {
    const result = spawnSync(
      forgeExecutable,
      ['config', '--json', '--root', project],
      { encoding: 'utf-8', shell: true },
    )
    if (!result.error && result.status === 0 && !result.signal)
      foundryConfig = FoundryConfigSchema.parse(JSON.parse(result.stdout))
  }
  catch {
    // Use defaults if forge config fails
  }
  finally {
    foundryConfig = {
      ...foundryConfig,
      out: artifacts ?? foundryConfig.out,
    }
  }

  const artifactsDirectory = join(project, foundryConfig.out)

  return {
    name: 'foundry',
    async validate() {
      if (!existsSync(project))
        throw new Error(`Foundry project ${gray(config.project ?? '.')} not found.`)

      if (clean || build) {
        try {
          execSync(`${forgeExecutable} --version`, {
            encoding: 'utf-8',
            stdio: 'pipe',
          })
        }
        catch {
          throw new Error(dedent`
            forge must be installed to use Foundry plugin.
            To install, follow the instructions at https://book.getfoundry.sh/getting-started/installation
          `)
        }
      }
    },
    async resolve() {
      if (clean) {
        execSync(`${forgeExecutable} clean --root ${project}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        })
      }
      if (build) {
        execSync(`${forgeExecutable} build --root ${project}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        })
      }

      if (!existsSync(artifactsDirectory))
        throw new Error('Artifacts not found.')

      if (includeBroadcasts) {
        const broadcastDeployments = await getBroadcastDeployments(project)
        allDeployments = { ...broadcastDeployments, ...deployments }
      }

      const artifactPaths = await getArtifactPaths(artifactsDirectory)
      const contracts: Record<string, any> = {}
      const addresses: Addresses = {}

      for (const artifactPath of artifactPaths) {
        const contract = await getContract(artifactPath, allDeployments)
        if (!contract.abi?.length)
          continue

        contracts[contract.name] = contract.abi
        if (contract.address !== undefined) {
          addresses[contract.name] ??= {}
          if (typeof contract.address === 'string') {
            addresses[contract.name]['1'] = contract.address as Address
          }
          else {
            for (const [chainId, addr] of Object.entries(contract.address))
              addresses[contract.name][String(chainId)] = addr as Address
          }
        }
      }

      return { contracts, addresses }
    },
  }
}
