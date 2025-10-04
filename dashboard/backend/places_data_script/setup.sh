#!/bin/bash
# Quick setup script for Restaurant Data Fetcher

echo "🚀 Restaurant Data Fetcher - Setup Script"
echo "=========================================="
echo ""

# Check Python
echo "1️⃣  Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "   ✅ $PYTHON_VERSION"
else
    echo "   ❌ Python 3 not found. Please install Python 3."
    exit 1
fi

# Install dependencies
echo ""
echo "2️⃣  Installing dependencies..."
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo "   ✅ Dependencies installed"
else
    echo "   ❌ Failed to install dependencies"
    exit 1
fi

# Check for Supabase key
echo ""
echo "3️⃣  Checking Supabase configuration..."
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "   ⚠️  SUPABASE_SERVICE_KEY not set"
    echo ""
    echo "   Please set your Supabase Service Key:"
    echo "   export SUPABASE_SERVICE_KEY='your-key-here'"
    echo ""
    echo "   Or add it to backend/.env file"
    NEEDS_KEY=true
else
    echo "   ✅ SUPABASE_SERVICE_KEY is set"
    NEEDS_KEY=false
fi

# Run verification
echo ""
echo "4️⃣  Running setup verification..."
python3 verify_setup.py

echo ""
echo "=========================================="
echo "📋 Setup Status"
echo "=========================================="
echo ""

if [ "$NEEDS_KEY" = true ]; then
    echo "⚠️  Almost ready! Next steps:"
    echo ""
    echo "1. Set Supabase key:"
    echo "   export SUPABASE_SERVICE_KEY='your-key'"
    echo ""
    echo "2. Run setup_tables.sql in Supabase SQL Editor"
    echo ""
    echo "3. Initialize and run:"
    echo "   python3 data_script.py --init"
    echo "   python3 data_script.py --cells 1"
else
    echo "✅ Setup complete! Next steps:"
    echo ""
    echo "1. Run setup_tables.sql in Supabase SQL Editor"
    echo ""
    echo "2. Initialize and run:"
    echo "   python3 data_script.py --init"
    echo "   python3 data_script.py --cells 1"
fi

echo ""
echo "📚 Read QUICKSTART.md for detailed instructions"
echo "=========================================="

