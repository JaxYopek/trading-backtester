"""
Backtesting Engine
==================
This is the heart of the backtester. It simulates trading based on strategy signals.

What is backtesting?
- Testing a trading strategy on historical data
- Simulates buying and selling as if you were trading in the past
- Calculates how much money you would have made/lost
- Helps evaluate if a strategy is profitable before risking real money

"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple


class Trade:
    """Represents a single trade."""
    
    def __init__(self, date, action: str, price: float, shares: int):
        self.date = date
        self.action = action  # 'BUY' or 'SELL'
        self.price = price
        self.shares = shares
        self.value = price * shares
    
    def __repr__(self):
        return f"{self.action} {self.shares} shares @ ${self.price:.2f} on {self.date.date()}"


class BacktestEngine:
    """
    Backtesting Engine
    ==================
    Simulates trading a strategy and calculates performance metrics.
    """
    
    def __init__(self, initial_capital: float = 10000):
        """
        Initialize the backtester.
        
        Args:
            initial_capital: Starting cash amount (default: $10,000)
        """
        self.initial_capital = initial_capital
        self.trades: List[Trade] = []
    
    def run(self, data_with_signals: pd.DataFrame) -> Dict:
        """
        Run the backtest simulation.
        
        Args:
            data_with_signals: DataFrame with price data and 'signal' column
        
        Returns:
            Dictionary with backtest results and performance metrics
        
        How it works:
        1. Start with initial cash
        2. Loop through each day
        3. When signal = 1 (BUY): buy stocks with all cash
        4. When signal = -1 (SELL): sell all stocks
        5. Track portfolio value over time
        6. Calculate performance metrics
        """
        df = data_with_signals.copy()
        
        # Initialize portfolio
        cash = self.initial_capital
        shares = 0
        portfolio_values = []
        self.trades = []
        
        print(f"\n{'='*60}")
        print(f"BACKTEST SIMULATION")
        print(f"{'='*60}")
        print(f"Initial Capital: ${self.initial_capital:,.2f}")
        print(f"Period: {df.index[0].date()} to {df.index[-1].date()}")
        print(f"{'='*60}\n")
        
        # Step through each day
        trade_profits = []
        for date, row in df.iterrows():
            price = row['close']
            signal = row['signal']
            
            # BUY SIGNAL (signal = 1)
            if signal == 1 and shares == 0 and cash > 0:
                # Buy as many shares as we can afford
                shares = int(cash / price)
                if shares > 0:
                    entry_price = price
                    cost = shares * price
                    cash -= cost
                    trade = Trade(date, 'BUY', price, shares)
                    self.trades.append(trade)
                    print(f"buy {trade}")
            
            # SELL SIGNAL (signal = -1)
            elif signal == -1 and shares > 0:
                # Sell all shares
                proceeds = shares * price
                cash += proceeds
                trade_profits.append((price - entry_price) * shares)  # Profit from this trade
                trade = Trade(date, 'SELL', price, shares)
                self.trades.append(trade)
                print(f"sell {trade}")
                shares = 0
            

            # Calculate portfolio value (cash + value of stocks)
            portfolio_value = cash + (shares * price)
            portfolio_values.append(portfolio_value)
        
        # Final portfolio value
        final_value = portfolio_values[-1]
        
        # Calculate metrics
        metrics = self._calculate_metrics(portfolio_values, trade_profits, df)
        
        # Print summary
        print(f"RESULTS")
        print(f"{'='*60}")
        print(f"Total Trades: {len(self.trades)}")
        print(f"Final Portfolio Value: ${final_value:,.2f}")
        print(f"Total Return: ${final_value - self.initial_capital:,.2f} ({metrics['total_return_pct']:.2f}%)")
        print(f"Sharpe Ratio: {metrics['sharpe_ratio']:.2f}")
        print(f"Win Rate: {metrics['win_rate']:.2f}")
        print(f"Profit Factor: {metrics['profit_factor']:.2f}") if metrics['profit_factor'] > 0 else print(f"Profit Factor: N/A")
        print(f"Buy & Hold Return: {metrics['buy_hold_return_pct']:.2f}%")
        print(f"Standard Deviation of Returns: {metrics['std']:.4f}")
        print(f"Volatility: {metrics['volatility']:.4f}")

        
        return {
            'initial_capital': self.initial_capital,
            'final_value': final_value,
            'portfolio_values': portfolio_values,
            'trades': self.trades,
            'metrics': metrics,
        }
    
    def _calculate_metrics(self, portfolio_values: List[float], trade_profits: List[float], df: pd.DataFrame) -> Dict:
        """
        Calculate performance metrics.
        
        Metrics explained:
        - Total Return: How much money you made/lost (%)
        - Buy & Hold: What if you just bought and held the whole time?
        - Max Drawdown: Largest drop from peak (worst losing streak)
        - Sharpe Ratio: Risk-adjusted return
        """
        final_value = portfolio_values[-1]
        total_return = final_value - self.initial_capital
        total_return_pct = (total_return / self.initial_capital) * 100
        
        # Buy and hold comparison
        # What if we just bought at start and held until end?
        start_price = df['close'].iloc[0]
        end_price = df['close'].iloc[-1]
        buy_hold_return = ((end_price - start_price) / start_price) * 100
        
        # Maximum Drawdown
        # Measures the largest peak-to-trough decline
        peak = portfolio_values[0]
        max_drawdown = 0
        for value in portfolio_values:
            if value > peak:
                peak = value
            drawdown = ((peak - value) / peak) * 100
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        num_wins = sum(1 for profit in trade_profits if profit > 0)
        num_losses = sum(1 for profit in trade_profits if profit < 0)  
        win_rate = (num_wins / (num_wins + num_losses)) if (num_wins + num_losses) > 0 else 0

        gross_profit = sum(profit for profit in trade_profits if profit > 0)
        gross_loss = sum(profit for profit in trade_profits if profit < 0)  
        profit_factor = (gross_profit / abs(gross_loss)) if gross_loss != 0 else float('inf')
        
        # Sharpe Ratio
        # Measures risk-adjusted return: (mean return / std deviation of returns) * sqrt(252)
        returns = pd.Series(portfolio_values).pct_change().dropna()
        mean_return = returns.mean()
        std_return = returns.std()
        sharpe_ratio = (mean_return / std_return) * np.sqrt(252) if std_return > 0 else 0
        
        
        return {
            'total_return': total_return,
            'total_return_pct': total_return_pct,
            'buy_hold_return_pct': buy_hold_return,
            'max_drawdown_pct': max_drawdown,
            'num_trades': len(self.trades),
            'sharpe_ratio': sharpe_ratio,
            'win_rate': win_rate,
            'profit_factor': profit_factor,
            'std': std_return,
            'volatility': std_return * np.sqrt(252),
        }


# For testing
if __name__ == "__main__":
    # Create sample data with signals
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    
    # Simulate price data
    prices = 100 + np.cumsum(np.random.randn(100))
    
    df = pd.DataFrame({
        'close': prices,
        'signal': 0
    }, index=dates)
    
    # Add some buy/sell signals manually
    df.loc[df.index[10], 'signal'] = 1  # Buy
    df.loc[df.index[50], 'signal'] = -1  # Sell
    df.loc[df.index[60], 'signal'] = 1  # Buy
    df.loc[df.index[90], 'signal'] = -1  # Sell
    
    # Run backtest
    engine = BacktestEngine(initial_capital=10000)
    results = engine.run(df)
