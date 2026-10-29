import { describe, expect, it } from 'vitest'
import type { PaperAccount } from '../api/ai'
import type { PaperPosition } from '../lib/positions'
import {
  accountLedger,
  createPaperSnapshot,
  diffLedgers,
  rewindPreview,
  snapshotLedger,
} from './paper'
import type { PaperLedger } from './paper'

function account(positions: PaperPosition[], cash = 100_000, unreadable = 0): PaperAccount {
  return {
    id: 'acc-1',
    label: 'Demo account',
    market: 'sa',
    currency: 'SAR',
    start_on: '2026-01-02',
    last_date: '2026-10-23',
    revision: 1,
    account_state: { cash, positions, unreadable },
  }
}

describe('paper checkpoints', () => {
  it('counts the positions it cannot name instead of dropping them silently', () => {
    const ledger = accountLedger(
      account([{ symbol: '2222', quantity: 40 }], 100_000, 2),
    )
    expect(ledger.positions).toEqual([{ symbol: '2222', quantity: 40 }])
    expect(ledger.positionCount).toBe(3)
    expect(ledger.cash).toBe(100_000)
  })

  it('diffs by symbol with a stable order and a signed cash delta', () => {
    const before: PaperLedger = {
      cash: 100_000,
      positions: [
        { symbol: '2222', quantity: 40 },
        { symbol: '1120', quantity: 10 },
      ],
      positionCount: 2,
    }
    const after: PaperLedger = {
      cash: 98_000.5,
      positions: [
        { symbol: '2010', quantity: 5 },
        { symbol: '2222', quantity: 40 },
      ],
      positionCount: 2,
    }
    const diff = diffLedgers(before, after)
    expect(diff.added.map((p) => p.symbol)).toEqual(['2010'])
    expect(diff.dropped.map((p) => p.symbol)).toEqual(['1120'])
    expect(diff.cashDelta).toBe(-1999.5)
    expect(diff.positionCountDelta).toBe(0)
    expect(diff.unchanged).toBe(1)
  })

  it('reports no change for an unchanged ledger', () => {
    const before: PaperLedger = {
      cash: 100_000,
      positions: [{ symbol: '2222', quantity: 1 }],
      positionCount: 1,
    }
    const diff = diffLedgers(before, { ...before })
    expect(diff.added).toEqual([])
    expect(diff.dropped).toEqual([])
    expect(diff.cashDelta).toBe(0)
    expect(diff.positionCountDelta).toBe(0)
  })

  it('flips the diff for a rewind preview', () => {
    const snapshot = createPaperSnapshot(
      account([{ symbol: '2222', quantity: 40 }], 90_000),
      'Before rebalance',
      1_700_000_000_000,
      'cp-1',
    )
    expect(snapshot).not.toBeNull()
    if (!snapshot) return

    const current: PaperLedger = {
      cash: 95_000,
      positions: [{ symbol: '2010', quantity: 8 }],
      positionCount: 1,
    }
    const preview = rewindPreview(snapshot, current)
    expect(preview.added.map((p) => p.symbol)).toEqual(['2222'])
    expect(preview.dropped.map((p) => p.symbol)).toEqual(['2010'])
    expect(preview.cashDelta).toBe(-5000)
    expect(snapshotLedger(snapshot).cash).toBe(90_000)
  })

  it('labels the snapshot as demo and rejects an empty name', () => {
    expect(createPaperSnapshot(account([]), '   ')).toBeNull()
    const snapshot = createPaperSnapshot(account([]), '  October close  ', 1, 'cp-2')
    expect(snapshot?.label).toBe('October close')
    expect(snapshot?.demo).toBe(true)
    expect(snapshot?.accountId).toBe('acc-1')
  })
})
