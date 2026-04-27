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

class RSIStrategy:
    """
    RSI Strategy
    ==============
    
    Concept:
    - RSI (Relative Strength Index) is a momentum oscillator that measures speed and change of price movements.
    - RSI values range from 0 to 100.
    - Common thresholds:
      - RSI > 70: Overbought (potential sell signal)
      - RSI < 30: Oversold (potential buy signal)
    
    Trading Rules:
    - BUY when RSI crosses above 30 (from oversold to neutral)
    - SELL when RSI crosses below 70 (from overbought to neutral)
    
    Example:
    - If RSI goes from 25 to 35 → BUY
    - If RSI goes from 75 to 65 → SELL
    """
    
    def __init__(self, rsi_period: int = 14):
        """
        Initialize the strategy.
        
        Args:
            rsi_period: Period for calculating RSI (default: 14 days)
        """
        self.rsi_period = rsi_period
        self.name = f"RSI Strategy ({rsi_period}-day)"
    
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Generate buy/sell signals based on RSI.
        
        Args:
            data: DataFrame with price data (must have 'close' column)
        
        Returns:
            DataFrame with added columns:
            - 'rsi': Calculated RSI values
            - 'signal': 1 for BUY, -1 for SELL, 0 for HOLD
        
        How it works:
        1. Calculate price changes and gains/losses
        2. Compute average gain and loss over the specified period
        3. Calculate RSI using the formula: RSI = 100 - (100 / (1 + RS))
           where RS = Average Gain / Average Loss
        4. Generate buy/sell signals based on crossing thresholds
        """
        df = data.copy()
        
        # Step 1: Calculate price changes
        df['change'] = df['close'].diff()
        
        # Step 2: Separate gains and losses
        df['gain'] = df['change'].apply(lambda x: x if x > 0 else 0)
        df['loss'] = df['change'].apply(lambda x: -x if x < 0 else 0)
        
        # Step 3: Calculate average gain and loss
        df['avg_gain'] = df['gain'].rolling(window=self.rsi_period).mean()
        df['avg_loss'] = df['loss'].rolling(window=self.rsi_period).mean()
        
        # Step 4: Calculate RS (Relative Strength)
        # Handle division by zero
        df['rs'] = df['avg_gain'] / df['avg_loss'].replace(0, 1e-10)
        
        # Step 5: Calculate RSI
        # RSI = 100 - (100 / (1 + RS))
        df['rsi'] = 100 - (100 / (1 + df['rs']))
        
        # Step 6: Generate signals based on RSI thresholds
        # Buy signal: RSI crosses above 30 (from oversold)
        # Sell signal: RSI crosses below 70 (from overbought)
        
        df['signal'] = 0
        
        # Check if RSI crossed above 30 (BUY)
        # Compare current RSI to previous RSI
        rsi_prev = df['rsi'].shift(1)
        df.loc[(df['rsi'] > 30) & (rsi_prev <= 30), 'signal'] = 1
        
        # Check if RSI crossed below 70 (SELL)
        df.loc[(df['rsi'] < 70) & (rsi_prev >= 70), 'signal'] = -1
        
        # Clean up and drop NaN rows
        df = df.dropna()
        
        return df
    
    def __str__(self):
        return self.name
    
class MACD:
    """
    MACD Strategy
    
    """
    def __init__(self, short_window: int = 12, long_window: int = 26, signal_window: int = 9):
        self.short_window = short_window
        self.long_window = long_window
        self.signal_window = signal_window
        self.name = f"MACD ({short_window}/{long_window}/{signal_window})"
    
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        df = data.copy()
        
        # Calculate EMAs
        df['ema_short'] = df['close'].ewm(span=self.short_window, adjust=False).mean()
        df['ema_long'] = df['close'].ewm(span=self.long_window, adjust=False).mean()
        
        # Calculate MACD line and Signal line
        df['macd_line'] = df['ema_short'] - df['ema_long']
        df['signal_line'] = df['macd_line'].ewm(span=self.signal_window, adjust=False).mean()
        
        # Generate signals
        df['signal'] = 0
        
        # Buy signal: MACD line crosses above Signal line
        macd_prev = df['macd_line'].shift(1)
        signal_prev = df['signal_line'].shift(1)
        
        df.loc[(df['macd_line'] > df['signal_line']) & (macd_prev <= signal_prev), 'signal'] = 1
        
        # Sell signal: MACD line crosses below Signal line
        df.loc[(df['macd_line'] < df['signal_line']) & (macd_prev >= signal_prev), 'signal'] = -1
        
        return df




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

class BollingerBands:
    """
    Bollinger Bands Strategy
    
    Concept:
    - Bollinger Bands consist of a middle band (SMA) and two outer bands (standard deviations)
    - The bands expand and contract based on volatility
    - Common settings: 20-day SMA, 2 standard deviations
    
    Trading Rules:
    - BUY when price crosses below lower band (potentially oversold)
    - SELL when price crosses above upper band (potentially overbought)
    
    Example:
    - If price goes from above to below lower band → BUY
    - If price goes from below to above upper band → SELL
    """
    
    def __init__(self, window: int = 20, num_std_dev: float = 2.0, ddof: int = 1):
        self.window = window
        self.num_std_dev = num_std_dev
        self.ddof = ddof
        self.name = f"Bollinger Bands ({window}-day, {num_std_dev} std dev)"
    
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        df = data.copy()
        
        # Calculate middle band (SMA)
        df['middle_band'] = df['close'].rolling(window=self.window).mean()
        
        # Calculate standard deviation
        df['std_dev'] = df['close'].rolling(window=self.window).std(ddof=self.ddof)
        
        # Calculate upper and lower bands
        df['upper_band'] = df['middle_band'] + (self.num_std_dev * df['std_dev'])
        df['lower_band'] = df['middle_band'] - (self.num_std_dev * df['std_dev'])
        
        # Generate signals
        df['signal'] = 0
        
        # Buy signal: Price crosses below lower band
        price_prev = df['close'].shift(1)
        lower_prev = df['lower_band'].shift(1)
        
        df.loc[(df['close'] < df['lower_band']) & (price_prev >= lower_prev), 'signal'] = 1
        
        # Sell signal: Price crosses above upper band
        upper_prev = df['upper_band'].shift(1)
        
        df.loc[(df['close'] > df['upper_band']) & (price_prev <= upper_prev), 'signal'] = -1

        # Drop initial rows where bands are undefined (NaNs)
        df = df.dropna(subset=['middle_band', 'upper_band', 'lower_band', 'std_dev'])

        return df


class MultipleStrategyCombination:
    """
    Multiple Strategy Combination
    ==============================
    
    Combines signals from multiple strategies using a voting mechanism.
    
    Concept:
    - Run multiple trading strategies on the same data
    - Combine their signals using consensus (majority voting)
    - Reduces false signals by requiring agreement from multiple strategies
    - More robust trading signals through diversification of indicators
    
    Voting Rules:
    - BUY signal: 2+ strategies agree to BUY
    - SELL signal: 2+ strategies agree to SELL
    - HOLD: Less than 2 strategies agree
    
    Example:
    - If MA Crossover says BUY and RSI says BUY → Consensus BUY
    - If MA Crossover says BUY but RSI says HOLD → Consensus HOLD
    """
    
    def __init__(self, strategies: list = None):
        """
        Initialize with a list of trading strategies.
        
        Args:
            strategies: List of strategy instances to combine
                       (defaults to MA Crossover, RSI, and MACD)
        """
        if strategies is None:
            # Default combination: MA Crossover, RSI, and MACD
            strategies = [
                MovingAverageCrossover(short_window=20, long_window=50),
                RSIStrategy(rsi_period=14),
                MACD(short_window=12, long_window=26, signal_window=9),
            ]
        
        self.strategies = strategies
        self.strategy_names = [str(s) for s in strategies]
        self.name = f"Combined ({', '.join(self.strategy_names)})"
    
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Generate combined buy/sell signals from multiple strategies.
        
        Args:
            data: DataFrame with price data (must have 'close' column)
        
        Returns:
            DataFrame with added columns:
            - 'signal': 1 for BUY, -1 for SELL, 0 for HOLD (consensus)
            - Individual strategy signals and indicators
        
        How it works:
        1. Generate signals from each strategy
        2. For each day, count how many strategies agree on BUY/SELL
        3. Generate consensus signal using majority voting (≥2 strategies)
        4. Include all individual strategy signals for transparency
        """
        df = data.copy()
        
        # Generate signals from all strategies
        strategy_signals = {}
        all_data_cols = [df]
        
        for i, strategy in enumerate(self.strategies):
            signals_df = strategy.generate_signals(data)
            strategy_signals[i] = signals_df
            
            # Extract just the signal column with a unique name
            signal_col = signals_df[['signal']].copy()
            signal_col.columns = [f'signal_{i}']
            all_data_cols.append(signal_col)
        
        # Combine all data
        df = pd.concat(all_data_cols, axis=1)
        
        # Count agreement votes for each day
        signal_cols = [f'signal_{i}' for i in range(len(self.strategies))]
        df['buy_votes'] = (df[signal_cols] == 1).sum(axis=1)
        df['sell_votes'] = (df[signal_cols] == -1).sum(axis=1)
        
        # Generate consensus signal (threshold: 2+ strategies must agree)
        df['signal'] = 0
        df.loc[df['buy_votes'] >= 2, 'signal'] = 1
        df.loc[df['sell_votes'] >= 2, 'signal'] = -1
        
        # Store all strategy signals for reference
        df['num_strategies'] = len(self.strategies)
        
        # Include selected columns from each strategy for visualization
        for i, strategy_df in strategy_signals.items():
            # Add common indicator columns if they exist
            indicator_cols = []
            if 'short_ma' in strategy_df.columns:
                indicator_cols.extend(['short_ma', 'long_ma'])
            if 'rsi' in strategy_df.columns:
                indicator_cols.append('rsi')
            if 'macd_line' in strategy_df.columns:
                indicator_cols.extend(['macd_line', 'signal_line'])
            if 'upper_band' in strategy_df.columns:
                indicator_cols.extend(['upper_band', 'middle_band', 'lower_band'])
            
            for col in indicator_cols:
                if col in strategy_df.columns and col not in df.columns:
                    df[col] = strategy_df[col]
        
        # Clean up
        df = df.dropna()
        
        return df
    
    def __str__(self):
        return self.name