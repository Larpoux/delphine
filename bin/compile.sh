#!/bin/bash
set -euo pipefail

# Always run from repo root (so paths are stable even if launched from VSCode)
cd "$(dirname "$0")/.."

# 1) Compile zaza
npx esbuild zaza.ts \
  --bundle \
  --format=esm \
  --platform=browser \
  --target=es2020 \
  --sourcemap=inline \
  --outfile=zaza.compiled.js
  rm media/zaza.compiled.js 2>/dev/null
  mv -v zaza.compiled.js media/

# 2) Compile boot.ts -> media/boot.js (DOM-only TS, no Node types)
rm -f media/bootEditor.js 2>/dev/null
rm -f media/bootPreview.js 2>/dev/null


npx tsc media/bootEditor.ts \
  --target ES2020 \
  --module ES2020 \
  --moduleResolution bundler \
  --lib DOM,ES2020 \
  --skipLibCheck \
  --outDir media \
  --noEmitOnError \
  --strict


npx tsc media/bootPreview.ts \
  --target ES2020 \
  --module ES2020 \
  --moduleResolution bundler \
  --lib DOM,ES2020 \
  --skipLibCheck \
  --outDir media \
  --noEmitOnError \
  --strict
