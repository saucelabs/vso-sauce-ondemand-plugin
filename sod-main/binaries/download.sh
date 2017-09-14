#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
URL=${URL:=https://saucelabs.com/versions.json}

curl -s $URL | jq '.["Sauce Connect"] | values[] | select (type=="object") | .download_url' | xargs wget
for i in *.zip; do unzip $i; done
for i in *.tar.gz; do tar xvfz $i; done
rm sc-*.tar.gz sc-*.zip
