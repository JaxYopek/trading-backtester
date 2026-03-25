# Trading Backtester 📈

A Python-based backtesting system I built to learn about algorithmic trading and test strategies on historical stock data. This project helped me understand financial data analysis, strategy development, and performance evaluation.

## About This Project

I created this as a learning project to understand how trading strategies work before risking real money. The system includes:

-  Historical data fetcher using Alpha Vantage API
-  Moving Average Crossover strategy implementation
-  Backtesting engine with performance metrics
-  Trade analysis and comparison tools

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or use the setup script:
```bash
./setup.sh
```

### 2. Get API Key

Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key). It's instant and free for up to 500 calls/day.

### 3. Configure API Key

Your `.env` file should look like:
```
ALPHA_VANTAGE_API_KEY=your_actual_key_here
```

### 4. Install python-dotenv

```bash
pip install python-dotenv
```

This library loads environment variables from the `.env` file.

### 5. Run a Backtest

```bash
cd backend
python main.py
```

## How It Works

I structured the system into modular components:

### 1. **Data Fetcher** (`app/services/data_fetcher.py`)
Handles API communication with Alpha Vantage to fetch historical price data (Open, High, Low, Close, Volume) and converts it into pandas DataFrames for analysis.

### 2. **Strategy Module** (`app/core/strategies.py`)
Implements:

Moving Average Crossover strategy:
- **BUY** when short-term MA crosses above long-term MA (bullish signal)
- **SELL** when short-term MA crosses below long-term MA (bearish signal)
- Configurable window periods (I use 20/50 days by default)

Relative Strength Index (RSI):
- **BUY** when RSI rises above the oversold threshold (e.g., 30), signaling upward momentum
- **SELL** when RSI falls below the overbought threshold (e.g., 70), signaling downward momentum
- Configurable RSI period and threshold levels (I use 14 days, 30/70 by default)

### 3. **Backtesting Engine** (`app/core/backtester.py`)
Simulates trading by:
- Starting with $10,000 (configurable)
- Executing trades based on strategy signals
- Tracking portfolio value over time
- Calculating performance metrics

### 4. **Main Script** (`main.py`)
The entry point that connects all components and runs the backtest.

## Example Output

Running a backtest produces results like:

```
Initial Capital:     $10,000.00
Final Value:         $12,500.00
Total Return:        25.00%
Buy & Hold Return:   20.00%
Max Drawdown:        8.50%
Number of Trades:    12
```

**Understanding the Metrics:**
- **Total Return**: Profit/loss from the trading strategy
- **Buy & Hold Return**: Baseline comparison - what if I just held the stock?
- **Max Drawdown**: Largest peak-to-trough decline (risk measure)
- **Number of Trades**: How actively the strategy trades

## Experimentation

The system is designed for easy experimentation. In `main.py`:

```python
SYMBOL = "AAPL"           # Test different stocks
INITIAL_CAPITAL = 10000   # Adjust starting capital
SHORT_WINDOW = 20         # Fast moving average period
LONG_WINDOW = 50          # Slow moving average period
```

## Project Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── strategies.py      # Trading strategy implementations
│   │   └── backtester.py      # Backtesting simulation engine
│   ├── services/
│   │   └── data_fetcher.py    # API data fetching
│   └── models/                # Future: data models
├── main.py                    # Main entry point
├── examples.py                # Advanced usage examples
└── requirements.txt           # Python dependencies
```

## What I Learned

Building this project taught me:

-  **Data Analysis**: Working with pandas DataFrames and time series data
-  **Technical Indicators**: Understanding moving averages and crossover signals  
-  **Trading Mechanics**: Portfolio management, position sizing, trade execution
-  **Risk Metrics**: Drawdown, return percentages, performance measurement
-  **System Design**: Modular architecture, separation of concerns
-  **Python Skills**: APIs, data structures, object-oriented programming

## Future Enhancements

Planning to add:

### Phase 2: Enhanced Metrics
- [x] Sharpe Ratio for risk-adjusted returns
- [x] Win rate and profit factor
- [x] Volatility and standard deviation
- [ ] More comprehensive trade statistics

### Phase 3: Additional Strategies
- [x] RSI (Relative Strength Index)
- [x] Bollinger Bands
- [x] MACD (Moving Average Convergence Divergence)
- [ ] Multiple strategy combinations

### Phase 4: Visualization
- [ ] Portfolio value charts over time
- [ ] Buy/sell signal markers on price charts
- [ ] Performance comparison visualizations
- [ ] Interactive plots with matplotlib/plotly

### Phase 5: Web Dashboard
- [x] FastAPI REST API
- [x] React frontend interface
- [ ] Real-time backtest execution
- [ ] Save and compare results
- [ ] Strategy parameter optimization

## Resources

Helpful resources I used while building this:

- **Pandas Documentation**: https://pandas.pydata.org/docs/
- **Investopedia - Backtesting**: https://www.investopedia.com/terms/b/backtesting.asp
- **Alpha Vantage API**: https://www.alphavantage.co/documentation/
- **Trading Strategy Concepts**: https://www.investopedia.com/articles/active-trading/

## Notes

 **Important Disclaimers:**

- **Educational Purpose**: This project is for learning only
- **Not Financial Advice**: Past performance doesn't guarantee future results
- **Paper Trading First**: Test thoroughly before considering real money
- **Risk Management**: Always understand the risks involved in trading

 **API Rate Limits:**
- Alpha Vantage free tier: 5 calls/minute, 500/day
- The system respects these limits in multi-stock testing

## License

This is a personal learning project. Feel free to fork and experiment!
