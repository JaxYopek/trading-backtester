from __future__ import annotations

import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.core.backtester import BacktestEngine
from app.core.strategies import BollingerBands, MACD, MovingAverageCrossover, RSIStrategy
from app.services.data_fetcher import DataFetcher


load_dotenv()


class BacktestRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10)
    initialCapital: float = Field(..., gt=0)
    strategy: Literal[
        "ma_crossover",
        "rsi_strategy",
        "macd_strategy",
        "bollinger_bands_strategy",
    ]
    # Moving Average Crossover params
    shortWindow: int | None = None
    longWindow: int | None = None
    # RSI Strategy params
    rsiPeriod: int | None = None
    # MACD Strategy params
    fastPeriod: int | None = None
    slowPeriod: int | None = None
    signalPeriod: int | None = None


class MetricSummary(BaseModel):
    total_return: float
    total_return_pct: float
    max_drawdown: float
    number_of_trades: int
    final_value: float
    buy_hold_return: float
    sharpe_ratio: float
    win_rate: float
    profit_factor: float
    std: float
    volatility: float


class EquityPoint(BaseModel):
    date: str
    value: float

class BollingerPoint(BaseModel):
    date: str
    close: float
    upper_band: float
    middle_band: float
    lower_band: float
    signal: int


class BacktestResponse(BaseModel):
    strategy: Literal[
        "ma_crossover",
        "rsi_strategy",
        "macd_strategy",
        "bollinger_bands_strategy",
    ]
    metrics: MetricSummary
    equity_curve: list[EquityPoint]
    bollinger_series: list[BollingerPoint] | None = None


app = FastAPI(title="Trading Backtester API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _resolve_strategy(name: str, **kwargs):
    if name == "ma_crossover":
        short_window = kwargs.get("shortWindow", 20)
        long_window = kwargs.get("longWindow", 50)
        return MovingAverageCrossover(short_window=short_window, long_window=long_window)
    if name == "rsi_strategy":
        rsi_period = kwargs.get("rsiPeriod", 14)
        return RSIStrategy(rsi_period=rsi_period)
    if name == "macd_strategy":
        fast_period = kwargs.get("fastPeriod", 12)
        slow_period = kwargs.get("slowPeriod", 26)
        signal_period = kwargs.get("signalPeriod", 9)
        return MACD(short_window=fast_period, long_window=slow_period, signal_window=signal_period)
    if name == "bollinger_bands_strategy":
        return BollingerBands()
    raise HTTPException(status_code=400, detail="Unsupported strategy")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/backtest", response_model=BacktestResponse)
def run_backtest(request: BacktestRequest) -> BacktestResponse:
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")

    try:
        fetcher = DataFetcher(api_key)
        market_data = fetcher.get_daily_data(request.symbol.upper(), outputsize="compact")
        strategy = _resolve_strategy(
            request.strategy,
            shortWindow=request.shortWindow,
            longWindow=request.longWindow,
            rsiPeriod=request.rsiPeriod,
            fastPeriod=request.fastPeriod,
            slowPeriod=request.slowPeriod,
            signalPeriod=request.signalPeriod,
        )
        signal_data = strategy.generate_signals(market_data)

        if signal_data.empty:
            raise HTTPException(
                status_code=400,
                detail="No signal data generated for the selected strategy and symbol.",
            )

        engine = BacktestEngine(initial_capital=request.initialCapital)
        results = engine.run(signal_data)

        metrics = results["metrics"]
        portfolio_values = results["portfolio_values"]
        equity_curve = [
            EquityPoint(date=str(date.date()), value=float(value))
            for date, value in zip(signal_data.index, portfolio_values)
        ]

        bollinger_series = None
        if request.strategy == "bollinger_bands_strategy":
            bollinger_series = [
                BollingerPoint(
                    date=str(date.date()),
                    close=float(row["close"]),
                    upper_band=float(row["upper_band"]),
                    middle_band=float(row["middle_band"]),
                    lower_band=float(row["lower_band"]),
                    signal=int(row["signal"]),
                )
                for date, row in signal_data.iterrows()
            ]

        return BacktestResponse(
            strategy=request.strategy,
            metrics=MetricSummary(
                total_return=float(metrics["total_return_pct"]) / 100.0,
                total_return_pct=float(metrics["total_return_pct"]),
                max_drawdown=float(metrics["max_drawdown_pct"]) / 100.0,
                number_of_trades=int(metrics["num_trades"]),
                final_value=float(results["final_value"]),
                buy_hold_return=float(metrics["buy_hold_return_pct"]),
                sharpe_ratio=float(metrics["sharpe_ratio"]),
                win_rate=float(metrics["win_rate"]),
                profit_factor=float(metrics["profit_factor"]) if metrics["profit_factor"] != float('inf') else 0,
                std=float(metrics["std"]),
                volatility=float(metrics["volatility"]),
            ),
            equity_curve=equity_curve,
            bollinger_series=bollinger_series,
        )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {exc}") from exc
