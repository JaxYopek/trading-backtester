#!/bin/bash

echo "================================"
echo "Trading Backtester Setup"
echo "================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Python3 is not installed. Please install Python first."
    exit 1
fi

echo "✓ Python3 found: $(python3 --version)"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
cd backend
python3 -m venv venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "⬇️  Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Get your free API key from:"
echo "   https://www.alphavantage.co/support/#api-key"
echo ""
echo "2. Edit backend/main.py and add your API key"
echo ""
echo "3. Run your first backtest:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
