# Privacy Policy — Pitch Shifter / プライバシーポリシー

Last updated: 2026-09-09

## English

**Pitch Shifter collects no data.**

- The extension does not collect, store, or transmit any personal information, browsing history, page content, or audio.
- The extension makes **no network requests**. All audio processing runs locally inside your browser using the Web Audio API.
- No analytics, no cookies, no third-party services, no accounts.
- Settings are not persisted; they live only in the current tab and are discarded when the tab is reloaded.

### Why the extension asks for permissions

| Permission | Reason |
|---|---|
| `activeTab` | To send your slider settings to the tab you are currently viewing when you open the popup. |
| `scripting` | To inject the audio-processing script into the current tab on demand if it is not already loaded. |
| Host permission `<all_urls>` | Video and audio can be played on any website, so the site list cannot be restricted in advance. The script only attaches to `<video>` / `<audio>` elements that are playing; it does not read, modify, or send page content. |

### Contact

Open an issue at https://github.com/TTMK7777/pitch-shifter/issues

---

## 日本語

**Pitch Shifter はいかなるデータも収集しません。**

- 個人情報・閲覧履歴・ページ内容・音声のいずれも、収集・保存・送信しません。
- 本拡張は**ネットワーク通信を一切行いません**。音声処理はすべてブラウザ内の Web Audio API で完結します。
- 解析ツール・Cookie・第三者サービス・アカウント登録はありません。
- 設定は永続化されず、現在のタブ内にのみ保持され、タブの再読み込みで破棄されます。

### 権限を要求する理由

| 権限 | 理由 |
|---|---|
| `activeTab` | ポップアップで操作した設定値を、いま表示しているタブへ送るため。 |
| `scripting` | 音声処理スクリプトが未読込のタブへ、操作時に注入するため。 |
| ホスト権限 `<all_urls>` | 動画・音声はあらゆるサイトで再生されうるため、対象サイトを事前に限定できません。スクリプトは再生中の `<video>` / `<audio>` 要素にのみ接続し、ページ内容の読み取り・改変・送信は行いません。 |

### 連絡先

https://github.com/TTMK7777/pitch-shifter/issues
