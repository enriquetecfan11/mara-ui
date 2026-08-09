interface SliderProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  onCommit?: (value: number) => void
  label?: string
}

export function Slider({ value, min = 0, max = 100, onChange, onCommit, label }: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {label ? <span className="text-sm text-dim">{label}</span> : null}
        <span className="font-mono text-xs text-faint tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        className="mara-range"
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={(e) => onCommit?.(Number((e.target as HTMLInputElement).value))}
        onKeyUp={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            onCommit?.(value)
          }
        }}
      />
    </div>
  )
}
