/* eslint-disable ts/no-redeclare */
import type { Arrayable } from '@hairy/utils'
import type { Chain, Config, Output, PluginBuildConfig, PluginBuildResolved, SimpleChain } from './config'
import type { ViemChain } from './config/viem'
import { writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { merge } from '@hairy/utils'
import { loadConfig } from 'c12'
import { ensureDir } from 'fs-extra'
import pc from 'picocolors'
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

  const { config, configFile } = await loadConfig<Arrayable<Config>>({ configFile: `${APP_NAME}.config` })
  const isArrayConfig = Array.isArray(config)
  const configs = isArrayConfig ? config : [config]

  if (!configFile) {
    if (options.config)
      throw new Error(`Config not found at ${pc.gray(options.config)}`)
    throw new Error('Config not found')
  }

  const outputNames = new Set<string>()

  for (const config of configs) {
    if (isArrayConfig)
      logger.log(`Using config ${pc.gray(basename(configFile))}`)
    if (!config.output)
      throw new Error('output is required.')
    if (outputNames.has(config.output))
      throw new Error(`out "${config.output}" must be unique.`)
    outputNames.add(config.output)

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
    if (config.chains)
      merge(resolved.chains, config.chains)
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
      for (const name in handled.addresses?.[chain.id]) {
        if (typeof handled.addresses[chain.id][name] === 'string')
          chain.contracts[name] = { address: handled.addresses[chain.id][name] }
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
    const outputs: Output[] = []
    for (const plugin of plugins) {
      if (plugin.run)
        outputs.push(...(await plugin.run(handled) || []))
    }

    // Write outputs
    spinner.start(`Writing to ${pc.gray(config.output)}`)
    for (const output of outputs) {
      const filepath = `${config.output}/${output.id}`
      const contents = [
        output.imports,
        output.prepend,
        output.content,
      ]
      const code = contents.filter(Boolean).join('\n\n')
      await ensureDir(dirname(filepath))
      await writeFile(filepath, code, 'utf-8')
    }
    spinner.success()
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
