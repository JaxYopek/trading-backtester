import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { runBacktest, type BacktestResponse, type StrategyType } from '../services/backtestApi'
import type { BacktestRun } from '../services/savedResultsStore'

const strategyOptions: Array<{ label: string; value: StrategyType }> = [
  { label: 'Moving Average Crossover', value: 'ma_crossover' },
  { label: 'RSI Strategy', value: 'rsi_strategy' },
  { label: 'MACD Strategy', value: 'macd_strategy' },
  { label: 'Bollinger Bands Strategy', value: 'bollinger_bands_strategy' },
  { label: 'Combined Strategy (All 4)', value: 'combined_strategy' },
]

const strategyDescriptions: Record<StrategyType, string> = {
  ma_crossover:
    'A trend-following strategy that generates buy signals when a short-term moving average crosses above a long-term average, and sell signals when it crosses below. Best for trending markets with clear momentum.',
  rsi_strategy:
    'Uses the Relative Strength Index to identify overbought (>70) and oversold (<30) conditions. Buy when RSI is oversold, sell when overbought. Effective in range-bound, sideways markets.',
  macd_strategy:
    'Combines exponential moving averages to identify momentum changes and trend direction. Generates signals when the MACD line crosses the signal line. Good for identifying trend reversals and momentum shifts.',
  bollinger_bands_strategy:
    'Uses volatility-based bands around a simple moving average. Buy when price touches the lower band, sell at the upper band. Effective for mean-reversion strategies in volatile markets.',
  combined_strategy:
    'Combines all 4 strategies (MA Crossover, RSI, MACD, Bollinger Bands) using consensus voting. A buy signal requires 2+ strategies to agree, reducing false signals. Blends momentum and mean-reversion approaches for robust signals. Great for risk-averse traders.',
}

