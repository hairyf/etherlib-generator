/* eslint-disable ts/no-redeclare */
import type { Arrayable } from '@hairy/utils'
import type { Chain, Config, Output, PluginBuildConfig, PluginBuildResolved, SimpleChain, UserChains } from './config'
import type { ViemChain } from './config/viem'
import { writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { merge } from '@hairy/utils'
import { ensureDir, remove } from 'fs-extra'
import pc from 'picocolors'
import { loadConfig } from 'unconfig'
import { z } from 'zod'
import { APP_NAME } from './constants'
import { fromZodError } from './errors'
import { logger } from './utils'

export type GenerateOptions = z.infer<typeof GenerateOptions>
const GenerateOptions = z.object({
  /** Path to config file */
  config: z.string().optional(),
  /** Directory to search for config file */
  root: z.string().optional(),
  /** Watch for file system changes to config and plugins */
  // watch: z.boolean().optional(),
})

export async function generate(options: GenerateOptions = {}): Promise<void> {
  await verify(options)

  const { config, sources } = await loadConfig<Arrayable<Config>>({
    sources: [{ files: `${APP_NAME}.config` }],
  })
  const isArrayConfig = Array.isArray(config)
  const configs = isArrayConfig ? config : [config]

  if (!sources.length) {
    if (options.config)
      throw new Error(`Config not found at ${pc.gray(options.config)}`)
    throw new Error('Config not found')
  }
  const outputNames = new Set<string>()

  for (const config of configs) {
    if (isArrayConfig)
      logger.log(`Using config ${pc.gray(basename(sources[0]))}`)
    if (!config.output)
      throw new Error('output is required.')

    // Collect contracts and watch configs from plugins
    const plugins = (config.plugins ?? []).map((x, i) => ({
      ...x,
      id: `${x.name}-${i}`,
    }))
    const spinner = logger.spinner('Validating plugins')
    spinner.start()
    for (const plugin of plugins)
      await plugin.validate?.()
    spinner.success()

    const resolved: PluginBuildConfig = {
      contracts: {},
      chains: {},
      addresses: {},
    }

    spinner.start('Resolving options')
    // Add plugin build to config
    for (const plugin of plugins) {
      if (plugin.resolve)
        merge(resolved, await plugin.resolve())
    }

    if (config.fragments)
      merge(resolved.contracts, config.fragments)
    if (config.contracts) {
      for (const c of config.contracts) {
        resolved.contracts[c.name] = c.abi
        if (c.address !== undefined) {
          resolved.addresses[c.name] ??= {}
          if (typeof c.address === 'string') {
            resolved.addresses[c.name][1] = c.address
          }
          else {
            for (const [chainId, addr] of Object.entries(c.address))
              resolved.addresses[c.name][Number(chainId)] = addr
          }
        }
      }
    }
    if (config.chains) {
      const chainsToMerge: UserChains = Array.isArray(config.chains)
        ? Object.fromEntries(
            config.chains.map((chain, i) => {
              const name = chain.name ?? `chain${i}`
              const alias = name.charAt(0).toLowerCase() + name.slice(1)
              return [alias, chain]
            }),
          )
        : config.chains
      merge(resolved.chains, chainsToMerge)
    }
    if (config.addresses)
      merge(resolved.addresses, config.addresses)

    spinner.success()

    const handled: PluginBuildResolved = {
      chains: {},
      addresses: resolved.addresses,
      contracts: resolved.contracts,
    }

    for (const alias in resolved.chains) {
      if (Reflect.get(resolved.chains[alias], 'rpcUrls')) {
        const chain = resolved.chains[alias] as ViemChain
        chain.contracts ??= {}
        for (const name in chain.contracts) {
          if (typeof chain.contracts[name] === 'string')
            chain.contracts[name] = { address: chain.contracts[name] }
        }
        handled.chains[alias] = chain as Chain
        continue
      }
      const chain = resolved.chains[alias] as SimpleChain
      handled.chains[alias] = {
        blockExplorers: chain.explorer ? { default: chain.explorer } : undefined,
        rpcUrls: { default: { http: [chain.rpc] } },
        nativeCurrency: chain.currency!,
        testnet: chain.testnet,
        name: chain.name!,
        icon: chain.icon,
        id: chain.id!,
      }
    }

    for (const alias in handled.chains) {
      const chain = handled.chains[alias]
      chain.contracts ??= {}
      for (const name in handled.addresses) {
        if (typeof handled.addresses[name][chain.id] === 'string')
          chain.contracts[name] = { address: handled.addresses[name][chain.id] }
      }
      for (const name in chain.contracts) {
        const address = chain.contracts[name]?.address
        if (address) {
          handled.addresses[name] ??= {}
          handled.addresses[name][chain.id] ??= address
        }
      }
    }

    // Run plugins
    const files: Output[] = []
    for (const plugin of plugins) {
      if (plugin.run)
        files.push(...(await plugin.run(handled) || []))
    }

    const outputs = Array.isArray(config.output) ? config.output : [config.output]

    // Write outputs
    for (const output of outputs) {
      if (outputNames.has(output))
        throw new Error(`out "${config.output}" must be unique.`)
      outputNames.add(output)
      await remove(output)
      spinner.start(`Writing to ${pc.gray(output)}`)
      for (const file of files) {
        const filepath = `${output}/${file.id}`
        const contents = [
          file.imports,
          file.prepend,
          file.content,
        ]
        const code = contents.filter(Boolean).join('\n\n')
        await ensureDir(dirname(filepath))
        await writeFile(filepath, code, 'utf-8')
      }
      spinner.success()
    }
  }
}

async function verify(options: GenerateOptions = {}): Promise<void> {
  // Validate command line options
  try {
    await GenerateOptions.parseAsync(options)
  }
  catch (error) {
    if (error instanceof z.ZodError)
      throw fromZodError(error, { prefix: 'Invalid option' })
    throw error
  }
}
