# 保守ガイド

この Chrome 拡張（Pitch Shifter）を、AI を使わずに保守するための案内です。何をする拡張かは [README.md](README.md) を先に読んでください。

このリポジトリは公開されています。個人の環境パス・アカウント名・閲覧履歴などをコミットしないでください（`assets/capture.png` を `.gitignore` で除外しているのも同じ理由です）。

## ファイルの種類

このリポジトリに「AI への指示書」はほぼありません。ほとんどは普通のコードと文書です。

| 種類 | 例 | 何か | 直すときの注意 |
|---|---|---|---|
| 普通のコード（拡張本体） | `content.js`・`popup.js`・`popup.html`・`soundtouch-worklet.js` | ブラウザで動く JavaScript と HTML。ビルド不要で、保存して拡張を再読み込みすれば反映される | 自動テストは無い。直したら下の「直したあとの確認」を回す。`soundtouch-worklet.js` は他人の作った部品を**無改変で同梱**しているので直接編集しない |
| 設定 | `manifest.json`・`.github/workflows/version-check.yml`・`.gitattributes`・`.gitignore` | 拡張の定義（権限・読み込むファイル）、タグの検査、改行コード（LF 固定）の指定 | `manifest.json` の権限を変えると、ストア審査・プライバシーポリシーに影響する（下の逆引き表） |
| 補助スクリプト | `scripts/package.py`・`scripts/build-screenshot.sh` | ストア提出用 zip の生成、スクリーンショットの生成 | `scripts/package.py` の `INCLUDE` が zip に入れるファイルの一覧。実行時に使うファイルを足したらここにも足す |
| 画像 | `assets/`（原本）・`icons/`・`store/`（書き出した PNG） | PNG は原本から作り直せる | デザインを変えるときは原本（SVG）を直す。手順は [assets/README.md](assets/README.md) |
| 文書 | `README.md`・`docs/`・`store/listing.md`・`CHANGELOG.md`・`SECURITY.md`・`CONTRIBUTING.md`・`THIRD_PARTY_NOTICES.md` | 利用者向け説明・設計メモ・ストア申請文・法的な表記 | 同じ数値や権限の説明が複数の文書に**手で写してある**。逆引き表で全部挙げている |
| AI への指示書 | [AGENTS.md](AGENTS.md) | AI（Codex・Claude Code）がこのリポジトリを触るときの約束ごと。拡張の動作には関係しない | 人間が読んでもよい短い文書。AI を使わないなら無視してよい |

## どこに何があるか

- 拡張の動作: `content.js` が本体（ページに注入されて音を加工する）、`popup.js` + `popup.html` が操作画面。2 つは `chrome.tabs.sendMessage` のメッセージで話す（種類は [README.md](README.md) の「メッセージ契約」の表）
- 設計メモ: [docs/architecture.md](docs/architecture.md)（状態の持ち方・音声グラフ・ピッチ値の変換）
- ストア関連: [store/listing.md](store/listing.md)（申請フォームに貼る文面）、[docs/privacy-policy.md](docs/privacy-policy.md)
- 画像の作り方: [assets/README.md](assets/README.md)
- 同梱している他人のコード: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
- 現行方針の食い違い: [SECURITY.md](SECURITY.md) の "Supported versions" はストア公開済みを前提に書かれているが、[README.md](README.md) の「インストール」と「ウェブストア申請」の残作業が現状（ストア未公開）。迷ったら README を正とする
- [AGENTS.md](AGENTS.md) が「現在地」として読めと指すローカルメモは `.gitignore` でコミット対象外なので、clone しただけでは存在しない（`.gitignore` の「セッション内部メモ」の項に名前がある）

## よくある作業（逆引き）

このリポジトリにはテストが無い（`tests/` も CI のテストも無い。CI は `.github/workflows/version-check.yml` のタグ検査だけ）。どの行も「テストが守ってくれる」ことは無いので、**手で写してある場所を全部合わせ**、最後に「直したあとの確認」を回してください。

