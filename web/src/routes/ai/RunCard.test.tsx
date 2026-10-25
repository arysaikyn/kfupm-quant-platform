import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { I18nProvider } from '../../i18n'
import type { RunPreview } from '../../api/ai'
import { RunCard } from './RunCard'

const run: RunPreview = {
  metrics: { total_return: 0.123, sharpe: 1.2 },
  equity_curve: [],
  report_worthy: true,
}

describe('run card', () => {
  it('pulses only the traced metric and keeps the card formatting', () => {
    const { container } = render(
      <I18nProvider>
        <RunCard run={run} pulseMetric="sharpe" />
      </I18nProvider>,
    )
    expect(container.querySelector('[data-run-metric="sharpe"]')?.className).toContain(
      'animate-pulse',
    )
    expect(
      container.querySelector('[data-run-metric="total_return"]')?.className ?? '',
    ).not.toContain('animate-pulse')
    expect(container.textContent).toContain('12.30')
  })
})
