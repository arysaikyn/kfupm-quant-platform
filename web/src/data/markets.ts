import { marketConstants } from './fundamentals'
import type { Market } from './fundamentals'

/**
 * The three boards the first run offers, and the one place that says which
 * venue each board prices and which index headlines it.
 *
 * This exists because `Market` used to mean two different things: a board
 * ('sa' | 'cn' | 'hk') in the UI store, and a venue ('cn_a' | 'hk' | 'us' |
 * 'sa') in the engine. They overlap on 'sa' and 'hk', which hid the bug: a
 * board id passed where a venue was expected typechecked and then looked up
 * `undefined`. `Board` and `Market` are now distinct names with an explicit
 * mapping, so that mistake cannot compile.
 */

export type Board = 'sa' | 'cn' | 'hk'

export type BoardSpec = {
  id: Board
  /** The venue the engine prices this board in. */
  venue: Market
  /** Index symbol in `data/mock`'s `indices`, the board's masthead. */
  indexSymbol: string
  currency: string
}

export const BOARDS: readonly BoardSpec[] = [
  { id: 'sa', venue: 'sa', indexSymbol: 'TASI', currency: marketConstants('sa').currency },
  { id: 'cn', venue: 'cn_a', indexSymbol: '000001', currency: marketConstants('cn_a').currency },
  { id: 'hk', venue: 'hk', indexSymbol: 'HSI', currency: marketConstants('hk').currency },
]

export const BOARD_IDS: readonly Board[] = BOARDS.map((board) => board.id)

export function isBoard(value: unknown): value is Board {
  return typeof value === 'string' && BOARDS.some((board) => board.id === value)
}

export function boardOf(id: Board): BoardSpec {
  const spec = BOARDS.find((board) => board.id === id)
  if (!spec) throw new Error(`Unknown board: ${id}`)
  return spec
}
