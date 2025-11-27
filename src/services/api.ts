import { config } from '../common/config';

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
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  /**
   * ゲーム結果を保存
   */
  async saveResult(result: GameResult): Promise<SavedResult> {
    try {
      const response = await fetch(`${this.baseUrl}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
      const response = await fetch(`${this.baseUrl}/results`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
      const response = await fetch(`${this.baseUrl}/results/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
      const response = await fetch(`${this.baseUrl}/stats`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
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
      const response = await fetch(`${this.baseUrl}/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
