# Chrome ウェブストア 申請フォーム記入内容

デベロッパーダッシュボード（https://chrome.google.com/webstore/devconsole）の各欄へ、以下をコピーして貼る。

## ストア掲載情報

**名前**: Pitch Shifter — 音程だけを変更

**概要（132 文字以内）**
```
動画・音楽のピッチ（音程）だけを、再生速度を変えずにリアルタイム変更。±1オクターブを1セント刻みで。外部通信ゼロ。
```

**詳細説明**
```
再生中の動画・音楽の「ピッチ（音程）だけ」を、再生速度を変えずにリアルタイムで上下する拡張機能です。

■ こんなときに
・楽器や歌の練習 — 原曲を自分の声域やギターのチューニングに合わせて移調
・耳コピ / 採譜 — 半音単位で動かして音程を確認
・語学・聴き取り — 声の高さを変えて聞き取りやすさを調整

■ 機能
・−1200〜+1200 セント（±1 オクターブ）を 1 セント刻みで調整
・半音 / ±10¢ / ±1¢ のボタン操作とリセット
・ピッチエンジン 2 種（軽量な Jungle ／ 高音質な WSOLA）を切替
・3 バンド EQ（低音・中音・高音 ±12 dB）とステレオの広がり（0〜200%）

■ プライバシー
外部通信ゼロ、データ収集ゼロ。音声処理はすべてブラウザ内（Web Audio API）で完結します。

■ 使い方
ツールバーのアイコンからポップアップを開き、つまみを操作するだけ。
メディアを一度再生してから操作してください（再生開始時に処理が接続されます）。

■ 既知の制限
・設定はタブ単位で、リロードすると初期値に戻ります
・DRM 保護コンテンツやクロスオリジン音源では無音になる場合があります
・他の拡張が先に音声を掴んでいる場合は動作しません

オープンソース（MIT）: https://github.com/TTMK7777/pitch-shifter
```

**カテゴリ**: エンターテインメント（代替: ツール）
**言語**: 日本語（主）

**English description（言語追加時）**
```
Change only the pitch of any playing video or audio in real time — without changing playback speed.

• ±1 octave (−1200 to +1200 cents) in 1-cent steps
• Semitone / ±10¢ / ±1¢ buttons and reset
• Two pitch engines: lightweight Jungle or high-quality WSOLA (SoundTouch)
• 3-band EQ (±12 dB) and stereo width (0–200%)
• Zero network requests, zero data collection — everything runs locally via Web Audio API

Use cases: transpose songs to your vocal range or guitar tuning, ear training / transcription, language listening practice.

Open source (MIT): https://github.com/TTMK7777/pitch-shifter
```

## 画像

| 項目 | ファイル | 状態 |
|---|---|---|
| アイコン 128×128 | `icons/icon128.png` | 済 |
| スクリーンショット 1280×800 | `store/screenshot-1-1280x800.png` | 生成手順は `assets/README.md` |
| 小プロモタイル 440×280 | `store/promo-small-440x280.png` | 済 |
| マーキー 1400×560 | — | 任意・未作成 |

## プライバシー

**プライバシーポリシー URL**
```
https://github.com/TTMK7777/pitch-shifter/blob/main/docs/privacy-policy.md
```

**単一目的の説明（Single purpose）**
```
再生中の動画・音声のピッチ（音程）を、再生速度を変えずにリアルタイムで変更する。
```

**権限の理由（Permission justification）**

| 権限 | 記入文 |
|---|---|
| activeTab | ポップアップで操作した設定値を、現在表示中のタブへ送信するため。 |
| scripting | 音声処理用 content script が未読込のタブへ、ユーザー操作時に注入するため。 |
| ホスト権限 `<all_urls>` | 動画・音声はあらゆるサイトで再生されうるため、対象サイトを事前に限定できない。スクリプトは再生中の `<video>`/`<audio>` 要素にのみ Web Audio API を接続し、ページ内容の読み取り・改変・送信は行わない。 |

**リモートコードの使用**: いいえ（すべて同梱。`soundtouch-worklet.js` はパッケージ内ファイル）

**データ使用の開示**: すべて「収集しない」にチェック。以下 3 点の証明にチェック
- ユーザーデータを承認された用途以外に販売・転用しない
- 単一目的と無関係な用途にデータを使用しない
- 信用力判定や融資目的にデータを使用しない

## 配布

- 公開範囲: 公開
- 配布地域: すべての地域
- 有料/無料: 無料

## 提出前チェック

- [ ] `dist/pitch-shifter-<version>.zip` を `python scripts/package.py` で生成し、中身が `manifest.json` / `content.js` / `popup.*` / `soundtouch-worklet.js` / `icons/` / `licenses/LGPL-2.1.txt` のみであること（出力の sha256 を控える）
- [ ] `manifest.json` の `version` と git タグが一致（`.github/workflows/version-check.yml`）
- [ ] スクリーンショットに個人情報（アカウント名・閲覧履歴）が写っていない
- [ ] 開発者アカウント登録（US$5、ユーザー作業）
