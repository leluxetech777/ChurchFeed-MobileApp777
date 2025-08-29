#!/bin/bash

echo "🚀 Starting ChurchFeed Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env with your actual keys before continuing"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🌟 Starting server on port ${PORT:-3000}..."
npm run dev