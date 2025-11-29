# Trolley DE Search - Frontend

ワッカソン2025 チームI「トロッコDEサーチ」のフロントエンドアプリケーション

## 機能概要

本アプリケーションは2つの主要機能を提供します:

1. **トーナメントゲーム**: トロッコアドベンチャー風のレストラン選択ゲーム
2. **レストラン検索・管理**: AWS Lambda経由の飲食店検索システム

## 🔄 環境とAPI接続

### API構成

- **Lambda API (AWS)**: レストラン検索・エリア情報・フォーム連携
  - エンドポイント: `https://1tebott34m.execute-api.ap-northeast-1.amazonaws.com/prod/search`
  - 用途: ManagePage（飲食店検索システム）
  
- **モックサーバー (ローカル)**: トーナメントゲーム用
  - エンドポイント: `http://localhost:3001/api`
  - 用途: TrolleyGame（トーナメント機能）

### API接続の仕組み

`src/services/api.ts`が両方のAPIを統合管理:

```typescript
// Lambda API用メソッド
apiService.getLargeAreas()        // エリア取得
apiService.searchRestaurants()    // レストラン検索
apiService.fetchFormResponses()   // フォーム回答取得

// モックサーバー用メソッド
apiService.getOptions()           // トーナメント選択肢取得
apiService.saveResult()           // トーナメント結果保存
```

### 開発環境のセットアップ

1. **モックサーバーの起動** (トーナメントゲーム用)
   ```bash
   cd ../mock
   npm start
   ```

2. **開発サーバーの起動**
   ```bash
   npm run dev
   ```
   - ローカル: `http://localhost:5173/`
   - LAN経由: `http://172.20.10.4:5173/`

### 本番環境

本番環境ではLambda APIに直接接続します。

1. **環境変数ファイルの確認**
   ```bash
   # .env.production
   VITE_API_BASE_URL=https://1tebott34m.execute-api.ap-northeast-1.amazonaws.com/prod/search
   ```

2. **本番ビルド**
   ```bash
   npm run build
   ```

3. **デプロイ**
   - AWS S3 + CloudFront
   - または任意の静的ホスティングサービス

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

## 🎮 機能詳細

### 1. トーナメントゲーム (TrolleyGame)

8つのレストランがトーナメント形式で対戦:

1. **1回戦**: 8店舗 → 4試合 → 勝者4店舗、敗者4店舗
2. **準決勝**: 勝者4店舗 → 2試合 → 勝者2店舗、敗者2店舗
3. **3位決定戦**: 準決勝敗者2店舗 → 1試合 → 3位・4位決定
4. **決勝**: 準決勝勝者2店舗 → 1試合 → 1位・2位決定

**結果**: 1位〜4位 + 同率5位(1回戦敗者4店舗)

合計7試合でランキングを決定します。

### 2. レストラン検索・管理 (ManagePage)

AWS Lambda経由で以下の機能を提供:

- **エリア階層選択**: 都道府県 → 市区町村 → 詳細エリア
- **検索条件**: 予算、参加人数、開催日
- **Google Forms連携**: スプレッドシートから出欠情報を取得
- **検索結果**: 店舗情報、写真、アクセス、設備などを表示

## 📁 プロジェクト構成

```
develop/
├── src/
│   ├── components/       # Reactコンポーネント
│   │   ├── home/         # ホーム画面
│   │   │   └── Home.tsx          # 初期画面・スタート画面
│   │   ├── game/         # トーナメントゲーム
│   │   │   ├── TrolleyGame.tsx   # メインゲーム画面
│   │   │   └── Countdown.tsx     # カウントダウン
│   │   ├── result/       # 結果表示
│   │   │   └── ResultPage.tsx    # トーナメント結果表示
│   │   └── search/       # レストラン検索・管理
│   │       └── ManagePage.tsx    # 飲食店検索システム
│   ├── services/         # APIクライアント
│   │   └── api.ts        # 統合API通信サービス
│   ├── styles/           # スタイルシート
│   │   ├── index.css     # 共通スタイル + ManagePage用
│   │   └── TrolleyGame.css
│   ├── App.tsx           # ルートコンポーネント（ルーティング設定）
│   └── main.tsx          # エントリーポイント
├── public/               # 公開ディレクトリ
│   └── images/           # 画像ファイル
├── .env.production       # 本番環境変数
└── index.html            # HTMLテンプレート
```

## 🔌 API連携

