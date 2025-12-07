// Lambda API用のRestaurant型
export interface Restaurant {
  id?: string;
  shop_id?: string; // トーナメントゲーム用の互換性
  name: string;
  address?: string;
  genre?: string;
  catch?: string;
  budget?: string | number; // トーナメントゲーム用の互換性
  budget_average?: string; // select-restaurants用
  budget_code?: string; // select-restaurants用
  party_capacity?: string | number;
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
  wifi?: string; // select-restaurants用
  lng?: number; // select-restaurants用
  lat?: number; // select-restaurants用
  created_at?: string; // select-restaurants用
  walk?: number; // トーナメントゲーム用
  seats?: number; // トーナメントゲーム用
  selection_reason?: string; // トーナメントゲーム用
  raw_data?: any; // select-restaurants用
}

// エリア情報の型定義
export interface Area {
  code: string;
  name: string;
}

// レストラン詳細情報の型定義（restaurant-info APIレスポンス）
export interface RestaurantInfo {
  shop_id: string;
  url: string;
  access: string;
  allergy_warnings: {
    name: string;
    allergy: string;
  }[];
}

export interface RestaurantInfoResponse {
  status: string;
  result_id: string;
  restaurant_count: number;
  restaurants: RestaurantInfo[];
}

// 検索結果の型定義（search APIレスポンス）
export interface SearchResult {
  message: string;
  deleted_count: number;
  searched_count: number;
  saved_to_dynamodb: number;
  shops: Restaurant[];
  // select-restaurants API互換性のため
  selected_shops?: Restaurant[];
  status?: string;
  result_id?: string;
  processing_time?: number;
  total_candidates?: number;
  selected_count?: number;
  participant_count?: number;
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
  private searchUrl: string;  // 回答取得用
  private restaurantUrl: string;  // 店舗検索用
  private restaurantInfoUrl: string;  // レストラン詳細情報用

  constructor() {
    // 開発環境: mockサーバー、本番環境: Lambda API
    if (import.meta.env.DEV) {
      // mockサーバーのURL(localhost → LAN IPの順にフォールバック)
      this.searchUrl = 'http://localhost:3001/search';
      this.restaurantUrl = 'http://localhost:3001/select-restaurants';
      this.restaurantInfoUrl = 'https://hn9e5kup8i.execute-api.ap-northeast-1.amazonaws.com/prod/restaurant-info';
    } else {
      // 本番環境: Lambda API
      this.searchUrl = 'https://1tebott34m.execute-api.ap-northeast-1.amazonaws.com/prod/search';
      this.restaurantUrl = import.meta.env.VITE_API_BASE_URL || 
        'https://hn9e5kup8i.execute-api.ap-northeast-1.amazonaws.com/prod/select-restaurants';
      this.restaurantInfoUrl = 'https://hn9e5kup8i.execute-api.ap-northeast-1.amazonaws.com/prod/restaurant-info';
    }
  }

