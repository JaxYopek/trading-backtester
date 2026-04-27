import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import type { MetricSummary } from '../services/backtestApi'
import {
  clearSavedRuns,
  exportRuns,
  loadSavedRuns,
  removeSavedRun,
  type SavedBacktestRun,
  saveLastRun,
} from '../services/savedResultsStore'

const metricKeys: Array<keyof MetricSummary> = [
  'total_return_pct',
  'buy_hold_return',
  'max_drawdown',
  'sharpe_ratio',
  'win_rate',
  'profit_factor',
  'number_of_trades',
  'final_value',
]

const strategyColors: Record<string, string> = {
  ma_crossover: 'rgb(59, 130, 246)',
  rsi_strategy: 'rgb(139, 92, 246)',
  macd_strategy: 'rgb(34, 197, 94)',
  bollinger_bands_strategy: 'rgb(249, 115, 22)',
  combined_strategy: 'rgb(14, 165, 233)',
}

function metricLabel(metric: keyof MetricSummary) {
  return metric.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatMetric(metric: keyof MetricSummary, value: number) {
  if (metric === 'number_of_trades') {
    return value.toString()
  }

  if (metric === 'final_value') {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  }

  if (metric === 'sharpe_ratio' || metric === 'profit_factor') {
    return value.toFixed(2)
  }

  if (metric === 'max_drawdown' || metric === 'win_rate') {
    return `${(value * 100).toFixed(2)}%`
  }

  if (metric === 'buy_hold_return' || metric === 'total_return_pct') {
    return `${value.toFixed(2)}%`
  }

  return value.toString()
}

function downloadRun(run: SavedBacktestRun) {
  exportRuns([run], `${run.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`)
}

function CompareOverlayChart({ runs }: { runs: SavedBacktestRun[] }) {
  const width = 1000
  const height = 480
  const pad = 60

  const curves = runs
    .map((run) => ({
      run,
      values: run.result.equity_curve.map((point) => point.value),
    }))
    .filter((entry) => entry.values.length > 1)

  if (curves.length === 0) {
    return <p className="chart-fallback">Select at least two saved runs with equity curves to compare them.</p>
  }

  const allValues = curves.flatMap((entry) => entry.values)
  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)
  const safeRange = maxValue - minValue === 0 ? 1 : maxValue - minValue
  const xSpan = width - pad * 2
  const ySpan = height - pad * 2

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgb(229, 231, 235)', padding: '20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Saved results comparison chart">
        <rect x={pad} y={pad} width={xSpan} height={ySpan} fill="rgb(249, 250, 251)" stroke="rgb(229, 231, 235)" strokeWidth="1.5" rx="4" />

        {[0, 1, 2, 3, 4, 5, 6].map((index) => (
          <line
            key={`grid-${index}`}
            x1={pad}
            y1={pad + (index / 6) * ySpan}
            x2={width - pad}
            y2={pad + (index / 6) * ySpan}
            stroke="rgba(200, 200, 200, 0.4)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        <line x1={pad} y1={pad} x2={pad} y2={pad + ySpan} stroke="rgb(107, 114, 128)" strokeWidth="2" />
        <line x1={pad} y1={pad + ySpan} x2={width - pad} y2={pad + ySpan} stroke="rgb(107, 114, 128)" strokeWidth="2" />

        {curves.map(({ run, values }) => {
          let path = ''

          values.forEach((value, index) => {
            const x = pad + (index / (values.length - 1)) * xSpan
            const y = pad + ((maxValue - value) / safeRange) * ySpan

            path += index === 0 ? `M${x},${y}` : ` L${x},${y}`
          })

          return (
            <path
              key={run.id}
              d={path}
              fill="none"
              stroke={strategyColors[run.request.strategy] || 'rgb(100, 100, 100)'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}

        <text x={width / 2} y={height - 15} textAnchor="middle" fontSize="13" fontWeight="600" fill="rgb(107, 114, 128)">
          Trading Days
        </text>
        <text x="20" y="30" textAnchor="start" fontSize="13" fontWeight="600" fill="rgb(107, 114, 128)">
          Portfolio Value
        </text>
      </svg>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
        {curves.map(({ run }) => (
          <div key={run.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'rgb(75, 85, 99)' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: strategyColors[run.request.strategy] || 'rgb(100, 100, 100)' }} />
            {run.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SavedResultsPage() {
  const navigate = useNavigate()
  const [savedRuns, setSavedRuns] = useState<SavedBacktestRun[]>(() => loadSavedRuns())
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    setSelectedIds((current) => {
      const validIds = current.filter((id) => savedRuns.some((run) => run.id === id))
      if (validIds.length > 0 || savedRuns.length === 0) {
        return validIds
      }

      return savedRuns.slice(0, 2).map((run) => run.id)
    })
  }, [savedRuns])

  const selectedRuns = savedRuns.filter((run) => selectedIds.includes(run.id))

  const handleOpenRun = (run: SavedBacktestRun) => {
    saveLastRun({ request: run.request, result: run.result })
    navigate('/results', { state: { run: { request: run.request, result: run.result }, result: run.result } })
  }

  const handleDeleteRun = (id: string) => {
    const nextRuns = removeSavedRun(id)
    setSavedRuns(nextRuns)
  }

  const handleToggleRun = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    )
  }

  const handleExportAll = () => {
    exportRuns(savedRuns, 'saved-backtest-results.json')
  }

  const handleExportSelected = () => {
    exportRuns(selectedRuns, 'selected-saved-backtest-results.json')
  }

  const handleClearAll = () => {
    clearSavedRuns()
    setSavedRuns([])
    setSelectedIds([])
  }

  const getBestStrategy = (metric: keyof MetricSummary) => {
    if (selectedRuns.length === 0) {
      return ''
    }

    let bestRun = selectedRuns[0]

    for (const run of selectedRuns.slice(1)) {
      const currentValue = run.result.metrics[metric]
      const bestValue = bestRun.result.metrics[metric]

      if (metric === 'max_drawdown') {
        if (currentValue < bestValue) {
          bestRun = run
        }
      } else if (currentValue > bestValue) {
        bestRun = run
      }
    }

    return bestRun.id
  }

  return (
    <main className="page">
      <h1>Saved Results</h1>
      <p className="lead">Session-only backtest runs saved in your browser for this tab or window.</p>

      <section className="form-card" style={{ marginBottom: '24px' }}>
        <p style={{ marginTop: 0, color: 'rgb(75, 85, 99)' }}>
          Saved runs persist only for the current browser session. Closing the tab clears them automatically.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button type="button" onClick={handleExportAll} disabled={savedRuns.length === 0}>
            Export All
          </button>
          <button type="button" onClick={handleExportSelected} disabled={selectedRuns.length === 0}>
            Export Selected
          </button>
          <button type="button" onClick={handleClearAll} disabled={savedRuns.length === 0}>
            Clear All
          </button>
        </div>
      </section>

      {savedRuns.length === 0 ? (
        <section className="form-card">
          <p style={{ margin: 0, color: 'rgb(75, 85, 99)' }}>
            Run a backtest and click <strong>Save Result</strong> on the results page to keep it for this session.
          </p>
        </section>
      ) : (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '16px' }}>Saved Run List</h2>
          <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgb(229, 231, 235)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgb(249, 250, 251)', borderBottom: '2px solid rgb(229, 231, 235)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'rgb(75, 85, 99)' }}>Compare</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'rgb(75, 85, 99)' }}>Run</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'rgb(75, 85, 99)' }}>Return</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'rgb(75, 85, 99)' }}>Final Value</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'rgb(75, 85, 99)' }}>Trades</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'rgb(75, 85, 99)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedRuns.map((run) => {
                  const isSelected = selectedIds.includes(run.id)

                  return (
                    <tr key={run.id} style={{ borderBottom: '1px solid rgb(229, 231, 235)' }}>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => handleToggleRun(run.id)} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: 'rgb(17, 24, 39)' }}>{run.label}</div>
                        <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)', marginTop: '4px' }}>
                          Saved {new Date(run.savedAt).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '500' }}>
                        {formatMetric('total_return_pct', run.result.metrics.total_return_pct)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '500' }}>
                        {formatMetric('final_value', run.result.metrics.final_value)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '500' }}>
                        {run.result.metrics.number_of_trades}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <button type="button" onClick={() => handleOpenRun(run)}>
                            Open
                          </button>
                          <button type="button" onClick={() => downloadRun(run)}>
                            Export
                          </button>
                          <button type="button" onClick={() => handleDeleteRun(run.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedRuns.length >= 2 ? (
        <>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ marginBottom: '16px' }}>Selected Comparison</h2>
            <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgb(229, 231, 235)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgb(249, 250, 251)', borderBottom: '2px solid rgb(229, 231, 235)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'rgb(75, 85, 99)' }}>Metric</th>
                    {selectedRuns.map((run) => (
                      <th key={run.id} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: 'rgb(75, 85, 99)', borderRight: '1px solid rgb(229, 231, 235)' }}>
                        {run.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricKeys.map((metric) => {
                    const bestRunId = getBestStrategy(metric)

                    return (
                      <tr key={metric} style={{ borderBottom: '1px solid rgb(229, 231, 235)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '500', color: 'rgb(75, 85, 99)' }}>{metricLabel(metric)}</td>
                        {selectedRuns.map((run) => {
                          const value = run.result.metrics[metric]
                          const isBest = run.id === bestRunId

                          return (
                            <td
                              key={run.id}
                              style={{
                                padding: '12px 16px',
                                textAlign: 'center',
                                backgroundColor: isBest ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                fontWeight: isBest ? '600' : '400',
                                color: isBest ? 'rgb(34, 197, 94)' : 'rgb(75, 85, 99)',
                                borderRight: '1px solid rgb(229, 231, 235)',
                              }}
                            >
                              {formatMetric(metric, value)}
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

          <section>
            <h2 style={{ marginBottom: '16px' }}>Selected Equity Curves</h2>
            <CompareOverlayChart runs={selectedRuns} />
          </section>
        </>
      ) : savedRuns.length > 0 ? (
        <section className="form-card">
          <p style={{ margin: 0, color: 'rgb(75, 85, 99)' }}>
            Select at least two saved runs to compare their metrics and equity curves.
          </p>
        </section>
      ) : null}
    </main>
  )
}