### Lambda API (ManagePage用)

#### エリア情報取得
```typescript
// 大エリア(都道府県)
POST /search
Body: { action: 'get_areas', area_type: 'large' }

// 中エリア(市区町村)
POST /search
Body: { action: 'get_areas', area_type: 'middle', parent_code: string }

// 小エリア(詳細エリア)
POST /search
Body: { action: 'get_areas', area_type: 'small', parent_code: string }
```

#### Google Forms連携
```typescript
POST /search
Body: { action: 'fetch_form_responses', spreadsheet_url: string }
Response: { total, attendance_yes, attendance_no }
```

#### レストラン検索
```typescript
POST /search
Body: {
  action: 'search',
  large_area?: string,
  middle_area?: string,
  small_area?: string,
  budget: string,
  party_capacity: number,
  event_date?: string,
  target_count: number
}
Response: { shops: Restaurant[], searched_count, saved_to_dynamodb }
```

### モックサーバー API (TrolleyGame用)

#### レストラン選択肢の取得
```typescript
POST /api/options
Response: { success: boolean, options: Restaurant[] }
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
Response: { success: boolean, result: SavedResult }
```

### 型定義

```typescript
// 統合Restaurant型（Lambda + モックサーバー両対応）
interface Restaurant {
  id: string;
  shop_id?: string;           // モックサーバー用
  name: string;
  address: string;
  genre: string;
  catch?: string;
  budget?: string | number;   // Lambda: string, モック: number
  party_capacity?: string;    // Lambda用
  url?: string;
  photo_url?: string;         // Lambda用
  logo_image?: string;        // Lambda用
  station_name?: string;      // Lambda用
  access?: string;            // Lambda用
  private_room?: string | boolean;
  free_drink?: string | boolean;
  card?: string | boolean;
  course?: string | boolean;
  walk?: number;              // モックサーバー用
  seats?: number;             // モックサーバー用
  selection_reason?: string;  // モックサーバー用
}

// エリア情報（Lambda用）
interface Area {
  code: string;
  name: string;
}

// フォーム回答（Lambda用）
interface FormResponse {
  total: number;
  attendance_yes: number;
  attendance_no: number;
}

// 検索結果（Lambda用）
interface SearchResult {
  message: string;
  deleted_count: number;
  searched_count: number;
  saved_to_dynamodb: number;
  shops: Restaurant[];
}

// トーナメント試合（モックサーバー用）
interface TournamentMatch {
  round: '1回戦' | '準決勝' | '3位決定戦' | '決勝';
  matchNumber: number;
  options: [Restaurant, Restaurant];
  winner: Restaurant;
  loser: Restaurant;
  answeredAt: string;
}

// トーナメント結果（モックサーバー用）
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

### API構成の理解

- **Lambda API**: ManagePage専用、AWS環境に直接接続
- **モックサーバー**: TrolleyGame専用、ローカル開発用
- **api.ts**: 両方のAPIを統合管理する単一サービスクラス

### 型の互換性

`Restaurant`型は両API対応のため、一部プロパティがオプショナルまたはユニオン型:
```typescript
budget?: string | number;      // Lambda: string, モック: number
private_room?: string | boolean; // Lambda: string, モック: boolean
```

### スタイルの管理

- `index.css`: 共通スタイル + ManagePage専用スタイル
- `TrolleyGame.css`: トーナメントゲーム専用スタイル

### 環境変数

- `.env.production`: Lambda API URLを定義
- 開発環境ではハードコードされたURL使用（モックサーバー）

## 🐛 トラブルシューティング

### トーナメントゲームで「選択肢の読み込みに失敗しました」

1. モックサーバーが起動しているか確認
   ```bash
   cd ../mock
   npm start
   ```
2. `http://localhost:3001/api/options`にアクセスできるか確認

### ManagePageでエリア情報が取得できない

1. Lambda APIのURLが正しいか確認（`.env.production`）
2. ブラウザのコンソールでエラーログを確認
3. ネットワーク接続を確認

### Google Formsの回答取得で401エラー

スプレッドシートの共有設定を確認:
1. スプレッドシート右上の「共有」をクリック
2. 「リンクを知っている全員」を選択
3. 権限を「閲覧者」に設定

### ビルドエラー

```bash
# node_modulesをクリーンインストール
rm -rf node_modules package-lock.json
npm install
```

## 📄 ライセンス

ワッカソン2025 チームI
