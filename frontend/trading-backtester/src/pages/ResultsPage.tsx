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

function buildSmoothPath(values: number[], width: number, height: number, pad: number, min: number, max: number): string {
  if (values.length === 0) {
    return ''
  }

  const xSpan = width - pad * 2
  const ySpan = height - pad * 2
  const safeDenominator = max - min === 0 ? 1 : max - min

  let path = ''

  values.forEach((value, index) => {
    const x = pad + (values.length === 1 ? xSpan / 2 : (index / (values.length - 1)) * xSpan)
    const y = pad + ((max - value) / safeDenominator) * ySpan

    if (index === 0) {
      path += `M${x.toFixed(2)},${y.toFixed(2)}`
    } else {
      const prevValue = values[index - 1]
      const prevX = pad + ((index - 1) / (values.length - 1)) * xSpan
      const prevY = pad + ((max - prevValue) / safeDenominator) * ySpan

      const controlX = (prevX + x) / 2
      const controlY = (prevY + y) / 2

      path += ` Q${controlX.toFixed(2)},${controlY.toFixed(2)} ${x.toFixed(2)},${y.toFixed(2)}`
    }
  })

  return path
}

function buildSmoothFillArea(values: number[], width: number, height: number, pad: number, min: number, max: number): string {
  const linePath = buildSmoothPath(values, width, height, pad, min, max)
  if (!linePath) return ''

  const xSpan = width - pad * 2
  const ySpan = height - pad * 2

  const bottomY = pad + ySpan
  const topRightX = pad + xSpan

  return `${linePath} L${topRightX},${bottomY} L${pad},${bottomY} Z`
}

