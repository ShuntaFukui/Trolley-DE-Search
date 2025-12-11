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

  // recommended_peopleにラベリングを追加する関数
  const addLabelsToRecommendedPeople = (restaurant: any) => {
    const recommendedPeople = restaurant.recommended_people || [];
    return recommendedPeople.map((person: any, index: number) => ({
      ...person,
      label: index // 0, 1, 2のラベルを付与
    }));
  };

  // 全レストランのrecommended_peopleを収集し、重複しないようにラベルを再割り当て
  const optimizeLabelsAcrossRestaurants = (restaurants: any[]) => {
    // 各ラベル(0, 1, 2)に割り当てられた名前を追跡
    const labelAssignments: Map<number, Set<string>> = new Map([
      [0, new Set()],
      [1, new Set()],
      [2, new Set()]
    ]);

    return restaurants.map(restaurant => {
      const people = restaurant.recommended_people || [];
      if (people.length === 0) return restaurant;

      // このレストランの人々を最適なラベルに割り当て
      const optimizedPeople = people.map((person: any) => {
        const name = person.name;
        
        // まず元のラベルを試す
        let assignedLabel = person.label;
        
        // 元のラベルで重複がある場合、別のラベルを探す
        if (labelAssignments.get(assignedLabel)?.has(name)) {
          // 0, 1, 2の順で空いているラベルを探す
          for (let label = 0; label <= 2; label++) {
            if (!labelAssignments.get(label)?.has(name)) {
              assignedLabel = label;
              break;
            }
          }
        }
        
        // ラベルに名前を記録
        labelAssignments.get(assignedLabel)?.add(name);
        
        return {
          ...person,
          label: assignedLabel
        };
      });

      return {
        ...restaurant,
        recommended_people: optimizedPeople
      };
    });
  };

  // 全レストランに初期ラベリングを適用
  const initialLabeledRestaurants = [
    { ...enrichedRanking.first, recommended_people: addLabelsToRecommendedPeople(enrichedRanking.first) },
    { ...enrichedRanking.second, recommended_people: addLabelsToRecommendedPeople(enrichedRanking.second) },
    { ...enrichedRanking.third, recommended_people: addLabelsToRecommendedPeople(enrichedRanking.third) },
    { ...enrichedRanking.fourth, recommended_people: addLabelsToRecommendedPeople(enrichedRanking.fourth) },
    ...enrichedRanking.fifth.map((r: any) => ({ ...r, recommended_people: addLabelsToRecommendedPeople(r) }))
  ];

  // ラベルの重複を解消
  const optimizedRestaurants = optimizeLabelsAcrossRestaurants(initialLabeledRestaurants);

  // 順位データを配列化（最適化されたラベリング済み）
  const topRanks = [
    { rank: 1, restaurant: optimizedRestaurants[0], className: 'rank-1' },
    { rank: 2, restaurant: optimizedRestaurants[1], className: 'rank-2' },
    { rank: 3, restaurant: optimizedRestaurants[2], className: 'rank-3' },
    { rank: 4, restaurant: optimizedRestaurants[3], className: 'rank-4' },
  ];

  // 5位の店舗（最適化済み）
  const labeledFifthRanks = optimizedRestaurants.slice(4);

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
