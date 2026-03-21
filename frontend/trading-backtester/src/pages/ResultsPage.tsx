import { useLocation } from 'react-router-dom'
import type { BacktestResponse } from '../services/backtestApi'

export default function ResultsPage() {
  const location = useLocation()
  const result = (location.state as { result?: BacktestResponse } | null)?.result

  if (!result) {
    return (
      <main className="page">
        <h1>Results</h1>
        <p className="lead">No backtest results yet. Run a backtest first.</p>
      </main>
    )
  }

  const recentPoints = result.equity_curve.slice(-5)

  return (
    <main className="page">
      <h1>Results</h1>
      <p className="lead">Latest run summary</p>

      <section className="metrics-grid">
        <article className="metric-card">
          <h2>Total Return</h2>
          <p>{(result.metrics.total_return * 100).toFixed(2)}%</p>
        </article>
        <article className="metric-card">
          <h2>Max Drawdown</h2>
          <p>{(result.metrics.max_drawdown * 100).toFixed(2)}%</p>
        </article>
        <article className="metric-card">
          <h2>Trades</h2>
          <p>{result.metrics.number_of_trades}</p>
        </article>
        <article className="metric-card">
          <h2>Final Value</h2>
          <p>${result.metrics.final_value.toLocaleString()}</p>
        </article>
      </section>

      <section className="equity-preview">
        <h2>Recent Equity Points</h2>
        <ul>
          {recentPoints.map((point) => (
            <li key={point.date}>
              <span>{point.date}</span>
              <strong>${point.value.toLocaleString()}</strong>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
