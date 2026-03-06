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


def main():
    """
    Main function to run a backtest.
    
    Steps:
    1. Fetch historical data
    2. Apply trading strategy
    3. Run backtest simulation
    4. Display results
    """
    
    # ========== CONFIGURATION ==========
    # API key is loaded from .env file (secure!)
    API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")
    
    # What stock to test?
    SYMBOL = "AAPL"  # Try: AAPL, MSFT, GOOGL, TSLA, etc.
    
    # Starting capital
    INITIAL_CAPITAL = 10000  # $10,000
    
    # Strategy parameters
    SHORT_WINDOW = 20  # Fast moving average (days)
    LONG_WINDOW = 50   # Slow moving average (days)
    # ===================================
    
    
    print("\n" + "="*60)
    print("TRADING BACKTESTER")
    print("="*60)
    
    # Check if API key is set
    if not API_KEY or API_KEY == "demo" or API_KEY == "your_api_key_here":
        print("\n⚠️  WARNING: Using demo API key!")
        print("   Demo key only works with IBM stock.")
        print("\n   To use your own key:")
        print("   1. Copy .env.example to .env")
        print("   2. Add your API key to .env")
        print("   3. Get free key at: https://www.alphavantage.co/support/#api-key")
        SYMBOL = "IBM"
        API_KEY = "demo"
    
    try:
        # Step 1: Fetch historical data
        print(f"\n📊 Step 1: Fetching data for {SYMBOL}...")
        fetcher = DataFetcher(API_KEY)
        data = fetcher.get_daily_data(SYMBOL, outputsize="compact")
        
        # Step 2: Apply strategy
        print(f"\n🎯 Step 2: Applying strategy...")
        strategy = MovingAverageCrossover(
            short_window=SHORT_WINDOW,
            long_window=LONG_WINDOW
        )
        signals = strategy.generate_signals(data)
        
        print(f"   Strategy: {strategy}")
        print(f"   Generated signals for {len(signals)} days")
        
        # Step 3: Run backtest
        print(f"\n💰 Step 3: Running backtest simulation...")
        engine = BacktestEngine(initial_capital=INITIAL_CAPITAL)
        results = engine.run(signals)
        
        # Step 4: Display results
        print("\n📈 Step 4: Performance Summary")
        metrics = results['metrics']
        print(f"\n   Initial Capital:     ${results['initial_capital']:,.2f}")
        print(f"   Final Value:         ${results['final_value']:,.2f}")
        print(f"   Total Return:        {metrics['total_return_pct']:.2f}%")
        print(f"   Buy & Hold Return:   {metrics['buy_hold_return_pct']:.2f}%")
        print(f"   Max Drawdown:        {metrics['max_drawdown_pct']:.2f}%")
        print(f"   Number of Trades:    {metrics['num_trades']}")
        
        # Performance comparison
        if metrics['total_return_pct'] > metrics['buy_hold_return_pct']:
            print(f"\n   ✅ Strategy OUTPERFORMED buy-and-hold by {metrics['total_return_pct'] - metrics['buy_hold_return_pct']:.2f}%")
        else:
            print(f"\n   ❌ Strategy UNDERPERFORMED buy-and-hold by {metrics['buy_hold_return_pct'] - metrics['total_return_pct']:.2f}%")
        
        print("\n" + "="*60)
        print("✅ Backtest complete!")
        print("="*60 + "\n")
        
        # Optional: Show trade history
        show_trades = input("Would you like to see all trades? (y/n): ").lower()
        if show_trades == 'y':
            print("\n📋 Trade History:")
            for i, trade in enumerate(results['trades'], 1):
                print(f"   {i}. {trade}")
        
    except ValueError as e:
        print(f"\n❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you have a valid API key")
        print("2. Check your internet connection")
        print("3. Try a different stock symbol")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
