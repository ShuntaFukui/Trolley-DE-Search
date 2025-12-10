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

- **エリア階層選択**: 都道府県 → 広域エリア → 詳細エリア
- **検索条件**: 
  - 予算（セレクトボックス）
  - 参加人数（数値入力、Google Form連携時の注意表示機能付き）
  - 開催日（任意）
  - 取得件数（スライダー: 5〜50件、「狭く」〜「広く」表示）
- **Google Forms連携**: スプレッドシートから出欠情報を取得
  - 参加人数自動設定機能
  - 変更時の警告表示（取得値と異なる場合、赤色で注意喚起）
- **検索結果**: 店舗情報、写真、アクセス、設備などを表示

### 3. 結果表示 (ResultPage)

トーナメント結果の表示機能:

- **ランキング表示**: 1位〜5位のレストラン情報
  - 1位: 金色(#FFD700)の特別デザイン
  - 2位: 銀色
  - 3位: 銅色
  - 4位・5位: グレー
- **店舗情報の表示**:
  - 店舗名
  - アクセス情報（タップで展開・折りたたみ可能）
  - 予約ボタン（外部リンク）

## 🔀 画面遷移フロー

```
Home (/)
  ↓ 「探しに行く」ボタン（ロゴ付きボタン）
ManagePage (/manage)
  ├─→ Home (「← ホームに戻る」ボタン)
  └─→ TrolleyGame (/game) (検索後「ゲーム開始」ボタン)
       └─→ ResultPage (/result)
            └─→ Home (「もう一度プレイ」ボタン)
```

- **Home**: 
  - 中央に大きなロゴ付き「探しに行く」ボタン
  - ManagePageへ遷移
- **ManagePage**: 
  - レストラン検索・AI選定後、ゲーム開始またはホームに戻る
  - フッターにゲーム開始ボタン表示（検索結果がある場合のみ有効）
- **TrolleyGame**: 
  - トーナメント完了後、結果ページへ自動遷移
  - アバターとトロッコアニメーション表示
- **ResultPage**: 
  - ランキング表示（1位は金色）
  - アクセス情報はタップで展開
  - ホームに戻るボタン

**注意**: `StartPage`と`ConfirmPage`は実装済みですが、現在ルーティングに登録されておらず使用されていません。

## 📁 プロジェクト構成

```
develop/
├── src/
│   ├── common/           # 共通モジュール
│   │   ├── App.tsx       # ルートコンポーネント(ルーティング設定)
│   │   ├── main.tsx      # エントリーポイント
│   │   └── config.ts     # 環境設定
│   ├── components/       # Reactコンポーネント
│   │   ├── common/       # 共通UI部品
│   │   │   ├── Header.tsx    # ヘッダーコンポーネント
│   │   │   └── Footer.tsx    # フッターコンポーネント
│   │   ├── home/         # ホーム画面
│   │   │   └── Home.tsx          # 初期画面・スタート画面
│   │   ├── search/       # レストラン検索・管理
│   │   │   └── ManagePage.tsx    # 飲食店検索システム
│   │   ├── game/         # トーナメントゲーム
│   │   │   ├── TrolleyGame.tsx   # メインゲーム画面
│   │   │   └── Countdown.tsx     # カウントダウン
│   │   ├── result/       # 結果表示
│   │   │   └── ResultPage.tsx    # トーナメント結果表示
│   │   ├── start/        # スタート画面(未使用)
│   │   │   └── StartPage.tsx     # トロッコゲーム開始画面
│   │   └── confirm/      # 確認画面(未使用)
│   │       └── ConfirmPage.tsx   # 検索結果確認画面
│   ├── services/         # APIクライアント
│   │   └── api.ts        # 統合API通信サービス
│   └── styles/           # スタイルシート
│       ├── index.css     # 共通スタイル + ManagePage用
│       └── TrolleyGame.css       # ゲーム専用スタイル
├── public/               # 公開ディレクトリ
│   └── images/           # 画像ファイル
│       ├── logo.png             # ロゴ画像
│       ├── avatar.png           # アバター画像
│       ├── BackGround.png       # ゲーム背景画像
│       └── trolley_1.png        # トロッコ画像
├── .env.development      # 開発環境変数(現在未使用)
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

// 中エリア(広域エリア)
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
- **TypeScript ~5.9.3** - 型安全な開発
- **Vite 7.2.2** - 高速ビルドツール
- **React Router DOM ^7.9.6** - クライアントサイドルーティング
- **React Compiler** - Babel Plugin (babel-plugin-react-compiler ^19.1.0-rc.3)
- **ESLint 9.39.1** - コード品質チェック

## 🎨 デザイン

- ネプリーグのトロッコアドベンチャーを模倣したUI
- レスポンシブデザイン対応（PC・タブレット・スマホ）
- アニメーション付きトーナメント進行

### UI/UX機能

- **ヘッダー**: 
  - 高さ80px、ロゴとタイトル表示
  - 全ページ共通デザイン
- **フッター**: 
  - ManagePageではゲーム開始ボタン表示（チーム名なし）
  - その他のページではチーム名「Team I "Neptune"」のみ表示
  - 高さ調整済み（適切なパディングとmin-height設定）
- **アバター機能（ゲーム画面のみ）**: 
  - ゲーム画面両端に表示
  - タップで吹き出し（コメント）表示
  - ボタンと同期したフェードイン/アウトアニメーション
- **背景アニメーション（ゲーム画面のみ）**: 
  - デュアルレイヤーシステム（現在背景と次背景）
  - 選択時の奥行き感のある遷移エフェクト
  - ゲーム画面の背景色: 黒(#000000)
- **レスポンシブ画像**: 
  - レストラン写真: アスペクト比4:3で統一
  - デバイスサイズに応じた自動調整

## 📝 開発時の注意事項

### コンポーネント構成

実際に使用されているコンポーネント:
- `Home.tsx` - ホーム画面（ロゴ付き「探しに行く」ボタン）
- `ManagePage.tsx` - レストラン検索・管理画面
- `TrolleyGame.tsx` - トーナメントゲーム画面
- `ResultPage.tsx` - 結果表示画面
- `Header.tsx` - 共通ヘッダー
- `Footer.tsx` - 共通フッター（ManagePage専用とその他用の2パターン）
- `Countdown.tsx` - カウントダウン表示

未使用コンポーネント（将来的な機能拡張用）:
- `StartPage.tsx` - トロッコゲーム開始画面
- `ConfirmPage.tsx` - 検索結果確認画面

### API構成の理解

- **Lambda API**: ManagePage専用、AWS環境に直接接続(エリア取得、検索、AI選定)
- **モックサーバー**: TrolleyGame専用、ローカル開発用(トーナメント選択肢・結果保存)
- **api.ts**: 両方のAPIを統合管理する単一サービスクラス
- 開発環境では自動フォールバック機能(localhost失敗時に172.20.10.4を試行)

### 型の互換性

`Restaurant`型は両API対応のため、一部プロパティがオプショナルまたはユニオン型:
```typescript
budget?: string | number;      // Lambda: string, モック: number
private_room?: string | boolean; // Lambda: string, モック: boolean
```

### スタイルの管理

**原則: インラインスタイルは使用せず、すべてCSSファイルで管理**

- **index.css**: 共通スタイル + ManagePage、StartPage、ConfirmPage用スタイル
  - ヘッダー: padding 20px、logo height 80px、title font-size 22px
  - フッター: ManagePage用(app-footer)とその他ページ用(footer-empty)の2種類
  - 共通レイアウト、ボタン、フォーム要素
  - ManagePage専用クラス: `.manage-page-container`, `.manage-page-content`, `.manage-slider-container`等
  - StartPage専用クラス: `.start-page-container`, `.start-page-content`
  - ConfirmPage専用クラス: `.confirm-page-container`, `.confirm-page-content`, `.confirm-restaurant-item`等
  
- **TrolleyGame.css**: トーナメントゲーム専用スタイル（約1400行）
  - ゲーム画面: 黒背景(#000000)
  - アバター: フェードイン/アウトアニメーション、吹き出し表示
  - 背景アニメーション: デュアルレイヤーシステム、左右選択時の遷移エフェクト
  - 結果画面: 
    - 1位: 金色(#FFD700)
    - 2位: 銀色(#c0c0c0)
    - 3位: 銅色(#cd7f32)
    - 4位・5位: グレー(#555555)
    - アクセス情報: タップで展開/折りたたみ機能
  - レスポンシブデザイン: 768px、480px、横向きモードのメディアクエリ

**例外**: 動的に変化するスタイル（条件分岐による色変更等）のみインラインスタイルを許可
```typescript
// ManagePage.tsx の参加人数警告表示
style={{
  color: formResponse && partyCapacity !== formResponse.attendance_yes ? '#ff6b6b' : formResponse ? '#ffffff' : '#0f3460',
  fontWeight: formResponse ? '600' : 'normal',
}}
```

### 環境変数

- `.env.production`: Lambda API URLを定義（本番環境で使用）
  ```bash
  VITE_API_BASE_URL=https://1tebott34m.execute-api.ap-northeast-1.amazonaws.com/prod/search
  ```
- `.env.development`: 現在未使用（コメントアウト）
- 開発環境のAPI接続:
  - Lambda API: `.env.production`の設定を使用
  - モックサーバー: `api.ts`内で直接URL管理
    - Primary: `http://localhost:3001/api`
    - Fallback: `http://172.20.10.4:3001/api`（自動フォールバック機能付き）

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
