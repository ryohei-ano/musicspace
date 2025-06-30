# Pocari Youth is Glitch

3D空間でメモリを共有するインタラクティブなWebアプリケーション

## 機能

- **3Dメモリシーン**: Three.jsを使用した3D空間でのメモリ表示
- **リアルタイム更新**: Supabaseを使用したリアルタイムメモリ共有
- **ターミナルインターフェース**: コマンドライン風のメモリ投稿機能
- **レスポンシブデザイン**: スマホ・タブレット・デスクトップ対応
- **認証システム**: パスワードベースの簡単な認証

## 技術スタック

- **Frontend**: Next.js 15, React 19, TypeScript
- **3D Graphics**: Three.js, React Three Fiber, React Three Drei
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

## 開発環境のセットアップ

1. リポジトリをクローン
```bash
git clone <repository-url>
cd pocari-youth-is-glitch
```

2. 依存関係をインストール
```bash
pnpm install
```

3. 環境変数を設定
`.env.local`ファイルを作成し、以下を設定：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. 開発サーバーを起動
```bash
pnpm dev
```

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)にアカウントを作成
2. GitHubリポジトリを接続
3. 環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. デプロイを実行

### 手動デプロイ

```bash
# ビルド
pnpm build

# 本番サーバー起動
pnpm start
```

## 使用方法

1. ログインページでパスワードを入力
2. 3D空間でメモリを閲覧
3. ターミナルボタンをクリックしてメモリを投稿
4. リアルタイムで他のユーザーのメモリが表示される

## 操作方法

### デスクトップ
- **ドラッグ**: 3D空間の回転
- **ホイール**: ズーム
- **右クリック + ドラッグ**: パン

### モバイル
- **タッチ**: 3D空間の回転
- **ピンチ**: ズーム
- **2本指ドラッグ**: パン

## ライセンス

MIT License
