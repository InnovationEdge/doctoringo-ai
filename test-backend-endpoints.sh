#!/bin/bash
echo "🔍 Testing Backend Endpoints..."
echo ""

echo "1. Health Check:"
curl -s -w "\nStatus: %{http_code}\n" https://api.knowhow.ge/health/ | head -5
echo ""

echo "2. CSRF Endpoint:"
curl -s -w "\nStatus: %{http_code}\n" https://api.knowhow.ge/api/csrf/ | head -5
echo ""

echo "3. Sessions Endpoint:"
curl -s -w "\nStatus: %{http_code}\n" https://api.knowhow.ge/api/sessions/ | head -5
echo ""

echo "4. Documents Endpoint:"
curl -s -w "\nStatus: %{http_code}\n" https://api.knowhow.ge/api/documents/ | head -5
echo ""

echo "5. Admin Login:"
curl -s -w "\nStatus: %{http_code}\n" https://api.knowhow.ge/admin/ | head -5
echo ""
