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
from app.core.strategies import MovingAverageCrossover
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


def get_strategy_params():
    """Prompt for strategy parameters or use defaults."""
    print("\nStrategy Configuration (Moving Average Crossover)")
    print("Press Enter to use defaults")
    
    short_input = input("Short MA window (default 20): ").strip()
    short_window = int(short_input) if short_input else 20
    
    long_input = input("Long MA window (default 50): ").strip()
    long_window = int(long_input) if long_input else 50
    
    if short_window >= long_window:
        print("Warning: Short window should be less than long window. Using defaults (20/50).")
        return 20, 50
    
    return short_window, long_window


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
        SHORT_WINDOW, LONG_WINDOW = get_strategy_params()
        
        print("\n" + "="*60)
        print("STARTING BACKTEST")
        print("="*60)
        print(f"Symbol: {SYMBOL}")
        print(f"Capital: ${INITIAL_CAPITAL:,.2f}")
        print(f"Strategy: MA Crossover ({SHORT_WINDOW}/{LONG_WINDOW})")
        print("="*60)
        
        # Data already fetched during validation
        print(f"\n Step 1: Data loaded ({len(data)} days)")
        
        # Step 2: Apply strategy
        print(f"\n Step 2: Applying strategy...")
        strategy = MovingAverageCrossover(
            short_window=SHORT_WINDOW,
            long_window=LONG_WINDOW
        )
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
