# Trading Backtester 📈

A Python-based backtesting system I built to learn about algorithmic trading and test strategies on historical stock data. This project helped me understand financial data analysis, strategy development, and performance evaluation.

## About This Project

I created this as a learning project to understand how trading strategies work before risking real money. The system includes:

-  Historical data fetcher using Alpha Vantage API
-  Moving Average Crossover strategy implementation
-  Backtesting engine with performance metrics
-  Trade analysis and comparison tools

## Quick Start

### Prerequisites

1. **Get API Key**
   - Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
   - Get a free API key (instant, up to 500 calls/day)

2. **Node.js & npm** (for frontend)
   - Download from https://nodejs.org/
   - Verify installation: `node --version && npm --version`

3. **Python 3.8+** (for backend)
   - Already installed if you're using a recent system
   - Verify: `python --version`

### Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configure API Key

Create a `.env` file in the `backend/` directory:

```bash
cd backend
echo "ALPHA_VANTAGE_API_KEY=your_actual_key_here" > .env
```

Or manually create `backend/.env`:
```
ALPHA_VANTAGE_API_KEY=your_actual_key_here
```

### Start Backend Server

```bash
cd backend

# Activate virtual environment (if not already active)
source .venv/bin/activate

# Start FastAPI server
python -m uvicorn app.api.server:app --reload --port 8000
```

The backend will be available at: `http://localhost:8000`

### Setup & Start Frontend

```bash
cd frontend/trading-backtester

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

### Access the Application

Once both servers are running:

1. **Open browser** → `http://localhost:5173`
2. **Navigate to "Backtest"** → Configure strategy and run backtest
3. **View "Results"** → See charts, metrics, and performance analysis
4. **Save Results** → Click **Save Result** on the results page to keep a session-only copy
5. **Compare Strategies** → Run side-by-side strategy comparison
6. **Open "Saved Runs"** → Review, export, compare, or reopen saved session results

### Run CLI Backtest (Optional)

You can also run backtests directly from command line (backend only):

```bash
cd backend
source .venv/bin/activate
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

## Available Strategies

The platform includes several built-in trading strategies:

1. **Moving Average Crossover**
   - Buy: Short MA crosses above Long MA
   - Sell: Short MA crosses below Long MA
   - Default: 20-day / 50-day MAs
   - Best for: Trending markets

2. **RSI (Relative Strength Index)**
   - Buy: RSI crosses above 30 (oversold → neutral)
   - Sell: RSI crosses below 70 (overbought → neutral)
   - Default: 14-day period
   - Best for: Range-bound markets

3. **MACD (Moving Average Convergence Divergence)**
   - Buy: MACD line crosses above Signal line
   - Sell: MACD line crosses below Signal line
   - Default: 12/26/9 periods
   - Best for: Momentum and trend identification

4. **Bollinger Bands**
   - Buy: Price touches lower band (mean reversion)
   - Sell: Price touches upper band
   - Default: 20-day SMA, 2 standard deviations
   - Best for: Volatile, range-bound markets

5. **Combined Strategy** (Consensus Voting)
   - Combines all 4 strategies: MA Crossover, RSI, MACD, and Bollinger Bands
   - Buy/Sell requires 2+ strategies to agree
   - Blends momentum (MA, RSI, MACD) and mean-reversion (Bollinger) approaches
   - Best for: Risk-averse traders seeking robust signals

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
- [x] More comprehensive trade statistics

### Phase 3: Additional Strategies 
- [x] RSI (Relative Strength Index)
- [x] Bollinger Bands
- [x] MACD (Moving Average Convergence Divergence)
- [x] Multiple strategy combinations (consensus voting)

### Phase 4: Visualization
- [x] Portfolio value charts over time (Plotly)
- [x] Buy/sell signal markers on price charts
- [x] Performance comparison visualizations
- [x] Interactive plots with Plotly
- [x] Strategy-specific technical analysis charts (MA, RSI, MACD, Bollinger Bands)

### Phase 5: Web Dashboard
- [x] FastAPI REST API
- [x] React frontend interface
- [x] Real-time backtest execution
- [x] Save and compare historical results (session-only in the browser)
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
