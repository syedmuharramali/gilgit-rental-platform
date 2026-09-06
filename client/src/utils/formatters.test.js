import { describe, expect, it } from 'vitest'
import { dateTime, money, pretty, shortDate } from './formatters'

describe('formatters', () => {
  it('formats PKR amounts', () => {
    expect(money(18000)).toBe('PKR 18,000')
  })

  it('prettifies enum-style values', () => {
    expect(pretty('semi_furnished')).toBe('Semi Furnished')
    expect(pretty('pending_review')).toBe('Pending Review')
  })

  it('uses a dash for missing dates', () => {
    expect(shortDate()).toBe('—')
    expect(dateTime(null)).toBe('—')
  })

  it('returns readable dates for valid input', () => {
    expect(shortDate('2026-09-05T00:00:00.000Z')).not.toBe('—')
    expect(dateTime('2026-09-05T12:30:00.000Z')).not.toBe('—')
  })
})
