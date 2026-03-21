import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { runBacktest, type BacktestResponse, type StrategyType } from '../services/backtestApi'

const strategyOptions: Array<{ label: string; value: StrategyType }> = [
  { label: 'Moving Average Crossover', value: 'ma_crossover' },
  { label: 'RSI Strategy', value: 'rsi_strategy' },
  { label: 'MACD Strategy', value: 'macd_strategy' },
  { label: 'Bollinger Bands Strategy', value: 'bollinger_bands_strategy' },
]

export default function BacktestPage() {
  const navigate = useNavigate()
  const [symbol, setSymbol] = useState('AAPL')
  const [initialCapital, setInitialCapital] = useState(10000)
  const [strategy, setStrategy] = useState<StrategyType>('ma_crossover')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      })

      navigate('/results', { state: { result: data } })
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
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? 'Running...' : 'Run Backtest'}
        </button>
      </form>
    </main>
  )
}
