#!/usr/bin/env bash

# -----------------------------
# CONFIG
# -----------------------------
BASE_URL="https://testradio.dough10.me"
ALERT_ID="test-alert"
ALERT_TITLE="Test Alert from curl"
ALERT_PARAGRAPHS='[
  "This alert was created via curl.",
  "Reload the page to see it.",
  "[https://example.com[Test Link]]"
]'
ALERT_PRIORITY=1

# Temporary file to store cookies
COOKIE_FILE=$(mktemp)

# -----------------------------
# STEP 1: Fetch the home page to get CSRF token + cookies
# -----------------------------
HTML=$(curl -s -L -c "$COOKIE_FILE" "$BASE_URL")
echo "$HTML" | grep csrf-token
# Extract the CSRF token from meta tag
CSRF_TOKEN=$(echo "$HTML" | grep -oP '(?<=<meta name="csrf-token" content=")[^"]+')

if [ -z "$CSRF_TOKEN" ]; then
  echo "Failed to fetch CSRF token from meta tag"
  rm -f "$COOKIE_FILE"
  exit 1
fi

echo "CSRF token: $CSRF_TOKEN"

# -----------------------------
# STEP 2: POST the test alert
# -----------------------------
curl -v -X POST "$BASE_URL/addAlert" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json" \
  -H "CSRF-Token: $CSRF_TOKEN" \
  -d "{
    \"id\": \"$ALERT_ID\",
    \"title\": \"$ALERT_TITLE\",
    \"paragraphs\": $ALERT_PARAGRAPHS,
    \"priority\": $ALERT_PRIORITY
  }"

# -----------------------------
# CLEANUP
# -----------------------------
rm -f "$COOKIE_FILE"
echo -e "\nDone."