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

type TradeSignal = {
  date: string
  signal: number  // 1 for BUY, -1 for SELL
  price: number
}

interface EquityCurveChartProps {
  data: EquityPoint[]
  tradeSignals?: TradeSignal[] | null
  title?: string
}

export function EquityCurveChart({ data, tradeSignals, title = 'Equity Curve' }: EquityCurveChartProps) {
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

      // Add buy signal markers
      if (tradeSignals && tradeSignals.length > 0) {
        const buySignals = tradeSignals.filter(s => s.signal === 1)
        if (buySignals.length > 0) {
          const buyDates = buySignals.map(s => s.date)
          const buyValues = buySignals.map(s => {
            const equityPoint = data.find(d => d.date === s.date)
            return equityPoint?.value || s.price
          })

          traces.push({
            x: buyDates,
            y: buyValues,
            mode: 'markers',
            type: 'scatter',
            marker: {
              size: 12,
              color: 'rgb(34, 197, 94)',  // Green for buy
              symbol: 'triangle-up',
              line: { color: 'white', width: 2 }
            },
            name: 'Buy Signal',
            hovertemplate: '%{x}<br>BUY @ $%{y:,.2f}<extra></extra>',
          } as Data)
        }

        // Add sell signal markers
        const sellSignals = tradeSignals.filter(s => s.signal === -1)
        if (sellSignals.length > 0) {
          const sellDates = sellSignals.map(s => s.date)
          const sellValues = sellSignals.map(s => {
            const equityPoint = data.find(d => d.date === s.date)
            return equityPoint?.value || s.price
          })

          traces.push({
            x: sellDates,
            y: sellValues,
            mode: 'markers',
            type: 'scatter',
            marker: {
              size: 12,
              color: 'rgb(239, 68, 68)',  // Red for sell
              symbol: 'triangle-down',
              line: { color: 'white', width: 2 }
            },
            name: 'Sell Signal',
            hovertemplate: '%{x}<br>SELL @ $%{y:,.2f}<extra></extra>',
          } as Data)
        }
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
          title: { text: 'Portfolio Value ($)', font: { color: 'rgb(100, 100, 100)' } },
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
          bgcolor: 'rgba(255, 255, 255, 0.8)',
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
      console.error('Error rendering Equity Curve chart:', err)
      setError(err instanceof Error ? err.message : 'Failed to render chart')
    }
  }, [data, tradeSignals, title])

  if (error) {
    return <p className="chart-fallback">Error rendering chart: {error}</p>
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