| やりたいこと | 触る所 | 確かめ方 |
|---|---|---|
| ピッチの可変幅（今は −1200〜+1200 セント）を変える | `popup.html` のスライダー（`id="slider"` の `min`・`max`）、`popup.js` のボタン処理 6 か所（`Math.max(-1200, …)`・`Math.min(1200, …)` が `downBtn`・`upBtn`・`down10`・`down1`・`up1`・`up10`）。WSOLA 側は `content.js` の `applyPitchWsola` が係数を 0.25〜4.0 に丸める（広げすぎるとここで頭打ち）。Jungle 側の `getMultiplier` が広い範囲でも正しい音程になるかは確認されていない。数値を書き写している文書: [README.md](README.md)（概要の表・「機能」・既知の制限 #5）、[docs/architecture.md](docs/architecture.md) の §6、[store/listing.md](store/listing.md)（概要・詳細説明・英語説明）。[CHANGELOG.md](CHANGELOG.md) の過去の記録は書き換えず、`[Unreleased]` に新しく書く | 「直したあとの確認」の 1・2 と、実機でスライダーの両端まで動かして両エンジンで音を聞く |
| 低音・中音・高音の中心周波数や幅を変える（今は 200 Hz・1 kHz・3.5 kHz、±12 dB） | `content.js` の `ensureChain`（`frequency.value`・`Q.value`）、範囲は `popup.html` の `id="bass"`・`"mid"`・`"treble"` の `min`・`max`。数値を書き写している文書: [README.md](README.md)（「音質強化」の表）、[docs/architecture.md](docs/architecture.md) の §5、[store/listing.md](store/listing.md)（詳細説明・英語説明の「±12 dB」） | 「直したあとの確認」+ 実機で各つまみを動かして音の変化を聞く |
| ステレオの広がりの範囲や初期値（今は 0〜200%・初期 100%）を変える | `popup.html` の `id="width"`（`min`・`max`・`step`・`value`、表示の初期文字 `100%`）、`popup.js` の `enhanceReset`（リセット時に `width.value = 100`）、`content.js` の `currentWidth`（既定 `1.0`）と `applyStereoWidth`。書き写している文書: [README.md](README.md)（「音質強化」の表）、[docs/architecture.md](docs/architecture.md) の §5、[store/listing.md](store/listing.md) | 「直したあとの確認」+ 実機で 0%（モノラル）と 200% を聞き比べる |
| ポップアップの文言（エンジンの説明など）を変える | エンジン説明は 2 か所: `popup.html` のボタン内の短い説明（`engJungle`・`engWsola`）と、`popup.js` の `ENGINE_NOTES`（ボタンを押したとき下に出る 1 行）。同じ内容を書いた文書: [README.md](README.md)（「ピッチエンジンの切替」の表）、[store/listing.md](store/listing.md)。両者は自動では揃わないので手で合わせる | `node --check popup.js`（文法だけ）+ 実機でポップアップを開いて目で見る |
| 拡張の権限（今は `activeTab`・`scripting`・`<all_urls>`）を足す・外す | `manifest.json` の `permissions`・`host_permissions`。**同じ PR で**次も直す: [README.md](README.md)（「要求している権限」の表）、[SECURITY.md](SECURITY.md)（"What this extension does and does not do"）、[docs/privacy-policy.md](docs/privacy-policy.md)（英語の表と日本語の表の両方）、[store/listing.md](store/listing.md)（「権限の理由」の表）。方針は [CONTRIBUTING.md](CONTRIBUTING.md) | `python -B scripts/package.py` が `OK` を出すこと + 拡張を再読み込みして警告が出ないこと |
| 拡張が使うファイルを足す・名前を変える | そのファイル、`manifest.json`（`content_scripts`・`web_accessible_resources` など）、`scripts/package.py` の `INCLUDE`。[store/listing.md](store/listing.md) の「提出前チェック」にある zip の中身の一覧も手で合わせる | `python -B scripts/package.py`。`manifest.json` が参照するのに `INCLUDE` に無いファイルがあると `ERROR: manifest が参照しているのに同梱されていません` で止まる（実際に確認済み）。逆に `INCLUDE` にあるが manifest が参照しないファイルや、manifest 以外（`popup.html` が読む `popup.js` など）の漏れは検出されないので、zip の一覧を目で確認する |
| popup と content の間のメッセージ（`SET_PITCH` など）を変える | 送る側 `popup.js`、受ける側 `content.js` の `chrome.runtime.onMessage` の分岐（両方同時に）。書き写している文書: [README.md](README.md)（「メッセージ契約」の表）、[docs/architecture.md](docs/architecture.md) の §2・§3 | 「直したあとの確認」+ 実機でポップアップを開き直して、表示が復元されるか（`GET_STATE`）も見る |
| バージョンを上げる | `manifest.json` の `version`（ストアはこの値だけで更新を判定する）。手で合わせる: [README.md](README.md) 冒頭の表の「バージョン」、[CHANGELOG.md](CHANGELOG.md)（`[Unreleased]` の中身を新しい版の見出しへ移し、末尾の比較リンクも足す）。リリース時は `v` + `version`（`version` が `1.2` ならタグ `v1.2`）のタグを打つ | タグを push すると `.github/workflows/version-check.yml` がタグと `manifest.json` の `version` を突き合わせる（ずれていれば赤）。この検査はタグ push 時にしか動かず、README・CHANGELOG の食い違いは検出しない |
| 同梱の SoundTouch（`soundtouch-worklet.js`）を更新する | ファイル自体を入れ替える（編集はしない）。[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) の版・上流パッケージ名・`sha256` を新しいファイルに合わせる | 次のコマンドの出力が、`THIRD_PARTY_NOTICES.md` の `sha256` と一致すること: `python -B -c "import hashlib;print(hashlib.sha256(open('soundtouch-worklet.js','rb').read()).hexdigest())"`（現状は一致を確認済み） |
| アイコン・ストア画像を作り直す | 原本の `assets/icon.svg`・`assets/promo-small.svg`・`assets/screenshot-template.html`。書き出し手順は [assets/README.md](assets/README.md)。`assets/icon.svg` を直したら `assets/promo-small.svg` の同じ図形も手で揃える | 書き出した PNG の寸法と見た目を目で確認（確認用コマンドも [assets/README.md](assets/README.md) の「検証」にある） |
| ストア申請の文面を変える | [store/listing.md](store/listing.md)。機能の説明を変えたなら [README.md](README.md) も合わせる | 文面を目で読み、概要が 132 文字以内か数える |

