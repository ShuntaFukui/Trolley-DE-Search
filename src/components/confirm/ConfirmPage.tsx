import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/index.css';
import type { Restaurant } from '../../services/api';
import Header from '../common/Header';
import Footer from '../common/Footer';

const ConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurants, searchConditions } = location.state || { restaurants: [], searchConditions: {} };

  const handleConfirm = () => {
    // 確認後、Start画面（通信②）を経由してトロッコゲームへ
    navigate('/start', { state: { restaurants } });
  };

  const handleBack = () => {
    // Manage画面に戻る
    navigate('/manage', { state: { searchConditions } });
  };

  return (
    <div className="confirm-page-container">
      <Header />
      <div className="confirm-page-content">
    <div className="container">
      <h1>🔍 検索結果の確認</h1>
      <p className="subtitle">現在の検索結果をやりなおしますか？</p>

      <div className="confirm-section">
        <h3>検索条件</h3>
        <div className="confirm-conditions">
          <p><strong>エリア:</strong> {searchConditions?.area || 'N/A'}</p>
          <p><strong>予算:</strong> {searchConditions?.budget || 'N/A'}</p>
          <p><strong>参加人数:</strong> {searchConditions?.partyCapacity || 'N/A'}人</p>
        </div>
      </div>

      <div className="confirm-section">
        <h3>検索結果（{restaurants.length}件）</h3>
        {restaurants.length > 0 ? (
          <div className="confirm-restaurant-list">
            {restaurants.map((restaurant: Restaurant, index: number) => (
              <div
                key={restaurant.id || index}
                className="confirm-restaurant-item"
              >
                <div className="confirm-restaurant-name">
                  {index + 1}. {restaurant.name || 'N/A'}
                </div>
                <div className="confirm-restaurant-detail">
                  📍 {restaurant.address || 'N/A'}
                </div>
                <div className="confirm-restaurant-detail">
                  🍽️ {restaurant.genre || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>検索結果がありません</p>
        )}
      </div>

      <div className="confirm-button-group">
        <button
          onClick={handleBack}
          className="confirm-back-button"
        >
          ← やりなおす
        </button>
        <button
          onClick={handleConfirm}
          className="confirm-submit-button"
        >
          この条件で決定 →
        </button>
      </div>
    </div>
    </div>
    <Footer />
  </div>
  );
};

export default ConfirmPage;
