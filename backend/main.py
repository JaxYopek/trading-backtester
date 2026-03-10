"""
Main Trading Backtester
========================
This is the entry point to run backtests.

How to use:
1. Get a free API key from https://www.alphavantage.co/support/#api-key
2. Copy .env.example to .env
3. Add your API key to .env file
4. Run: python main.py
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append('/Users/jaxyopek/Desktop/Trading Backtester/backend')

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from app.services.data_fetcher import DataFetcher
from app.core.strategies import MACD, MovingAverageCrossover, RSIStrategy



def choose_strategy():
    """Prompt user to select a strategy."""
    print("\nAvailable Strategies:")
    print("1. Moving Average Crossover")
    print("2. RSI Strategy")
    print("3. MACD Strategy")
    # Adding more strategies
    while True:
        choice = input("\nWhich strategy would you like to use?: ").strip()
        if choice in ("", "1"):
            return "ma_crossover"
        elif choice == "2":
            return "rsi_strategy"
        elif choice == "3":
            return "macd_strategy"
        else:
            print("Invalid choice. Please enter 1, 2, or 3.")
from app.core.backtester import BacktestEngine


def get_valid_symbol(api_key):
    """Prompt for stock symbol and validate it exists."""
    while True:
        symbol = input("\nEnter stock symbol to backtest (e.g., AAPL, TSLA): ").upper().strip()
        
        if not symbol:
            print("Symbol cannot be empty. Please try again.")
            continue
        
        # Try to fetch data to validate symbol exists
        print(f"Fetching {symbol}...")
        fetcher = DataFetcher(api_key)
        
        try:
            data = fetcher.get_daily_data(symbol, outputsize="compact")
            return symbol, data
        except ValueError as e:
            print(f"Error: {e}")
            print(f"'{symbol}' may not exist or there was an API issue.")
            retry = input("Try another symbol? (y/n): ").lower()
            if retry != 'y':
                print("Exiting...")
                sys.exit(0)


def get_capital():
    """Prompt for initial capital with validation."""
    while True:
        capital_input = input("\nEnter initial capital (default $10,000): ").strip()
        
        if not capital_input:
            return 10000
        
        try:
            capital = float(capital_input.replace('$', '').replace(',', ''))
            if capital <= 0:
                print("Capital must be positive. Please try again.")
                continue
            return capital
        except ValueError:
            print("Invalid number. Please enter a valid amount (e.g., 10000 or $10,000)")


def get_ma_params(data_length=100):
    """Prompt for strategy parameters or use defaults.
    
    Args:
        data_length: Number of days of data available (used for validation)
    """
    print("\nStrategy Configuration (Moving Average Crossover)")
    print("Press Enter to use defaults")
    print(f" Hint: You have {data_length} days of data")
    print("   (Long MA window should be less than available data)")
    
    short_input = input("Short MA window (default 20): ").strip()
    short_window = int(short_input) if short_input else 20
    
    long_input = input("Long MA window (default 50): ").strip()
    long_window = int(long_input) if long_input else 50
    
    # Validate parameters
    if short_window >= long_window:
        print(" Warning: Short window should be less than long window. Using defaults (20/50).")
        return 20, 50
    
    if long_window > data_length:
        print(f" Error: Long window ({long_window}) exceeds data length ({data_length}).")
        print(f"   This won't generate any signals. Using defaults (20/50).")
        return 20, 50
    
    # Warn if windows are too close to data length
    if long_window > data_length * 0.8:
        print(f"  Warning: Long window ({long_window}) means you'll have very few signals.")
        print(f"   Recommended: Use long window under {int(data_length * 0.6)} for better results.")
        print(f"   Using smaller defaults (20/50) instead.")
        return 20, 50
    
    return short_window, long_window

def get_rsi_params(data_length=100):
    """Prompt for RSI strategy parameters or use defaults."""
    print("\nStrategy Configuration (RSI Strategy)")
    print("Press Enter to use defaults")
    print(f" Hint: You have {data_length} days of data")
    
    rsi_input = input("RSI period (default 14): ").strip()
    rsi_period = int(rsi_input) if rsi_input else 14
    
    if rsi_period >= data_length:
        print(f" Error: RSI period ({rsi_period}) exceeds data length ({data_length}).")
        print(f"   This won't generate any signals. Using default (14).")
        return 14
    
    return rsi_period

def get_macd_params(data_length=100):
    """Prompt for MACD strategy parameters or use defaults."""
    print("\nStrategy Configuration (MACD Strategy)")
    print("Press Enter to use defaults")
    print(f" Hint: You have {data_length} days of data")
    
    fast_input = input("Fast EMA period (default 12): ").strip()
    fast_period = int(fast_input) if fast_input else 12
    
    slow_input = input("Slow EMA period (default 26): ").strip()
    slow_period = int(slow_input) if slow_input else 26
    
    signal_input = input("Signal line EMA period (default 9): ").strip()
    signal_period = int(signal_input) if signal_input else 9
    
    # Validate parameters
    if fast_period >= slow_period:
        print(" Warning: Fast EMA should be less than Slow EMA. Using defaults (12/26).")
        return 12, 26, 9
    
    if slow_period > data_length:
        print(f" Error: Slow EMA period ({slow_period}) exceeds data length ({data_length}).")
        print(f"   This won't generate any signals. Using defaults (12/26/9).")
        return 12, 26, 9
    
    return fast_period, slow_period, signal_period


def main():
    """
    Main function to run a backtest.
    
    Steps:
    1. Fetch historical data
    2. Apply trading strategy
    3. Run backtest simulation
    4. Display results
    """
    
    print("\n" + "="*60)
    print("TRADING BACKTESTER")
    print("="*60)
    
    # Get API key
    API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")
    
    # Check if API key is set
    if not API_KEY or API_KEY == "demo" or API_KEY == "your_api_key_here":
        print("\n  WARNING: Using demo API key!")
        print("   Demo key only works with IBM stock.")
        print("\n   To use your own key:")
        print("   1. Copy .env.example to .env")
        print("   2. Add your API key to .env")
        print("   3. Get free key at: https://www.alphavantage.co/support/#api-key")
        SYMBOL = "IBM"
        API_KEY = "demo"
    
    try:
        # Get configuration from user
        SYMBOL, data = get_valid_symbol(API_KEY)
        INITIAL_CAPITAL = get_capital()
        strategy_choice = choose_strategy()
        if strategy_choice == "ma_crossover":
            SHORT_WINDOW, LONG_WINDOW = get_ma_params(data_length=len(data))
            strategy = MovingAverageCrossover(
                short_window=SHORT_WINDOW,
                long_window=LONG_WINDOW
            )
            strategy_desc = f"MA Crossover ({SHORT_WINDOW}/{LONG_WINDOW})"
        elif strategy_choice == "rsi_strategy":
            RSI_PERIOD = get_rsi_params(data_length=len(data))
            strategy = RSIStrategy(
                rsi_period=RSI_PERIOD
            )
            strategy_desc = f"RSI Strategy ({RSI_PERIOD})"
        elif strategy_choice == "macd_strategy":
            FAST_PERIOD, SLOW_PERIOD, SIGNAL_PERIOD = get_macd_params(data_length=len(data))
            strategy = MACD(
                short_window=FAST_PERIOD,
                long_window=SLOW_PERIOD,
                signal_window=SIGNAL_PERIOD
            )
            strategy_desc = f"MACD Strategy ({FAST_PERIOD}/{SLOW_PERIOD}/{SIGNAL_PERIOD})"
        else:
            print("Unknown strategy. Exiting.")
            sys.exit(1)

        print("\n" + "="*60)
        print("STARTING BACKTEST")
        print("="*60)
        print(f"Symbol: {SYMBOL}")
        print(f"Capital: ${INITIAL_CAPITAL:,.2f}")
        print(f"Strategy: {strategy_desc}")
        print("="*60)
        # Data already fetched during validation
        print(f"\n Step 1: Data loaded ({len(data)} days)")

        # Step 2: Apply strategy
        print(f"\n Step 2: Applying strategy...")
        signals = strategy.generate_signals(data)
        print(f"   Strategy: {strategy}")
        print(f"   Generated signals for {len(signals)} days")

        # Step 3: Run backtest
        print(f"\n Step 3: Running backtest simulation...")
        engine = BacktestEngine(initial_capital=INITIAL_CAPITAL)
        results = engine.run(signals)

        # Step 4: Display results
        print("\n Step 4: Performance Summary")
        metrics = results['metrics']
        print(f"\n   Initial Capital:     ${results['initial_capital']:,.2f}")
        print(f"   Final Value:         ${results['final_value']:,.2f}")
        print(f"   Total Return:        {metrics['total_return_pct']:.2f}%")
        print(f"   Buy & Hold Return:   {metrics['buy_hold_return_pct']:.2f}%")
        print(f"   Max Drawdown:        {metrics['max_drawdown_pct']:.2f}%")
        print(f"   Number of Trades:    {metrics['num_trades']}")

        # Performance comparison
        if metrics['total_return_pct'] > metrics['buy_hold_return_pct']:
            print(f"\n    Strategy OUTPERFORMED buy-and-hold by {metrics['total_return_pct'] - metrics['buy_hold_return_pct']:.2f}%")
        else:
            print(f"\n    Strategy UNDERPERFORMED buy-and-hold by {metrics['buy_hold_return_pct'] - metrics['total_return_pct']:.2f}%")

        print("\n" + "="*60)
        print(" Backtest complete!")
        print("="*60 + "\n")

        # Optional: Show trade history
        try:
            show_trades = input("Would you like to see all trades? (y/n): ").lower()
            if show_trades == 'y':
                print("\n Trade History:")
                for i, trade in enumerate(results['trades'], 1):
                    print(f"   {i}. {trade}")
        except EOFError:
            # Handle piped input or Ctrl+D
            pass

    except ValueError as e:
        print(f"\n Error: {e}")
    except KeyboardInterrupt:
        print("\n\n Backtest cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n Unexpected error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
