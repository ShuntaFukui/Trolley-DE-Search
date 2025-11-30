import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/TrolleyGame.css';
import { apiService, type Restaurant } from '../../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [allOptions, setAllOptions] = useState<Restaurant[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初回マウント時に選択肢を取得
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        const options = await apiService.getOptions();
        setAllOptions(options);
        setLoadingError(null);
      } catch (error) {
        console.error('Failed to load options:', error);
        setLoadingError('選択肢の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleStartGame = () => {
    if (allOptions.length === 0) {
      setLoadingError('選択肢が読み込まれていません');
      return;
    }

    // ゲーム画面に遷移
    navigate('/game', {
      state: { restaurants: allOptions },
    });
  };

  const handleGoToManage = () => {
    navigate('/manage');
  };

  return (
    <div className="trolley-game">
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
            <p>トーナメント形式で好みを決定！</p>
            <p className="question-count">全7試合（1回戦4試合・準決勝2試合・3位決定戦・決勝）</p>
            {loadingError && <p className="error-message">{loadingError}</p>}
          </div>
          <button 
            className="start-button" 
            onClick={handleStartGame} 
            disabled={allOptions.length === 0}
          >
            ゲームスタート
          </button>
          <button 
            className="start-button" 
            onClick={handleGoToManage}
            style={{ marginTop: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            レストラン検索・管理
          </button>
        </div>
      )}
    </div>
  );
}
