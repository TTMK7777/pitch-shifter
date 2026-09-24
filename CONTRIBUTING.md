# Contributing / コントリビューション

Thanks for your interest. This is a small, dependency-free Chrome extension; contributions are welcome as issues and pull requests.

## Before you start

- Read `README.md` (architecture, message contract, known limitations) and `docs/architecture.md`.
- Security problems: follow `SECURITY.md`, not a public issue.
- Everyone participating agrees to `CODE_OF_CONDUCT.md`.

## Development

No build step. Edit → `chrome://extensions` → reload the unpacked extension → reload the tab.

- Keep the extension **network-free and storage-free**. A PR that adds `fetch`, `chrome.storage`, new permissions, or remote code needs a written rationale and will update `docs/privacy-policy.md` / `store/listing.md` in the same PR.
- `soundtouch-worklet.js` is vendored **unmodified** (LGPL-2.1+). Do not edit it; bump the upstream version instead and update `THIRD_PARTY_NOTICES.md`.
- Release packaging: `python scripts/package.py` (allowlist in the script; add new runtime files there).

## Pull requests

1. Branch from `main`; one topic per PR.
2. Describe what changed and how you verified it (which page, which engine, what you heard).
3. If `manifest.json` `version` changes, update `CHANGELOG.md`; the `v*` tag must match (`.github/workflows/version-check.yml`).

Commit messages may be in Japanese or English.

---

## 日本語

- ビルド不要。編集 → `chrome://extensions` で再読み込み → タブを F5。
- **外部通信ゼロ・ストレージ不使用**を維持してください。権限追加や `fetch` 追加は理由を書き、同じ PR で `docs/privacy-policy.md` と `store/listing.md` を更新してください。
- `soundtouch-worklet.js` は無改変同梱（LGPL）。直接編集せず上流バージョンを上げてください。
- PR には「何を・どのページで・どう聞いて確認したか」を書いてください。
