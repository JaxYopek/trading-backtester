import { Link } from 'react-router-dom'
import { buildRunLabel, loadLastRun, loadSavedRuns, strategyLabel } from '../services/savedResultsStore'

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export default function HomePage() {
  const savedRuns = loadSavedRuns()
  const lastRun = loadLastRun()
  const latestSavedRuns = savedRuns.slice(0, 3)
  const bestSavedRun = savedRuns.reduce((best, run) => {
    if (!best) {
      return run
    }

    return run.result.metrics.total_return_pct > best.result.metrics.total_return_pct ? run : best
  }, savedRuns[0])

  return (
    <main className="page">
      <section className="form-card" style={{ marginBottom: '24px' }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(107, 114, 128)', fontSize: '12px', fontWeight: 700 }}>
          Session Dashboard
        </p>
        <h1 style={{ marginTop: '8px' }}>Trading Backtester</h1>
        <p className="lead" style={{ marginBottom: '0' }}>
          Run new backtests, reopen the latest result, and compare saved runs from this browser session.
        </p>
      </section>

      <section className="metrics-grid" style={{ marginBottom: '24px' }}>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Saved Runs</h2>
          </div>
          <p>{savedRuns.length}</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Latest Run</h2>
          </div>
          <p>{lastRun ? buildRunLabel(lastRun) : 'None yet'}</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Best Saved Return</h2>
          </div>
          <p>{bestSavedRun ? formatPercent(bestSavedRun.result.metrics.total_return_pct) : 'N/A'}</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Best Strategy</h2>
          </div>
          <p>{bestSavedRun ? strategyLabel(bestSavedRun.request.strategy) : 'N/A'}</p>
        </article>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <article className="form-card">
          <h2 style={{ marginTop: 0 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link className="primary-link" to="/backtest">
              Start a Backtest
            </Link>
            <Link className="primary-link" to="/saved-results" style={{ background: 'rgb(17, 24, 39)' }}>
              Open Saved Runs
            </Link>
            <Link className="primary-link" to="/comparison" style={{ background: 'rgb(75, 85, 99)' }}>
              Compare Strategies
            </Link>
          </div>
        </article>

        <article className="form-card">
          <h2 style={{ marginTop: 0 }}>Latest Result</h2>
          {lastRun ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Symbol</div>
                <div style={{ fontWeight: 700 }}>{lastRun.request.symbol.toUpperCase()}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Strategy</div>
                <div style={{ fontWeight: 700 }}>{strategyLabel(lastRun.request.strategy)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Return</div>
                <div style={{ fontWeight: 700 }}>{formatPercent(lastRun.result.metrics.total_return_pct)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Final Value</div>
                <div style={{ fontWeight: 700 }}>{formatMoney(lastRun.result.metrics.final_value)}</div>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, color: 'rgb(107, 114, 128)' }}>
              Run a backtest to populate the dashboard with your latest result.
            </p>
          )}
        </article>
      </section>

      <section className="form-card">
        <h2 style={{ marginTop: 0 }}>Recent Saved Runs</h2>
        {latestSavedRuns.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {latestSavedRuns.map((run) => (
              <Link
                key={run.id}
                to="/saved-results"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgb(229, 231, 235)',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'white',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{buildRunLabel(run)}</div>
                  <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)', marginTop: '4px' }}>
                    Saved {new Date(run.savedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{formatMoney(run.result.metrics.final_value)}</div>
                  <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)' }}>{formatPercent(run.result.metrics.total_return_pct)}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: 'rgb(107, 114, 128)' }}>
            Nothing is saved yet. Backtest a strategy, then click <strong>Save Result</strong>.
          </p>
        )}
      </section>
    </main>
  )
}
