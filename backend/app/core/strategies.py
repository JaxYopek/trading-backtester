"""
Trading Strategies
==================
This module contains different trading strategies.

What is a trading strategy?
- A set of rules that tells us when to BUY or SELL
- Based on price patterns or indicators
- Can be backtested on historical data to see if they would have been profitable

First strategy: Moving Average Crossover
"""

import pandas as pd
from typing import Literal


class MovingAverageCrossover:
    """
    Moving Average Crossover Strategy
    ==================================
    
    Concept:
    - A moving average (MA) is the average price over N days
    - Example: 20-day MA = average of last 20 closing prices
    - Short MA (fast) reacts quickly to price changes
    - Long MA (slow) changes more gradually
    
    Trading Rules:
    - BUY when fast MA crosses ABOVE slow MA (bullish signal)
    - SELL when fast MA crosses BELOW slow MA (bearish signal)
    
    Example:
    - Fast: 20-day MA, Slow: 50-day MA
    - When 20-day crosses above 50-day → BUY
    - When 20-day crosses below 50-day → SELL
    """
    
    def __init__(self, short_window: int = 20, long_window: int = 50):
        """
        Initialize the strategy.
        
        Args:
            short_window: Period for fast moving average (default: 20 days)
            long_window: Period for slow moving average (default: 50 days)
        """
        self.short_window = short_window
        self.long_window = long_window
        self.name = f"MA Crossover ({short_window}/{long_window})"
    
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Generate buy/sell signals based on moving average crossover.
        
        Args:
            data: DataFrame with price data (must have 'close' column)
        
        Returns:
            DataFrame with added columns:
            - 'short_ma': Short-term moving average
            - 'long_ma': Long-term moving average  
            - 'signal': 1 for BUY, -1 for SELL, 0 for HOLD
            - 'position': Current position (1 = holding stock, 0 = holding cash)
        
        How it works:
        1. Calculate short and long moving averages
        2. Find where short MA crosses long MA
        3. Generate buy signal on upward cross
        4. Generate sell signal on downward cross
        """
        df = data.copy()
        
        # Step 1: Calculate moving averages
        # .rolling() creates a sliding window that moves through the data
        # .mean() calculates the average of values in that window
        df['short_ma'] = df['close'].rolling(window=self.short_window).mean()
        df['long_ma'] = df['close'].rolling(window=self.long_window).mean()
        
        # Step 2: Initialize signal column
        df['signal'] = 0
        
        # Step 3: Generate signals
        # When short MA > long MA, we want to be in the market (1)
        # When short MA < long MA, we want to be out of the market (0)
        df['position'] = 0
        df.loc[df['short_ma'] > df['long_ma'], 'position'] = 1
        
        # Step 4: Create buy/sell signals at crossover points
        # We detect crossovers by looking at changes in position
        # diff() calculates the difference between current and previous row
        # 1 = crossover up (BUY), -1 = crossover down (SELL)
        df['signal'] = df['position'].diff()
        
        # Clean up the first rows (they have NaN due to moving average calculation)
        df = df.dropna()
        
        return df
    
    def __str__(self):
        return self.name


# For testing the strategy
if __name__ == "__main__":
    # Example: Create some sample data
    import numpy as np
    
    dates = pd.date_range('2023-01-01', periods=200, freq='D')
    
    # Simulate a stock price with an upward trend
    prices = 100 + np.cumsum(np.random.randn(200) * 2)
    
    df = pd.DataFrame({
        'close': prices
    }, index=dates)
    
    # Apply the strategy
    strategy = MovingAverageCrossover(short_window=10, long_window=30)
    signals = strategy.generate_signals(df)
    
    print(f"Strategy: {strategy}\n")
    print("Sample of generated signals:")
    print(signals[['close', 'short_ma', 'long_ma', 'signal', 'position']].tail(10))
    
    # Count signals
    buy_signals = (signals['signal'] == 1).sum()
    sell_signals = (signals['signal'] == -1).sum()
    
    print(f"\nTotal BUY signals: {buy_signals}")
    print(f"Total SELL signals: {sell_signals}")
