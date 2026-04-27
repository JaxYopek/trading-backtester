import { useEffect, useRef, useState } from 'react'
import type { Data, Layout, Config } from 'plotly.js'
import type { MAPoint } from '../services/backtestApi'

declare global {
  interface Window {
    Plotly: any
  }
}

interface MAChartProps {
  data: MAPoint[]
  title?: string
}

export function MAChart({ data, title = 'Moving Average Crossover' }: MAChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  if (!data || data.length === 0) {
    return <p className="chart-fallback">No MA data available.</p>
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
      const shortMAs = data.map((d) => d.short_ma)
      const longMAs = data.map((d) => d.long_ma)

      // Find buy and sell signals
      const buySignals = data.filter(d => d.signal === 1)
      const sellSignals = data.filter(d => d.signal === -1)

      const traces: Data[] = [
        // Close price
        {
          x: dates,
          y: closes,
          mode: 'lines',
          name: 'Close Price',
          line: { color: 'rgb(107, 114, 128)', width: 2 },
          hovertemplate: '%{x}<br>Close: $%{y:,.2f}<extra></extra>',
        } as Data,
        // Short MA
        {
          x: dates,
          y: shortMAs,
          mode: 'lines',
          name: 'Short MA (20)',
          line: { color: 'rgb(59, 130, 246)', width: 2.5, dash: 'solid' },
          hovertemplate: '%{x}<br>Short MA: $%{y:,.2f}<extra></extra>',
        } as Data,
        // Long MA
        {
          x: dates,
          y: longMAs,
          mode: 'lines',
          name: 'Long MA (50)',
          line: { color: 'rgb(239, 68, 68)', width: 2.5, dash: 'solid' },
          hovertemplate: '%{x}<br>Long MA: $%{y:,.2f}<extra></extra>',
        } as Data,
      ]

      // Add buy signal markers
      if (buySignals.length > 0) {
        traces.push({
          x: buySignals.map(s => s.date),
          y: buySignals.map(s => s.close),
          mode: 'markers',
          type: 'scatter',
          marker: {
            size: 12,
            color: 'rgb(34, 197, 94)',
            symbol: 'triangle-up',
            line: { color: 'white', width: 2 }
          },
          name: 'BUY',
          hovertemplate: '%{x}<br>BUY @ $%{y:,.2f}<extra></extra>',
        } as Data)
      }

      // Add sell signal markers
      if (sellSignals.length > 0) {
        traces.push({
          x: sellSignals.map(s => s.date),
          y: sellSignals.map(s => s.close),
          mode: 'markers',
          type: 'scatter',
          marker: {
            size: 12,
            color: 'rgb(239, 68, 68)',
            symbol: 'triangle-down',
            line: { color: 'white', width: 2 }
          },
          name: 'SELL',
          hovertemplate: '%{x}<br>SELL @ $%{y:,.2f}<extra></extra>',
        } as Data)
      }

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
          title: { text: 'Price ($)', font: { color: 'rgb(100, 100, 100)' } },
          gridcolor: 'rgba(0, 0, 0, 0.1)',
        },
        hovermode: 'x unified',
        plot_bgcolor: 'rgba(255, 255, 255, 1)',
        paper_bgcolor: 'transparent',
        font: { family: 'inherit', size: 12, color: 'rgb(100, 100, 100)' },
        margin: { l: 60, r: 30, t: 50, b: 50 },
        height: 500,
        showlegend: true,
        legend: {
          x: 0.02,
          y: 0.98,
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          bordercolor: 'rgba(0, 0, 0, 0.2)',
          borderwidth: 1
        }
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
      console.error('Error rendering MA chart:', err)
      setError(err instanceof Error ? err.message : 'Failed to render chart')
    }
  }, [data, title])

  if (error) {
    return <p className="chart-fallback">Error rendering chart: {error}</p>
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
