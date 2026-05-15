#!/bin/bash
# Adiciona env vars no Vercel via stdin com newline
set -e

declare -A VARS=(
  [NEXT_PUBLIC_SUPABASE_URL]="https://qirogiafdyyvsuxspepq.supabase.co"
  [NEXT_PUBLIC_SUPABASE_ANON_KEY]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcm9naWFmZHl5dnN1eHNwZXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MjY5NzYsImV4cCI6MjA5NDMwMjk3Nn0.S4wQJANJKGxULfkPAVzg9PESs-SijM_6y6iPnCsGJAE"
  [SUPABASE_SERVICE_ROLE_KEY]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcm9naWFmZHl5dnN1eHNwZXBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcyNjk3NiwiZXhwIjoyMDk0MzAyOTc2fQ.cjMNl-MV8x39U3KlXZhLU9NIUaST7LOIKh8oJ7YDSOc"
  [NEXT_PUBLIC_APP_URL]="https://axonia.vercel.app"
  [QR_HMAC_SECRET]="2c6f3a8e9d1b4f5c7a8e9d0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d"
)

for KEY in "${!VARS[@]}"; do
  VALUE="${VARS[$KEY]}"
  for ENV in production development; do
    echo "→ $KEY [$ENV]"
    npx vercel env rm "$KEY" "$ENV" --yes 2>/dev/null || true
    # Salva em arquivo temp e redireciona
    TMP=$(mktemp)
    echo "$VALUE" > "$TMP"
    npx vercel env add "$KEY" "$ENV" < "$TMP" 2>&1 | grep -E "Added|Error" | head -1
    rm -f "$TMP"
  done
done
echo ""
echo "✓ Done"
