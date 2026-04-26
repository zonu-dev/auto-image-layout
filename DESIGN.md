---
version: alpha
name: Auto Image Layout
description: Design system for the browser-only image layout tool in the ZOOCHI app family.
colors:
  primary: "#fb923c"
  secondary: "#38bdf8"
  tertiary: "#34d399"
  neutral: "#f4f7f9"
  background: "#f4f7f9"
  background-dot: "#94a3b8"
  surface: "#ffffff"
  surface-soft: "#f8fafc"
  surface-dark: "#1e293b"
  text: "#1e293b"
  text-strong: "#0f172a"
  muted: "#64748b"
  muted-light: "#94a3b8"
  line: "#cbd5e1"
  line-hover: "#475569"
  on-dark: "#ffffff"
  accent: "#fb923c"
  accent-deep: "#ea580c"
  accent-soft: "#fff7ed"
  accent-soft-border: "#fed7aa"
  accent-ink: "#ea580c"
  amber: "#fbbf24"
  marshmallow-pink: "#ff80a1"
  danger: "#dc2626"
typography:
  display-lg:
    fontFamily: Zen Maru Gothic
    fontSize: 42px
    fontWeight: 900
    lineHeight: "1.08"
    letterSpacing: "-0.05em"
  headline-md:
    fontFamily: Zen Maru Gothic
    fontSize: 24px
    fontWeight: 900
    lineHeight: "1.15"
    letterSpacing: "-0.03em"
  title-md:
    fontFamily: Zen Maru Gothic
    fontSize: 18px
    fontWeight: 900
    lineHeight: "1.25"
  body-md:
    fontFamily: Zen Maru Gothic
    fontSize: 16px
    fontWeight: 700
    lineHeight: "1.7"
  body-sm:
    fontFamily: Zen Maru Gothic
    fontSize: 14px
    fontWeight: 700
    lineHeight: "1.55"
  label-md:
    fontFamily: Zen Maru Gothic
    fontSize: 14px
    fontWeight: 900
    lineHeight: "1"
    letterSpacing: "0.02em"
  caption:
    fontFamily: Zen Maru Gothic
    fontSize: 12px
    fontWeight: 700
    lineHeight: "1.45"
rounded:
  xs: 6px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 40px
  full: 999px
spacing:
  micro: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  section: 40px
  shell-max: 1180px
components:
  page-body:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
  header-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.sm}"
  app-badge:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
  settings-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  dropzone:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  dropzone-hover:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
  preview-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  preview-empty:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.muted}"
    rounded: "{rounded.lg}"
  primary-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  primary-button-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-strong}"
  secondary-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.line-hover}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.md}"
  language-switcher:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  language-current:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.full}"
  contact-modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xxl}"
  contact-link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
---

# Auto Image Layout Design System

## Overview

Auto Image Layout は、複数画像を横並び・縦並びで1枚に連結するブラウザ完結ツールである。画面は ZOOCHI 系のライトテーマを前提にし、丸い面、太い文字、短い段差影、オレンジのアクセントで「使いやすい道具」らしく見せる。

主役はアップロード、並び順、設定、プレビュー、保存の流れである。装飾より作業効率を優先し、アップロード後に次の操作がすぐ分かる情報密度にする。

## Colors

ベースは `background`, `surface`, `surface-soft`, `text`, `muted`, `line` のニュートラルで組む。製品差分は Auto のオレンジ系 `accent` セットで表現する。

`accent` はアップロード、選択中の設定、保存ボタン hover、フォーカス補助に限定して使う。大きな面を常時オレンジにしすぎない。通常のボタンやコントロールは白地を保ち、hover や active でテーマ色へ反転させる。

## Typography

フォントは現行実装に合わせて `Zen Maru Gothic` を使う。見出しは `900`、本文とラベルは `700` 以上を基準にする。

見出し、設定ラベル、ボタン文言は短くする。UI テキストは `src/i18n.ts` の全ロケールで管理し、公開 UI にリポジトリ名や実装都合を出さない。

## Layout

デスクトップでは設定列とプレビュー列を横並びにする。設定列は細め、プレビュー列は広めにし、アップロードと画像一覧の操作を近くに置く。

モバイルでは1カラムにするが、単純に長く積み上げない。詳細設定、画像一覧、空状態は必要最小限の高さに抑える。開発用の `?view=mobile` は補助であり、実際の narrow viewport と CSS media query を真実のソースにする。

## Elevation & Depth

奥行きは短い段差影で出す。カードや主要パネルは `0 6px 0 var(--shadow)`、押せる UI は `0 4px 0 var(--button-shadow)` を基準にする。

押下時は `translateY(4px)` で沈ませ、影を消す。大きなぼかし影や長い浮遊アニメーションは使わない。プレビュー画像そのものには余計な角丸や重い装飾を足さず、仕上がりを正確に見せる。

## Shapes

形は丸く、境界線は 2px から 3px を基本にする。ツール全体のパネルは `xl` 以上、ドロップゾーンと補助面は `lg`、ボタンと入力周りは `md`、ピルと丸アイコンは `full` を使う。

画像プレビューの内容自体は出力の正確さを優先し、UI 側の角丸とは分けて扱う。

## Components

### Header

ヘッダーは ZOOCHI ロゴ、アプリアイコン、アプリ名、1行概要に絞る。機能説明やタグを増やしすぎない。

### Upload & Image List

ドロップゾーンはアップロード導線として明確に見せるが、ページ全体の主張を奪わない。非対応ファイルは見落としにくい popup や状態表示で明示する。

画像一覧は順序変更が重要な機能である。ドラッグハンドル、上下移動、削除の状態が重ならないようにし、横スクロールやドラッグ中の見た目を実画面で確認する。

### Settings

設定変更は即時プレビューに反映する。label と control のバランスを崩さず、数値入力、segmented control、toggle、color picker を用途ごとに使い分ける。

text input に button 用の段差影や押下演出を当てない。入力欄と命令ボタンの見た目を区別する。

### Preview & Export

空状態では高さを抑え、画像追加後は十分なプレビュー領域を確保する。出力サイズがブラウザの Canvas 制限を超える場合は保存を抑止し、短い警告で伝える。

保存ボタンは主要アクションだが、通常時は白基調を保ち、hover で Auto のオレンジへ切り替える。

### Contact

問い合わせ導線は本文より目立たせすぎない。モーダル内にはメールと Marshmallow を基本セットとして置き、version は補助情報として小さく扱う。

## Do's and Don'ts

- Do: `src/index.css` の CSS 変数を共有トークンとして扱う
- Do: デザイン値を変えたら `DESIGN.md` も更新する
- Do: 公開 URL は `/apps/auto-image-layout/` を基準に揃える
- Do: asset は `import.meta.env.BASE_URL` または `%BASE_URL%` ベースにする
- Do: `en`, `ja`, `ko`, `zh-Hans`, `vi`, `id` の文言を揃える
- Don't: バックエンド、認証、DB を追加する
- Don't: 出力画像そのものに UI 用の角丸や影を足す
- Don't: 開発用 mobile preview を本番レイアウト判定の唯一の根拠にする
