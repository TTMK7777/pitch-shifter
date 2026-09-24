# サードパーティ ライセンス表記

本拡張機能は以下の第三者コードを同梱／利用しています。各コンポーネントは
それぞれのライセンスに従います（ルートの `LICENSE`（MIT）は本プロジェクト
独自コードのみを対象とし、以下を再ライセンスするものではありません）。

---

## 1. SoundTouch Audio Worklet v0.3.0

- **該当ファイル**: `soundtouch-worklet.js`（**無改変**で同梱）
- **ライセンス**: GNU Lesser General Public License v2.1 or later (LGPL-2.1+) — 本文は `licenses/LGPL-2.1.txt`（配布 zip にも同梱）
- **上流パッケージ**: npm `@soundtouchjs/audio-worklet@0.3.0`（リポジトリ https://github.com/cutterbl/soundtouchjs-audio-worklet tag `v0.3.0`。同梱物は npm 配布のビルド済みバンドル）
- **同梱ファイルの sha256**: `50293f0edbb91361cd679f76d92d1ad45fbb10745f00dc16a5907242aa0124f7`（上流 npm tarball との一致確認は未実施 — 監査 run-1 で deferred）
- **著作権者**: Olli Parviainen / Ryan Berdeen / Jakub Fiala / Steve 'Cutter' Blades
- **入手元**: https://github.com/cutterbl/SoundTouchJS
- **用途**: WSOLA（波形相似オーバーラップ加算）方式のピッチシフトエンジン

### LGPL 準拠の状態

LGPL は「ライブラリ部分を差し替え可能な形で結合し、ライセンス表記を保持する」
ことを求めます。本プロジェクトは以下によりこれを満たします。

| 要件 | 本プロジェクトの状態 |
|------|---------------------|
| 改変の有無 | **無改変**。上流の配布物をそのまま同梱 |
| ライセンスヘッダ | ファイル冒頭の LGPL ヘッダを保持 |
| ライセンス本文の添付 | `licenses/LGPL-2.1.txt` をリポジトリと配布 zip の両方に同梱 |
| 差し替え可能性 | 独立した単一ファイルであり、利用者が同名ファイルを置換するだけで別ビルドに交換できる |
| 結合方式 | `audioWorklet.addModule()` による実行時ロード（静的リンクではない） |
| ソース入手性 | 同梱物そのものがソース（非圧縮 JS）。上流 URL も明記 |

> 本節はライセンス条項の解釈を要約したものであり、法的助言ではありません。
> 商用配布を行う場合は別途確認してください。

---

## 2. Jungle — delay-based pitch shifter

- **該当箇所**: `content.js` 内の `Jungle` / `createFadeBuffer` /
  `createDelayTimeBuffer` 関数群（該当箇所にヘッダコメントを保持）
- **ライセンス**: BSD 3-Clause
- **著作権者**: Copyright 2012, Google Inc.（作者: Chris Wilson）
- **入手元**: https://github.com/cwilso/Audio-Input-Effects/blob/master/js/jungle.js
- **用途**: ディレイ変調によるグラニュラー式ピッチシフトエンジン（既定）

---

## 3. soundbank-pitch-shift（校正多項式のみ）

- **該当箇所**: `content.js` の `getMultiplier()` に含まれる 5 次多項式係数
- **ライセンス**: MIT
- **著作権者**: Matt McKegg (mmckegg)
- **入手元**: https://github.com/mmckegg/soundbank-pitch-shift
- **用途**: 「半音」から Jungle 内部パラメータへの経験的校正

---

## その他

上記以外の外部ライブラリ・フレームワーク・CDN・ネットワーク API への依存は
**ありません**。ビルドツールも不要です（素の JavaScript のみ）。
