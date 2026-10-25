import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { AgentMarkdown } from './Markdown'
import { metricRegistry } from './numerals'

describe('numeral trace in markdown', () => {
  it('marks bound and unbound numbers and reports clicks', () => {
    const onTrace = vi.fn()
    const { container } = render(
      <AgentMarkdown
        text={'Return +12.30% and 14.20% elsewhere.'}
        trace={{
          metrics: metricRegistry({ total_return: 0.123 }, 'en'),
          tracedLabel: 'Traced',
          untracedLabel: 'Not traced',
          onTrace,
        }}
      />,
    )
    const bound = container.querySelector('[data-metric="total_return"]')
    expect(bound).not.toBeNull()
    expect(bound?.textContent).toBe('+12.30%')
    expect(bound?.getAttribute('class')).toContain('underline')
    if (bound) fireEvent.click(bound)
    expect(onTrace).toHaveBeenCalledWith('total_return')

    const struck = container.querySelectorAll('.line-through')
    expect(struck).toHaveLength(1)
    expect(struck[0].textContent).toBe('14.20%')
    expect(struck[0].getAttribute('title')).toBe('Not traced')
  })

  it('leaves code fences undecorated', () => {
    const { container } = render(
      <AgentMarkdown
        text={'```\n+12.30%\n```'}
        trace={{
          metrics: metricRegistry({ total_return: 0.123 }, 'en'),
          tracedLabel: 'Traced',
          untracedLabel: 'Not traced',
        }}
      />,
    )
    expect(container.querySelector('[data-metric]')).toBeNull()
    expect(container.querySelector('code')?.textContent).toContain('+12.30%')
  })
})
