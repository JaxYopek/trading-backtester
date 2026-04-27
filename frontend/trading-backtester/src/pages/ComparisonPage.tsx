import { useState, type FormEvent } from 'react'
import '../App.css'

interface StrategyMetrics {
  total_return_pct: number
  buy_hold_return: number
  max_drawdown: number
  sharpe_ratio: number
  win_rate: number
  profit_factor: number
  num_trades: number
  final_value: number
}

interface StrategyData {
  name: string
  metrics: StrategyMetrics
  equity_curve: Array<{ date: string; value: number }>
}

interface ComparisonResult {
  symbol: string
  initial_capital: number
  strategies: Record<string, StrategyData>
}

const strategyColors: Record<string, string> = {
  'ma_crossover': 'rgb(59, 130, 246)',
  'rsi_strategy': 'rgb(139, 92, 246)',
  'macd_strategy': 'rgb(34, 197, 94)',
  'bollinger_bands_strategy': 'rgb(249, 115, 22)',
}

export default function ComparisonPage() {
  const [symbol, setSymbol] = useState('AAPL')
  const [initialCapital, setInitialCapital] = useState(10000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ComparisonResult | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!symbol.trim()) {
      setError('Symbol is required.')
      return
    }

    if (!Number.isFinite(initialCapital) || initialCapital <= 0) {
      setError('Initial capital must be greater than 0.')
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams({
        symbol: symbol.trim().toUpperCase(),
        initialCapital: initialCapital.toString(),
      })
      
      const response = await fetch(`http://localhost:8000/compare-strategies?${params}`, {
        method: 'POST',
      })

      if (!response.ok) {
        let detail = 'Comparison failed. Make sure backend is running on port 8000.'
        try {
          const errorPayload = (await response.json()) as { detail?: string }
          if (errorPayload.detail) {
            detail = errorPayload.detail
          }
        } catch {
          // Keep fallback message if response body is not JSON.
        }
        throw new Error(detail)
      }

      const data = (await response.json()) as ComparisonResult
      setResult(data)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!result) {
    return (
      <main className="page">
        <h1>Compare Strategies</h1>
        <p className="lead">Run all strategies on the same stock and compare their performance.</p>

        <form onSubmit={handleSubmit} className="form-card">
          <label>
            Symbol
            <input
              type="text"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="AAPL"
            />
          </label>

          <label>
            Initial Capital
            <input
              type="number"
              min={1}
              step="any"
              value={initialCapital}
              onChange={(event) => setInitialCapital(event.target.valueAsNumber)}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Running Comparisons...' : 'Compare Strategies'}
          </button>
        </form>
      </main>
    )
  }

  const strategyEntries = Object.entries(result.strategies)

  // Find best strategy for each metric
  const getBestStrategy = (metric: keyof StrategyMetrics) => {
    let best = ''
    let bestValue = metric.includes('drawdown') ? 0 : -Infinity
    
    for (const [key, data] of strategyEntries) {
      const value = data.metrics[metric]
      if (metric.includes('drawdown')) {
        if (value < bestValue || bestValue === 0) bestValue = value
      } else {
        if (value > bestValue) bestValue = value
      }
      if (value === bestValue) best = key
    }
    
    return best
  }

  const formatMetric = (value: number, metric: string) => {
    if (metric.includes('return') || metric.includes('drawdown') || metric.includes('win_rate')) {
      return `${value.toFixed(2)}%`
    }
    if (metric.includes('sharpe')) {
      return value.toFixed(2)
    }
    if (metric.includes('final_value')) {
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    }
    if (metric.includes('profit_factor')) {
      return value.toFixed(2)
    }
    if (metric.includes('trades')) {
      return value.toString()
    }
    return value.toString()
  }

  return (
    <main className="page">
      <h1>Strategy Comparison Results</h1>
      <p className="lead">{result.symbol} with ${result.initial_capital.toLocaleString()} initial capital</p>

      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => setResult(null)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgb(229, 231, 235)',
            border: '1px solid rgb(209, 213, 219)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: 'rgb(55, 65, 81)',
          }}
        >
          ← Back to Comparison
        </button>
      </div>

      {/* Metrics Comparison Table */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px' }}>Performance Metrics Comparison</h2>
        <div style={{
          overflowX: 'auto',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid rgb(229, 231, 235)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}>
            <thead>
              <tr style={{ backgroundColor: 'rgb(249, 250, 251)', borderBottom: '2px solid rgb(229, 231, 235)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'rgb(75, 85, 99)' }}>Metric</th>
                {strategyEntries.map(([key, data]) => (
                  <th
                    key={key}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: strategyColors[key] || 'rgb(75, 85, 99)',
                      borderRight: '1px solid rgb(229, 231, 235)',
                    }}
                  >
                    {data.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(strategyEntries[0]?.[1]?.metrics || {}).map((metric) => {
                const bestStrategy = getBestStrategy(metric as keyof StrategyMetrics)
                
                return (
                  <tr key={metric} style={{ borderBottom: '1px solid rgb(229, 231, 235)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: 'rgb(75, 85, 99)' }}>
                      {metric.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    {strategyEntries.map(([key, data]) => {
                      const value = data.metrics[metric as keyof StrategyMetrics]
                      const isBest = key === bestStrategy
                      
                      return (
                        <td
                          key={key}
                          style={{
                            padding: '12px 16px',
                            textAlign: 'center',
                            backgroundColor: isBest ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                            fontWeight: isBest ? '600' : '400',
                            color: isBest ? 'rgb(34, 197, 94)' : 'rgb(75, 85, 99)',
                            borderRight: '1px solid rgb(229, 231, 235)',
                          }}
                        >
                          {formatMetric(value, metric)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Equity Curves Overlay */}
      <section>
        <h2 style={{ marginBottom: '16px' }}>Equity Curves Comparison</h2>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid rgb(229, 231, 235)',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}>
          <svg viewBox="0 0 1000 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <defs>
              {strategyEntries.map(([key]) => (
                <linearGradient key={`grad-${key}`} id={`gradient-${key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={`${strategyColors[key] || 'rgb(100, 100, 100)'}33`} />
                  <stop offset="100%" stopColor={`${strategyColors[key] || 'rgb(100, 100, 100)'}00`} />
                </linearGradient>
              ))}
            </defs>

            {/* Background and axes */}
            <rect x="60" y="50" width="880" height="400" fill="rgb(249, 250, 251)" stroke="rgb(229, 231, 235)" strokeWidth="1.5" rx="4" />
            
            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <line
                key={`grid-${i}`}
                x1="60"
                y1={50 + (i / 6) * 400}
                x2="940"
                y2={50 + (i / 6) * 400}
                stroke="rgba(200, 200, 200, 0.4)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            ))}

            {/* Axes */}
            <line x1="60" y1="50" x2="60" y2="450" stroke="rgb(107, 114, 128)" strokeWidth="2" />
            <line x1="60" y1="450" x2="940" y2="450" stroke="rgb(107, 114, 128)" strokeWidth="2" />

            {/* Plot lines */}
            {strategyEntries.map(([key, data]) => {
              if (data.equity_curve.length < 2) return null

              const values = data.equity_curve.map((p) => p.value)
              const minValue = Math.min(...values)
              const maxValue = Math.max(...values)
              const range = maxValue - minValue || 1

              let pathData = ''
              values.forEach((value, index) => {
                const x = 60 + (index / (values.length - 1)) * 880
                const y = 450 - ((value - minValue) / range) * 400

                if (index === 0) {
                  pathData += `M${x},${y}`
                } else {
                  pathData += ` L${x},${y}`
                }
              })

              return (
                <g key={key}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strategyColors[key] || 'rgb(100, 100, 100)'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )
            })}

            {/* Legend */}
            {strategyEntries.map(([key, data], index) => (
              <g key={`legend-${key}`}>
                <rect x="680" y={60 + index * 25} width="14" height="14" fill={strategyColors[key] || 'rgb(100, 100, 100)'} rx="2" />
                <text
                  x="700"
                  y={72 + index * 25}
                  fontSize="12"
                  fontWeight="500"
                  fill="rgb(75, 85, 99)"
                >
                  {data.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </section>

      <div style={{ marginTop: '32px' }}>
        <button
          onClick={() => setResult(null)}
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgb(59, 130, 246)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Run Another Comparison
        </button>
      </div>
    </main>
  )
}
