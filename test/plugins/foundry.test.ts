import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { foundry } from '../../src/plugins/foundry'

const fixturesDir = resolve(__dirname, '../fixtures/foundry')

describe('foundry plugin', () => {
  describe('validate', () => {
    it('throws when project does not exist', async () => {
      await expect(
        foundry({ project: '/nonexistent/path/to/project/xyz' }).validate?.(),
      ).rejects.toThrow(/Foundry project .* not found/)
    })

    it('passes when project exists and build/clean is disabled', async () => {
      await expect(
        foundry({
          project: fixturesDir,
          forge: { build: false, clean: false },
        }).validate?.(),
      ).resolves.toBeUndefined()
    })
  })

  describe('resolve', () => {
    it('returns contracts and addresses from foundry artifacts', async () => {
      if (!existsSync(fixturesDir))
        return

      const result = await foundry({
        project: fixturesDir,
        forge: { build: false },
      }).resolve?.()

      expect(result).toBeDefined()
      expect(result?.contracts).toBeDefined()
      expect(result?.contracts?.Counter).toBeDefined()
      expect(Array.isArray(result?.contracts?.Counter)).toBe(true)
      expect(result?.contracts?.Counter).toHaveLength(3)
    })

    it('applies deployments mapping to addresses', async () => {
      if (!existsSync(fixturesDir))
        return

      const result = await foundry({
        project: fixturesDir,
        forge: { build: false },
        deployments: {
          Counter: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        },
      }).resolve?.()

      expect(result?.addresses?.Counter).toBeDefined()
      expect(result?.addresses?.Counter?.['1']).toBe('0x5FbDB2315678afecb367f032d93F642f64180aa3')
    })

    it('applies namePrefix to contract names', async () => {
      if (!existsSync(fixturesDir))
        return

      const result = await foundry({
        project: fixturesDir,
        forge: { build: false },
        namePrefix: 'Foundry',
      }).resolve?.()

      expect(result?.contracts?.FoundryCounter).toBeDefined()
      expect(result?.contracts?.Counter).toBeUndefined()
    })
  })
})
