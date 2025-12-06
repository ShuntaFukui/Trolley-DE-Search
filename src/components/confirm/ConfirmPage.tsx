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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
    <div className="container">
      <h1>🔍 検索結果の確認</h1>
      <p className="subtitle">現在の検索結果をやりなおしますか？</p>

      <div style={{ marginTop: '30px', marginBottom: '30px' }}>
        <h3>検索条件</h3>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
          <p><strong>エリア:</strong> {searchConditions?.area || 'N/A'}</p>
          <p><strong>予算:</strong> {searchConditions?.budget || 'N/A'}</p>
          <p><strong>参加人数:</strong> {searchConditions?.partyCapacity || 'N/A'}人</p>
        </div>
      </div>

      <div style={{ marginTop: '30px', marginBottom: '30px' }}>
        <h3>検索結果（{restaurants.length}件）</h3>
        {restaurants.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
            {restaurants.map((restaurant: Restaurant, index: number) => (
              <div
                key={restaurant.id || index}
                style={{
                  background: 'white',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #667eea'
                }}
              >
                <div style={{ fontWeight: 600, color: '#333', marginBottom: '5px' }}>
                  {index + 1}. {restaurant.name || 'N/A'}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  📍 {restaurant.address || 'N/A'}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  🍽️ {restaurant.genre || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>検索結果がありません</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
        <button
          onClick={handleBack}
          style={{
            flex: 1,
            padding: '15px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ← やりなおす
        </button>
        <button
          onClick={handleConfirm}
          style={{
            flex: 1,
            padding: '15px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
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
