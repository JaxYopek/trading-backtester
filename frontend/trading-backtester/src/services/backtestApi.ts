export type StrategyType = 'ma_crossover' | 'rsi_strategy' | 'macd_strategy' | 'bollinger_bands_strategy'

export interface BacktestRequest {
  symbol: string
  initialCapital: number
  strategy: StrategyType
}

export interface MetricSummary {
  total_return: number
  max_drawdown: number
  number_of_trades: number
  final_value: number
}

export interface EquityPoint {
  date: string
  value: number
}

export interface BollingerPoint {
  date: string
  close: number
  upper_band: number
  middle_band: number
  lower_band: number
  signal: number
}

export interface BacktestResponse {
  strategy: StrategyType
  metrics: MetricSummary
  equity_curve: EquityPoint[]
  bollinger_series?: BollingerPoint[] | null
}

export async function runBacktest(payload: BacktestRequest): Promise<BacktestResponse> {
  const response = await fetch('http://localhost:8000/backtest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let detail = 'Backtest request failed. Make sure backend is running on port 8000.'
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

  return response.json() as Promise<BacktestResponse>
}