export default function BacktestPage() {
  const navigate = useNavigate()
  const [symbol, setSymbol] = useState('AAPL')
  const [initialCapital, setInitialCapital] = useState(10000)
  const [strategy, setStrategy] = useState<StrategyType>('ma_crossover')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Moving Average Crossover params
  const [shortWindow, setShortWindow] = useState(20)
  const [longWindow, setLongWindow] = useState(50)
  
  // RSI Strategy params
  const [rsiPeriod, setRsiPeriod] = useState(14)
  
  // MACD Strategy params
  const [fastPeriod, setFastPeriod] = useState(12)
  const [slowPeriod, setSlowPeriod] = useState(26)
  const [signalPeriod, setSignalPeriod] = useState(9)

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
      const data: BacktestResponse = await runBacktest({
        symbol: symbol.trim().toUpperCase(),
        initialCapital,
        strategy,
        shortWindow: strategy === 'ma_crossover' || strategy === 'combined_strategy' ? shortWindow : undefined,
        longWindow: strategy === 'ma_crossover' || strategy === 'combined_strategy' ? longWindow : undefined,
        rsiPeriod: strategy === 'rsi_strategy' || strategy === 'combined_strategy' ? rsiPeriod : undefined,
        fastPeriod: strategy === 'macd_strategy' || strategy === 'combined_strategy' ? fastPeriod : undefined,
        slowPeriod: strategy === 'macd_strategy' || strategy === 'combined_strategy' ? slowPeriod : undefined,
        signalPeriod: strategy === 'macd_strategy' || strategy === 'combined_strategy' ? signalPeriod : undefined,
      })

      const run: BacktestRun = {
        request: {
          symbol: symbol.trim().toUpperCase(),
          initialCapital,
          strategy,
          shortWindow: strategy === 'ma_crossover' || strategy === 'combined_strategy' ? shortWindow : undefined,
          longWindow: strategy === 'ma_crossover' || strategy === 'combined_strategy' ? longWindow : undefined,
          rsiPeriod: strategy === 'rsi_strategy' || strategy === 'combined_strategy' ? rsiPeriod : undefined,
          fastPeriod: strategy === 'macd_strategy' || strategy === 'combined_strategy' ? fastPeriod : undefined,
          slowPeriod: strategy === 'macd_strategy' || strategy === 'combined_strategy' ? slowPeriod : undefined,
          signalPeriod: strategy === 'macd_strategy' || strategy === 'combined_strategy' ? signalPeriod : undefined,
        },
        result: data,
      }

      navigate('/results', { state: { run, result: data } })
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <h1>Run Backtest</h1>
      <p className="lead">Set strategy inputs and execute a backtest from the browser.</p>

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

        <label>
          Strategy
          <select value={strategy} onChange={(event) => setStrategy(event.target.value as StrategyType)}>
            {strategyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p style={{ marginTop: '8px', fontSize: '14px', color: 'rgb(107, 114, 128)', fontStyle: 'italic' }}>
            {strategyDescriptions[strategy]}
          </p>
        </label>

        {/* Moving Average Crossover Strategy Fields */}
        {strategy === 'ma_crossover' && (
          <>
            <label>
              Short MA Window
              <input
                type="number"
                min={1}
                step={1}
                value={shortWindow}
                onChange={(event) => setShortWindow(event.target.valueAsNumber)}
              />
            </label>
            <label>
              Long MA Window
              <input
                type="number"
                min={1}
                step={1}
                value={longWindow}
                onChange={(event) => setLongWindow(event.target.valueAsNumber)}
              />
            </label>
          </>
        )}

        {/* RSI Strategy Fields */}
        {strategy === 'rsi_strategy' && (
          <label>
            RSI Period
            <input
              type="number"
              min={1}
              step={1}
              value={rsiPeriod}
              onChange={(event) => setRsiPeriod(event.target.valueAsNumber)}
            />
          </label>
        )}

        {/* MACD Strategy Fields */}
        {strategy === 'macd_strategy' && (
          <>
            <label>
              Fast EMA Period
              <input
                type="number"
                min={1}
                step={1}
                value={fastPeriod}
                onChange={(event) => setFastPeriod(event.target.valueAsNumber)}
              />
            </label>
            <label>
              Slow EMA Period
              <input
                type="number"
                min={1}
                step={1}
                value={slowPeriod}
                onChange={(event) => setSlowPeriod(event.target.valueAsNumber)}
              />
            </label>
            <label>
              Signal Line Period
              <input
                type="number"
                min={1}
                step={1}
                value={signalPeriod}
                onChange={(event) => setSignalPeriod(event.target.valueAsNumber)}
              />
            </label>
          </>
        )}

        {/* Combined Strategy Fields (shows all three sets of parameters) */}
        {strategy === 'combined_strategy' && (
          <>
            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <legend style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Moving Average Parameters</legend>
              <label>
                Short MA Window
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={shortWindow}
                  onChange={(event) => setShortWindow(event.target.valueAsNumber)}
                />
              </label>
              <label>
                Long MA Window
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={longWindow}
                  onChange={(event) => setLongWindow(event.target.valueAsNumber)}
                />
              </label>
            </fieldset>

            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <legend style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>RSI Parameters</legend>
              <label>
                RSI Period
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={rsiPeriod}
                  onChange={(event) => setRsiPeriod(event.target.valueAsNumber)}
                />
              </label>
            </fieldset>

            <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <legend style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>MACD Parameters</legend>
              <label>
                Fast EMA Period
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={fastPeriod}
                  onChange={(event) => setFastPeriod(event.target.valueAsNumber)}
                />
              </label>
              <label>
                Slow EMA Period
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={slowPeriod}
                  onChange={(event) => setSlowPeriod(event.target.valueAsNumber)}
                />
              </label>
              <label>
                Signal Line Period
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={signalPeriod}
                  onChange={(event) => setSignalPeriod(event.target.valueAsNumber)}
                />
              </label>
            </fieldset>
          </>
        )}

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? 'Running...' : 'Run Backtest'}
        </button>
      </form>
    </main>
  )
}
