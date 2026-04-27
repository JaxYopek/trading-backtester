from __future__ import annotations

import os
from typing import Literal

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.core.backtester import BacktestEngine
from app.core.strategies import (
    BollingerBands,
    MACD,
    MovingAverageCrossover,
    MultipleStrategyCombination,
    RSIStrategy,
)
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
        "combined_strategy",
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

class TradeSignal(BaseModel):
    date: str
    signal: int  # 1 for BUY, -1 for SELL, 0 for HOLD
    price: float

class MAPoint(BaseModel):
    date: str
    close: float
    short_ma: float
    long_ma: float
    signal: int

class RSIPoint(BaseModel):
    date: str
    close: float
    rsi: float
    signal: int

class MACDPoint(BaseModel):
    date: str
    close: float
    macd_line: float
    signal_line: float
    histogram: float
    signal: int

class StrategyResult(BaseModel):
    strategy: str
    metrics: MetricSummary
    equity_curve: list[EquityPoint]

class BollingerPoint(BaseModel):
    date: str
    close: float
    upper_band: float
    middle_band: float
    lower_band: float
    signal: int


class MAPoint(BaseModel):
    date: str
    close: float
    short_ma: float
    long_ma: float
    signal: int


class RSIPoint(BaseModel):
    date: str
    close: float
    rsi: float
    signal: int


class MACDPoint(BaseModel):
    date: str
    close: float
    macd_line: float
    signal_line: float
    histogram: float
    signal: int


class BacktestResponse(BaseModel):
    strategy: Literal[
        "ma_crossover",
        "rsi_strategy",
        "macd_strategy",
        "bollinger_bands_strategy",
        "combined_strategy",
    ]
    metrics: MetricSummary
    equity_curve: list[EquityPoint]
    trade_signals: list[TradeSignal] | None = None
    ma_series: list[MAPoint] | None = None
    rsi_series: list[RSIPoint] | None = None
    macd_series: list[MACDPoint] | None = None
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
    if name == "combined_strategy":
        # Create a combination of all main strategies with customizable parameters
        ma_strategy = MovingAverageCrossover(
            short_window=kwargs.get("shortWindow", 20),
            long_window=kwargs.get("longWindow", 50)
        )
        rsi_strategy = RSIStrategy(rsi_period=kwargs.get("rsiPeriod", 14))
        macd_strategy = MACD(
            short_window=kwargs.get("fastPeriod", 12),
            long_window=kwargs.get("slowPeriod", 26),
            signal_window=kwargs.get("signalPeriod", 9)
        )
        bollinger_strategy = BollingerBands()
        return MultipleStrategyCombination(strategies=[ma_strategy, rsi_strategy, macd_strategy, bollinger_strategy])
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

        # Generate MA series for MA Crossover strategy
        ma_series = None
        if request.strategy == "ma_crossover":
            ma_series = [
                MAPoint(
                    date=str(date.date()),
                    close=float(row["close"]),
                    short_ma=float(row["short_ma"]) if "short_ma" in row and pd.notna(row["short_ma"]) else 0,
                    long_ma=float(row["long_ma"]) if "long_ma" in row and pd.notna(row["long_ma"]) else 0,
                    signal=int(row["signal"]),
                )
                for date, row in signal_data.iterrows()
                if pd.notna(row.get("short_ma")) and pd.notna(row.get("long_ma"))
            ]

        # Generate RSI series for RSI strategy
        rsi_series = None
        if request.strategy == "rsi_strategy":
            rsi_series = [
                RSIPoint(
                    date=str(date.date()),
                    close=float(row["close"]),
                    rsi=float(row["rsi"]) if "rsi" in row and pd.notna(row["rsi"]) else 0,
                    signal=int(row["signal"]),
                )
                for date, row in signal_data.iterrows()
                if "rsi" in row and pd.notna(row["rsi"])
            ]

        # Generate MACD series for MACD strategy
        macd_series = None
        if request.strategy == "macd_strategy":
            macd_series = [
                MACDPoint(
                    date=str(date.date()),
                    close=float(row["close"]),
                    macd_line=float(row["macd_line"]) if "macd_line" in row and pd.notna(row["macd_line"]) else 0,
                    signal_line=float(row["signal_line"]) if "signal_line" in row and pd.notna(row["signal_line"]) else 0,
                    histogram=float(row["macd_line"] - row["signal_line"]) if "macd_line" in row and "signal_line" in row and pd.notna(row["macd_line"]) and pd.notna(row["signal_line"]) else 0,
                    signal=int(row["signal"]),
                )
                for date, row in signal_data.iterrows()
                if "macd_line" in row and "signal_line" in row and pd.notna(row["macd_line"]) and pd.notna(row["signal_line"])
            ]

        # Generate trade signals for visualization (shows buy/sell points on charts)
        trade_signals = [
            TradeSignal(
                date=str(date.date()),
                signal=int(row["signal"]),
                price=float(row["close"])
            )
            for date, row in signal_data.iterrows()
            if row["signal"] != 0  # Only include actual buy/sell signals
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
            trade_signals=trade_signals,
            ma_series=ma_series,
            rsi_series=rsi_series,
            macd_series=macd_series,
            bollinger_series=bollinger_series,
        )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {exc}") from exc


