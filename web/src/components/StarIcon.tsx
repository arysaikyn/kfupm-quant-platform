/**
 * The watchlist star, sized for a 44px row. It was copied into four screens
 * (market, sector, search, watchlists); one copy means one stroke weight when
 * the icon is refined.
 */
export function StarIcon({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="M12 3.6l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.62 6.9 19.3l.98-5.68L3.75 9.6l5.7-.83z" />
    </svg>
  )
}
