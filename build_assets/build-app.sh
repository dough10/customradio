#!/bin/bash
set -e

configs=(
  "config/runtime.config.js"
  "config/webpack.config.js"
  "config/submit.config.js"
)

for config in "${configs[@]}"; do
  echo "Running webpack with $config"
  npx webpack --config "$config"
done