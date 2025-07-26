#!/bin/bash
# Install GTTS and dependencies for your FastAPI backend

echo "Installing Google Text-to-Speech (GTTS)..."
pip install gtts

echo "Creating audio directory..."
mkdir -p static/audio

echo "GTTS installation complete!"
echo ""
echo "Usage in your FastAPI backend:"
echo "1. Add the gtts-integration.py code to your main.py"
echo "2. Restart your FastAPI server"
echo "3. The frontend will automatically use GTTS audio"
echo ""
echo "Test GTTS with:"
echo "curl -X POST http://localhost:8001/api/test_gtts -H 'Content-Type: application/json' -d '{\"text\":\"Hello from GTTS!\"}'"