  /**
   * Lambda APIへのリクエスト共通処理（開発環境ではmockサーバー使用）
   */
  private async callLambda<T>(url: string, payload: any): Promise<T> {
    try {
      // 開発環境でmockサーバーを試行（フォールバック付き）
      if (import.meta.env.DEV) {
        const mockUrls = [
          url,
          url.replace('localhost', '172.20.10.4')
        ];

        for (const mockUrl of mockUrls) {
          try {
            const response = await fetch(mockUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              continue;
            }

            const data = await response.json();
            console.log('Mock Server Response:', data);

            // mockサーバーはbody部分のみ返す（Lambda形式ではない）
            // search.jsonの場合はLambda形式、select_restaurants.jsonは直接形式
            if (data.statusCode !== undefined && data.body !== undefined) {
              // Lambda形式（search.json）
              if (typeof data.body === 'string') {
                return JSON.parse(data.body);
              }
              return data.body as T;
            }
            
            // 直接形式（select_restaurants.json）
            return data as T;
          } catch (error) {
            console.warn(`Failed to fetch from ${mockUrl}:`, error);
            continue;
          }
        }
        
        throw new Error('All mock server URLs failed');
      }

      // 本番環境: Lambda API
      const response = await fetch(url, {
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
      
      console.log('Lambda API Response:', data);
      
      // Lambdaのレスポンス形式に対応
      if (data.body !== undefined) {
        if (typeof data.body === 'string') {
          return JSON.parse(data.body);
        }
        return data.body as T;
      }
      
      // bodyがない場合は、data自体がレスポンスデータの可能性
      return data as unknown as T;
    } catch (error) {
      console.error('Lambda API Error:', error);
      throw error;
    }
  }

  /**
   * 大エリア(都道府県)を取得
   */
  async getLargeAreas(): Promise<{ areas: Area[] }> {
    return this.callLambda(this.searchUrl, {
      action: 'get_areas',
      area_type: 'large',
    });
  }

  /**
   * 中エリア(広域エリア)を取得
   */
  async getMiddleAreas(parentCode: string): Promise<{ areas: Area[] }> {
    return this.callLambda(this.searchUrl, {
      action: 'get_areas',
      area_type: 'middle',
      parent_code: parentCode,
    });
  }

  /**
   * 小エリア(詳細エリア)を取得
   */
  async getSmallAreas(parentCode: string): Promise<{ areas: Area[] }> {
    return this.callLambda(this.searchUrl, {
      action: 'get_areas',
      area_type: 'small',
      parent_code: parentCode,
    });
  }

  /**
   * Google Formの回答を取得
   */
  async fetchFormResponses(spreadsheetUrl: string): Promise<FormResponse> {
    return this.callLambda(this.searchUrl, {
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
    return this.callLambda(this.searchUrl, {
      action: 'search',
      ...params,
    });
  }

  /**
   * AI選定によるレストラン取得（select-restaurants API）
   */
  async selectRestaurants(): Promise<{
    status: string;
    result_id: string;
    message: string;
    processing_time: number;
    total_candidates: number;
    selected_count: number;
    participant_count: number;
    selected_shops: Restaurant[];
  }> {
    return this.callLambda(this.restaurantUrl, {});
  }

  /**
   * レストラン詳細情報取得（restaurant-info API）
   * Resultテーブルから最新の選定結果の詳細情報を取得
   */
  async getRestaurantInfo(): Promise<RestaurantInfoResponse> {
    return this.callLambda(this.restaurantInfoUrl, {});
  }

  /**
   * トーナメントゲーム用: 初期選択肢を取得
   * ※ Lambda APIではなくモックサーバーからの取得を想定
   */
  async getOptions(): Promise<Restaurant[]> {
    // 開発環境: モックサーバー（localhost → LAN IPの順にフォールバック）
    // 本番環境: 既存のLambda APIを使用（/search → /select-restaurants）
    if (import.meta.env.DEV) {
      const urls = [
        'http://localhost:3001/api/options',
        'http://172.20.10.4:3001/api/options'
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            continue;
          }

          const data = await response.json();
          
          if (data.success && data.options) {
            return data.options;
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${url}:`, error);
          continue;
        }
      }
      
      throw new Error('All mock server URLs failed');
    } else {
      // 本番環境: 店舗検索用Lambda APIを使用
      const prodUrl = this.restaurantUrl;
      
      try {
        const response = await fetch(prodUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'get_options' }),
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
  }

  /**
   * トーナメントゲーム用: 結果を保存
   */
  async saveResult(result: GameResult): Promise<SavedResult> {
    // 開発環境: モックサーバー（localhost → LAN IPの順にフォールバック）
    // 本番環境: 既存のLambda APIを使用
    if (import.meta.env.DEV) {
      const urls = [
        'http://localhost:3001/api/results',
        'http://172.20.10.4:3001/api/results'
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(result),
          });

          if (!response.ok) {
            continue;
          }

          const data = await response.json();
          
          if (data.success && data.result) {
            return data.result;
          }
        } catch (error) {
          console.warn(`Failed to save to ${url}:`, error);
          continue;
        }
      }
      
      throw new Error('All mock server URLs failed');
    }
    
    // 本番環境: 店舗検索用Lambda APIを使用(save-resultsエンドポイント)
    const prodUrl = this.restaurantUrl.replace('/select-restaurants', '/save-results');
    
    try {
      const response = await fetch(prodUrl, {
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
