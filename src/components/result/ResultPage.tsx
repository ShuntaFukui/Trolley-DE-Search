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

  // 順位データを配列化（すでにラベリング済み）
  const topRanks = [
    { rank: 1, restaurant: enrichedRanking.first, className: 'rank-1' },
    { rank: 2, restaurant: enrichedRanking.second, className: 'rank-2' },
    { rank: 3, restaurant: enrichedRanking.third, className: 'rank-3' },
    { rank: 4, restaurant: enrichedRanking.fourth, className: 'rank-4' },
  ];

  // 5位の店舗
  const labeledFifthRanks = enrichedRanking.fifth;

  // 予約ボタンのレンダリング関数
  const renderReservationButton = (url?: string) => {
    if (url && url.trim() !== '') {
      return (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="reservation-button"
        >
          予約
        </a>
      );
    }
    return (
      <button 
        className="reservation-button reservation-button-disabled"
        disabled
      >
        予約
      </button>
    );
  };

  return (
    <div className="page-container">
      <Header pageTitle="結果" />
      <div className="trolley-game page-content-flex">
        <div className="result-screen">
          {/* <div className="result-title">サーチ完了！</div> */}
          
          <div className="ranking">
            {/* 1-4位のループ */}
            {topRanks.map(({ rank, restaurant, className }) => (
              <div key={rank} className={`rank-item ${className}`}>
                {rank <= 3 ? (
                  // 1-3位: グリッドレイアウト
                  <>
                    <div className="rank-number">{rank}</div>
                    <div className="rank-restaurant">
                      <div className="rank-restaurant-name">{restaurant.name}</div>
                    </div>
                    <div className="rank-button-access">
                      {renderReservationButton(restaurant.url)}
                    </div>
                  </>
                ) : (
                  // 4位: 従来のレイアウト
                  <div className="rank-restaurant">
                    <div className="rank-restaurant-top">
                      <div className="rank-restaurant-name">{restaurant.name}</div>
                      {renderReservationButton(restaurant.url)}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 5位(複数店舗) */}
            {labeledFifthRanks.map((restaurant) => (
              <div key={restaurant.shop_id} className="rank-item rank-5">
                <div className="rank-restaurant">
                  <div className="rank-restaurant-top">
                    <div className="rank-restaurant-name">{restaurant.name}</div>
                    {renderReservationButton(restaurant.url)}
                  </div>
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
