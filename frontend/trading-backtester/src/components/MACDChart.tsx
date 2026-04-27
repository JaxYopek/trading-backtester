import { useEffect, useRef, useState } from 'react'
import type { Data, Layout, Config } from 'plotly.js'
import type { MACDPoint } from '../services/backtestApi'

declare global {
  interface Window {
    Plotly: any
  }
}

interface MACDChartProps {
  data: MACDPoint[]
  title?: string
}

export function MACDChart({ data, title = 'MACD Strategy' }: MACDChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  if (!data || data.length === 0) {
    return <p className="chart-fallback">No MACD data available.</p>
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
      const macdLines = data.map((d) => d.macd_line)
      const signalLines = data.map((d) => d.signal_line)
      const histograms = data.map((d) => d.histogram)

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
        // MACD Histogram
        {
          x: dates,
          y: histograms,
          type: 'bar',
          name: 'MACD Histogram',
          marker: {
            color: histograms.map((h) => (h > 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)')),
          },
          yaxis: 'y2',
          hovertemplate: '%{x}<br>Histogram: %{y:.4f}<extra></extra>',
        } as Data,
        // MACD Line
        {
          x: dates,
          y: macdLines,
          mode: 'lines',
          name: 'MACD Line',
          line: { color: 'rgb(34, 197, 94)', width: 2 },
          yaxis: 'y2',
          hovertemplate: '%{x}<br>MACD: %{y:.4f}<extra></extra>',
        } as Data,
        // Signal Line
        {
          x: dates,
          y: signalLines,
          mode: 'lines',
          name: 'Signal Line',
          line: { color: 'rgb(239, 68, 68)', width: 2, dash: 'dash' },
          yaxis: 'y2',
          hovertemplate: '%{x}<br>Signal: %{y:.4f}<extra></extra>',
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
          title: { text: 'MACD', font: { color: 'rgb(100, 100, 100)' } },
          gridcolor: 'rgba(0, 0, 0, 0.1)',
          domain: [0, 0.5],
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
      console.error('Error rendering MACD chart:', err)
      setError(err instanceof Error ? err.message : 'Failed to render chart')
    }
  }, [data, title])

  if (error) {
    return <p className="chart-fallback">Error rendering chart: {error}</p>
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
