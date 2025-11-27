// 環境変数から設定を読み込み
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

// 現在の環境情報をログ出力（開発時のみ）
if (config.isDevelopment) {
  console.log('🔧 Environment Config:', config);
}
