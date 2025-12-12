# Trolley DE Search - Mock Server

ワッカソン2025 チームI「トロッコDEサーチ」のモックサーバー

トーナメント形式のレストラン選択ゲームの結果を保存・管理するモックサーバー

## セットアップ

```bash
cd mock
npm install
```

## 起動

```bash
npm start
```

サーバーは以下で起動します:
- **ローカル**: `http://localhost:3001`
- **LAN経由**: `http://172.20.10.4:3001` (同一ネットワーク内の別端末からアクセス可能)

## API エンドポイント

### ヘルスチェック
```
GET /health
```

### search API - エリア取得
```
POST /search
Content-Type: application/json

Request Body:
{
  "action": "get_areas",
  "area_type": "large" | "middle" | "small",
  "parent_code": "STRING" // area_type が middle または small の場合
}

Response:
Lambda互換形式のレスポンス（response/areas_*.json）
```

### search API - Google Forms連携
```
POST /search
Content-Type: application/json

Request Body:
{
  "action": "fetch_form_responses",
  "spreadsheet_url": "STRING"
}

Response:
Lambda互換形式のレスポンス（response/search.json）
```

### select-restaurants API - AI選定
```
POST /select-restaurants
Content-Type: application/json

Request Body:
{
  "large_area": "STRING",
  "middle_area": "STRING",
  "small_area": "STRING",
  "budget": "STRING",
  "party_capacity": INTEGER,
  "event_date": "STRING",
  "target_count": INTEGER
}

Response:
{
  "status": "success",
  "result_id": "STRING",
  "selected_shops": [
    {
      "shop_id": "shop002",
      "name": "イタリアンバール ロッソ",
      "address": "東京都中央区八重洲1-2-3",
      "genre": "イタリアン",
      "budget_average": "5000",
      "url": "https://www.hotpepper.jp/shop002",
      "photo_url": "https://example.com/photo.jpg",
      "private_room": "あり",
      "free_drink": "あり",
      "recommended_people": [
        {"name": "山田太郎", "comment": "美味しいです！"},
        {"name": "佐藤花子", "comment": "おすすめです"},
        {"name": "田中次郎", "comment": "また行きたい"}
      ]
    }
    // ... 全8店舗
  ],
  "processing_time": 0.123,
  "total_candidates": 50,
  "selected_count": 8,
  "participant_count": 10
}
```

### restaurant-info API（レストラン詳細情報）
注意: このAPIは常にLambda APIに接続されます（モックサーバーでは提供されません）
```
POST https://hn9e5kup8i.execute-api.ap-northeast-1.amazonaws.com/prod/restaurant-info

Response:
{
  "status": "success",
  "result_id": "STRING",
  "restaurant_count": INTEGER,
  "restaurants": [
    {
      "shop_id": "STRING",
      "url": "STRING",
      "access": "STRING",
      "allergy_warnings": [...]
    }
  ]
}
```

### 未実装の機能
以下のエンドポイントは現在実装されていません:
- `GET /api/results` - 全結果の取得
- `GET /api/results/:id` - 特定の結果の取得
```

## データ形式

### レストランオブジェクト
```json
{
  "shop_id": "STRING",              // 店舗を一意に識別するID
  "name": "STRING",                 // 店舗名
  "address": "STRING",              // 住所
  "genre": "STRING",                // ジャンル（例：和食、洋食など）
  "budget": "INTEGER",              // 平均予算
  "url": "STRING",                  // 店舗ページURL
  "walk": "INTEGER",                // 駅からの徒歩時間（分）
  "private_room": "BOOLEAN",        // 個室の有無
  "course": "BOOLEAN",              // コース料理の有無
  "free_drink": "BOOLEAN",          // 飲み放題の有無
  "card": "BOOLEAN",                // クレジットカード利用可否
  "seats": "INTEGER",               // 座席数
  "catch": "STRING",                // キャッチコピー等の短文
  "selection_reason": "STRING"      // 選定理由の詳細コメント
}

```

### トーナメント試合オブジェクト
```json
{
  "round": "1回戦",
  "matchNumber": 1,
  "options": [/* レストランオブジェクト2つ */],
  "winner": {/* レストランオブジェクト */},
  "loser": {/* レストランオブジェクト */},
  "answeredAt": "2025-11-27T10:00:00.000Z"
}
```

### トーナメント順位
```json
{
  "first": {/* 1位のレストラン */},
  "second": {/* 2位のレストラン */},
  "third": {/* 3位のレストラン */},
  "fourth": {/* 4位のレストラン */},
  "fifth": [/* 同率5位の4店舗 */]
}
```

## トーナメント形式

- **1回戦**: 8店舗 → 4試合 → 勝者4店舗、敗者4店舗
- **準決勝**: 勝者4店舗 → 2試合 → 勝者2店舗、敗者2店舗
- **3位決定戦**: 準決勝敗者2店舗 → 1試合 → 3位・4位決定
- **決勝**: 準決勝勝者2店舗 → 1試合 → 1位・2位決定
- **結果**: 1位〜4位 + 同率5位(1回戦敗者4店舗)

合計7試合で順位決定

## ファイル構成

- `server.js` - Express サーバー本体
- `response/` - モックレスポンスデータディレクトリ
  - `areas_large.json` - 大エリア（都道府県）データ
  - `areas_middle.json` - 中エリア（広域エリア）データ
  - `areas_small.json` - 小エリア（詳細エリア）データ
  - `search.json` - search APIレスポンス（フォーム連携用）
  - `select_restaurants.json` - select-restaurants APIレスポンス（AI選定8店舗）
- `results.json` - 結果保存ファイル（現在未使用）
- `package.json` - Node.js パッケージ設定

## 技術スタック

- **Node.js** - ランタイム
- **Express** - Webフレームワーク
- **CORS** - クロスオリジン対応
- **ポート**: 3001
- **ホスト**: 0.0.0.0 (LAN経由アクセス対応)