## 直したあとの確認

1. 文法チェック（Node.js が入っている場合）: `node --check content.js` と `node --check popup.js` — どちらもエラー無しで終われば OK。**見つけられるのは文法エラーだけ**で、存在しない関数を呼ぶ・要素の `id` を間違える、といった誤りは見つからない
2. 配布物の組み立て: `python -B scripts/package.py` — 先頭が `OK dist\pitch-shifter-<version>.zip` で、同梱ファイル一覧に `manifest.json`・`content.js`・`popup.html`・`popup.js`・`soundtouch-worklet.js`・`icons/`・`licenses/LGPL-2.1.txt` が並ぶこと。`dist/` は `.gitignore` で除外されている。sha256 は実行のたびに変わる（zip に時刻が入るため）ので、値の比較には使えない
3. `manifest.json` の JSON が壊れていないか: `python -B -c "import json;print(json.load(open('manifest.json', encoding='utf-8'))['version'])"` が版を表示すれば OK
4. 実機で確かめる（**自動では確かめられない部分**。音を出す・聞く作業なので、この整理作業では実行していない）
   1. 普段使いと別の Chrome プロファイルを用意する（拡張が全サイトに効くため、作業用に分けておくと安全）
   2. `chrome://extensions` を開き、デベロッパーモードをオンにして、このフォルダを「パッケージ化されていない拡張機能を読み込む」で読み込む。コードを直したあとは拡張カードの ⟳ を押し、対象タブを F5 で再読み込みする
   3. 音声か動画が再生できるページで**再生を始めてから**、ポップアップのつまみを動かす（再生前だと効かない。README の「使い方」参照）
   4. スライダーの両端、Jungle・WSOLA の切替、低音・中音・高音、ステレオの広がり（0% でモノラルになる）を順に動かして、音が変わるか聞く
   5. ページの DevTools コンソールに `[PitchShifter] attached to …` が出ること、ポップアップを右クリック →「検証」でエラーが出ていないことを見る

## 壊れたとき

