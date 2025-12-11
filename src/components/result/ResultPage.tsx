import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { TournamentResult, RestaurantInfoResponse } from '../../services/api';
import Header from '../common/Header';
import Footer from '../common/Footer';
import '../../styles/TrolleyGame.css';

interface ResultPageState {
  finalRanking: TournamentResult;
  restaurantInfo?: RestaurantInfoResponse;
  isSaving?: boolean;
}

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  // const [expandedAccess, setExpandedAccess] = useState<Set<string>>(new Set());

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

  /* const toggleAccess = (id: string) => {
    setExpandedAccess(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }; */

  const { finalRanking, restaurantInfo } = state;

  // restaurantInfoがあれば、finalRankingの各レストランの情報を補完
  const enrichedRanking = { ...finalRanking };
  
  if (restaurantInfo?.restaurants) {
    const infoMap = new Map(
      restaurantInfo.restaurants.map(info => [info.shop_id, info])
    );

    // 各順位のレストラン情報を補完
    const enrichRestaurant = (restaurant: typeof enrichedRanking.first) => {
      const shopId = restaurant.shop_id || restaurant.id;
      if (!shopId) return restaurant;
      
      const info = infoMap.get(shopId);
      if (info) {
        return {
          ...restaurant,
          url: info.url || restaurant.url,
          access: info.access || restaurant.access,
        };
      }
      return restaurant;
    };

    enrichedRanking.first = enrichRestaurant(enrichedRanking.first);
    enrichedRanking.second = enrichRestaurant(enrichedRanking.second);
    enrichedRanking.third = enrichRestaurant(enrichedRanking.third);
    enrichedRanking.fourth = enrichRestaurant(enrichedRanking.fourth);
    enrichedRanking.fifth = enrichedRanking.fifth.map(enrichRestaurant);
  }

  return (
    <div className="page-container">
      <Header pageTitle="結果" />
      <div className="trolley-game page-content-flex">
        <div className="result-screen">
          {/* <div className="result-title">サーチ完了！</div> */}
          
          <div className="ranking">
            <div className="rank-item rank-1">
              <div className="rank-number">1</div>
              <div className="rank-restaurant">
                <div className="rank-restaurant-name">{enrichedRanking.first.name}</div>
              </div>
              <div className="rank-button-access">
                {enrichedRanking.first.url && enrichedRanking.first.url.trim() !== '' ? (
                  <a 
                    href={enrichedRanking.first.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="reservation-button"
                  >
                    予約
                  </a>
                ) : (
                  <button 
                    className="reservation-button reservation-button-disabled"
                    disabled
                  >
                    予約
                  </button>
                )}
                {/* <div 
                  className={`rank-restaurant-access ${expandedAccess.has('first') ? 'expanded' : ''} ${!enrichedRanking.first.access || enrichedRanking.first.access.trim() === '' ? 'access-disabled' : ''}`}
                  onClick={() => {
                    if (enrichedRanking.first.access && enrichedRanking.first.access.trim() !== '') {
                      toggleAccess('first');
                    }
                  }}
                >
                  {enrichedRanking.first.access && enrichedRanking.first.access.trim() !== '' 
                    ? (expandedAccess.has('first') ? `📍 ${enrichedRanking.first.access}` : '📍')
                    : '🚫 アクセス情報なし'
                  }
                </div> */}
              </div>
            </div>
            <div className="rank-item rank-2">
              <div className="rank-number">2</div>
              <div className="rank-restaurant">
                <div className="rank-restaurant-name">{enrichedRanking.second.name}</div>
              </div>
              <div className="rank-button-access">
                {enrichedRanking.second.url && enrichedRanking.second.url.trim() !== '' ? (
                  <a 
                    href={enrichedRanking.second.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="reservation-button"
                  >
                    予約
                  </a>
                ) : (
                  <button 
                    className="reservation-button reservation-button-disabled"
                    disabled
                  >
                    予約
                  </button>
                )}
                {/* <div 
                  className={`rank-restaurant-access ${expandedAccess.has('second') ? 'expanded' : ''} ${!enrichedRanking.second.access || enrichedRanking.second.access.trim() === '' ? 'access-disabled' : ''}`}
                  onClick={() => {
                    if (enrichedRanking.second.access && enrichedRanking.second.access.trim() !== '') {
                      toggleAccess('second');
                    }
                  }}
                >
                  {enrichedRanking.second.access && enrichedRanking.second.access.trim() !== '' 
                    ? (expandedAccess.has('second') ? `📍 ${enrichedRanking.second.access}` : '📍')
                    : '🚫 アクセス情報なし'
                  }
                </div> */}
              </div>
            </div>
            <div className="rank-item rank-3">
              <div className="rank-number">3</div>
              <div className="rank-restaurant">
                <div className="rank-restaurant-name">{enrichedRanking.third.name}</div>
              </div>
              <div className="rank-button-access">
                {enrichedRanking.third.url && enrichedRanking.third.url.trim() !== '' ? (
                  <a 
                    href={enrichedRanking.third.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="reservation-button"
                  >
                    予約
                  </a>
                ) : (
                  <button 
                    className="reservation-button reservation-button-disabled"
                    disabled
                  >
                    予約
                  </button>
                )}
                {/* <div 
                  className={`rank-restaurant-access ${expandedAccess.has('third') ? 'expanded' : ''} ${!enrichedRanking.third.access || enrichedRanking.third.access.trim() === '' ? 'access-disabled' : ''}`}
                  onClick={() => {
                    if (enrichedRanking.third.access && enrichedRanking.third.access.trim() !== '') {
                      toggleAccess('third');
                    }
                  }}
                >
                  {enrichedRanking.third.access && enrichedRanking.third.access.trim() !== '' 
                    ? (expandedAccess.has('third') ? `📍 ${enrichedRanking.third.access}` : '📍')
                    : '🚫 アクセス情報なし'
                  }
                </div> */}
              </div>
            </div>
            <div className="rank-item rank-4">
              <div className="rank-restaurant">
                <div className="rank-restaurant-top">
                  <div className="rank-restaurant-name">{enrichedRanking.fourth.name}</div>
                  {enrichedRanking.fourth.url && enrichedRanking.fourth.url.trim() !== '' ? (
                    <a 
                      href={enrichedRanking.fourth.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="reservation-button"
                    >
                      予約
                    </a>
                  ) : (
                    <button 
                      className="reservation-button reservation-button-disabled"
                      disabled
                    >
                      予約
                    </button>
                  )}
                </div>
                {/* <div 
                  className={`rank-restaurant-access ${expandedAccess.has('fourth') ? 'expanded' : ''} ${!enrichedRanking.fourth.access || enrichedRanking.fourth.access.trim() === '' ? 'access-disabled' : ''}`}
                  onClick={() => {
                    if (enrichedRanking.fourth.access && enrichedRanking.fourth.access.trim() !== '') {
                      toggleAccess('fourth');
                    }
                  }}
                >
                  {enrichedRanking.fourth.access && enrichedRanking.fourth.access.trim() !== '' 
                    ? (expandedAccess.has('fourth') ? `📍 ${enrichedRanking.fourth.access}` : '📍')
                    : '🚫 アクセス情報なし'
                  }
                </div> */}
              </div>
            </div>
            {enrichedRanking.fifth.map((restaurant) => (
              <div key={restaurant.shop_id} className="rank-item rank-5">
                <div className="rank-restaurant">
                  <div className="rank-restaurant-top">
                    <div className="rank-restaurant-name">{restaurant.name}</div>
                    {restaurant.url && restaurant.url.trim() !== '' ? (
                      <a 
                        href={restaurant.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="reservation-button"
                      >
                        予約
                      </a>
                    ) : (
                      <button 
                        className="reservation-button reservation-button-disabled"
                        disabled
                      >
                        予約
                      </button>
                    )}
                  </div>
                  {/* <div 
                    className={`rank-restaurant-access ${expandedAccess.has(`fifth-${restaurant.shop_id}`) ? 'expanded' : ''} ${!restaurant.access || restaurant.access.trim() === '' ? 'access-disabled' : ''}`}
                    onClick={() => {
                      if (restaurant.access && restaurant.access.trim() !== '') {
                        toggleAccess(`fifth-${restaurant.shop_id}`);
                      }
                    }}
                  >
                    {restaurant.access && restaurant.access.trim() !== '' 
                      ? (expandedAccess.has(`fifth-${restaurant.shop_id}`) ? `📍 ${restaurant.access}` : '📍')
                      : '🚫 アクセス情報なし'
                    }
                  </div> */}
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
