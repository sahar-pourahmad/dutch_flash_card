import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseCSV, fetchChapter, fetchAllChapters } from './sheets'

const csvWithHeader = `word,definition,example
huis,house,"Ik woon in een huis."
auto,car,De auto is rood.
"de kat",the cat,"De kat slaapt."
`

const csvWithEmptyRows = `word,definition,example
boom,tree,
,empty word should be ignored,
fiets,bicycle,Ik rijd op de fiets.
`

describe('parseCSV', () => {
  it('parses basic CSV into word objects', () => {
    const words = parseCSV(csvWithHeader, 'Chapter 1')
    expect(words).toHaveLength(3)
    expect(words[0]).toEqual({
      id: 'Chapter 1__huis',
      word: 'huis',
      definition: 'house',
      example: 'Ik woon in een huis.',
      chapter: 'Chapter 1',
    })
  })

  it('handles quoted fields containing commas', () => {
    const words = parseCSV(csvWithHeader, 'Chapter 1')
    expect(words[2].word).toBe('de kat')
  })

  it('skips rows where the word column is empty', () => {
    const words = parseCSV(csvWithEmptyRows, 'Chapter 1')
    expect(words).toHaveLength(2)
    expect(words.every(w => w.word)).toBe(true)
  })

  it('sets example to empty string when column is missing', () => {
    const words = parseCSV(csvWithEmptyRows, 'Chapter 1')
    expect(words[0].example).toBe('')
  })

  it('generates correct id from tabName and word', () => {
    const words = parseCSV(csvWithHeader, 'Chapter 2')
    expect(words[0].id).toBe('Chapter 2__huis')
    expect(words[0].chapter).toBe('Chapter 2')
  })
})

describe('fetchChapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => csvWithHeader,
    }))
  })

  it('fetches the correct URL', async () => {
    await fetchChapter('SHEET123', 'Chapter 1')
    expect(fetch).toHaveBeenCalledWith(
      'https://docs.google.com/spreadsheets/d/SHEET123/gviz/tq?tqx=out:csv&sheet=Chapter%201'
    )
  })

  it('returns parsed words with correct chapter', async () => {
    const words = await fetchChapter('SHEET123', 'Chapter 1')
    expect(words).toHaveLength(3)
    expect(words[0].chapter).toBe('Chapter 1')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }))
    await expect(fetchChapter('SHEET123', 'Chapter 1')).rejects.toThrow('403')
  })
})

describe('fetchAllChapters', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => csvWithHeader,
    }))
  })

  it('fetches all chapters and concatenates results', async () => {
    const words = await fetchAllChapters('SHEET123', ['Chapter 1', 'Chapter 2'])
    expect(words).toHaveLength(6) // 3 words × 2 chapters
  })
})