| 症状 | まず見る所 | よくある原因 |
|---|---|---|
| つまみを動かしても音が変わらない | ページの DevTools コンソールに `[PitchShifter] attached to` が出ているか | メディアが再生される前に操作した（再生を始めてからやり直す）。コードを直したのに拡張の ⟳ とタブの F5 をしていない |
| コンソールに何も出ず、音も変わらない | `content.js` の `attachElement` | 他の拡張が先に同じ要素の音を掴んでいる。`createMediaElementSource` は 1 要素に 1 回しか成功せず、失敗は握りつぶして何も表示しない（[README.md](README.md) 既知の制限 #6） |
| WSOLA に切り替えても Jungle の音のまま | コンソールの `[PitchShifter] WSOLA worklet 読込失敗, Jungle にフォールバック` | `soundtouch-worklet.js` が読めていない（`manifest.json` の `web_accessible_resources` の書き間違い・ファイル名の変更など）。ポップアップ側の表示は WSOLA のままになるので、コンソールで確かめる |
| ポップアップを開いても表示が初期値に戻っている | ポップアップを右クリック →「検証」 | 対象タブに `content.js` が入っていない（`chrome://` のページなど、拡張が動けないページ）。`GET_STATE` が失敗してもポップアップは黙って何もしない。または、タブをリロードして状態が初期化された（保存しない設計。README 既知の制限 #1） |
| 低音を上げたら音が歪む | — | 仕様（リミッター未搭載。README 既知の制限 #4）。低音を下げる |
| `python -B scripts/package.py` が `ERROR: 同梱対象が見つかりません` | `scripts/package.py` の `INCLUDE` | ファイルの名前変更・削除で `INCLUDE` と実物がずれた |
| `python -B scripts/package.py` が `ERROR: manifest が参照しているのに同梱されていません` | `manifest.json` と `INCLUDE` | manifest にファイルを足して `INCLUDE` に足し忘れた |
| タグを打ったら GitHub Actions の "version check" が赤 | `manifest.json` の `version` とタグ名 | タグ `v1.2` に対し `version` が `"1.2"` になっていない。直してタグを打ち直す |
| `bash scripts/build-screenshot.sh` が Chrome を見つけられない | スクリプト先頭の `CHROME` | 既定値は Windows の Chrome の場所。別の場所なら環境変数 `CHROME` で渡す。このスクリプトは実行すると**コミット済みの** `store/screenshot-1-1280x800.png` を上書きする |

## AI なしでは保守できない所

なし。ビルドも AI 用の手順書も無く、すべて人が読んで直せます。ただし、**音の良し悪しは耳で確かめるしかなく**（自動テストが無いため）、直したら上の「実機で確かめる」を毎回行う必要があります。

## 用語集

| 言葉 | 意味 |
|---|---|
| ピッチ | 音の高さ。この拡張は再生速度を変えず、高さだけを変える |
| セント（¢） | 音程の単位。100 セント = 半音 1 つ、1200 セント = 1 オクターブ |
| Manifest V3 | Chrome 拡張の定義ファイル `manifest.json` の現行の書式 |
| content script | 開いているページの中で動く拡張のプログラム。ここでは `content.js` |
| popup | ツールバーのアイコンを押すと開く小さな操作画面。ここでは `popup.html` + `popup.js` |
| Web Audio API | ブラウザの音声加工機能。この拡張はこれで音をつなぎ替える |
| AudioWorklet | 音声加工を専用スレッドで動かすブラウザの仕組み。WSOLA エンジンが使う（`soundtouch-worklet.js`） |
| Jungle | ピッチを変える方式の 1 つ（ディレイの揺らし）。軽いが大きくずらすと揺らぎが出る。`content.js` に直接書いてある |
| WSOLA | ピッチを変える方式のもう 1 つ（波形をつなぎ合わせる）。高音質だがやや重い。SoundTouchJS を同梱して使う |
| SoundTouchJS | WSOLA の実装を提供する第三者のライブラリ。LGPL ライセンス。`soundtouch-worklet.js` として無改変で同梱 |
| LGPL | 部品として使うときの条件（無改変・差し替え可能・ライセンス表記を残す）が付く公開ライセンス。詳しくは [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) |
| EQ | 低音・中音・高音の大きさを調整する機能 |
| M/S マトリクス | 左右の音を混ぜ合わせてステレオの広がりを変える計算。`content.js` の `applyStereoWidth` |
| headless Chrome | 画面を出さずに動かす Chrome。画像の書き出しに使う |
| Chrome ウェブストア | Chrome 拡張の配布場所。提出用の zip は `scripts/package.py` で作る |
| AGENTS.md | AI が最初に読む案内文書。人間は読まなくても保守できる |
