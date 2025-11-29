// Lambda API用のRestaurant型
export interface Restaurant {
  id: string;
  shop_id?: string; // トーナメントゲーム用の互換性
  name: string;
  address: string;
  genre: string;
  catch?: string;
  budget?: string | number; // トーナメントゲーム用の互換性
  party_capacity?: string;
  url?: string;
  photo_url?: string;
  logo_image?: string;
  station_name?: string;
  access?: string;
  private_room?: string | boolean; // トーナメントゲーム用の互換性
  free_drink?: string | boolean; // トーナメントゲーム用の互換性
  free_food?: string;
  horigotatsu?: string;
  tatami?: string;
  karaoke?: string;
  card?: string | boolean; // トーナメントゲーム用の互換性
  course?: string | boolean; // トーナメントゲーム用の互換性
  non_smoking?: string;
  walk?: number; // トーナメントゲーム用
  seats?: number; // トーナメントゲーム用
  selection_reason?: string; // トーナメントゲーム用
}

// エリア情報の型定義
export interface Area {
  code: string;
  name: string;
}

// 検索結果の型定義
export interface SearchResult {
  message: string;
  deleted_count: number;
  searched_count: number;
  saved_to_dynamodb: number;
  shops: Restaurant[];
}

// フォーム回答の型定義
export interface FormResponse {
  total: number;
  attendance_yes: number;
  attendance_no: number;
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

// Lambda APIレスポンスの型定義
interface LambdaResponse<T> {
  statusCode: number;
  body: string | T;
}

class ApiService {
  private lambdaUrl: string;

  constructor() {
    // Lambda API URLを環境変数から取得
    this.lambdaUrl = import.meta.env.VITE_API_BASE_URL || 
      'https://1tebott34m.execute-api.ap-northeast-1.amazonaws.com/prod/search';
  }

  /**
   * Lambda APIへのリクエスト共通処理
   */
  private async callLambda<T>(payload: any): Promise<T> {
    try {
      const response = await fetch(this.lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data: LambdaResponse<T> = await response.json();
      
      // Lambdaのレスポンス形式に対応
      if (typeof data.body === 'string') {
        return JSON.parse(data.body);
      }
      
      return data.body as T;
    } catch (error) {
      console.error('Lambda API Error:', error);
      throw error;
    }
  }

  /**
   * 大エリア(都道府県)を取得
   */
  async getLargeAreas(): Promise<{ areas: Area[] }> {
    return this.callLambda({
      action: 'get_areas',
      area_type: 'large',
    });
  }

  /**
   * 中エリア(市区町村)を取得
   */
  async getMiddleAreas(parentCode: string): Promise<{ areas: Area[] }> {
    return this.callLambda({
      action: 'get_areas',
      area_type: 'middle',
      parent_code: parentCode,
    });
  }

  /**
   * 小エリア(詳細エリア)を取得
   */
  async getSmallAreas(parentCode: string): Promise<{ areas: Area[] }> {
    return this.callLambda({
      action: 'get_areas',
      area_type: 'small',
      parent_code: parentCode,
    });
  }

  /**
   * Google Formの回答を取得
   */
  async fetchFormResponses(spreadsheetUrl: string): Promise<FormResponse> {
    return this.callLambda({
      action: 'fetch_form_responses',
      spreadsheet_url: spreadsheetUrl,
    });
  }

  /**
   * レストランを検索
   */
  async searchRestaurants(params: {
    large_area?: string;
    middle_area?: string;
    small_area?: string;
    budget: string;
    party_capacity: number;
    event_date?: string;
    target_count: number;
  }): Promise<SearchResult> {
    return this.callLambda({
      action: 'search',
      ...params,
    });
  }

  /**
   * トーナメントゲーム用: 初期選択肢を取得
   * ※ Lambda APIではなくモックサーバーからの取得を想定
   */
  async getOptions(): Promise<Restaurant[]> {
    try {
      // モックサーバーのエンドポイントを使用
      const mockUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/api/options'
        : `${this.lambdaUrl.replace('/search', '')}/options`;

      const response = await fetch(mockUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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

  /**
   * トーナメントゲーム用: 結果を保存
   */
  async saveResult(result: GameResult): Promise<SavedResult> {
    try {
      // モックサーバーのエンドポイントを使用
      const mockUrl = import.meta.env.DEV
        ? 'http://localhost:3001/api/results'
        : `${this.lambdaUrl.replace('/search', '')}/results`;

      const response = await fetch(mockUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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
}

// シングルトンインスタンスをエクスポート
export const apiService = new ApiService();
