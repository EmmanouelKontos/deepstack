#!/usr/bin/env bash
# Builds the Chrome Web Store upload: dist/deepstack-v<version>.zip
# Only runtime files are packaged (manifest, toolbar icons, src).
set -euo pipefail

cd "$(dirname "$0")/.."

version=$(jq -r .version manifest.json)
out="dist/deepstack-v${version}.zip"

for f in $(find src -name '*.js'); do
  node --check "$f"
done

mkdir -p dist
rm -f "$out"
zip -q -r -X "$out" manifest.json icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png src \
  -x '*.DS_Store'

echo "Built $out ($(du -h "$out" | cut -f1))"
