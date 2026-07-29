# アーキテクチャ詳細

`README.md` の概要より踏み込んだ内部設計のメモ。

## 1. 全体構成

Manifest V3 の 3 コンポーネント構成。background (service worker) は持たない。

```
┌──────────────┐   chrome.tabs.sendMessage    ┌─────────────────┐
│  popup.js    │ ───────────────────────────► │   content.js    │
│  (操作 UI)   │ ◄─────────────────────────── │  (音声グラフ)   │
└──────────────┘        sendResponse          └────────┬────────┘
                                                       │ addModule()
                                              ┌────────▼────────┐
                                              │ soundtouch-     │
                                              │ worklet.js      │
                                              │ (AudioWorklet)  │
                                              └─────────────────┘
```

`content.js` は `manifest.json` の `content_scripts` により全 URL へ自動注入されるが、
注入前のタブ（拡張の読み込み直後など）に備えて、`popup.js` は
`sendMessage` 失敗時に `chrome.scripting.executeScript` で強制注入してから再送する
フォールバックを全メッセージ送信経路に持つ。

## 2. 状態の所在

状態はすべて `content.js` のクロージャ内に置かれ、**タブ単位**で独立する。
永続化は行っていない（`chrome.storage` を使わず、`storage` 権限も要求していない）。

| 変数 | 意味 | 既定値 |
|------|------|--------|
| `currentFactor` | ピッチ係数 `2^(cents/1200)` | `1.0` |
| `currentEngine` | `'jungle'` / `'wsola'` | `'jungle'` |
| `currentEQ` | `{ bass, mid, treble }`（dB） | 全て `0` |
| `currentWidth` | ステレオ幅倍率 | `1.0` |
| `elementMap` | `HTMLMediaElement → { source, jungle, stNode }` | 空 |

ポップアップは開くたびに `GET_STATE` を投げ、返ってきた値で UI を復元する。
つまり **UI は状態を持たず、content script が唯一の真実**である。

## 3. アタッチのライフサイクル

```
document.addEventListener('play', ..., true)   ← capture フェーズで全再生を捕捉
        │
        ▼
   attachElement(el)
        │
        ├─ elementMap に既存 → 何もしない（冪等）
        ├─ AudioContext を遅延生成 / suspended なら resume
        ├─ createMediaElementSource(el)  ← 失敗したら黙って return
        └─ wireEngine(entry, currentEngine)
```

補助経路として、以下の 2 箇所で「今再生中の要素」を走査して取りこぼしを拾う。

- 注入直後の `attachPlayingElements()`
- `SET_PITCH` / `SET_ENGINE` 受信時

### createMediaElementSource の一回性

Web Audio の仕様上、1 つのメディア要素に対して `createMediaElementSource` は
1 回しか成功しない。2 回目は例外になる。ここから 2 つの帰結がある。

1. **エンジン切替でソースを作り直せない** → 下流の配線だけ張り替える設計になる（§4）
2. **他拡張と共存できない** → 先に掴んだ側が勝つ。本拡張は例外を握り潰して静かに無効化する

## 4. エンジン切替（配線の張り替え）

`wireEngine()` は以下の順で動く。

```
1. ensureChain()                    音質強化チェーンを（未構築なら）作る
2. source.disconnect()              下流を全部切る
   jungle.output.disconnect()
   stNode.disconnect()
3. 選択エンジンを build（遅延生成・再利用）
4. source → engine → chainInput へ繋ぎ直す
5. 現在の currentFactor を新エンジンへ適用
```

`disconnect()` はいずれも `try/catch` で握り潰す。未接続ノードへの
`disconnect()` は実装により例外になるため、状態を追跡するより握り潰す方が単純と判断した。

WSOLA 側の `buildWsola()` が失敗した場合（worklet の読み込み失敗）は、
その場で Jungle を組んで返し、戻り値として実際に採用したエンジン名を返す。

## 5. 音質強化チェーン

全メディア要素で **1 セットだけ** 共有する。遅延構築（`ensureChain()`）で、
最初にエンジンが繋がれるまで生成しない。

```
chainInput (Gain)
  → bassFilter   lowshelf  200 Hz
  → midFilter    peaking   1 kHz  Q=0.9
  → trebleFilter highshelf 3.5 kHz
  → stereoize (Gain)          ← channelCountMode='explicit', interpretation='speakers'
  → splitter (2ch)
  → [gLa, gRb, gLb, gRa]      ← M/S マトリクス
  → merger (2ch)
  → destination
```

### ステレオワイドナー

```
outL = a·L + b·R
outR = b·L + a·R
  where  a = 0.5(1 + width),  b = 0.5(1 - width)
```

`width = 0` でモノラル、`1` で原音、`2` で最大拡張。

**モノラル音源対策**: `ChannelSplitter` は discrete アップミックスを行うため、
モノラル入力だと R チャンネルが無音になる。これを避けるため、splitter の手前に
`channelInterpretation='speakers'` の Gain ノード（`stereoize`）を挟み、
L=R の複製アップミックスを強制している。

## 6. ピッチ値の変換

UI はセント、内部はピッチ係数、エンジンごとにさらに別表現を使う。

```
セント (UI, -1200..+1200)
   │  factor = 2^(cents/1200)
   ▼
ピッチ係数 (0.5 .. 2.0)
   ├─ WSOLA : そのまま pitch AudioParam へ（0.25..4.0 にクランプ）
   └─ Jungle: semitones = log2(factor) * 12
              → getMultiplier(semitones) で内部 mult へ校正
```

`getMultiplier()` は負側を線形 `x/12`、正側を 5 次多項式で近似する。
これは Jungle のディレイ変調量と実際の音程変化が線形でないための経験的補正で、
soundbank-pitch-shift の係数をそのまま使用している。

`|semitones| < 0.01` のときは `setPitchOffset(0)` として、
0 付近で不要な変調が残らないようにしている。

## 7. 意図的に持っていないもの

| 機能 | 不採用の理由 |
|------|-------------|
| background service worker | popup ↔ content の 2 者間で完結するため不要 |
| 設定の永続化 | 未実装。あわせて `storage` 権限も要求しない（要求する権限を実際に使う分だけに絞る方針） |
| リミッター / 自動ゲイン | 未実装。EQ を上げすぎるとクリップする |
| 再生速度の変更 | ブラウザ標準機能と重複するため対象外 |
| ビルドツール / npm 依存 | 素の JS で足りるため導入していない |
