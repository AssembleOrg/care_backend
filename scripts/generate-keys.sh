#!/bin/bash

echo "Generando claves de cifrado para CareByDani..."
echo ""
echo "ENC_KEY_BASE64:"
openssl rand -base64 32
echo ""
echo "HMAC_PEPPER:"
openssl rand -hex 32
echo ""
echo "ADMIN_SESSION_SECRET:"
openssl rand -hex 32
echo ""
echo "SWAGGER_PASSWORD:"
openssl rand -hex 16
echo ""
echo "✅ Copiá estos valores a tu archivo .env"
