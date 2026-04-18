#!/bin/bash
echo "🔍 Checking deployment status..."
echo ""
echo "=== Health Check ==="
curl -s https://api.knowhow.ge/health/ | head -5
echo ""
echo ""
echo "=== Documents Endpoint ==="
curl -s https://api.knowhow.ge/api/documents/ | head -5
echo ""
echo ""
echo "📊 Check GitHub Actions: https://github.com/knowhowaiassistant/knowhow-ai-backend/actions"
