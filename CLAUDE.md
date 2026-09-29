# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code 向けのガイドです。

## プロジェクト概要

レシート読み込み家計簿Webアプリ（kakeibo-app）。レシート画像をアップロードすると Claude API で商品名・金額・日付を読み取り、カテゴリ別・月別に集計してグラフ表示する。

- フロントエンド: React + Vite（`src/`）、グラフは Chart.js（react-chartjs-2）
- バックエンド: Node.js + Express（`server/`）。Claude API はここからのみ呼ぶ
- Claude API: `@anthropic-ai/sdk`、モデルは `claude-haiku-4-5`（Haiku の最新版）。構造化出力（zod）で JSON を受け取る
- データ保存先: ブラウザのローカルストレージ（`src/storage.js`、キー `kakeibo.receipts.v1`）
- カテゴリ一覧: `shared/categories.js`（フロント・バック共通）。グラフの色はこの並び順で固定（`src/colors.js`）

### 構成上の注意

- APIキー（`ANTHROPIC_API_KEY`）は `.env` でのみ管理する。ブラウザ側のコードに APIキーや Claude API 呼び出しを置かない。
- 画像はサーバーのメモリ上で扱い、保存しない。受け付ける形式は JPEG / PNG / WebP / GIF、5MB まで。
- 商品合計と支払合計がずれる場合（外税など）は、サーバーで「消費税・調整」行を追加して合計を合わせている。

## 開発コマンド

- セットアップ: `npm install` → `.env.example` を `.env` にコピーして `ANTHROPIC_API_KEY` を設定
- 開発サーバー起動: `npm run dev`（フロント http://localhost:5173 、バックエンド http://localhost:3001 。`/api` は Vite がバックエンドへ転送）
- ビルド: `npm run build`（`dist/` に出力）
- 本番起動: `npm start`（Express がビルド済みの `dist/` も配信）
- テスト / Lint: 未導入。変更後は最低限 `npm run build` が通ることを確認する

## コーディング規約

- コメント・ドキュメント・コミットメッセージは日本語で書く。
- 金額は浮動小数点ではなく整数（円単位）で扱い、丸め誤差を避ける。
- 日付はタイムゾーンを意識して扱う（基本は日本時間 / Asia/Tokyo）。
- 既存コードの命名・書き方に合わせる。

## Git 運用ルール

**コードを変更したら、そのたびにコミットして GitHub にプッシュすること。**

1. 変更がひとまとまり完了したら、すぐにコミットする（複数の無関係な変更を1コミットにまとめない）。
2. コミット後は必ず `git push` で GitHub のリモート（`origin`）に反映する。
3. プッシュ前に、テストや Lint がある場合は実行して通ることを確認する。
4. コミットメッセージは日本語で、何をなぜ変更したかが分かるように書く。
   - 例: `支出一覧に月別フィルタを追加`
5. `main` ブランチへの強制プッシュ（`git push --force`）は禁止。
6. `.env` や認証情報など秘密情報はコミットしない（`.gitignore` に追加する）。
7. プッシュに失敗した場合（リモート未設定・認証エラー・競合など）は、勝手に解決せずユーザーに報告する。