@app.post("/compare-strategies")
def compare_strategies(symbol: str, initialCapital: float = 10000) -> dict:
    """
    Compare all trading strategies on the same stock.
    
    Args:
        symbol: Stock symbol (e.g., 'AAPL')
        initialCapital: Starting capital for backtesting
    
    Returns:
        Dictionary with results for each strategy
    """
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")
    
    if not symbol.strip():
        raise HTTPException(status_code=400, detail="Symbol is required")
    
    if initialCapital <= 0:
        raise HTTPException(status_code=400, detail="Initial capital must be greater than 0")
    
    try:
        fetcher = DataFetcher(api_key)
        market_data = fetcher.get_daily_data(symbol.upper(), outputsize="compact")
        
        strategies_to_compare = [
            ("ma_crossover", MovingAverageCrossover(short_window=20, long_window=50)),
            ("rsi_strategy", RSIStrategy(rsi_period=14)),
            ("macd_strategy", MACD(short_window=12, long_window=26, signal_window=9)),
            ("bollinger_bands_strategy", BollingerBands()),
        ]
        
        results = {
            "symbol": symbol.upper(),
            "initial_capital": initialCapital,
            "strategies": {}
        }
        
        for strategy_name, strategy in strategies_to_compare:
            try:
                signal_data = strategy.generate_signals(market_data)
                
                if signal_data.empty:
                    continue
                
                engine = BacktestEngine(initial_capital=initialCapital)
                backtest_results = engine.run(signal_data)
                
                metrics = backtest_results["metrics"]
                portfolio_values = backtest_results["portfolio_values"]
                
                equity_curve = [
                    {"date": str(date.date()), "value": float(value)}
                    for date, value in zip(signal_data.index, portfolio_values)
                ]
                
                results["strategies"][strategy_name] = {
                    "name": str(strategy),
                    "metrics": {
                        "total_return_pct": float(metrics["total_return_pct"]),
                        "buy_hold_return": float(metrics["buy_hold_return_pct"]),
                        "max_drawdown": float(metrics["max_drawdown_pct"]),
                        "sharpe_ratio": float(metrics["sharpe_ratio"]),
                        "win_rate": float(metrics["win_rate"] * 100),
                        "profit_factor": float(metrics["profit_factor"]) if metrics["profit_factor"] != float('inf') else 0,
                        "num_trades": int(metrics["num_trades"]),
                        "final_value": float(backtest_results["final_value"]),
                    },
                    "equity_curve": equity_curve
                }
            except Exception as e:
                # Log error but continue with other strategies
                print(f"Error with strategy {strategy_name}: {e}")
                continue
        
        return results
    
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Strategy comparison failed: {exc}") from exc
