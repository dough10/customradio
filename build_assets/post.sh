#!/bin/bash

generate_random_string() {
  length=$1
  openssl rand -base64 "$length" | tr -d '/+' | cut -c1-"$length"
}

replace_path() {
  search="$1"
  replace="$2"
  file="$3"

  search_escaped=$(printf '%s' "$search" | sed 's/[&/\]/\\&/g')
  replace_escaped=$(printf '%s' "$replace" | sed 's/[&/\]/\\&/g')

  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i "" "s|$search_escaped|$replace_escaped|g" "$file"
  else
    sed -i "s|$search_escaped|$replace_escaped|g" "$file"
  fi
}

version=$(generate_random_string 8)

css_path=styles.min.$version.css
js_path=bundle.min.$version.js

template=templates/index.pug
cp src/index.pug "$template"

replace_path styles.min.css "./$css_path" $template
replace_path bundle.min.js "./$js_path" $template

mv public/styles.min.css public/"$css_path"
mv public/bundle.min.js public/"$js_path"
mv public/bundle.min.js.LICENSE.txt public/"$js_path".LICENSE.txt

node build_assets/update-sw-urls