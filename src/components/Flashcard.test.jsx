import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Flashcard from './Flashcard'
import { AGAIN, GOOD } from '../lib/sm2'

const word = {
  id: 'Ch1__huis',
  word: 'huis',
  definition: 'house',
  example: 'Ik woon in een huis.',
  chapter: 'Chapter 1',
}

describe('Flashcard', () => {
  it('shows the Dutch word on front', () => {
    render(<Flashcard word={word} onRate={vi.fn()} />)
    expect(screen.getByText('huis')).toBeInTheDocument()
  })

  it('does not show definition before flip', () => {
    render(<Flashcard word={word} onRate={vi.fn()} />)
    expect(screen.queryByText('house')).not.toBeVisible()
  })

  it('reveals definition after clicking the card', () => {
    render(<Flashcard word={word} onRate={vi.fn()} />)
    fireEvent.click(screen.getByTestId('flashcard'))
    expect(screen.getByText('house')).toBeVisible()
  })

  it('shows example sentence after flip', () => {
    render(<Flashcard word={word} onRate={vi.fn()} />)
    fireEvent.click(screen.getByTestId('flashcard'))
    expect(screen.getByText('Ik woon in een huis.')).toBeVisible()
  })

  it('shows rating buttons after flip', () => {
    render(<Flashcard word={word} onRate={vi.fn()} />)
    fireEvent.click(screen.getByTestId('flashcard'))
    expect(screen.getByText('Again')).toBeInTheDocument()
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('calls onRate with AGAIN quality when Again is clicked', () => {
    const onRate = vi.fn()
    render(<Flashcard word={word} onRate={onRate} />)
    fireEvent.click(screen.getByTestId('flashcard'))
    fireEvent.click(screen.getByText('Again'))
    expect(onRate).toHaveBeenCalledWith(AGAIN)
  })

  it('calls onRate with GOOD quality when Good is clicked', () => {
    const onRate = vi.fn()
    render(<Flashcard word={word} onRate={onRate} />)
    fireEvent.click(screen.getByTestId('flashcard'))
    fireEvent.click(screen.getByText('Good'))
    expect(onRate).toHaveBeenCalledWith(GOOD)
  })
})
