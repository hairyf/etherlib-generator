import type { GenerateOptions } from '../generate'
import process from 'node:process'
import { cac } from 'cac'
import { APP_NAME } from '../constants'
import { generate } from '../generate'
import { logger } from '../utils'

const cli = cac(APP_NAME)

cli
  .command('generate', 'generate code based on configuration')
  .option('-c, --config <path>', '[string] path to config file')
  .option('-r, --root <path>', '[string] root path to resolve config from')
  .example(name => `${name} generate`)
  .action(async (options: GenerateOptions) => {
    await generate(options)
    process.exit(0)
  })

void (async () => {
  try {
    process.title = `node (${APP_NAME})`
  }
  catch {}

  try {
    // Parse CLI args without running command
    cli.parse(process.argv, { run: false })
    if (!cli.matchedCommand) {
      if (cli.args.length === 0) {
        if (!cli.options.help && !cli.options.version)
          cli.outputHelp()
      }
      else {
        throw new Error(`Unknown command: ${cli.args.join(' ')}`)
      }
    }
    await cli.runMatchedCommand()
  }
  catch (error) {
    logger.error(`\n${(error as Error).message}`)
    process.exit(1)
  }
})()
