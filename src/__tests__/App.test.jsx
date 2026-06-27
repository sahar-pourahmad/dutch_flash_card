import 'fake-indexeddb/auto'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App.jsx'

describe('App routing', () => {
  it('renders Dashboard at /', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('Dutch Words')).toBeInTheDocument()
  })

  it('renders ReviewSession at /review', () => {
    window.history.pushState({}, '', '/review')
    render(<App />)
    expect(screen.getByText('Loading cards...')).toBeInTheDocument()
  })
})

describe('config exports', () => {
  it('exports SPREADSHEET_ID and CHAPTERS', async () => {
    const { SPREADSHEET_ID, CHAPTERS } = await import('../config.js')
    expect(typeof SPREADSHEET_ID).toBe('string')
    expect(Array.isArray(CHAPTERS)).toBe(true)
    expect(CHAPTERS.length).toBeGreaterThan(0)
  })
})
