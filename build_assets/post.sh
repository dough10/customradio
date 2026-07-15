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

css_path=styles.min."$version".css
js_path=bundle.min."$version".js
submit_path=submit.min."$version".js
dashboard_path=dashboard.min."$version".js
dashboard_css=dashboard.min."$version".css

index_template=templates/index.pug
dashboard_template=templates/dashboard.pug
cp html/*.pug templates/

replace_path styles.min.css "./$css_path" $index_template
replace_path bundle.min.js "./$js_path" $index_template
replace_path submit.min.js "./$submit_path" templates/submit.pug
replace_path dashboard.min.js "./$dashboard_path" $dashboard_template
replace_path dashboard.min.css "./$dashboard_css" $dashboard_template

mv public/styles.min.css public/"$css_path"
mv public/bundle.min.js public/"$js_path"
mv public/alerts/submit.min.js public/alerts/"$submit_path"
mv public/dashboard.min.js public/"$dashboard_path"
mv public/dashboard.min.css public/"$dashboard_css"

node build_assets/update-sw-urls