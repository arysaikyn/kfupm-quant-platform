import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { useLongPress } from './useLongPress'

function Probe() {
  const [count, setCount] = useState(0)
  const handlers = useLongPress(() => setCount((n) => n + 1), { ms: 400, slop: 8 })
  return (
    <button type="button" {...handlers}>
      {count}
    </button>
  )
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useLongPress', () => {
  it('fires after the hold threshold', () => {
    render(<Probe />)
    const button = screen.getByRole('button')
    fireEvent.pointerDown(button, { pointerType: 'touch', clientX: 10, clientY: 10, button: 0 })
    act(() => vi.advanceTimersByTime(420))
    expect(button.textContent).toBe('1')
  })

  it('cancels when the finger moves past the slop', () => {
    render(<Probe />)
    const button = screen.getByRole('button')
    fireEvent.pointerDown(button, { pointerType: 'touch', clientX: 10, clientY: 10, button: 0 })
    fireEvent.pointerMove(button, { pointerType: 'touch', clientX: 30, clientY: 10 })
    act(() => vi.advanceTimersByTime(500))
    expect(button.textContent).toBe('0')
  })

  it('cancels on pointer up', () => {
    render(<Probe />)
    const button = screen.getByRole('button')
    fireEvent.pointerDown(button, { pointerType: 'touch', clientX: 10, clientY: 10, button: 0 })
    fireEvent.pointerUp(button)
    act(() => vi.advanceTimersByTime(500))
    expect(button.textContent).toBe('0')
  })
})
