import { describe, it, expect, beforeEach } from 'vitest'
import { saveWords, getWords, getProgress, saveProgress, getAllProgress, getMeta, setMeta } from './db'

// idb uses indexedDB global — jsdom provides a fake implementation via fake-indexeddb
import 'fake-indexeddb/auto'

const sampleWords = [
  { id: 'Ch1__huis', word: 'huis', definition: 'house', example: 'Ik woon in een huis.', chapter: 'Chapter 1' },
  { id: 'Ch1__auto', word: 'auto', definition: 'car', example: 'De auto is rood.', chapter: 'Chapter 1' },
]

const sampleProgress = {
  id: 'Ch1__huis',
  interval: 6,
  repetitions: 2,
  efactor: 2.5,
  dueDate: '2026-02-01T00:00:00.000Z',
}

describe('words store', () => {
  it('saves and retrieves words', async () => {
    await saveWords(sampleWords)
    const words = await getWords()
    expect(words).toHaveLength(2)
    // IndexedDB returns records in key order; 'Ch1__auto' < 'Ch1__huis' alphabetically,
    // so we check membership rather than position.
    expect(words.some(w => w.word === 'huis')).toBe(true)
    expect(words.some(w => w.word === 'auto')).toBe(true)
  })
})

describe('progress store', () => {
  it('returns undefined for unknown card', async () => {
    const p = await getProgress('unknown')
    expect(p).toBeUndefined()
  })

  it('saves and retrieves progress for a card', async () => {
    await saveProgress(sampleProgress)
    const p = await getProgress('Ch1__huis')
    expect(p.interval).toBe(6)
    expect(p.efactor).toBe(2.5)
  })

  it('getAllProgress returns all saved progress', async () => {
    await saveProgress(sampleProgress)
    const all = await getAllProgress()
    expect(all.length).toBeGreaterThanOrEqual(1)
    expect(all.some(p => p.id === 'Ch1__huis')).toBe(true)
  })
})

describe('meta store', () => {
  it('returns undefined for missing key', async () => {
    const val = await getMeta('nonexistent')
    expect(val).toBeUndefined()
  })

  it('saves and retrieves a meta value', async () => {
    await setMeta('streak', 5)
    const val = await getMeta('streak')
    expect(val).toBe(5)
  })

  it('overwrites existing meta value', async () => {
    await setMeta('lastStudy', '2026-01-01')
    await setMeta('lastStudy', '2026-01-02')
    const val = await getMeta('lastStudy')
    expect(val).toBe('2026-01-02')
  })
})
