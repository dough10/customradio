#!/bin/bash

# Usage: ./translate-js.sh input.js lang1 [lang2 ...]

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 input.js lang1 [lang2 ...]"
  exit 1
fi

INPUT_FILE="$1"
shift
LANGUAGES=("$@")

OUT_DIR="translated"
mkdir -p "$OUT_DIR"

# Translation function using translate-shell
translate() {
  local text="$1"
  local lang="$2"

  if [[ -z "$text" ]]; then
    echo ""
    return
  fi

  echo "DEBUG: Translating [$text] to [$lang]" >&2

  translated=$(trans -brief -e google :"$lang" "$text" 2>/dev/null | sed 's/^ *//; s/ *$//' | tr -d '\n')

  if [[ -z "$translated" ]]; then
    echo "DEBUG: Translation failed or empty for [$text]" >&2
  fi

  # Escape single quotes for JS
  translated=${translated//\'/\\\'}
  echo "$translated"
}

# Extract static and function-style entries
extract_entries() {
  local static_lines_sq
  local static_lines_dq
  local func_lines

  # Static entries with single quotes
  static_lines_sq=$(grep -E "^[[:space:]]*[a-zA-Z0-9_]+[[:space:]]*:[[:space:]]*'" "$INPUT_FILE" \
    | sed -E "s/^[[:space:]]*([a-zA-Z0-9_]+)[[:space:]]*:[[:space:]]*'([^']*)',?[[:space:]]*$/static|\1|\2/")

  # Static entries with double quotes
  static_lines_dq=$(grep -E "^[[:space:]]*[a-zA-Z0-9_]+[[:space:]]*:[[:space:]]*\"" "$INPUT_FILE" \
    | sed -E "s/^[[:space:]]*([a-zA-Z0-9_]+)[[:space:]]*:[[:space:]]*\"([^\"]*)\",?[[:space:]]*$/static|\1|\2/")

  # Function-style template strings
  func_lines=$(grep -E "^[[:space:]]*[a-zA-Z0-9_]+[[:space:]]*:[[:space:]]*[a-zA-Z0-9_]+[[:space:]]*=>[[:space:]]*\`" "$INPUT_FILE" \
    | sed -E 's/^[[:space:]]*([a-zA-Z0-9_]+)[[:space:]]*:[[:space:]]*([a-zA-Z0-9_]+)[[:space:]]*=>[[:space:]]*\`([^`]*)\`,?[[:space:]]*$/func|\1|\2|\3/')

  printf "%s\n%s\n%s\n" "$static_lines_sq" "$static_lines_dq" "$func_lines"
}

# Extract entries once for debug
# entries=$(extract_entries)
# echo "DEBUG: Extracted entries:"
# echo "$entries"

# Translate and generate output files
for lang in "${LANGUAGES[@]}"; do
  OUTPUT_FILE="$OUT_DIR/$lang.js"
  echo "Translating to $lang -> $OUTPUT_FILE"
  echo "module.exports = {" > "$OUTPUT_FILE"

  extract_entries | while IFS='|' read -r type key rest; do
    if [[ "$type" == "static" ]]; then
      value="$rest"
      if [[ -z "$key" || -z "$value" ]]; then
        echo "DEBUG: Skipping malformed static entry: key=[$key], value=[$value]" >&2
        continue
      fi
      translated=$(translate "$value" "$lang")
      echo "  $key: '$translated'," >> "$OUTPUT_FILE"

    elif [[ "$type" == "func" ]]; then
      IFS='|' read -r arg value <<< "$rest"
      if [[ -z "$key" || -z "$arg" || -z "$value" ]]; then
        echo "DEBUG: Skipping malformed func entry: key=[$key], arg=[$arg], value=[$value]" >&2
        continue
      fi
      placeholder=${value//\$\{$arg\}/___}
      translated=$(translate "$placeholder" "$lang")
      final_template=${translated//___/\$\{$arg\}}
      echo "  $key: $arg => \`$final_template\`," >> "$OUTPUT_FILE"
    fi
  done

  echo "};" >> "$OUTPUT_FILE"
  echo "Translation for $lang completed."
done
