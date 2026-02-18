#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf out
#npm run compile
npx tsc -p src/extension/tsconfig.extension.json

echo "***** zaza *****"
npx esbuild examples/zaza/zaza.ts \
  --bundle \
  --format=esm \
  --platform=browser \
  --target=es2020 \
  --sourcemap=inline \
  --alias:@vcl=src/vcl \
  --alias:@drt=src/drt \
  --outfile=media/zaza.compiled.js

echo "***** boots *****"
npx tsc --project src/tsconfig.web.json

#echo "***** bootPreview *****"
#npx tsc --project src/tsconfig.web.json

#npx tsc src/webview/bootPreview.ts \
#  --project src/tsconfig.web.json \
#  --outDir media \
#  --noEmitOnError