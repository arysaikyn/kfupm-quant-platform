export type TreemapTile = {
  key: string
  label: string
  /** Identity under the name: the ticker, and the button's accessible name. */
  sub: string
  change: number
  weight: number
}

export type TreemapGroup = {
  id: string
  label: string
  change: number
  weight: number
  tiles: TreemapTile[]
}

type Props = {
  groups: TreemapGroup[]
  /** CSS colour values for the two directions, so the theme decides the hues. */
  up: string
  down: string
  onPick: (key: string) => void
  /** A band header navigates when this is set; otherwise it is a plain label. */
  onGroup?: (id: string) => void
  selected?: string | null
  selectedGroup?: string | null
  formatChange: (change: number) => string
}

/** Four steps per direction, Finviz-style. A continuous gradient makes a +0.3%
    day look like a rout next to a +2% one, and the printed number already
    carries the magnitude — the tint only has to answer "up or down, roughly". */
const EDGES = [0.005, 0.01, 0.02]
const MIX = [16, 28, 42, 58]

function stepOf(change: number): number {
  const size = Math.abs(change)
  const i = EDGES.findIndex((edge) => size < edge)
  return i === -1 ? EDGES.length : i
}

/**
 * Sector → stock map in plain flexbox: bands grow with the sector weight,
 * tiles grow with theirs. No canvas, no layout library, no measurement — the
 * only arithmetic is the flex shares, which CSS does itself.
 */
export function Treemap({
  groups,
  up,
  down,
  onPick,
  onGroup,
  selected,
  selectedGroup,
  formatChange,
}: Props) {
  if (groups.length === 0) return null

  // Bands wrap instead of squeezing: seven sectors in one 358px row left the
  // last two at ~8px. Each band keeps a 96px floor and grows by weight.
  const deepest = groups.reduce((n, g) => Math.max(n, g.tiles.length), 1)
  const bandHeight = Math.max(132, Math.min(210, deepest * 44 + 30))

  return (
    <div
      className="grid w-full gap-1"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))',
        gridAutoRows: bandHeight,
      }}
    >
      {groups.map((group) => {
        const groupTone = group.change >= 0 ? up : down
        const focused = selectedGroup === group.id

        const head = (
          <>
            <span
              className="block max-w-full truncate text-2xs leading-tight font-medium"
              style={focused ? { color: 'var(--color-accent)' } : undefined}
            >
              {group.label}
            </span>
            <span
              className="num block max-w-full truncate text-2xs leading-tight"
              style={{ color: groupTone }}
            >
              {formatChange(group.change)}
            </span>
          </>
        )

        return (
          <div
            key={group.id}
            className="flex min-w-0 flex-col"
          >
            {onGroup ? (
              <button
                type="button"
                onClick={() => onGroup(group.id)}
                className="mb-1 flex min-w-0 flex-col items-start rounded-sm px-0.5 text-start transition-opacity active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {head}
              </button>
            ) : (
              <div className="mb-1 flex min-w-0 flex-col items-start px-0.5">{head}</div>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-1">
              {group.tiles.map((tile) => {
                const tone = tile.change >= 0 ? up : down
                const mix = MIX[stepOf(tile.change)]
                const picked = selected === tile.key
                return (
                  <button
                    key={tile.key}
                    type="button"
                    aria-pressed={picked}
                    aria-label={`${tile.label} · ${tile.sub} · ${formatChange(tile.change)}`}
                    onClick={() => onPick(tile.key)}
                    className="flex min-h-11 min-w-0 flex-col justify-between gap-1 overflow-hidden rounded-[10px] px-1 py-1 text-start transition-[background-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                    style={{
                      flexGrow: tile.weight,
                      flexBasis: 0,
                      background: `color-mix(in srgb, ${tone} ${mix}%, var(--color-surface))`,
                      border: `1px solid color-mix(in srgb, ${tone} ${Math.min(mix + 18, 80)}%, var(--color-line))`,
                      boxShadow: picked ? 'inset 0 0 0 2px var(--color-accent)' : undefined,
                    }}
                  >
                    <span className="block max-w-full truncate text-2xs leading-tight font-medium">
                      {tile.label}
                    </span>
                    <span className="num block max-w-full truncate text-2xs leading-none">
                      {formatChange(tile.change)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
