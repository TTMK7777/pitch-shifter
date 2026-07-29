# 変更履歴

このプロジェクトの主な変更を記録します。
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準じ、
バージョンは [セマンティック バージョニング](https://semver.org/lang/ja/) に従います。

## [Unreleased]

### Added
- リポジトリ整備: `LICENSE`(MIT) / `THIRD_PARTY_NOTICES.md` / `docs/architecture.md` /
  `CHANGELOG.md` / `.gitignore` を追加
- README を全面拡充（権限とプライバシー、既知の制限、メッセージ契約、想定ユースケースを追記）

- 拡張アイコンを追加（`assets/icon.svg` が原本、`icons/icon{16,32,48,128}.png` を書き出し）。
  `manifest.json` に `icons` と `action.default_icon` / `default_title` を配線
- ウェブストア用の小プロモーション画像 440×280（`assets/promo-small.svg` →
  `store/promo-small-440x280.png`）
- スクリーンショット（1280×800）の合成テンプレート `assets/screenshot-template.html`
- `assets/README.md` — 画像のサイズ要件と headless Chrome での書き出し手順、既知の罠

### Removed
- **未使用だった `storage` 権限を `manifest.json` から削除**。コード上 `chrome.storage` は
  一度も呼ばれておらず、宣言だけが残っていた。要求する権限を実際に使う分だけに絞る

### Known Issues
- 設定は永続化されない。タブのリロードでピッチ・EQ は初期値へ戻る
- 拡張アイコン (`icons/`) 未同梱。ウェブストア公開には必須

## [1.0] - 2026-06-20

### Added
- ピッチのリアルタイム変更（−1200〜+1200 セント、1 セント刻み）
- ピッチエンジン 2 種の切替（Jungle / WSOLA）と、WSOLA 失敗時の Jungle フォールバック
- 音質強化: 3 バンド EQ（低音/中音/高音、各 ±12 dB）
- 音質強化: ステレオの広がり調整（0〜200%、M/S マトリクス）
- ポップアップを開いた際の状態復元（`GET_STATE`）

[Unreleased]: https://github.com/TTMK7777/pitch-shifter/compare/v1.0...HEAD
[1.0]: https://github.com/TTMK7777/pitch-shifter/releases/tag/v1.0
