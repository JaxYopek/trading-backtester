# Trading Backtester 📈

A simple Python-based backtesting system for testing trading strategies on historical stock data.

## What You Just Built

You have a working backtester with:
- ✅ Historical data fetcher (Alpha Vantage API)
- ✅ Moving Average Crossover strategy
- ✅ Backtesting engine with performance metrics
- ✅ Command-line interface

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Get API Key

1. Go to https://www.alphavantage.co/support/#api-key
2. Enter your email to get a FREE API key
3. You'll receive it instantly via email

### 3. Set Your API Key

Edit `backend/main.py` and replace `YOUR_API_KEY_HERE` with your actual API key:

```python
API_KEY = "your_actual_key_here"
```

### 4. Run Your First Backtest

```bash
cd backend
python main.py
```

## How It Works

### 1. **Data Fetcher** (`app/services/data_fetcher.py`)
- Fetches historical stock prices from Alpha Vantage
- Returns data as a pandas DataFrame
- Includes: Open, High, Low, Close, Volume

### 2. **Strategy** (`app/core/strategies.py`)
- **Moving Average Crossover**: A classic beginner strategy
  - When short MA crosses above long MA → BUY signal
  - When short MA crosses below long MA → SELL signal
- You can customize the window periods (default: 20/50 days)

### 3. **Backtester** (`app/core/backtester.py`)
- Simulates buying and selling based on strategy signals
- Starts with $10,000 (configurable)
- Tracks all trades and portfolio value
- Calculates performance metrics

### 4. **Main Script** (`main.py`)
- Ties everything together
- Easy to configure and run

## Understanding the Output

When you run a backtest, you'll see:

```
Initial Capital:     $10,000.00
Final Value:         $12,500.00
Total Return:        25.00%
Buy & Hold Return:   20.00%
Max Drawdown:        8.50%
Number of Trades:    12
```

**Metrics Explained:**
- **Total Return**: How much your strategy made/lost
- **Buy & Hold Return**: What if you just bought and held?
- **Max Drawdown**: Biggest drop from peak (your worst losing streak)
- **Number of Trades**: How many times the strategy traded

## Customization

You can easily customize the backtest in `main.py`:

```python
SYMBOL = "AAPL"           # Stock to test
INITIAL_CAPITAL = 10000   # Starting money
SHORT_WINDOW = 20         # Fast moving average
LONG_WINDOW = 50          # Slow moving average
```

Try different:
- Stocks: AAPL, MSFT, GOOGL, TSLA, NVDA, etc.
- MA windows: 10/30, 20/50, 50/200
- Starting capital amounts

## Project Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── strategies.py      # Trading strategies
│   │   └── backtester.py      # Backtesting engine
│   ├── services/
│   │   └── data_fetcher.py    # Data fetching
│   └── models/                # (For future use)
├── main.py                    # Entry point
└── requirements.txt           # Dependencies
```

## Testing Individual Components

Each file has a test section at the bottom. You can run them individually:

```bash
# Test data fetcher
python app/services/data_fetcher.py

# Test strategy
python app/core/strategies.py

# Test backtester
python app/core/backtester.py
```

## What's Next?

Now that you have the basics working, you can:

### Phase 2: More Metrics
- [ ] Sharpe Ratio (risk-adjusted returns)
- [ ] Win rate (% of profitable trades)
- [ ] Average profit/loss per trade
- [ ] Volatility measurements

### Phase 3: More Strategies
- [ ] RSI (Relative Strength Index)
- [ ] Bollinger Bands
- [ ] Momentum strategies
- [ ] Mean reversion

### Phase 4: Better Data
- [ ] Multiple timeframes (hourly, weekly)
- [ ] Multiple assets (portfolio backtesting)
- [ ] Support for options data

### Phase 5: Visualization
- [ ] Plot portfolio value over time
- [ ] Show buy/sell points on price chart
- [ ] Performance comparison charts

### Phase 6: Web Interface
- [ ] FastAPI backend
- [ ] React frontend
- [ ] Interactive dashboard
- [ ] Save and compare backtests

## Learning Resources

- **Pandas**: https://pandas.pydata.org/docs/
- **Backtesting Basics**: https://www.investopedia.com/terms/b/backtesting.asp
- **Moving Averages**: https://www.investopedia.com/terms/m/movingaverage.asp
- **Trading Strategies**: https://www.investopedia.com/articles/active-trading/

## Important Notes

⚠️ **Alpha Vantage Free Tier Limits:**
- 5 API calls per minute
- 500 API calls per day

⚠️ **Disclaimer:**
This is for educational purposes only. Past performance does not guarantee future results. Do not use this to make real trading decisions without proper research and risk management.

## Questions?

Each Python file has extensive comments explaining:
- What the code does
- How it works
- Why decisions were made

Read through the code to learn more!
