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

### レストラン選択肢の取得
```
POST /api/options
Content-Type: application/json

Response:
{
  "success": true,
  "options": [
    {
      "shop_id": "shop002",
      "name": "イタリアンバール ロッソ",
      "address": "東京都中央区八重洲1-2-3",
      "genre": "イタリアン",
      "budget": 5000,
      "url": "https://www.hotpepper.jp/shop002",
      "walk": 5,
      "private_room": true,
      "course": true,
      "free_drink": true,
      "card": true,
      "seats": 40,
      "catch": "本格イタリアン×カジュアル空間",
      "selection_reason": "Tier1: 好みのジャンル・コース有・駅近5分。Tier2: 個室・カード・飲み放題完備で10名に最適。"
    },
    // ... 全8店舗
  ]
}
```

### トーナメント結果の保存（未確定につき要修正）
```
POST /api/results
Content-Type: application/json

Request Body:
{
  "userId": "user123",
  "tournament": {
    "initialOptions": [/* 8つのレストランオブジェクト */],
    "matches": [
      {
        "round": "1回戦",
        "matchNumber": 1,
        "options": [/* レストランオブジェクト2つ */],
        "winner": {/* レストランオブジェクト */},
        "loser": {/* レストランオブジェクト */},
        "answeredAt": "2025-11-27T10:00:00.000Z"
      },
      // ... 全7試合
    ],
    "finalRanking": {
      "first": {/* レストランオブジェクト */},
      "second": {/* レストランオブジェクト */},
      "third": {/* レストランオブジェクト */},
      "fourth": {/* レストランオブジェクト */},
      "fifth": [/* レストランオブジェクト4つ */]
    }
  },
  "completedAt": "2025-11-27T10:00:30.000Z"
}
```

### 全結果の取得
```
GET /api/results
```

### 特定の結果の取得
```
GET /api/results/:id
```

### 統計情報の取得
```
GET /api/stats
```

### 全結果の削除（開発用）
```
DELETE /api/results
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
- `options.json` - レストラン選択肢データ(8店舗)
- `results.json` - トーナメント結果の保存ファイル(自動生成)
- `package.json` - Node.js パッケージ設定
- `.gitignore` - Git除外設定

## 技術スタック

- **Node.js** - ランタイム
- **Express** - Webフレームワーク
- **CORS** - クロスオリジン対応
- **ポート**: 3001
- **ホスト**: 0.0.0.0 (LAN経由アクセス対応)
