export function SectionHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mt-6">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {hint && (
        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}
