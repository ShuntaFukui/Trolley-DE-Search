export interface Restaurant {
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

export interface Answer {
  questionId: number;
  options: string[];
  selectedOption: number;
  answeredAt: string;
}

export interface TournamentMatch {
  round: string; // '1回戦', '準決勝', '3位決定戦', '決勝'
  matchNumber: number;
  options: [Restaurant, Restaurant];
  winner: Restaurant;
  loser: Restaurant;
  answeredAt: string;
}

export interface TournamentResult {
  first: Restaurant;
  second: Restaurant;
  third: Restaurant;
  fourth: Restaurant;
  fifth: Restaurant[]; // 同率5位(4つ)
}

export interface GameResult {
  userId?: string;
  answers?: Answer[]; // 後方互換性のため残す
  tournament?: {
    initialOptions: Restaurant[];
    matches: TournamentMatch[];
    finalRanking: TournamentResult;
  };
  completedAt: string;
}

export interface SavedResult extends GameResult {
  id: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  result?: T;
  error?: string;
}

export interface Stats {
  totalGames: number;
  totalUsers: number;
  answerStats: {
    [key: string]: {
      questionId: number;
      option0Count: number;
      option1Count: number;
    };
  };
}

class ApiService {
  private baseUrls: string[];

  constructor() {
    const isDevelopment = import.meta.env.DEV;
    
    if (isDevelopment) {
      // 開発環境: フォールバック用に複数のベースURLを設定
      // localhostを優先し、失敗時にLAN IPにフォールバック
      this.baseUrls = [
        'http://localhost:3001/api',
        'http://172.20.10.4:3001/api',
      ];
    } else {
      // 本番環境: 環境変数から取得したURLのみ使用
      const prodUrl = import.meta.env.VITE_API_BASE_URL || '';
      this.baseUrls = [prodUrl];
    }
  }

  /**
   * フォールバック機能付きfetch
   * 最初のURLで失敗した場合、次のURLを試す
   */
  private async fetchWithFallback(
    endpoint: string,
    options?: RequestInit
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (const baseUrl of this.baseUrls) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          signal: AbortSignal.timeout(5000), // 5秒でタイムアウト
        });

        if (response.ok) {
          console.log(`✅ Connected to: ${baseUrl}`);
          return response;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to connect to ${baseUrl}:`, error);
        lastError = error as Error;
        // 次のURLを試す
        continue;
      }
    }

    // すべてのURLで失敗した場合
    throw new Error(
      `All API endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * ゲーム結果を保存
   */
  async saveResult(result: GameResult): Promise<SavedResult> {
    try {
      const response = await this.fetchWithFallback('/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      const data: ApiResponse<SavedResult> = await response.json();
      
      if (!data.success || !data.result) {
        throw new Error(data.error || 'Failed to save result');
      }

      return data.result;
    } catch (error) {
      console.error('Error saving result:', error);
      throw error;
    }
  }

  /**
   * 全結果を取得
   */
  async getResults(): Promise<SavedResult[]> {
    try {
      const response = await this.fetchWithFallback('/results');
      return await response.json();
    } catch (error) {
      console.error('Error fetching results:', error);
      throw error;
    }
  }

  /**
   * 特定の結果を取得
   */
  async getResult(id: string): Promise<SavedResult> {
    try {
      const response = await this.fetchWithFallback(`/results/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching result:', error);
      throw error;
    }
  }

  /**
   * 統計情報を取得
   */
  async getStats(): Promise<Stats> {
    try {
      const response = await this.fetchWithFallback('/stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // ヘルスチェックは/apiなしのパスなので、独自に実装
      let lastError: Error | null = null;

      for (const baseUrl of this.baseUrls) {
        try {
          const healthUrl = baseUrl.replace('/api', '/health');
          const response = await fetch(healthUrl, {
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            console.log(`✅ Health check OK: ${healthUrl}`);
            return await response.json();
          }
        } catch (error) {
          console.warn(`⚠️ Health check failed for ${baseUrl}:`, error);
          lastError = error as Error;
          continue;
        }
      }

      throw new Error(`Health check failed. Last error: ${lastError?.message || 'Unknown error'}`);
    } catch (error) {
      console.error('Error in health check:', error);
      throw error;
    }
  }

  /**
   * トーナメントの選択肢を取得
   */
  async getOptions(): Promise<Restaurant[]> {
    try {
      const response = await this.fetchWithFallback('/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!data.success || !data.options) {
        throw new Error('Failed to get options');
      }

      return data.options;
    } catch (error) {
      console.error('Error fetching options:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const apiService = new ApiService();
