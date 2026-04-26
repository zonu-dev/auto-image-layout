# AGENTS.md

プロジェクト固有ルール:

- 既存のコードパターンと規約に従う。
- クリーンで保守しやすいコードを書く。
- 完了前にセルフレビューする。
- 実行可能な範囲でテストを実行する。
- このアプリは React + TypeScript + Vite のフロントエンド専用ツールとして保つ。明示要求がない限り、バックエンド、認証、DB を追加しない。
- 表示文言を変更するときは `src/i18n.ts` の `en`, `ja`, `ko`, `zh-Hans`, `vi`, `id` を揃える。
- `AI_AGENT_WEB_GUIDELINES.md` の「UI テキストは日本語」は `ja` ロケールの文体ルールとして扱い、公開 UI の6ロケール対応は維持する。
- app-pages 配信では `/apps/auto-image-layout/` base path を前提にする。asset、canonical、OG、Twitter card、structured data、robots、sitemap の URL を同じ public path に揃える。
- 画像・ロゴ・flag などの asset 参照は `import.meta.env.BASE_URL` または `%BASE_URL%` ベースにする。
- `main` に入るユーザー向け変更は原則 patch version を上げる。UI、CSS、挙動、公開 asset、build 設定を変えたら、commit 前に `npm run release:patch` を実行する。
- version bump 漏れを確認するときは `npm run check:version-bump` を使う。この guard は `src/`, `public/`, `index.html`, Vite/TS config の変更に対して `package.json` の version 増加を要求する。
- 変更後は可能な範囲で `npm run lint`、`npm run test`、`npm run build` を実行する。app-pages への組み込み確認では `npm run build:app-pages` も使う。
- Codex App で実行されているセッションで UI、レイアウト、CSS、インタラクションを変更した場合は、ローカルサーバーを起動し、Codex App 内蔵ブラウザ（Browser Use）で動作確認やスクリーンショット撮影を行う。外部ブラウザや macOS `open` だけで確認を済ませない。

デザインと Web UI ガイダンス:

- ビジュアルデザイン、レイアウト、CSS、コンポーネント styling を変更するときは、先に `DESIGN.md` を読み、トークンとガイダンスに沿わせる。
- `src/index.css` や `src/App.css` の共有デザイン値を変更するときは、`DESIGN.md` も一緒に更新する。
- `./AI_AGENT_WEB_GUIDELINES.md` も読み、実装・検証・SEO の詳細ルールに従う。
- `AI_AGENT_WEB_GUIDELINES.md` と `DESIGN.md` が視覚方針で衝突する場合は、現行実装と `DESIGN.md` を優先する。
