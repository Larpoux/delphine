#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== clean ==="
rm -rf out

echo "=== build: vscode extension ==="
npx tsc -p src/extension/tsconfig.extension.json

echo "=== build: webview boots ==="
npx tsc --project src/tsconfig.web.json

echo "=== build: example zaza (esbuild) ==="
npx esbuild examples/zaza/zaza.ts \
  --bundle \
  --format=esm \
  --platform=browser \
  --target=es2020 \
  --sourcemap=inline \
  --alias:@vcl=src/vcl \
  --alias:@drt=src/drt \
  --outfile=media/zaza.compiled.js

echo "=== build: example zazaVue (vite) ==="
pushd examples/zazaVue >/dev/null

# Installe si nécessaire (utile si vous nettoyez node_modules parfois)
if [ ! -d node_modules ]; then
  npm install
fi

npm run build
cp -f dist/zazaVue.compiled.js ../../media/zazaVue.compiled.js

#
# Récupérer l'entry JS depuis dist/manifest.json

node - <<'NODE'
const fs = require('fs');
const path = require('path');


NODE


popd >/dev/null

echo "=== done ==="