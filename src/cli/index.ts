import type { GenerateOptions } from '../generate'
import process from 'node:process'
import { defineCommand, runMain } from 'citty'
import { APP_NAME } from '../constants'
import { generate } from '../generate'
import { logger } from '../utils'

const generateCommand = defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate code based on configuration',
  },
  args: {
    config: {
      type: 'string',
      alias: 'c',
      description: 'Path to config file',
    },
    root: {
      type: 'string',
      alias: 'r',
      description: 'Root path to resolve config from',
    },
  },
  run: async ({ args }) => {
    await generate(args as GenerateOptions)
    process.exit(0)
  },
})

const main = defineCommand({
  meta: {
    name: APP_NAME,
    description: 'Manage and generate different ethereum library codes from config',
  },
  subCommands: {
    generate: generateCommand,
  },
})

void runMain(main).catch((error) => {
  logger.error(`\n${(error as Error).message}`)
  process.exit(1)
})
