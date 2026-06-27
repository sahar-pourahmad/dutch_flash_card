import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextReview, isDue, isLearned, AGAIN, HARD, GOOD, EASY, LEARNED_INTERVAL } from './sm2'

describe('nextReview', () => {
  it('new card rated AGAIN resets to interval=1, repetitions=0', () => {
    const result = nextReview({}, AGAIN)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  it('new card rated GOOD gives interval=1, repetitions=1', () => {
    const result = nextReview({}, GOOD)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
  })

  it('first successful review gives interval=6, repetitions=2', () => {
    const card = { interval: 1, repetitions: 1, efactor: 2.5 }
    const result = nextReview(card, GOOD)
    expect(result.interval).toBe(6)
    expect(result.repetitions).toBe(2)
  })

  it('second successful review multiplies interval by efactor', () => {
    const card = { interval: 6, repetitions: 2, efactor: 2.5 }
    const result = nextReview(card, GOOD)
    expect(result.interval).toBe(15) // round(6 * 2.5)
    expect(result.repetitions).toBe(3)
  })

  it('AGAIN on a mature card resets repetitions to 0', () => {
    const card = { interval: 15, repetitions: 3, efactor: 2.5 }
    const result = nextReview(card, AGAIN)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  it('efactor decreases on HARD', () => {
    const card = { interval: 1, repetitions: 1, efactor: 2.5 }
    const result = nextReview(card, HARD)
    expect(result.efactor).toBeLessThan(2.5)
  })

  it('efactor increases on EASY', () => {
    const card = { interval: 1, repetitions: 1, efactor: 2.5 }
    const result = nextReview(card, EASY)
    expect(result.efactor).toBeGreaterThan(2.5)
  })

  it('efactor never drops below 1.3', () => {
    let card = { interval: 1, repetitions: 1, efactor: 1.3 }
    const result = nextReview(card, HARD)
    expect(result.efactor).toBeGreaterThanOrEqual(1.3)
  })

  it('dueDate is in the future by interval days', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    vi.setSystemTime(now)
    const result = nextReview({}, GOOD)
    const due = new Date(result.dueDate)
    const tomorrow = new Date('2026-01-02T00:00:00.000Z')
    expect(due.toDateString()).toBe(tomorrow.toDateString())
    vi.useRealTimers()
  })
})

describe('isDue', () => {
  it('card with no dueDate is always due', () => {
    expect(isDue({})).toBe(true)
  })

  it('card due in the past is due', () => {
    expect(isDue({ dueDate: new Date(Date.now() - 86400000).toISOString() })).toBe(true)
  })

  it('card due in the future is not due', () => {
    expect(isDue({ dueDate: new Date(Date.now() + 86400000).toISOString() })).toBe(false)
  })
})

describe('isLearned', () => {
  it('card with no interval is not learned', () => {
    expect(isLearned({})).toBe(false)
  })

  it(`card with interval >= ${LEARNED_INTERVAL} is learned`, () => {
    expect(isLearned({ interval: LEARNED_INTERVAL })).toBe(true)
    expect(isLearned({ interval: LEARNED_INTERVAL + 10 })).toBe(true)
  })

  it(`card with interval < ${LEARNED_INTERVAL} is not learned`, () => {
    expect(isLearned({ interval: LEARNED_INTERVAL - 1 })).toBe(false)
  })
})
