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
  const [expandedAccess, setExpandedAccess] = useState<Set<string>>(new Set());

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

  const toggleAccess = (id: string) => {
    setExpandedAccess(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const { finalRanking } = state;

  return (
    <div className="page-container">
      <Header pageTitle="結果" />
      <div className="trolley-game page-content-flex">
        <div className="result-screen">
          <div className="result-title">サーチ完了！</div>
          
          <div className="ranking">
            <div className="rank-item rank-1">
              <div className="rank-restaurant">
                <div className="rank-restaurant-top">
                  <div className="rank-restaurant-name">{finalRanking.first.name}</div>
                  {finalRanking.first.url && finalRanking.first.url.trim() !== '' && (
                    <a 
                      href={finalRanking.first.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="reservation-button"
                    >
                      予約
                    </a>
                  )}
                </div>
                {finalRanking.first.access && finalRanking.first.access.trim() !== '' && (
                  <div 
                    className={`rank-restaurant-access ${expandedAccess.has('first') ? 'expanded' : ''}`}
                    onClick={() => toggleAccess('first')}
                  >
                    {expandedAccess.has('first') ? `📍 ${finalRanking.first.access}` : '📍'}
                  </div>
                )}
              </div>
            </div>
            <div className="rank-item rank-2">
              <div className="rank-restaurant">
                <div className="rank-restaurant-top">
                  <div className="rank-restaurant-name">{finalRanking.second.name}</div>
                  {finalRanking.second.url && finalRanking.second.url.trim() !== '' && (
                    <a 
                      href={finalRanking.second.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="reservation-button"
                    >
                      予約
                    </a>
                  )}
                </div>
                {finalRanking.second.access && finalRanking.second.access.trim() !== '' && (
                  <div 
                    className={`rank-restaurant-access ${expandedAccess.has('second') ? 'expanded' : ''}`}
                    onClick={() => toggleAccess('second')}
                  >
                    {expandedAccess.has('second') ? `📍 ${finalRanking.second.access}` : '📍'}
                  </div>
                )}
              </div>
            </div>
            <div className="rank-item rank-3">
              <div className="rank-restaurant">
                <div className="rank-restaurant-top">
                  <div className="rank-restaurant-name">{finalRanking.third.name}</div>
                  {finalRanking.third.url && finalRanking.third.url.trim() !== '' && (
                    <a 
                      href={finalRanking.third.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="reservation-button"
                    >
                      予約
                    </a>
                  )}
                </div>
                {finalRanking.third.access && finalRanking.third.access.trim() !== '' && (
                  <div 
                    className={`rank-restaurant-access ${expandedAccess.has('third') ? 'expanded' : ''}`}
                    onClick={() => toggleAccess('third')}
                  >
                    {expandedAccess.has('third') ? `📍 ${finalRanking.third.access}` : '📍'}
                  </div>
                )}
              </div>
            </div>
            <div className="rank-item rank-4">
              <div className="rank-restaurant">
                <div className="rank-restaurant-top">
                  <div className="rank-restaurant-name">{finalRanking.fourth.name}</div>
                  {finalRanking.fourth.url && finalRanking.fourth.url.trim() !== '' && (
                    <a 
                      href={finalRanking.fourth.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="reservation-button"
                    >
                      予約
                    </a>
                  )}
                </div>
                {finalRanking.fourth.access && finalRanking.fourth.access.trim() !== '' && (
                  <div 
                    className={`rank-restaurant-access ${expandedAccess.has('fourth') ? 'expanded' : ''}`}
                    onClick={() => toggleAccess('fourth')}
                  >
                    {expandedAccess.has('fourth') ? `📍 ${finalRanking.fourth.access}` : '📍'}
                  </div>
                )}
              </div>
            </div>
            {finalRanking.fifth.map((restaurant) => (
              <div key={restaurant.shop_id} className="rank-item rank-5">
                <div className="rank-restaurant">
                  <div className="rank-restaurant-top">
                    <div className="rank-restaurant-name">{restaurant.name}</div>
                    {restaurant.url && restaurant.url.trim() !== '' && (
                      <a 
                        href={restaurant.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="reservation-button"
                      >
                        予約
                      </a>
                    )}
                  </div>
                  {restaurant.access && restaurant.access.trim() !== '' && (
                    <div 
                      className={`rank-restaurant-access ${expandedAccess.has(`fifth-${restaurant.shop_id}`) ? 'expanded' : ''}`}
                      onClick={() => toggleAccess(`fifth-${restaurant.shop_id}`)}
                    >
                      {expandedAccess.has(`fifth-${restaurant.shop_id}`) ? `📍 ${restaurant.access}` : '📍'}
                    </div>
                  )}
                </div>
              </div>
            ))}
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
