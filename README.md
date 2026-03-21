# auto-image-layout

ブラウザ内だけで複数画像を自動連結し、1枚の画像として書き出せるWebツールです。  
画像データはサーバーに送らず、Canvas を使ってローカルで処理します。

## 主な機能

- 複数画像アップロード
- ドラッグ&ドロップでの追加
- 画像一覧プレビュー
- 横並び/縦並びの切り替え
- 画像順の並び替え
  - ドラッグ&ドロップ
  - ↑ ↓ ボタン
- 自動サイズ調整
  - 横並び時の高さ揃え
  - 縦並び時の幅揃え
- 画像間 spacing の px 指定
- 背景色指定
  - カラーピッカー
  - テキスト入力
- 書き出し形式
  - PNG
  - JPEG
  - WebP
- 連結結果の即時プレビュー
- ダウンロード
- 各画像の削除
- 全画像クリア
- モバイルで最低限使えるレスポンシブ UI

## 技術構成

- Vite
- React
- TypeScript
- Canvas API
- Vitest

依存は最小限にし、バックエンド・認証・DB は入れていません。

## ローカル起動

### 1. 依存インストール

```bash
npm install
```

### 2. 開発サーバー起動

```bash
npm run dev
```

Vite の表示するローカル URL をブラウザで開いてください。

## スクリプト

```bash
npm run dev
npm run build
npm run build:pages
npm run preview
npm run lint
npm run test
```

## 使い方

1. 画像をドラッグ&ドロップ、またはファイル選択で複数追加します
2. 左パネルで並び方向、サイズ揃え、spacing、背景色、書き出し形式を設定します
3. 必要に応じて一覧内で順序変更や削除を行います
4. 右パネルのプレビューを確認してダウンロードします

## 実装メモ

- プレビューは設定変更ごとに自動更新されます
- JPEG/WebP では背景色が透過部分の埋め色として使われます
- 非常に大きい出力サイズはブラウザの Canvas 制限を超えるため、プレビューと書き出しを抑止します

## 基本検証

以下を実行して確認しています。

```bash
npm run lint
npm run test
npm run build
```

## GitHub Pages で公開

このリポジトリは GitHub Pages で公開できます。  
公開URLは `https://zonu-dev.github.io/auto-image-layout/` です。

### 初回設定

1. GitHub の `Settings` → `Pages` を開く
2. `Build and deployment` の `Source` を `GitHub Actions` にする
3. `main` ブランチへ push する

`main` への push ごとに [deploy-pages.yml](/Users/s01080/src/gh-me/zonu-dev/auto-image-layout/.github/workflows/deploy-pages.yml) が実行され、`dist/` が GitHub Pages に公開されます。

### ローカルで Pages 用ビルドを確認

```bash
npm run build:pages
```

GitHub Pages 用に `/auto-image-layout/` をベースパスとしてビルドします。
