import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'results.json');
const OPTIONS_FILE = path.join(__dirname, 'options.json');

// ミドルウェア
app.use(cors());
app.use(express.json());

// データファイルの初期化
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ results: [] }, null, 2));
  }
}

// 選択肢ファイルの初期化
async function initOptionsFile() {
  try {
    await fs.access(OPTIONS_FILE);
  } catch {
    const defaultOptions = {
      options: [
        '犬派',
        '猫派',
        '朝型',
        '夜型',
        '海派',
        '山派',
        '暑い夏',
        '寒い冬',
      ]
    };
    await fs.writeFile(OPTIONS_FILE, JSON.stringify(defaultOptions, null, 2));
  }
}

// 結果データの読み込み
async function readResults() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { results: [] };
  }
}

// 結果データの書き込み
async function writeResults(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// 選択肢データの読み込み
async function readOptions() {
  try {
    const data = await fs.readFile(OPTIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { options: [] };
  }
}

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 選択肢の取得（POST）
app.post('/api/options', async (req, res) => {
  try {
    const data = await readOptions();
    res.json({ success: true, options: data.options });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get options', message: error.message });
  }
});

// 全結果の取得
app.get('/api/results', async (req, res) => {
  try {
    const data = await readResults();
    res.json(data.results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read results', message: error.message });
  }
});

// 結果の保存
app.post('/api/results', async (req, res) => {
  try {
    const { userId, answers, completedAt } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid request: answers array is required' });
    }

    const data = await readResults();
    
    const newResult = {
      id: Date.now().toString(),
      userId: userId || `user_${Date.now()}`,
      answers,
      completedAt: completedAt || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    data.results.push(newResult);
    await writeResults(data);

    res.status(201).json({
      success: true,
      result: newResult
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save result', message: error.message });
  }
});

// 特定の結果の取得
app.get('/api/results/:id', async (req, res) => {
  try {
    const data = await readResults();
    const result = data.results.find(r => r.id === req.params.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read result', message: error.message });
  }
});

// 統計情報の取得
app.get('/api/stats', async (req, res) => {
  try {
    const data = await readResults();
    const results = data.results;

    const stats = {
      totalGames: results.length,
      totalUsers: new Set(results.map(r => r.userId)).size,
      answerStats: {}
    };

    // 各質問の回答統計を計算
    results.forEach(result => {
      result.answers.forEach((answer, questionIndex) => {
        if (!stats.answerStats[questionIndex]) {
          stats.answerStats[questionIndex] = {
            questionId: questionIndex + 1,
            option0Count: 0,
            option1Count: 0
          };
        }
        
        if (answer.selectedOption === 0) {
          stats.answerStats[questionIndex].option0Count++;
        } else if (answer.selectedOption === 1) {
          stats.answerStats[questionIndex].option1Count++;
        }
      });
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate stats', message: error.message });
  }
});

// データのリセット（開発用）
app.delete('/api/results', async (req, res) => {
  try {
    await writeResults({ results: [] });
    res.json({ success: true, message: 'All results deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete results', message: error.message });
  }
});

// サーバー起動
async function startServer() {
  await initDataFile();
  await initOptionsFile();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚂 Trolley Mock Server is running on http://localhost:${PORT}`);
    console.log(`🌐 LAN access: http://172.20.10.4:${PORT}`);
    console.log(`📊 API Endpoints:`);
    console.log(`   GET    /health - Health check`);
    console.log(`   POST   /api/options - Get tournament options`);
    console.log(`   GET    /api/results - Get all results`);
    console.log(`   POST   /api/results - Save a new result`);
    console.log(`   GET    /api/results/:id - Get a specific result`);
    console.log(`   GET    /api/stats - Get statistics`);
    console.log(`   DELETE /api/results - Delete all results (dev only)`);
  });
}

startServer().catch(console.error);
