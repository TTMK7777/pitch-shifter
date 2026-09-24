# 変更履歴

このプロジェクトの主な変更を記録します。
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準じ、
バージョンは [セマンティック バージョニング](https://semver.org/lang/ja/) に従います。

## [Unreleased]

### Added
- `licenses/LGPL-2.1.txt` — 同梱 SoundTouchJS worklet のライセンス本文。配布 zip にも同梱（`scripts/package.py`）
- `SECURITY.md` / `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md` — 公開リポジトリとしての窓口と規約
- `scripts/package.py` が生成 zip の sha256 を表示
- `THIRD_PARTY_NOTICES.md` に上流 npm パッケージ名・同梱ファイルの sha256 を記録

### Changed
- `todo.md` を git 管理外へ（ローカル作業メモ）。`AGENTS.md` の参照を更新
- `store/listing.md` の提出前チェックが存在しない `scripts/package.sh` を指していたのを `scripts/package.py` に修正

## [1.1] - 2026-09-09

Chrome ウェブストア初回申請に向けた整備。拡張本体の挙動に変更なし。

### Added
- `docs/privacy-policy.md` — プライバシーポリシー（日英）。ストア申請の必須 URL
- `store/listing.md` — ストア掲載文・権限の理由・提出前チェックリスト
- `store/screenshot-1-1280x800.png` — スクリーンショット（ポップアップ実画面を合成）
- `scripts/package.py` — 提出用 zip 生成（manifest 参照ファイルの同梱漏れを検査）
- `scripts/build-screenshot.sh` — スクリーンショットを headless Chrome だけで再生成
- リポジトリ整備: `LICENSE`(MIT) / `THIRD_PARTY_NOTICES.md` / `docs/architecture.md` /
  `CHANGELOG.md` / `.gitignore` を追加
- README を全面拡充（権限とプライバシー、既知の制限、メッセージ契約、想定ユースケースを追記）

- 拡張アイコンを追加（`assets/icon.svg` が原本、`icons/icon{16,32,48,128}.png` を書き出し）。
  `manifest.json` に `icons` と `action.default_icon` / `default_title` を配線
- ウェブストア用の小プロモーション画像 440×280（`assets/promo-small.svg` →
  `store/promo-small-440x280.png`）
- スクリーンショット（1280×800）の合成テンプレート `assets/screenshot-template.html`
- `assets/README.md` — 画像のサイズ要件と headless Chrome での書き出し手順、既知の罠
- `.gitattributes` — 改行を LF に固定。複数 PC 間で `core.autocrlf` の差により
  「clone しただけで全行差分になる」事故を防ぐ。PNG 等はバイナリとして明示し、
  同梱の `soundtouch-worklet.js` は `linguist-vendored` を付与
- `.github/workflows/version-check.yml` — タグ push 時に `manifest.json` の
  `version` とタグを突合し、不一致なら失敗させる（ストアは manifest の version
  でしか更新を判定しないため、上げ忘れると更新が届かない）

### Removed
- **未使用だった `storage` 権限を `manifest.json` から削除**。コード上 `chrome.storage` は
  一度も呼ばれておらず、宣言だけが残っていた。要求する権限を実際に使う分だけに絞る

### Known Issues
- 設定は永続化されない。タブのリロードでピッチ・EQ は初期値へ戻る

## [1.0] - 2026-06-20

### Added
- ピッチのリアルタイム変更（−1200〜+1200 セント、1 セント刻み）
- ピッチエンジン 2 種の切替（Jungle / WSOLA）と、WSOLA 失敗時の Jungle フォールバック
- 音質強化: 3 バンド EQ（低音/中音/高音、各 ±12 dB）
- 音質強化: ステレオの広がり調整（0〜200%、M/S マトリクス）
- ポップアップを開いた際の状態復元（`GET_STATE`）

[Unreleased]: https://github.com/TTMK7777/pitch-shifter/compare/v1.1...HEAD
[1.1]: https://github.com/TTMK7777/pitch-shifter/compare/v1.0...v1.1
[1.0]: https://github.com/TTMK7777/pitch-shifter/releases/tag/v1.0
