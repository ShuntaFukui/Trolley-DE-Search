# Trolley DE Search - Frontend

ワッカソン2025 チームI「トロッコDEサーチ」のフロントエンドアプリケーション

トーナメント形式でレストランを選択するWebアプリケーション

## 🔄 環境切り替え手順

本アプリケーションは開発環境と本番環境で異なるAPIサーバーに接続します。

### 開発環境（モックサーバー使用）

開発環境ではローカルまたはLAN上のモックサーバーに接続します。

1. **環境変数ファイルの確認**
   ```bash
   # .env.development の内容
   VITE_API_BASE_URL=http://172.20.10.4:3001/api  # LAN経由
   # または
   VITE_API_BASE_URL=http://localhost:3001/api     # ローカルのみ
   VITE_USE_MOCK=true
   ```

2. **モックサーバーの起動**
   ```bash
   # 別のターミナルでモックサーバーを起動
   cd ../mock
   npm start
   ```
   モックサーバーは以下で起動します:
   - ローカル: `http://localhost:3001`
   - LAN経由: `http://172.20.10.4:3001`

3. **開発サーバーの起動**
   ```bash
   npm run dev
   ```
   アプリケーションは以下でアクセス可能:
   - ローカル: `http://localhost:5173/`
   - LAN経由: `http://172.20.10.4:5173/`

### 本番環境（AWS使用）

本番環境ではAWS API Gatewayに接続します。

1. **環境変数ファイルの編集**
   ```bash
   # .env.production の内容を実際のAPI Gatewayエンドポイントに設定
   VITE_API_BASE_URL=https://your-api-gateway.execute-api.ap-northeast-1.amazonaws.com/prod/api
   VITE_USE_MOCK=false
   ```

2. **本番ビルドの実行**
   ```bash
   npm run build
   ```
   ビルド成果物は `dist/` ディレクトリに生成されます。

3. **ビルド成果物のデプロイ**
   - AWS S3にアップロード
   - CloudFrontでCDN配信
   - または任意の静的ホスティングサービスにデプロイ

### 環境の確認方法

開発者ツールのConsoleで以下を確認:
```javascript
// 現在のAPI URL
console.log(import.meta.env.VITE_API_BASE_URL)

// モックモード
console.log(import.meta.env.VITE_USE_MOCK)
```

## 📦 セットアップ

### 必要環境
- Node.js 18.x 以上
- npm 9.x 以上

### インストール

```bash
npm install
```

## 🚀 開発

### 開発サーバー起動（ホットリロード有効）

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### プレビュー（ビルド後の確認）

```bash
npm run preview
```

## 🎮 ゲーム仕様

### トーナメント形式

8つのレストランがトーナメント形式で対戦:

1. **1回戦**: 8店舗 → 4試合 → 勝者4店舗、敗者4店舗
2. **準決勝**: 勝者4店舗 → 2試合 → 勝者2店舗、敗者2店舗
3. **3位決定戦**: 準決勝敗者2店舗 → 1試合 → 3位・4位決定
4. **決勝**: 準決勝勝者2店舗 → 1試合 → 1位・2位決定

**結果**: 1位〜4位 + 同率5位(1回戦敗者4店舗)

合計7試合でランキングを決定します。

### 表示情報

各レストランは以下の情報を表示:
- **name**: レストラン名
- **genre**: ジャンル（和食、イタリアン、焼肉など）
- **catch**: キャッチコピー

## 📁 プロジェクト構成

```
develop/
├── src/
│   ├── common/           # 共通コンポーネント
│   │   ├── App.tsx       # ルートコンポーネント
│   │   ├── main.tsx      # エントリーポイント
│   │   └── config.ts     # 環境設定
│   ├── components/       # Reactコンポーネント
│   │   ├── game/         # ゲーム関連
│   │   │   ├── TrolleyGame.tsx   # メインゲーム画面
│   │   │   └── Countdown.tsx     # カウントダウン
│   │   └── result/       # 結果関連
│   │       └── ResultPage.tsx    # 結果表示画面
│   ├── services/         # APIクライアント
│   │   └── api.ts        # API通信サービス
│   ├── styles/           # スタイルシート
│   │   ├── App.css
│   │   ├── TrolleyGame.css
│   │   └── index.css
│   └── assets/           # 静的アセット
├── public/               # 公開ディレクトリ
│   └── images/           # 画像ファイル
│       ├── BackGround.png
│       └── trolley_1.png
├── .env.development      # 開発環境変数
├── .env.production       # 本番環境変数
└── index.html            # HTMLテンプレート
```

## 🔌 API連携

### エンドポイント

#### レストラン選択肢の取得
```typescript
POST /api/options
Response: Restaurant[] (8店舗)
```

#### トーナメント結果の保存
```typescript
POST /api/results
Body: {
  tournament: {
    initialOptions: Restaurant[]
    matches: TournamentMatch[]
    finalRanking: TournamentResult
  }
  completedAt: string
}
```

### 型定義

```typescript
interface Restaurant {
  shop_id: string;
  name: string;
  address: string;
  genre: string;
  budget: number;
  url: string;
  walk: number;
  private_room: boolean;
  course: boolean;
  free_drink: boolean;
  card: boolean;
  seats: number;
  catch: string;
  selection_reason: string;
}

interface TournamentMatch {
  round: '1回戦' | '準決勝' | '3位決定戦' | '決勝';
  matchNumber: number;
  options: [Restaurant, Restaurant];
  winner: Restaurant;
  loser: Restaurant;
  answeredAt: string;
}

interface TournamentResult {
  first: Restaurant;
  second: Restaurant;
  third: Restaurant;
  fourth: Restaurant;
  fifth: Restaurant[];
}
```

## 🛠 技術スタック

- **React 19.2.0** - UIライブラリ
- **TypeScript 5.6.2** - 型安全な開発
- **Vite 7.2.2** - 高速ビルドツール
- **React Router DOM 7.1.1** - クライアントサイドルーティング
- **ESLint** - コード品質チェック

## 🎨 デザイン

- ネプリーグのトロッコアドベンチャーを模倣したUI
- レスポンシブデザイン対応（PC・タブレット・スマホ）
- アニメーション付きトーナメント進行

## 📝 開発時の注意事項

### LAN経由アクセス時

別端末からアクセスする場合:
1. 開発サーバーを `--host` オプション付きで起動（`npm run dev` で自動）
2. `.env.development` の `VITE_API_BASE_URL` をローカルIPアドレスに設定
3. モックサーバーも同様に `0.0.0.0` でリッスン設定済み

### 環境変数の変更時

環境変数を変更した場合は開発サーバーの再起動が必要:
```bash
# Ctrl+C で停止
npm run dev
```

## 🐛 トラブルシューティング

### 「選択肢の読み込みに失敗しました」が表示される

1. モックサーバーが起動しているか確認
2. `.env.development` のURLが正しいか確認
3. ネットワーク接続を確認（LAN経由の場合）

### ビルドエラー

```bash
# node_modulesをクリーンインストール
rm -rf node_modules package-lock.json
npm install
```

## 📄 ライセンス

ワッカソン2025 チームI
