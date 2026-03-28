import { useEffect, useRef, useState } from 'react'
import type { Data, Layout, Config } from 'plotly.js'

declare global {
  interface Window {
    Plotly: any
  }
}

type EquityPoint = {
  date: string
  value: number
}

interface EquityCurveChartProps {
  data: EquityPoint[]
  title?: string
}

export function EquityCurveChart({ data, title = 'Equity Curve' }: EquityCurveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  if (!data || data.length === 0) {
    return <p className="chart-fallback">No equity curve data available.</p>
  }

  useEffect(() => {
    if (!containerRef.current) return
    if (!window.Plotly) {
      setError('Plotly library failed to load')
      return
    }

    try {
      const dates = data.map((d) => d.date)
      const values = data.map((d) => d.value)

      const traces: Data[] = [
        // Equity curve fill
        {
          x: dates,
          y: values,
          fill: 'tozeroy',
          fillcolor: 'rgba(59, 130, 246, 0.2)',
          line: { color: 'rgb(59, 130, 246)', width: 2.5 },
          name: 'Equity Curve',
          hovertemplate: '%{x}<br>Portfolio Value: $%{y:,.2f}<extra></extra>',
          type: 'scatter',
        } as Data,
      ]

      const layout: Partial<Layout> = {
        title: {
          text: title,
          font: { size: 18, color: 'rgb(100, 100, 100)' },
        },
        xaxis: {
          title: { text: 'Date', font: { color: 'rgb(100, 100, 100)' } },
          type: 'date',
          gridcolor: 'rgba(0, 0, 0, 0.1)',
        },
        yaxis: {
          title: { text: 'Portfolio Value ($)', font: { color: 'rgb(100, 100, 100)' } },
          gridcolor: 'rgba(0, 0, 0, 0.1)',
        },
        hovermode: 'x unified',
        plot_bgcolor: 'rgba(255, 255, 255, 1)',
        paper_bgcolor: 'transparent',
        font: { family: 'inherit', size: 12, color: 'rgb(100, 100, 100)' },
        margin: { l: 60, r: 30, t: 50, b: 50 },
        height: 500,
      }

      const config: Partial<Config> = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      }

      window.Plotly.newPlot(
        containerRef.current,
        traces,
        layout,
        config
      )
    } catch (err) {
      console.error('Error rendering Equity Curve chart:', err)
      setError(err instanceof Error ? err.message : 'Failed to render chart')
    }
  }, [data, title])

  if (error) {
    return <p className="chart-fallback">Error rendering chart: {error}</p>
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
