#!/bin/bash
# Install Google Translate and dependencies for multilingual support

echo "Installing Google Translate for multilingual support..."
pip install googletrans==4.0.0rc1

echo "Ensuring GTTS is installed..."
pip install gtts

echo "Creating audio directory..."
mkdir -p static/audio

echo "Multilingual installation complete!"
echo ""
echo "Supported Languages:"
echo "- English (en)"
echo "- Hindi (hi) - हिंदी"
echo "- Bengali (bn) - বাংলা"
echo "- Telugu (te) - తెలుగు"
echo "- Marathi (mr) - मराठी"
echo "- Tamil (ta) - தமிழ்"
echo "- Gujarati (gu) - ગુજરાતી"
echo "- Kannada (kn) - ಕನ್ನಡ"
echo "- Malayalam (ml) - മലയാളം"
echo "- Punjabi (pa) - ਪੰਜਾਬੀ"
echo "- Odia (or) - ଓଡ଼ିଆ"
echo "- Assamese (as) - অসমীয়া"
echo "- Urdu (ur) - اردو"
echo ""
echo "Usage in your FastAPI backend:"
echo "1. Add the gtts-multilingual-integration.py code to your main.py"
echo "2. Restart your FastAPI server"
echo "3. The frontend will automatically support multilingual chat"
echo ""
echo "Test multilingual with:"
echo "curl -X POST http://localhost:8001/api/test_multilingual -H 'Content-Type: application/json' -d '{\"text\":\"Hello from KisaanSaathi!\", \"language\":\"hi\"}'"
