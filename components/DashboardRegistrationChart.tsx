'use client'

import { useCallback, useMemo, useState, type MouseEvent } from 'react'

import type { DailyRegistrationCount } from '@/lib/admin-types'
import { cn } from '@/utils'

type DashboardRegistrationChartProps = {
  title: string
  data: DailyRegistrationCount[]
  color: string
  className?: string
}

const CHART_WIDTH = 800
const CHART_HEIGHT = 200
const PADDING = { top: 20, right: 20, bottom: 12, left: 44 }

const PLOT_LEFT_PCT = (PADDING.left / CHART_WIDTH) * 100
const PLOT_RIGHT_PCT = (PADDING.right / CHART_WIDTH) * 100
const PLOT_TOP_PCT = (PADDING.top / CHART_HEIGHT) * 100
const PLOT_BOTTOM_PCT = (PADDING.bottom / CHART_HEIGHT) * 100
const PLOT_WIDTH_PCT = 100 - PLOT_LEFT_PCT - PLOT_RIGHT_PCT
const PLOT_HEIGHT_PCT = 100 - PLOT_TOP_PCT - PLOT_BOTTOM_PCT

function formatAxisDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function formatShortDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function pickTickIndices(length: number, maxTicks = 5): number[] {
  if (length <= 1) return length === 1 ? [0] : []
  if (length <= maxTicks) {
    return Array.from({ length }, (_, index) => index)
  }

  const indices: number[] = []
  for (let i = 0; i < maxTicks; i += 1) {
    indices.push(Math.round((i / (maxTicks - 1)) * (length - 1)))
  }
  return [...new Set(indices)]
}

function indexFromPlotRatio(ratio: number, length: number): number {
  if (length <= 1) return 0
  return Math.round(Math.max(0, Math.min(1, ratio)) * (length - 1))
}

function pointLeftPercent(index: number, length: number): number {
  if (length <= 1) return PLOT_LEFT_PCT + PLOT_WIDTH_PCT / 2
  const ratio = index / (length - 1)
  return PLOT_LEFT_PCT + ratio * PLOT_WIDTH_PCT
}

function pointTopPercent(count: number, maxCount: number): number {
  const ratio = count / maxCount
  return PLOT_TOP_PCT + (1 - ratio) * PLOT_HEIGHT_PCT
}

export default function DashboardRegistrationChart({
  title,
  data,
  color,
  className,
}: DashboardRegistrationChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const maxCount = useMemo(
    () => Math.max(1, ...data.map((point) => point.count)),
    [data],
  )

  const total = useMemo(() => data.reduce((sum, point) => sum + point.count, 0), [data])

  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
  const baseY = PADDING.top + plotHeight

  const points = useMemo(() => {
    if (data.length === 0) return []

    return data.map((point, index) => {
      const x =
        data.length === 1
          ? PADDING.left + plotWidth / 2
          : PADDING.left + (index / (data.length - 1)) * plotWidth
      const y = PADDING.top + plotHeight - (point.count / maxCount) * plotHeight
      return { ...point, x, y, index }
    })
  }, [data, maxCount, plotHeight, plotWidth])

  const linePath = useMemo(() => {
    if (points.length === 0) return ''
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  }, [points])

  const areaPath = useMemo(() => {
    if (points.length === 0) return ''
    const first = points[0]
    const last = points[points.length - 1]
    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    return `${line} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`
  }, [baseY, points])

  const tickIndices = useMemo(() => pickTickIndices(data.length), [data.length])
  const hoveredPoint = hoveredIndex != null ? data[hoveredIndex] : null

  const handlePlotMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (data.length === 0) return
      const rect = event.currentTarget.getBoundingClientRect()
      const ratio = (event.clientX - rect.left) / rect.width
      setHoveredIndex(indexFromPlotRatio(ratio, data.length))
    },
    [data.length],
  )

  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{total.toLocaleString()}</span>{' '}
          new in period
        </p>
      </div>

      {data.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">No registrations in this period.</p>
      ) : (
        <div className="mt-4">
          <div className="relative h-[200px]">
            <div
              className="pointer-events-none absolute left-0 top-0 flex h-full w-11 flex-col justify-between py-5 text-[11px] tabular-nums text-muted-foreground"
              aria-hidden
            >
              <span>{maxCount}</span>
              <span>0</span>
            </div>

            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="pointer-events-none h-full w-full"
              role="img"
              aria-label={`${title} daily registrations`}
              preserveAspectRatio="xMidYMid meet"
            >
              <line
                x1={PADDING.left}
                y1={baseY}
                x2={CHART_WIDTH - PADDING.right}
                y2={baseY}
                stroke="currentColor"
                className="text-border"
                strokeWidth="1"
              />
              <path d={areaPath} fill={color} fillOpacity="0.12" />
              <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {hoveredIndex != null && points[hoveredIndex] ? (
                <>
                  <line
                    x1={points[hoveredIndex].x}
                    y1={PADDING.top}
                    x2={points[hoveredIndex].x}
                    y2={baseY}
                    stroke={color}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.55"
                  />
                  <circle
                    cx={points[hoveredIndex].x}
                    cy={points[hoveredIndex].y}
                    r="6"
                    fill="white"
                    stroke={color}
                    strokeWidth="2"
                  />
                  <circle
                    cx={points[hoveredIndex].x}
                    cy={points[hoveredIndex].y}
                    r="3"
                    fill={color}
                  />
                </>
              ) : null}
            </svg>

            <div
              className="absolute cursor-crosshair"
              style={{
                left: `${PLOT_LEFT_PCT}%`,
                right: `${PLOT_RIGHT_PCT}%`,
                top: `${PLOT_TOP_PCT}%`,
                bottom: `${PLOT_BOTTOM_PCT}%`,
              }}
              onMouseMove={handlePlotMouseMove}
              onMouseLeave={() => setHoveredIndex(null)}
            />

            {hoveredPoint && hoveredIndex != null ? (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${pointLeftPercent(hoveredIndex, data.length)}%`,
                  top: `${pointTopPercent(hoveredPoint.count, maxCount)}%`,
                  marginTop: '-10px',
                }}
              >
                <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-center shadow-md">
                  <p className="whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                    {formatAxisDate(hoveredPoint.date)}
                  </p>
                  <p className="text-sm font-bold tabular-nums text-foreground">
                    {hoveredPoint.count.toLocaleString()}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">new</span>
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="relative mt-2 h-5 text-[11px] text-muted-foreground"
            style={{ marginLeft: `${PLOT_LEFT_PCT}%`, marginRight: `${PLOT_RIGHT_PCT}%` }}
          >
            {tickIndices.map((index) => {
              const point = data[index]
              if (!point) return null
              const leftPercent = data.length === 1 ? 50 : (index / (data.length - 1)) * 100
              return (
                <span
                  key={point.date}
                  className={cn(
                    'absolute -translate-x-1/2 whitespace-nowrap transition-colors',
                    hoveredIndex === index && 'font-semibold text-foreground',
                  )}
                  style={{ left: `${leftPercent}%` }}
                >
                  {formatShortDate(point.date)}
                </span>
              )
            })}
          </div>

          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Hover the chart to see daily counts
          </p>
        </div>
      )}
    </div>
  )
}
