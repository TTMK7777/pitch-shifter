#!/usr/bin/env python3
"""Chrome ウェブストア提出用 zip を生成する。

拡張の実行に必要なファイルと同梱ライブラリのライセンス本文だけを同梱し、
原本 (assets/) やストア素材 (store/)、ドキュメントは含めない。依存パッケージなし（標準ライブラリのみ）。

使い方:  python scripts/package.py
出力:    dist/pitch-shifter-<manifest.version>.zip
"""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 同梱するファイル（manifest.json が参照するものだけ）
INCLUDE = [
    "manifest.json",
    "content.js",
    "popup.html",
    "popup.js",
    "soundtouch-worklet.js",
    "icons/icon16.png",
    "icons/icon32.png",
    "icons/icon48.png",
    "icons/icon128.png",
    "licenses/LGPL-2.1.txt",  # 同梱 worklet (LGPL-2.1+) のライセンス本文
]


def main() -> int:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    version = manifest["version"]

    missing = [p for p in INCLUDE if not (ROOT / p).is_file()]
    if missing:
        print("ERROR: 同梱対象が見つかりません:", ", ".join(missing), file=sys.stderr)
        return 1

    # manifest が参照するファイルが INCLUDE から漏れていないか突合
    referenced = set()
    for size in manifest.get("icons", {}).values():
        referenced.add(size)
    for size in manifest.get("action", {}).get("default_icon", {}).values():
        referenced.add(size)
    referenced.add(manifest.get("action", {}).get("default_popup", ""))
    for cs in manifest.get("content_scripts", []):
        referenced.update(cs.get("js", []))
    for war in manifest.get("web_accessible_resources", []):
        referenced.update(war.get("resources", []))
    referenced.discard("")
    not_included = sorted(referenced - set(INCLUDE))
    if not_included:
        print("ERROR: manifest が参照しているのに同梱されていません:", ", ".join(not_included), file=sys.stderr)
        return 1

    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    out = dist / f"pitch-shifter-{version}.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for rel in INCLUDE:
            zf.write(ROOT / rel, rel)

    with zipfile.ZipFile(out) as zf:
        names = zf.namelist()
    digest = hashlib.sha256(out.read_bytes()).hexdigest()
    print(f"OK {out.relative_to(ROOT)} ({out.stat().st_size} bytes, {len(names)} files)")
    print(f"   sha256 {digest}")
    for n in names:
        print("  ", n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