function MiniLineChart({ title, series }: { title: string; series: NumericSeries[] }) {
  const width = 1000
  const height = 450
  const pad = 60
  const gridLines = 6

  const allValues = series.flatMap((s) => s.values)

  if (allValues.length === 0 || series.every((s) => s.values.length === 0)) {
    return <p className="chart-fallback">No plottable points were returned for this run.</p>
  }

  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const range = max - min === 0 ? 1 : max - min
  const padding = range * 0.05

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
        stroke="rgba(200, 200, 200, 0.4)"
        strokeWidth="1"
        strokeDasharray="4,4"
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
        y={y + 5}
        textAnchor="end"
        fontSize="12"
        fontWeight="500"
        fill="rgb(107, 114, 128)"
      >
        ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </text>
    )
  }

  return (
    <>
      <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>{title}</h2>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid rgb(229, 231, 235)', padding: '20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ display: 'block' }} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
            <filter id={`shadow-${title}`}>
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>
          
          {/* Background */}
          <rect x={pad} y={pad} width={xSpan} height={ySpan} fill="rgba(249, 250, 251, 1)" stroke="rgb(229, 231, 235)" strokeWidth="1.5" rx="4" />
          
          {/* Grid lines */}
          {gridLineElements}
          
          {/* Y-axis */}
          <line x1={pad} y1={pad} x2={pad} y2={pad + ySpan} stroke="rgb(107, 114, 128)" strokeWidth="2" />
          
          {/* X-axis */}
          <line x1={pad} y1={pad + ySpan} x2={width - pad} y2={pad + ySpan} stroke="rgb(107, 114, 128)" strokeWidth="2" />
          
          {/* Y-axis labels */}
          {yLabels}
          
          {/* X-axis label */}
          <text
            x={width / 2}
            y={height - 15}
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fill="rgb(107, 114, 128)"
          >
            Trading Days
          </text>
          
          {/* Y-axis label */}
          <text
            x="20"
            y="30"
            textAnchor="start"
            fontSize="13"
            fontWeight="600"
            fill="rgb(107, 114, 128)"
          >
            Portfolio Value
          </text>
          
          {/* Fill areas under lines */}
          {series.map((line) => (
            <path
              key={`${line.label}-fill`}
              d={buildSmoothFillArea(line.values, width, height, pad, min - padding, max + padding)}
              fill={`url(#gradient-${title})`}
              stroke="none"
            />
          ))}
          
          {/* Lines */}
          {series.map((line) => (
            <path
              key={line.label}
              d={buildSmoothPath(line.values, width, height, pad, min - padding, max + padding)}
              fill="none"
              stroke={line.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#shadow-${title})`}
            />
          ))}
          
          {/* Data point markers */}
          {series.map((line) =>
            line.values.map((value, index) => {
              const xSpanCalc = width - pad * 2
              const ySpanCalc = height - pad * 2
              const safeDenominator = (max + padding) - (min - padding) === 0 ? 1 : (max + padding) - (min - padding)
              const x = pad + (line.values.length === 1 ? xSpanCalc / 2 : (index / (line.values.length - 1)) * xSpanCalc)
              const y = pad + (((max + padding) - value) / safeDenominator) * ySpanCalc
              
              // Only show markers on key points (first, last, and every 10th point if many points)
              const showMarker = index === 0 || index === line.values.length - 1 || (line.values.length > 20 && index % Math.ceil(line.values.length / 5) === 0)
              
              return showMarker ? (
                <circle
                  key={`${line.label}-marker-${index}`}
                  cx={x}
                  cy={y}
                  r="5"
                  fill={line.color}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.8"
                />
              ) : null
            })
          )}
        </svg>
      </div>
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgb(229, 231, 235)' }}>
        <p style={{ margin: '8px 0', fontSize: '14px', color: 'rgb(107, 114, 128)', fontWeight: '500' }}>
          <strong>Range:</strong> ${(min - padding).toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${(max + padding).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p style={{ margin: '8px 0', fontSize: '13px', color: 'rgb(107, 114, 128)' }}>
          {series.map((line) => (
            <span key={line.label} style={{ marginRight: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '14px', height: '14px', backgroundColor: line.color, borderRadius: '3px' }}></span>
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

  const metricDescriptions: Record<string, string> = {
    'Total Return': 'The overall profit/loss percentage generated by your trading strategy.',
    'Buy & Hold Return': 'What you would have made if you simply bought and held the stock the entire time.',
    'Max Drawdown': 'The largest peak-to-trough decline experienced during the backtest period.',
    'Sharpe Ratio': 'Risk-adjusted return metric. Higher values indicate better returns per unit of risk.',
    'Win Rate': 'Percentage of trades that were profitable (or closed with a gain).',
    'Profit Factor': 'Gross profit divided by gross loss. Higher ratios indicate better profitability.',
    'Number of Trades': 'Total number of buy and sell trades executed during the backtest.',
    'Final Value': 'The ending portfolio value after all trades and the backtest period.',
    'Volatility': 'Annualized standard deviation of daily returns (measures price fluctuations).',
    'Std Dev of Returns': 'Daily standard deviation of portfolio returns (measure of day-to-day volatility).',
  }

  const InfoIcon = ({ metric }: { metric: string }) => (
    <div className="tooltip-container">
      <div className="info-icon">i</div>
      <div className="tooltip-text">{metricDescriptions[metric]}</div>
    </div>
  )

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
          <div className="metric-header">
            <h2>Total Return</h2>
            <InfoIcon metric="Total Return" />
          </div>
          <p>{result.metrics.total_return_pct.toFixed(2)}%</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Buy & Hold Return</h2>
            <InfoIcon metric="Buy & Hold Return" />
          </div>
          <p>{result.metrics.buy_hold_return.toFixed(2)}%</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Max Drawdown</h2>
            <InfoIcon metric="Max Drawdown" />
          </div>
          <p>{(result.metrics.max_drawdown * 100).toFixed(2)}%</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Sharpe Ratio</h2>
            <InfoIcon metric="Sharpe Ratio" />
          </div>
          <p>{result.metrics.sharpe_ratio.toFixed(2)}</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Win Rate</h2>
            <InfoIcon metric="Win Rate" />
          </div>
          <p>{(result.metrics.win_rate * 100).toFixed(2)}%</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Profit Factor</h2>
            <InfoIcon metric="Profit Factor" />
          </div>
          <p>{result.metrics.profit_factor.toFixed(2)}</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Number of Trades</h2>
            <InfoIcon metric="Number of Trades" />
          </div>
          <p>{result.metrics.number_of_trades}</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Final Value</h2>
            <InfoIcon metric="Final Value" />
          </div>
          <p>${result.metrics.final_value.toLocaleString()}</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Volatility</h2>
            <InfoIcon metric="Volatility" />
          </div>
          <p>{result.metrics.volatility.toFixed(4)}</p>
        </article>
        <article className="metric-card">
          <div className="metric-header">
            <h2>Std Dev of Returns</h2>
            <InfoIcon metric="Std Dev of Returns" />
          </div>
          <p>{result.metrics.std.toFixed(4)}</p>
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
        <div className="equity-points-container">
          {recentPoints.map((point, index) => {
            const percentChange = ((point.value - result.metrics.final_value) / result.metrics.final_value) * 100
            const isPositive = index === recentPoints.length - 1 || (index > 0 && recentPoints[index].value > recentPoints[index - 1].value)
            return (
              <div key={point.date} className="equity-point-card">
                <div className="point-date">{point.date}</div>
                <div className="point-value">${point.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className={`point-change ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? '↗' : '↘'} {Math.abs(percentChange).toFixed(2)}%
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
