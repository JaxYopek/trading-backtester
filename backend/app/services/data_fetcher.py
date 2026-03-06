"""
Data Fetcher Service
=====================
This service fetches historical stock data from Alpha Vantage API.

What it does:
- Makes HTTP requests to Alpha Vantage
- Downloads daily stock prices (Open, High, Low, Close, Volume)
- Converts the data into a pandas DataFrame for easy analysis

Note: Alpha Vantage has a free tier (5 API calls/minute, 500/day)
Get your free API key at: https://www.alphavantage.co/support/#api-key
"""

import requests
import pandas as pd
from datetime import datetime


class DataFetcher:
    """Fetches historical stock data from Alpha Vantage."""
    
    def __init__(self, api_key: str):
        """
        Initialize the data fetcher.
        
        Args:
            api_key: Your Alpha Vantage API key
        """
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
    
    def get_daily_data(self, symbol: str, outputsize: str = "full") -> pd.DataFrame:
        """
        Fetch daily stock data for a given symbol.
        
        Args:
            symbol: Stock ticker (e.g., 'AAPL', 'TSLA')
            outputsize: 'compact' (100 days) or 'full' (20+ years)
        
        Returns:
            DataFrame with columns: date, open, high, low, close, volume
            
        How it works:
        1. Build the API request URL
        2. Send GET request to Alpha Vantage
        3. Parse JSON response
        4. Convert to pandas DataFrame
        5. Clean up column names and sort by date
        """
        # Build the API request
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "outputsize": outputsize,
            "apikey": self.api_key
        }
        
        print(f"Fetching data for {symbol}...")
        response = requests.get(self.base_url, params=params)
        data = response.json()
        
        # Check for errors
        if "Error Message" in data:
            raise ValueError(f"API Error: {data['Error Message']}")
        
        if "Note" in data:
            raise ValueError(f"API Rate Limit: {data['Note']}")
        
        # Extract the time series data
        time_series = data.get("Time Series (Daily)", {})
        
        if not time_series:
            raise ValueError(f"No data found for {symbol}")
        
        # Convert to DataFrame
        # Each date has: open, high, low, close, volume
        df = pd.DataFrame.from_dict(time_series, orient='index')
        
        # Clean up column names (remove '1. ', '2. ' prefixes)
        df.columns = [col.split('. ')[1] for col in df.columns]
        
        # Convert index to datetime
        df.index = pd.to_datetime(df.index)
        df.index.name = 'date'
        
        # Convert all values to numeric
        df = df.astype(float)
        
        # Sort by date (oldest first)
        df = df.sort_index()
        
        print(f"✓ Fetched {len(df)} days of data for {symbol}")
        print(f"  Date range: {df.index[0].date()} to {df.index[-1].date()}")
        
        return df


# For testing the data fetcher
if __name__ == "__main__":
    # Example usage - you'll need to add your API key
    API_KEY = "demo"  # Replace with your actual API key
    
    fetcher = DataFetcher(API_KEY)
    
    # Fetch data for IBM (demo key only works with IBM)
    df = fetcher.get_daily_data("IBM", outputsize="compact")
    
    print("\nFirst few rows:")
    print(df.head())
    
    print("\nLast few rows:")
    print(df.tail())
