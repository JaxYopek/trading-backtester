"""
Configuration File
==================
Store your API keys and settings here.

For security:
1. Copy this file to config_local.py
2. Add your actual API key to config_local.py
3. config_local.py is in .gitignore (won't be committed to git)
"""

# Alpha Vantage API
ALPHA_VANTAGE_API_KEY = "YOUR_API_KEY_HERE"

# Default backtest settings
DEFAULT_INITIAL_CAPITAL = 10000
DEFAULT_SHORT_WINDOW = 20
DEFAULT_LONG_WINDOW = 50

# Data settings
DEFAULT_OUTPUT_SIZE = "full"  # 'compact' or 'full'
