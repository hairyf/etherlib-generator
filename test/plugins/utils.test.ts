import { describe, expect, it } from 'vitest'
import { getBannerContent } from '../../src/plugins/utils'

describe('plugins/utils', () => {
  describe('getBannerContent', () => {
    it('returns banner with given name', () => {
      const banner = getBannerContent({ name: 'MyContract' })
      expect(banner).toContain('MyContract')
      expect(banner).toContain('////////////////////////////////////////////////////////////////////')
    })

    it('uses dedent so no leading indentation', () => {
      const banner = getBannerContent({ name: 'X' })
      expect(banner).not.toMatch(/^\s+\/\//)
    })
  })
})
