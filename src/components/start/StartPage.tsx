import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/TrolleyGame.css';
import { apiService } from '../../services/api';
import type { Restaurant } from '../../services/api';
import Header from '../common/Header';
import Footer from '../common/Footer';

const StartPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stateRestaurants = location.state?.restaurants;
    
    if (stateRestaurants && stateRestaurants.length > 0) {
      // Confirm画面から渡されたレストラン情報を使用
      setRestaurants(stateRestaurants);
    } else {
      // 通信②: GoogleFormリンクからトロッコ結果を取得
      fetchTrolleyResults();
    }
  }, [location.state]);

  const fetchTrolleyResults = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: GoogleFormリンクから結果を取得するAPI実装
      // 現在はモックサーバーからの取得で代用
      const options = await apiService.getOptions();
      setRestaurants(options);
    } catch (err) {
      console.error('Failed to fetch trolley results:', err);
      setError('トロッコ結果の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = () => {
    if (restaurants.length === 0) {
      setError('レストラン情報が読み込まれていません');
      return;
    }

    // トロッコゲーム画面に遷移（通信④経由）
    navigate('/game', {
      state: { restaurants },
    });
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="start-page-container">
      <Header />
    <div className="trolley-game start-page-content">
      <div className="start-screen">
        <div className="game-title">
          <div className="title-main">ボタン：開始</div>
          <div className="title-sub">START</div>
        </div>
        
        {isLoading ? (
          <div className="game-info">
            <p className="loading-message">トロッコ結果を読み込み中...</p>
          </div>
        ) : error ? (
          <div className="game-info">
            <p className="error-message">{error}</p>
            <button className="start-button" onClick={handleBack}>
              ホームに戻る
            </button>
          </div>
        ) : (
          <>
            <div className="game-info">
              <p>トーナメント形式で好みを決定！</p>
              <p className="question-count">
                全7試合（1回戦4試合・準決勝2試合・3位決定戦・決勝）
              </p>
              <p className="start-restaurant-count">
                対象レストラン: {restaurants.length}件
              </p>
            </div>
            <button
              className="start-button"
              onClick={handleStartGame}
              disabled={restaurants.length === 0}
            >
              トロッコスタート
            </button>
          </>
        )}
      </div>
    </div>
    <Footer />
  </div>
  );
};

export default StartPage;
