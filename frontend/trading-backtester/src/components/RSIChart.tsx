import { useEffect, useRef, useState } from 'react'
import type { Data, Layout, Config } from 'plotly.js'
import type { RSIPoint } from '../services/backtestApi'

declare global {
  interface Window {
    Plotly: any
  }
}

interface RSIChartProps {
  data: RSIPoint[]
  title?: string
}

export function RSIChart({ data, title = 'RSI Strategy' }: RSIChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  if (!data || data.length === 0) {
    return <p className="chart-fallback">No RSI data available.</p>
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
      const rsiValues = data.map((d) => d.rsi)

      // Find buy and sell signals
      const buySignals = data.filter(d => d.signal === 1)
      const sellSignals = data.filter(d => d.signal === -1)

      const traces: Data[] = [
        // Close price (top subplot)
        {
          x: dates,
          y: closes,
          mode: 'lines',
          name: 'Close Price',
          line: { color: 'rgb(107, 114, 128)', width: 2 },
          yaxis: 'y',
          hovertemplate: '%{x}<br>Close: $%{y:,.2f}<extra></extra>',
        } as Data,
        // RSI (bottom subplot)
        {
          x: dates,
          y: rsiValues,
          mode: 'lines',
          name: 'RSI (14)',
          line: { color: 'rgb(139, 92, 246)', width: 2.5 },
          yaxis: 'y2',
          fill: 'tozeroy',
          fillcolor: 'rgba(139, 92, 246, 0.2)',
          hovertemplate: '%{x}<br>RSI: %{y:.1f}<extra></extra>',
        } as Data,
      ]

      // Add buy signal markers on price chart
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
          yaxis: 'y',
          hovertemplate: '%{x}<br>BUY @ $%{y:,.2f}<extra></extra>',
        } as Data)
      }

      // Add sell signal markers on price chart
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
          yaxis: 'y',
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
          title: { text: 'Price ($)', font: { color: 'rgb(107, 114, 128)' } },
          gridcolor: 'rgba(0, 0, 0, 0.1)',
          domain: [0.55, 1],
          side: 'left',
        },
        yaxis2: {
          title: { text: 'RSI', font: { color: 'rgb(139, 92, 246)' } },
          gridcolor: 'rgba(0, 0, 0, 0.1)',
          domain: [0, 0.5],
          range: [0, 100],
          showline: true,
          side: 'right',
        },
        hovermode: 'x unified',
        plot_bgcolor: 'rgba(255, 255, 255, 1)',
        paper_bgcolor: 'transparent',
        font: { family: 'inherit', size: 12, color: 'rgb(100, 100, 100)' },
        margin: { l: 60, r: 60, t: 50, b: 50 },
        height: 600,
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
      console.error('Error rendering RSI chart:', err)
      setError(err instanceof Error ? err.message : 'Failed to render chart')
    }
  }, [data, title])

  if (error) {
    return <p className="chart-fallback">Error rendering chart: {error}</p>
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
