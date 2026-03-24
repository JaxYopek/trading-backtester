import { useEffect, useRef, useState } from 'react'
import type { Data, Layout, Config } from 'plotly.js'

declare global {
  interface Window {
    Plotly: any
  }
}

type BollingerBandsPoint = {
  date: string
  close: number
  upper_band: number
  middle_band: number
  lower_band: number
}

interface BollingerBandsChartProps {
  data: BollingerBandsPoint[]
  title?: string
}

export function BollingerBandsChart({ data, title = 'Bollinger Bands' }: BollingerBandsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  if (!data || data.length === 0) {
    return <p className="chart-fallback">No Bollinger Bands data available.</p>
  }

  useEffect(() => {
    if (!containerRef.current) return
    if (!window.Plotly) {
      setError('Plotly library failed to load')
      return
    }

    try {
      const dates = data.map((d) => d.date)
      const closes = data.map((d) => d.close)
      const upperBands = data.map((d) => d.upper_band)
      const lowerBands = data.map((d) => d.lower_band)
      const middles = data.map((d) => d.middle_band)

      const traces: Data[] = [
        // Lower band fill (first so it's behind everything)
        {
          x: dates,
          y: lowerBands,
          fill: 'tozeroy',
          fillcolor: 'rgba(22, 163, 74, 0.1)',
          line: { color: 'rgba(0, 0, 0, 0)' },
          name: 'Lower Band Fill',
          hoverinfo: 'skip',
          showlegend: false,
          type: 'scatter',
        } as Data,
        // Upper band fill
        {
          x: dates,
          y: upperBands,
          fill: 'tonexty',
          fillcolor: 'rgba(220, 38, 38, 0.1)',
          line: { color: 'rgba(0, 0, 0, 0)' },
          name: 'Upper Band Fill',
          hoverinfo: 'skip',
          showlegend: false,
          type: 'scatter',
        } as Data,
        // Lower band line
        {
          x: dates,
          y: lowerBands,
          line: { color: 'rgb(22, 163, 74)', width: 1, dash: 'dash' },
          name: 'Lower Band',
          hovertemplate: '%{x}<br>Lower: %{y:.2f}<extra></extra>',
          type: 'scatter',
        } as Data,
        // Upper band line
        {
          x: dates,
          y: upperBands,
          line: { color: 'rgb(220, 38, 38)', width: 1, dash: 'dash' },
          name: 'Upper Band',
          hovertemplate: '%{x}<br>Upper: %{y:.2f}<extra></extra>',
          type: 'scatter',
        } as Data,
        // Middle band (SMA)
        {
          x: dates,
          y: middles,
          line: { color: 'rgb(59, 130, 246)', width: 2 },
          name: 'Middle Band (SMA)',
          hovertemplate: '%{x}<br>Middle: %{y:.2f}<extra></extra>',
          type: 'scatter',
        } as Data,
        // Close price
        {
          x: dates,
          y: closes,
          line: { color: 'rgb(17, 24, 39)', width: 2.5 },
          name: 'Close Price',
          hovertemplate: '%{x}<br>Close: %{y:.2f}<extra></extra>',
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
          title: { text: 'Price', font: { color: 'rgb(100, 100, 100)' } },
          gridcolor: 'rgba(0, 0, 0, 0.1)',
        },
        hovermode: 'x unified',
        plot_bgcolor: 'rgba(255, 255, 255, 1)',
        paper_bgcolor: 'transparent',
        font: { family: 'inherit', size: 12, color: 'rgb(100, 100, 100)' },
        margin: { l: 50, r: 30, t: 50, b: 50 },
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
      console.error('Error rendering Bollinger Bands chart:', err)
      setError(err instanceof Error ? err.message : 'Failed to render chart')
    }
  }, [data, title])

  if (error) {
    return (
      <div className="chart-fallback">
        <p>Error rendering Bollinger Bands chart: {error}</p>
      </div>
    )
  }

  return <div ref={containerRef} style={{ width: '100%', minHeight: '500px' }} />
}
