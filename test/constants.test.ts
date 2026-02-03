import { describe, expect, it } from 'vitest'
import { APP_NAME } from '../src/constants'

describe('constants', () => {
  it('aPP_NAME is etherlib', () => {
    expect(APP_NAME).toBe('etherlib')
  })
})
