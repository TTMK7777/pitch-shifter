# 画像素材と書き出し手順

`assets/` は**原本（SVG / HTML）**、`icons/` は**拡張に同梱する PNG**、
`store/` は**ウェブストア申請用 PNG** を置く。PNG は原本から再生成できるため、
デザインを変えるときは必ず SVG 側を直す。

書き出しには **headless Chrome だけ**を使う（Node / Python / ImageMagick 等の
追加依存を持たない方針）。

```
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
```

---

## 素材一覧

| 原本 | 出力 | サイズ | ストア要件 |
|------|------|--------|-----------|
| `assets/icon.svg` | `icons/icon{16,32,48,128}.png` | 各サイズ | 128 は**必須** |
| `assets/promo-small.svg` | `store/promo-small-440x280.png` | 440×280 | **必須扱い**（無いと検索順で不利） |
| `assets/screenshot-template.html` | `store/screenshot-1-1280x800.png` | 1280×800 | **最低1枚**（最大5枚） |
| — | マーキータイル 1400×560 | 1400×560 | 任意（「注目」枠の条件） |

出典: https://developer.chrome.com/docs/webstore/images

---

## アイコン

`icon.svg` は `width`/`height` を持たず `viewBox` のみ。これは意図的で、
固定値があると headless Chrome での書き出しが「縮小」ではなく「切り取り」になる。

ただし **`viewBox` のみの SVG を直接渡すと、一部サイズ（実測では 128px）で
全面透明になる**ことを確認している。そのためサイズ毎に `width`/`height` を
注入した一時 SVG を作ってから書き出す。

```bash
cd <リポジトリルート>
TMP=$(mktemp -d)
for s in 16 32 48 128; do
  sed "s|viewBox|width=\"$s\" height=\"$s\" viewBox|" assets/icon.svg > "$TMP/icon-$s.svg"
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --default-background-color=00000000 --force-device-scale-factor=1 \
    --virtual-time-budget=3000 --window-size=$s,$s \
    --screenshot="$(pwd -W)/icons/icon$s.png" "$TMP/icon-$s.svg"
done
```

- `--default-background-color=00000000` で背景を透明にする（**アイコンでは必須**）
- `--virtual-time-budget=3000` は描画完了前にシャッターが切れるのを防ぐ

### デザイン上の制約

- 絵柄は 128 キャンバスの内側 96×96（x,y = 16..112）に収め、周囲 16px を透明余白にする
- 16px でも判別できるよう、単色地 + 白抜きの太いグリフのみ。細線・影・グラデーションは使わない
- 明背景・暗背景の両方で見えること（中間彩度の `#4F46E5` を採用）

---

## プロモタイル（440×280）

こちらは出力サイズが 1 つなので、SVG に `width`/`height` を持たせてそのまま渡す。
**背景を透明にしない**ため `--default-background-color` は付けない。

```bash
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=1 --virtual-time-budget=3000 --window-size=440,280 \
  --screenshot="$(pwd -W)/store/promo-small-440x280.png" \
  "$(pwd -W)/assets/promo-small.svg"
```

`promo-small.svg` のグリフは `icon.svg` と同一形状を複製している（`scale` を掛けず
`translate` だけで移動しているので線幅が変わらない）。**`icon.svg` を直したら
`promo-small.svg` の `<g id="glyph">` も同じ内容に揃える。**

---

## スクリーンショット（1280×800）

ポップアップは縦長で 1280×800 に直接は収まらないため、テンプレートに合成する。

1. 実際の操作画面をキャプチャする
   - おすすめの構図: 動画を再生しているページ + 開いたポップアップが両方写った状態
   - Windows なら `Win+Shift+S` → 範囲選択 → 貼り付けて保存
2. `assets/capture.png` として保存する
3. `assets/screenshot-template.html` の `CAPTION` を差し替える
4. 書き出す:

```bash
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=1 --virtual-time-budget=3000 --window-size=1280,800 \
  --screenshot="$(pwd -W)/store/screenshot-1-1280x800.png" \
  "$(pwd -W)/assets/screenshot-template.html"
```

`capture.png` が無い場合は破線のプレースホルダが描かれるので、素材が無い段階でも
構図の確認ができる。

`capture.png` は実際の閲覧画面が写り込むため **`.gitignore` で除外している**
（意図せず個人的な閲覧履歴やアカウント名をコミットしないため）。合成後の
`store/*.png` は内容を目視確認した上でコミットする。

---

## 検証

書き出した PNG は**必ず実寸と中身を確認する**。透明・切り取り・フォント欠けは
バイトサイズだけでは気づけない。

```bash
python -c "
import struct,glob
for f in sorted(glob.glob('icons/*.png')+glob.glob('store/*.png')):
    d=open(f,'rb').read(); print(f, '%dx%d'%struct.unpack('>II',d[16:24]), len(d),'bytes')
"
```

そのうえで画像ビューアで開き、**16px のアイコンが判別できるか**と
**日本語が豆腐になっていないか**を目で見る。
