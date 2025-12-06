import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { TournamentResult } from '../../services/api';
import Header from '../common/Header';
import Footer from '../common/Footer';
import '../../styles/TrolleyGame.css';

interface ResultPageState {
  finalRanking: TournamentResult;
  isSaving?: boolean;
}

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const state = location.state as ResultPageState | null;

  useEffect(() => {
    // 結果データがない場合はホームに戻す
    if (!state || !state.finalRanking) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    if (state?.isSaving !== undefined) {
      setIsSaving(state.isSaving);
    }
  }, [state]);

  if (!state || !state.finalRanking) {
    return null;
  }

  const handleRetry = () => {
    navigate('/', { replace: true });
  };

  const { finalRanking } = state;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
    <div className="trolley-game" style={{ flex: 1 }}>
      <div className="result-screen">
        <div className="result-title">トーナメント終了！</div>
        
        <div className="ranking">
          <div className="rank-item rank-1">
            <span className="rank-label">🥇 1位</span>
            <div className="rank-restaurant">
              <div className="rank-restaurant-name">{finalRanking.first.name}</div>
              <div className="rank-restaurant-genre">{finalRanking.first.genre}</div>
            </div>
          </div>
          <div className="rank-item rank-2">
            <span className="rank-label">🥈 2位</span>
            <div className="rank-restaurant">
              <div className="rank-restaurant-name">{finalRanking.second.name}</div>
              <div className="rank-restaurant-genre">{finalRanking.second.genre}</div>
            </div>
          </div>
          <div className="rank-item rank-3">
            <span className="rank-label">🥉 3位</span>
            <div className="rank-restaurant">
              <div className="rank-restaurant-name">{finalRanking.third.name}</div>
              <div className="rank-restaurant-genre">{finalRanking.third.genre}</div>
            </div>
          </div>
          <div className="rank-item rank-4">
            <span className="rank-label">4位</span>
            <div className="rank-restaurant">
              <div className="rank-restaurant-name">{finalRanking.fourth.name}</div>
              <div className="rank-restaurant-genre">{finalRanking.fourth.genre}</div>
            </div>
          </div>
          <div className="rank-item rank-5">
            <span className="rank-label">同率5位</span>
            <div className="rank-value-list">
              {finalRanking.fifth.map((restaurant) => (
                <div key={restaurant.shop_id} className="rank-restaurant-mini">
                  <span className="rank-restaurant-name-mini">{restaurant.name}</span>
                  <span className="rank-restaurant-genre-mini">({restaurant.genre})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isSaving && <p className="saving-message">結果を保存中...</p>}
        
        <button className="retry-button" onClick={handleRetry}>
          もう一度プレイ
        </button>
      </div>
    </div>
    <Footer />
  </div>
  );
}
