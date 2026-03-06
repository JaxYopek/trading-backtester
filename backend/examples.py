"""
Example: Custom Backtest
=========================
This shows how to use the backtester components programmatically.
You can modify this to create your own custom backtests.
"""

import sys
sys.path.append('/Users/jaxyopek/Desktop/Trading Backtester/backend')

from app.services.data_fetcher import DataFetcher
from app.core.strategies import MovingAverageCrossover
from app.core.backtester import BacktestEngine
import pandas as pd


def compare_strategies():
    """
    Example: Compare different moving average windows.
    This helps you understand which parameters work best.
    """
    
    API_KEY = "demo"  # Replace with your key
    SYMBOL = "IBM"    # Demo key only works with IBM
    
    print("\n" + "="*70)
    print("STRATEGY COMPARISON: Testing Different MA Windows")
    print("="*70)
    
    # Fetch data once
    fetcher = DataFetcher(API_KEY)
    data = fetcher.get_daily_data(SYMBOL, outputsize="compact")
    
    # Test different strategy parameters
    strategies = [
        (10, 30),  # Fast: aggressive trading
        (20, 50),  # Medium: balanced
        (50, 200), # Slow: conservative (Golden Cross)
    ]
    
    results_summary = []
    
    for short, long in strategies:
        print(f"\n{'─'*70}")
        print(f"Testing MA({short}/{long})...")
        print(f"{'─'*70}")
        
        # Apply strategy
        strategy = MovingAverageCrossover(short_window=short, long_window=long)
        signals = strategy.generate_signals(data)
        
        # Run backtest
        engine = BacktestEngine(initial_capital=10000)
        result = engine.run(signals)
        
        # Save summary
        results_summary.append({
            'strategy': f"MA({short}/{long})",
            'return': result['metrics']['total_return_pct'],
            'trades': result['metrics']['num_trades'],
            'max_drawdown': result['metrics']['max_drawdown_pct']
        })
    
    # Print comparison table
    print("\n" + "="*70)
    print("COMPARISON SUMMARY")
    print("="*70)
    print(f"{'Strategy':<15} {'Return':<12} {'Trades':<10} {'Max Drawdown'}")
    print("─"*70)
    
    for r in results_summary:
        print(f"{r['strategy']:<15} {r['return']:>8.2f}%    {r['trades']:<10} {r['max_drawdown']:>8.2f}%")
    
    # Find best strategy
    best = max(results_summary, key=lambda x: x['return'])
    print("\n" + "="*70)
    print(f"🏆 Best Performer: {best['strategy']} with {best['return']:.2f}% return")
    print("="*70 + "\n")


def test_on_multiple_stocks():
    """
    Example: Test the same strategy on different stocks.
    This helps you understand which stocks work well with your strategy.
    """
    
    API_KEY = "YOUR_API_KEY_HERE"  # You need a real key for this
    
    if API_KEY == "YOUR_API_KEY_HERE":
        print("\n⚠️  This example requires a real API key!")
        print("   Get one free at: https://www.alphavantage.co/support/#api-key")
        return
    
    symbols = ["AAPL", "MSFT", "GOOGL"]
    strategy = MovingAverageCrossover(20, 50)
    
    print("\n" + "="*70)
    print("MULTI-STOCK BACKTEST")
    print("="*70)
    
    results = []
    
    for symbol in symbols:
        try:
            print(f"\nTesting {symbol}...")
            
            # Fetch and test
            fetcher = DataFetcher(API_KEY)
            data = fetcher.get_daily_data(symbol, outputsize="full")
            signals = strategy.generate_signals(data)
            
            engine = BacktestEngine(initial_capital=10000)
            result = engine.run(signals)
            
            results.append({
                'symbol': symbol,
                'return': result['metrics']['total_return_pct']
            })
            
            # Respect API rate limit (5 calls/minute)
            import time
            time.sleep(12)  # Wait 12 seconds between calls
            
        except Exception as e:
            print(f"Error testing {symbol}: {e}")
    
    # Summary
    print("\n" + "="*70)
    print("RESULTS ACROSS STOCKS")
    print("="*70)
    for r in results:
        print(f"{r['symbol']}: {r['return']:.2f}%")


def analyze_trade_history():
    """
    Example: Detailed trade analysis.
    Look at win rate, average profit/loss, etc.
    """
    
    API_KEY = "demo"
    SYMBOL = "IBM"
    
    # Run backtest
    fetcher = DataFetcher(API_KEY)
    data = fetcher.get_daily_data(SYMBOL, outputsize="compact")
    
    strategy = MovingAverageCrossover(20, 50)
    signals = strategy.generate_signals(data)
    
    engine = BacktestEngine(initial_capital=10000)
    results = engine.run(signals)
    
    # Analyze trades
    trades = results['trades']
    
    if len(trades) < 2:
        print("Not enough trades to analyze")
        return
    
    print("\n" + "="*70)
    print("TRADE ANALYSIS")
    print("="*70)
    
    # Calculate profit/loss for each trade pair (buy + sell)
    profits = []
    for i in range(0, len(trades)-1, 2):
        if i+1 < len(trades):
            buy = trades[i]
            sell = trades[i+1]
            
            if buy.action == 'BUY' and sell.action == 'SELL':
                profit = (sell.price - buy.price) * buy.shares
                profit_pct = ((sell.price - buy.price) / buy.price) * 100
                profits.append(profit_pct)
                
                print(f"\nTrade {i//2 + 1}:")
                print(f"  Buy:  {buy}")
                print(f"  Sell: {sell}")
                print(f"  P/L:  ${profit:,.2f} ({profit_pct:.2f}%)")
    
    # Statistics
    if profits:
        winning_trades = [p for p in profits if p > 0]
        losing_trades = [p for p in profits if p < 0]
        
        print("\n" + "="*70)
        print("STATISTICS")
        print("="*70)
        print(f"Total Trades:    {len(profits)}")
        print(f"Winning Trades:  {len(winning_trades)} ({len(winning_trades)/len(profits)*100:.1f}%)")
        print(f"Losing Trades:   {len(losing_trades)} ({len(losing_trades)/len(profits)*100:.1f}%)")
        print(f"Average Profit:  {sum(profits)/len(profits):.2f}%")
        
        if winning_trades:
            print(f"Avg Win:         {sum(winning_trades)/len(winning_trades):.2f}%")
        if losing_trades:
            print(f"Avg Loss:        {sum(losing_trades)/len(losing_trades):.2f}%")


if __name__ == "__main__":
    print("\n🎯 BACKTESTER EXAMPLES")
    print("\nChoose an example:")
    print("1. Compare different MA strategies")
    print("2. Test on multiple stocks")
    print("3. Detailed trade analysis")
    
    choice = input("\nEnter your choice (1-3): ")
    
    if choice == "1":
        compare_strategies()
    elif choice == "2":
        test_on_multiple_stocks()
    elif choice == "3":
        analyze_trade_history()
    else:
        print("Invalid choice!")
