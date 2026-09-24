# Security Policy / セキュリティポリシー

## Supported versions

Only the latest version published on the Chrome Web Store (and the matching `v*` tag on `main`) receives fixes.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

| Situation | Where to report |
|---|---|
| General concern, hardening suggestion, or something already public | [Open an issue](../../issues/new) |
| Vulnerability you believe is not yet public | [Private vulnerability report](../../security/advisories/new) (visible to maintainers only) |
| The maintainer is the party at fault (abuse, malicious update, etc.) | [GitHub report abuse](https://github.com/contact/report-abuse) |

You will get an acknowledgement within 7 days. Fixed issues are credited in `CHANGELOG.md` unless you ask otherwise.

## What this extension does and does not do

- Makes **no network requests** and collects **no data** (see `docs/privacy-policy.md`).
- Requests only `activeTab`, `scripting`, and host access `<all_urls>`; no `storage`.
- Ships no remote code; the only third-party code is the bundled SoundTouchJS worklet (see `THIRD_PARTY_NOTICES.md`).

If you find behaviour that contradicts the above, that is a security bug — please report it through the private channel.

---

## 日本語

セキュリティに関わる問題は **公開 Issue に書かないでください**。

| 状況 | 報告先 |
|---|---|
| 一般的な懸念・強化提案・既に公開済みの内容 | [Issue を作成](../../issues/new) |
| 未公開の脆弱性 | [Private vulnerability report](../../security/advisories/new)（メンテナのみ閲覧可） |
| メンテナ自身が当事者の場合 | [GitHub report abuse](https://github.com/contact/report-abuse) |

7 日以内に受領連絡をします。修正した問題は希望がなければ `CHANGELOG.md` に謝辞を載せます。
