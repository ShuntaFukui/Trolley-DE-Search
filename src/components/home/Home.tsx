import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/TrolleyGame.css';
import { apiService, type Restaurant } from '../../services/api';
import Header from '../common/Header';
import Footer from '../common/Footer';

export default function Home() {
  const navigate = useNavigate();
  const [currentResults, setCurrentResults] = useState<Restaurant[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初回マウント時に現在の結果を取得（通信①）
  useEffect(() => {
    const fetchCurrentResults = async () => {
      try {
        setIsLoading(true);
        // TODO: 通信① - 検索条件・結果リスト取得APIの実装
        // 現在はモックサーバーから取得で代用
        const results = await apiService.getOptions();
        setCurrentResults(results);
        setLoadingError(null);
      } catch (error) {
        console.error('Failed to load current results:', error);
        setLoadingError('現在の結果の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentResults();
  }, []);

  const handleStartGame = () => {
    // ボタン：開始 → Start画面へ遷移（通信②経由でトロッコへ）
    navigate('/start');
  };

  const handleGoToManage = () => {
    // ボタン：編集 → Manage画面へ遷移
    navigate('/manage');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="trolley-game" style={{ flex: 1 }}>
      {isLoading ? (
        <div className="start-screen">
          <div className="game-title">
            <div className="title-main">トロッコ DE サーチ</div>
            <div className="title-sub">TROLLEY de SEARCH</div>
          </div>
          <div className="game-info">
            <p className="loading-message">選択肢を読み込み中...</p>
          </div>
        </div>
      ) : (
        <div className="start-screen">
          <div className="game-title">
            <div className="title-main">トロッコ DE サーチ</div>
            <div className="title-sub">TROLLEY de SEARCH</div>
          </div>
          <div className="game-info">
            <h3 style={{ marginBottom: '15px' }}>現在の結果</h3>
            {currentResults.length > 0 ? (
              <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                {currentResults.slice(0, 3).map((restaurant, index) => (
                  <div key={restaurant.id || index} style={{ marginBottom: '8px', fontSize: '14px' }}>
                    {index + 1}. {restaurant.name}
                  </div>
                ))}
                {currentResults.length > 3 && (
                  <div style={{ fontSize: '12px', color: '#999' }}>他 {currentResults.length - 3}件</div>
                )}
              </div>
            ) : (
              <p style={{ marginBottom: '20px' }}>結果がまだありません</p>
            )}
            {loadingError && <p className="error-message">{loadingError}</p>}
          </div>
          <button 
            className="start-button" 
            onClick={handleStartGame}
          >
            ボタン：開始
          </button>
          <button 
            className="start-button" 
            onClick={handleGoToManage}
            style={{ marginTop: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            ボタン：編集
          </button>
        </div>
      )}
    </div>
    <Footer />
  </div>
  );
}
