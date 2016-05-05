#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
URL=${URL:=https://saucelabs.com/versions.json}

rm sc-*.tar.gz sc-*.zip
curl -s $URL | jq '.["Sauce Connect"] | values[] | select (type=="object") | .download_url' | xargs wget
