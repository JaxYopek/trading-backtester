export type StrategyType = 'ma_crossover' | 'rsi_strategy' | 'macd_strategy' | 'bollinger_bands_strategy' | 'combined_strategy'

export interface BacktestRequest {
  symbol: string
  initialCapital: number
  strategy: StrategyType
  // Moving Average Crossover params
  shortWindow?: number
  longWindow?: number
  // RSI Strategy params
  rsiPeriod?: number
  // MACD Strategy params
  fastPeriod?: number
  slowPeriod?: number
  signalPeriod?: number
}

export interface MetricSummary {
  total_return: number
  total_return_pct: number
  max_drawdown: number
  number_of_trades: number
  final_value: number
  buy_hold_return: number
  sharpe_ratio: number
  win_rate: number
  profit_factor: number
  std: number
  volatility: number
}

export interface EquityPoint {
  date: string
  value: number
}

export interface TradeSignal {
  date: string
  signal: number  // 1 for BUY, -1 for SELL
  price: number
}

export interface MAPoint {
  date: string
  close: number
  short_ma: number
  long_ma: number
  signal: number
}

export interface RSIPoint {
  date: string
  close: number
  rsi: number
  signal: number
}

export interface MACDPoint {
  date: string
  close: number
  macd_line: number
  signal_line: number
  histogram: number
  signal: number
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
  trade_signals?: TradeSignal[] | null
  ma_series?: MAPoint[] | null
  rsi_series?: RSIPoint[] | null
  macd_series?: MACDPoint[] | null
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
