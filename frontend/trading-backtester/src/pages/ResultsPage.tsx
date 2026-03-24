import { useLocation } from 'react-router-dom'
import type { BacktestResponse } from '../services/backtestApi'
import { BollingerBandsChart } from '../components/BollingerBandsChart'

type NumericSeries = {
  label: string
  color: string
  values: number[]
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function buildPath(values: number[], width: number, height: number, pad: number, min: number, max: number): string {
  if (values.length === 0) {
    return ''
  }

  const xSpan = width - pad * 2
  const ySpan = height - pad * 2
  const safeDenominator = max - min === 0 ? 1 : max - min

  return values
    .map((value, index) => {
      const x = pad + (values.length === 1 ? xSpan / 2 : (index / (values.length - 1)) * xSpan)
      const y = pad + ((max - value) / safeDenominator) * ySpan
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

function buildFillArea(values: number[], width: number, height: number, pad: number, min: number, max: number): string {
  const linePath = buildPath(values, width, height, pad, min, max)
  if (!linePath) return ''
  
  const xSpan = width - pad * 2
  const ySpan = height - pad * 2
  const safeDenominator = max - min === 0 ? 1 : max - min
  
  const bottomY = pad + ySpan
  const topRightX = pad + xSpan
  
  return `${linePath} L${topRightX},${bottomY} L${pad},${bottomY} Z`
}

function MiniLineChart({ title, series }: { title: string; series: NumericSeries[] }) {
  const width = 900
  const height = 380
  const pad = 50
  const gridLines = 5

  const allValues = series.flatMap((s) => s.values)

  if (allValues.length === 0 || series.every((s) => s.values.length === 0)) {
    return <p className="chart-fallback">No plottable points were returned for this run.</p>
  }

  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const range = max - min === 0 ? 1 : max - min

  const xSpan = width - pad * 2
  const ySpan = height - pad * 2

  // Generate grid lines
  const gridLineElements = []
  for (let i = 0; i <= gridLines; i++) {
    const y = pad + (i / gridLines) * ySpan
    gridLineElements.push(
      <line
        key={`grid-h-${i}`}
        x1={pad}
        y1={y}
        x2={width - pad}
        y2={y}
        stroke="rgba(200, 200, 200, 0.3)"
        strokeWidth="1"
      />
    )
  }

  // Generate Y-axis labels
  const yLabels = []
  for (let i = 0; i <= gridLines; i++) {
    const value = max - (i / gridLines) * range
    const y = pad + (i / gridLines) * ySpan
    yLabels.push(
      <text
        key={`y-label-${i}`}
        x={pad - 12}
        y={y + 4}
        textAnchor="end"
        fontSize="12"
        fill="rgb(100, 100, 100)"
      >
        ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </text>
    )
  }

  return (
    <>
      <h2 style={{ marginBottom: '16px' }}>{title}</h2>
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgb(220, 220, 220)', padding: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ display: 'block' }} role="img" aria-label={title}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
          </defs>
          
          {/* Background */}
          <rect x={pad} y={pad} width={xSpan} height={ySpan} fill="rgba(250, 250, 250, 1)" stroke="rgb(200, 200, 200)" strokeWidth="1" />
          
          {/* Grid lines */}
          {gridLineElements}
          
          {/* Y-axis */}
          <line x1={pad} y1={pad} x2={pad} y2={pad + ySpan} stroke="rgb(80, 80, 80)" strokeWidth="2" />
          
          {/* X-axis */}
          <line x1={pad} y1={pad + ySpan} x2={width - pad} y2={pad + ySpan} stroke="rgb(80, 80, 80)" strokeWidth="2" />
          
          {/* Y-axis labels */}
          {yLabels}
          
          {/* X-axis label */}
          <text
            x={width / 2}
            y={height - 12}
            textAnchor="middle"
            fontSize="12"
            fill="rgb(100, 100, 100)"
          >
            Time
          </text>
          
          {/* Y-axis label */}
          <text
            x="20"
            y="20"
            textAnchor="start"
            fontSize="12"
            fontWeight="600"
            fill="rgb(80, 80, 80)"
          >
            Value ($)
          </text>
          
          {/* Fill areas under lines */}
          {series.map((line) => (
            <path
              key={`${line.label}-fill`}
              d={buildFillArea(line.values, width, height, pad, min, max)}
              fill={`rgba(59, 130, 246, 0.08)`}
              stroke="none"
            />
          ))}
          
          {/* Lines */}
          {series.map((line) => (
            <path
              key={line.label}
              d={buildPath(line.values, width, height, pad, min, max)}
              fill="none"
              stroke={line.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgb(220, 220, 220)' }}>
        <p className="lead" style={{ margin: '8px 0' }}>
          <strong>Range:</strong> ${min.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className="lead" style={{ margin: '8px 0', fontSize: '14px', color: 'rgb(100, 100, 100)' }}>
          {series.map((line) => (
            <span key={line.label} style={{ marginRight: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: line.color, borderRadius: '2px' }}></span>
              {line.label}
            </span>
          ))}
        </p>
      </div>
    </>
  )
}

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

  const equityCurve = Array.isArray(result.equity_curve)
    ? result.equity_curve
        .map((point) => {
          const value = toFiniteNumber(point?.value)
          if (!isValidDate(point?.date) || value === null) {
            return null
          }
          return { date: point.date, value }
        })
        .filter((point): point is { date: string; value: number } => point !== null)
    : []

  const recentPoints = equityCurve.slice(-5)

  const isBollinger = result.strategy === 'bollinger_bands_strategy'
  const bollingerSeries = Array.isArray(result.bollinger_series)
    ? result.bollinger_series
        .map((point) => {
          const close = toFiniteNumber(point?.close)
          const upperBand = toFiniteNumber(point?.upper_band)
          const middleBand = toFiniteNumber(point?.middle_band)
          const lowerBand = toFiniteNumber(point?.lower_band)

          if (
            !isValidDate(point?.date) ||
            close === null ||
            upperBand === null ||
            middleBand === null ||
            lowerBand === null
          ) {
            return null
          }

          return {
            date: point.date,
            close,
            upper_band: upperBand,
            middle_band: middleBand,
            lower_band: lowerBand,
          }
        })
        .filter(
          (point): point is {
            date: string
            close: number
            upper_band: number
            middle_band: number
            lower_band: number
          } => point !== null,
        )
    : []

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

      <section className="equity-chart">
        <MiniLineChart
          title="Equity Curve"
          series={[
            {
              label: 'Equity',
              color: '#2563eb',
              values: equityCurve.map((point) => point.value),
            },
          ]}
        />
      </section>

      {isBollinger && bollingerSeries.length > 0 ? (
        <section className="equity-chart">
          <BollingerBandsChart data={bollingerSeries} />
        </section>
      ) : null}

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
