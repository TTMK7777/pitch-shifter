#!/usr/bin/env bash
# ストア用スクリーンショット (1280x800) を headless Chrome だけで生成する。
#
#   1. popup.html を実寸の 2 倍で撮影 → assets/capture.png
#   2. assets/screenshot-template.html に合成 → store/screenshot-1-1280x800.png
#
# 実際の閲覧ページを写さないので個人情報の混入がない。
# 使い方: bash scripts/build-screenshot.sh
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
COMMON=(--headless --disable-gpu --no-sandbox --hide-scrollbars --virtual-time-budget=3000)
W="$(pwd -W 2>/dev/null || pwd)"

# 1. ポップアップ本体（280px 幅。高さは余裕を持たせる）
"$CHROME" "${COMMON[@]}" --force-device-scale-factor=2 --window-size=280,${POPUP_HEIGHT:-530} \
  --screenshot="$W/assets/capture.png" "$W/popup.html"

# 2. テンプレートへ合成
"$CHROME" "${COMMON[@]}" --force-device-scale-factor=1 --window-size=1280,800 \
  --screenshot="$W/store/screenshot-1-1280x800.png" "$W/assets/screenshot-template.html"

python - <<'EOF'
import struct
for f in ("assets/capture.png", "store/screenshot-1-1280x800.png"):
    d = open(f, "rb").read()
    print(f, "%dx%d" % struct.unpack(">II", d[16:24]), len(d), "bytes")
EOF
