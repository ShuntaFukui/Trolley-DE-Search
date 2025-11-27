<<<<<<< HEAD
# Trolley DE Search - Mock Server

トロッコゲームの結果を保存・管理するモックサーバー

## セットアップ

```bash
cd mock
npm install
```

## 起動

```bash
npm start
```

開発モード（ファイル変更時に自動再起動）:
```bash
npm run dev
```

サーバーは `http://localhost:3001` で起動します。

## API エンドポイント

### ヘルスチェック
```
GET /health
```

### 選択肢の取得
```
POST /api/options
Content-Type: application/json

Response:
{
  "success": true,
  "options": ["犬派", "猫派", "朝型", "夜型", "海派", "山派", "暑い夏", "寒い冬"]
}
```

### 全結果の取得
```
GET /api/results
```

### 結果の保存
```
POST /api/results
Content-Type: application/json

{
  "userId": "user123",
  "answers": [
    {
      "questionId": 1,
      "options": ["犬派", "猫派"],
      "selectedOption": 0,
      "answeredAt": "2025-11-27T10:00:00.000Z"
    },
    {
      "questionId": 2,
      "options": ["朝型", "夜型"],
      "selectedOption": 1,
      "answeredAt": "2025-11-27T10:00:05.000Z"
    }
  ],
  "completedAt": "2025-11-27T10:00:10.000Z"
}
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

### 結果オブジェクト
```json
{
  "id": "1732694400000",
  "userId": "user123",
  "answers": [
    {
      "questionId": 1,
      "options": ["犬派", "猫派"],
      "selectedOption": 0,
      "answeredAt": "2025-11-27T10:00:00.000Z"
    }
  ],
  "completedAt": "2025-11-27T10:00:10.000Z",
  "createdAt": "2025-11-27T10:00:10.000Z"
}
```

### 統計情報
```json
{
  "totalGames": 10,
  "totalUsers": 5,
  "answerStats": {
    "0": {
      "questionId": 1,
      "option0Count": 6,
      "option1Count": 4
    }
  }
}
```

## ファイル構成

- `server.js` - Express サーバー本体
- `options.json` - トーナメントの選択肢データ（8個）
- `results.json` - 結果データの保存ファイル（自動生成）
- `package.json` - Node.js パッケージ設定
=======
# Trolley-DE-Search
ワッカソン2025 チームI「トロッコDEサーチ」
>>>>>>> 339f75a33f79402bf28ea66730ffebdd3e8fe65a
