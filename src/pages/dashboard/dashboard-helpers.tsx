import React from 'react'

export const fmt = (v?: number | string) => {
  if (v === undefined || v === null) return '--'
  const n = typeof v === 'string' ? Number(v) : v
  if (Number.isNaN(n)) return String(v)
  return n.toLocaleString('en-IN')
}

export const fmtCurrency = (v?: number | string) => {
  if (v === undefined || v === null) return '--'
  const n = typeof v === 'string' ? Number(v) : v
  if (Number.isNaN(n)) return String(v)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export const fmtDate = (v?: string) => {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export const fmtPct = (n?: number) =>
  n !== undefined && n !== null ? `${Number(n).toFixed(1)}%` : '--'

// ── Donut Chart ────────────────────────────────────────────────────────────────
type Slice = { label: string; value: number; color: string }

export function DonutChart({
  slices,
  size = 140,
  stroke = 26,
  center,
}: {
  slices: Slice[]
  size?: number
  stroke?: number
  center?: React.ReactNode
}) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0)
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  let off = 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {total === 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#e2e8f0"
            strokeWidth={stroke}
            fill="none"
          />
        ) : (
          slices.map((sl) => {
            const dash = (Math.max(0, sl.value) / total) * circ
            const el = (
              <circle
                key={sl.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={sl.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`}
                strokeDashoffset={-off}
                fill="none"
                strokeLinecap="butt"
              />
            )
            off += dash
            return el
          })
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {center}
      </div>
    </div>
  )
}

// ── Sparkline (SVG polyline) ───────────────────────────────────────────────────
export function Sparkline({
  values,
  color = '#667eea',
  height = 40,
  width = 120,
}: {
  values: number[]
  color?: string
  height?: number
  width?: number
}) {
  if (!values.length) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Bar Chart (horizontal) ─────────────────────────────────────────────────────
export function HBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: color,
        }}
      />
    </div>
  )
}

// ── Progress Ring ──────────────────────────────────────────────────────────────
export function ProgressRing({
  pct,
  size = 80,
  stroke = 8,
  color = '#667eea',
  children,
}: {
  pct: number
  size?: number
  stroke?: number
  color?: string
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circ
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#e2e8f0"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ── Vertical Bar Chart ─────────────────────────────────────────────────────────
export function VBarChart({
  data,
  height = 120,
  color = '#667eea',
}: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <div
            className="w-full rounded-t-sm transition-all duration-700"
            style={{
              height: `${(d.value / max) * (height - 20)}px`,
              background: color,
              opacity: 0.7 + (d.value / max) * 0.3,
            }}
          />
          <span className="text-[9px] text-gray-400 truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
export function StatCard({
  title,
  value,
  sub,
  gradient,
  icon,
  badge,
}: {
  title: string
  value: string | number
  sub?: string
  gradient: string
  icon: string
  badge?: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default"
      style={{ background: gradient }}
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            {sub && <p className="mt-1 text-xs text-white/60">{sub}</p>}
          </div>
          <div className="text-2xl opacity-80">{icon}</div>
        </div>
        {badge && (
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
            {badge}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section Card ───────────────────────────────────────────────────────────────
export function Card({
  title,
  icon,
  children,
  className = '',
}: {
  title: string
  icon?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        {icon && <span className="text-lg">{icon}</span>}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Mini legend row ────────────────────────────────────────────────────────────
export function LegendRow({
  label,
  value,
  pct,
  color,
}: {
  label: string
  value: number | string
  pct?: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span className="text-gray-600 capitalize">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{fmt(value)}</span>
          {pct !== undefined && (
            <span className="text-gray-400">{fmtPct(pct)}</span>
          )}
        </div>
      </div>
      {pct !== undefined && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, pct)}%`, background: color }}
          />
        </div>
      )}
    </div>
  )
}
