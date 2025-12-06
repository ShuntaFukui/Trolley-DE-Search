import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/index.css';
import { apiService } from '../../services/api';
import type { Area, Restaurant, SearchResult, FormResponse } from '../../services/api';
import Header from '../common/Header';
import Footer from '../common/Footer';

const ManagePage: React.FC = () => {
  const navigate = useNavigate();

  // エリア選択の状態
  const [largeAreas, setLargeAreas] = useState<Area[]>([]);
  const [middleAreas, setMiddleAreas] = useState<Area[]>([]);
  const [smallAreas, setSmallAreas] = useState<Area[]>([]);
  
  const [selectedLargeArea, setSelectedLargeArea] = useState('');
  const [selectedMiddleArea, setSelectedMiddleArea] = useState('');
  const [selectedSmallArea, setSelectedSmallArea] = useState('');

  // 検索条件の状態
  const [budget, setBudget] = useState('');
  const [partyCapacity, setPartyCapacity] = useState(10);
  const [eventDate, setEventDate] = useState('');
  const [targetCount, setTargetCount] = useState(10);

  // Google Form関連の状態
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [formResponse, setFormResponse] = useState<FormResponse | null>(null);
  const [isFetchingForm, setIsFetchingForm] = useState(false);
  const [isPartyCapacityDisabled, setIsPartyCapacityDisabled] = useState(false);

  // 検索結果の状態
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 大エリア取得
  useEffect(() => {
    loadLargeAreas();
    
    // 今日の日付を最小値として設定
    const today = new Date().toISOString().split('T')[0];
    const eventDateInput = document.getElementById('eventDate') as HTMLInputElement;
    if (eventDateInput) {
      eventDateInput.setAttribute('min', today);
    }
  }, []);

  const loadLargeAreas = async () => {
    try {
      const data = await apiService.getLargeAreas();
      setLargeAreas(data.areas);
    } catch (error) {
      console.error('大エリア取得エラー:', error);
    }
  };

  const loadMiddleAreas = async (largeAreaCode: string) => {
    try {
      const data = await apiService.getMiddleAreas(largeAreaCode);
      setMiddleAreas(data.areas);
    } catch (error) {
      console.error('中エリア取得エラー:', error);
    }
  };

  const loadSmallAreas = async (middleAreaCode: string) => {
    try {
      const data = await apiService.getSmallAreas(middleAreaCode);
      setSmallAreas(data.areas);
    } catch (error) {
      console.error('小エリア取得エラー:', error);
    }
  };

  const handleLargeAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLargeArea(value);
    setSelectedMiddleArea('');
    setSelectedSmallArea('');
    setMiddleAreas([]);
    setSmallAreas([]);

    if (value) {
      loadMiddleAreas(value);
    }
  };

  const handleMiddleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedMiddleArea(value);
    setSelectedSmallArea('');
    setSmallAreas([]);

    if (value) {
      loadSmallAreas(value);
    }
  };

  // Google Form回答取得
  const handleFetchForm = async () => {
    if (!spreadsheetUrl.trim()) {
      alert('スプレッドシートのURLを入力してください');
      return;
    }

    setIsFetchingForm(true);
    setFormResponse(null);

    try {
      console.log('フォーム回答取得開始:', spreadsheetUrl);

      const data = await apiService.fetchFormResponses(spreadsheetUrl);
      console.log('レスポンスデータ:', data);

      if ('error' in data) {
        throw new Error((data as any).error);
      }

      setFormResponse(data);
      setPartyCapacity(data.attendance_yes);
      setIsPartyCapacityDisabled(true);

      alert(`✅ 回答を取得しました!\n参加: ${data.attendance_yes}名\n不参加: ${data.attendance_no}名\n\n参加人数が自動設定されました。`);
    } catch (error: any) {
      console.error('フォーム回答取得エラー:', error);
      let errorMsg = error.message;

      if (errorMsg.includes('401')) {
        errorMsg = `スプレッドシートにアクセスできません（401エラー）\n\n以下を確認してください：\n1. スプレッドシートが公開されているか\n2. 「リンクを知っている全員」に設定されているか\n\n設定方法：\nスプレッドシート右上の「共有」→「リンクを知っている全員」→「閲覧者」`;
      }

      alert('❌ エラー: ' + errorMsg);
    } finally {
      setIsFetchingForm(false);
    }
  };

  // スプレッドシートURL変更時の処理
  const handleSpreadsheetUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSpreadsheetUrl(value);

    if (!value.trim()) {
      setIsPartyCapacityDisabled(false);
      setFormResponse(null);
    }
  };

  // 検索実行
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSearching(true);
    setSearchResult(null);
    setErrorMessage('');

    try {
      const params: any = {
        budget,
        party_capacity: partyCapacity,
        target_count: targetCount,
      };

      if (selectedSmallArea) {
        params.small_area = selectedSmallArea;
      } else if (selectedMiddleArea) {
        params.middle_area = selectedMiddleArea;
      } else {
        params.large_area = selectedLargeArea;
      }

      if (eventDate) {
        params.event_date = eventDate;
      }

      console.log('送信データ:', params);

      const result = await apiService.searchRestaurants(params);

      console.log('検索結果:', result);
      setSearchResult(result);
    } catch (error: any) {
      console.error('検索エラー:', error);
      setErrorMessage('検索中にエラーが発生しました: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  // 特徴バッジの生成
  const getFeatures = (shop: Restaurant): string[] => {
    const features: string[] = [];
    if (shop.private_room) features.push('個室');
    if (shop.free_drink) features.push('飲み放題');
    if (shop.free_food) features.push('食べ放題');
    if (shop.horigotatsu) features.push('掘りごたつ');
    if (shop.tatami) features.push('座敷');
    if (shop.karaoke) features.push('カラオケ');
    if (shop.card) features.push('カード可');
    if (shop.course) features.push('コース');
    if (shop.non_smoking) features.push('禁煙席');
    return features;
  };

  // 保存・修正ボタン押下時の処理
  const handleSaveOrModify = () => {
    if (!searchResult || searchResult.shops.length === 0) {
      alert('検索結果がありません');
      return;
    }

    // 検索条件を整理
    const searchConditions = {
      area: selectedSmallArea 
        ? smallAreas.find(a => a.code === selectedSmallArea)?.name
        : selectedMiddleArea
        ? middleAreas.find(a => a.code === selectedMiddleArea)?.name
        : largeAreas.find(a => a.code === selectedLargeArea)?.name,
      budget: budget,
      partyCapacity: partyCapacity
    };

    // Confirm画面へ遷移（通信③経由）
    navigate('/confirm', {
      state: {
        restaurants: searchResult.shops,
        searchConditions
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← ホームに戻る
        </button>
      </div>
      <h1>🍴 飲食店検索システム</h1>
      <p className="subtitle">エリア・予算・開催日から最適なお店を検索</p>

      {/* Google Form連携セクション */}
      <div className="form-integration">
        <div className="form-integration-title">📋 Google Form 回答連携</div>
        <div className="url-input-group">
          <input
            type="text"
            id="spreadsheetUrl"
            placeholder="スプレッドシートのURLを貼り付けてください"
            value={spreadsheetUrl}
            onChange={handleSpreadsheetUrlChange}
          />
        </div>
        <button
          type="button"
          className="fetch-btn"
          onClick={handleFetchForm}
          disabled={isFetchingForm}
        >
          {isFetchingForm ? '取得中...' : '📥 回答を取得'}
        </button>

        {formResponse && (
          <div className="attendance-info active">
            <div className="attendance-stats">
              <div className="stat-item">
                <div className="stat-number">{formResponse.attendance_yes}</div>
                <div className="stat-label">参加</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{formResponse.attendance_no}</div>
                <div className="stat-label">不参加</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{formResponse.total}</div>
                <div className="stat-label">合計回答数</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSearch}>
        {/* エリア選択 */}
        <div className="form-group">
          <label>
            エリア選択<span className="required">*</span>
          </label>
          <div className="area-hierarchy">
            <div className="area-selection">
              <select
                id="largeArea"
                value={selectedLargeArea}
                onChange={handleLargeAreaChange}
                required
              >
                <option value="">都道府県を選択してください</option>
                {largeAreas.map((area) => (
                  <option key={area.code} value={area.code}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="area-selection">
              <select
                id="middleArea"
                value={selectedMiddleArea}
                onChange={handleMiddleAreaChange}
                disabled={!selectedLargeArea}
              >
                <option value="">市区町村を選択してください</option>
                {middleAreas.map((area) => (
                  <option key={area.code} value={area.code}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="area-selection">
              <select
                id="smallArea"
                value={selectedSmallArea}
                onChange={(e) => setSelectedSmallArea(e.target.value)}
                disabled={!selectedMiddleArea || smallAreas.length === 0}
              >
                <option value="">詳細エリアを選択してください</option>
                {smallAreas.map((area) => (
                  <option key={area.code} value={area.code}>
                    {area.name}
                  </option>
                ))}
              </select>
              <p className="helper-text">
                ※ 詳細エリアは任意です(選択しない場合は市区町村全体で検索)
              </p>
            </div>
          </div>
        </div>

        {/* 予算 */}
        <div className="form-group">
          <label htmlFor="budget">
            予算<span className="required">*</span>
          </label>
          <select
            id="budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          >
            <option value="">予算を選択してください</option>
            <option value="B009">~500円</option>
            <option value="B010">501~1000円</option>
            <option value="B011">1001~1500円</option>
            <option value="B001">1501~2000円</option>
            <option value="B002">2001~3000円</option>
            <option value="B003">3001~4000円</option>
            <option value="B008">4001~5000円</option>
            <option value="B004">5001~7000円</option>
            <option value="B005">7001~10000円</option>
            <option value="B006">10001~15000円</option>
            <option value="B012">15001~20000円</option>
            <option value="B013">20001~30000円</option>
            <option value="B014">30001円~</option>
          </select>
        </div>

        {/* 参加人数 */}
        <div className="form-group">
          <label htmlFor="partyCapacity">
            参加人数<span className="required">*</span>
          </label>
          <input
            type="number"
            id="partyCapacity"
            min="1"
            value={partyCapacity}
            onChange={(e) => setPartyCapacity(parseInt(e.target.value))}
            disabled={isPartyCapacityDisabled}
            required
          />
          <p
            className="helper-text"
            style={{
              color: isPartyCapacityDisabled ? '#667eea' : '#666',
              fontWeight: isPartyCapacityDisabled ? '600' : 'normal',
            }}
          >
            ※{' '}
            {isPartyCapacityDisabled
              ? 'フォーム回答から自動設定されました(変更する場合はURLを削除してください)'
              : '宴会可能人数で検索します(フォーム回答を取得すると自動設定されます)'}
          </p>
        </div>

        {/* 開催日 */}
        <div className="form-group">
          <label htmlFor="eventDate">開催日(任意)</label>
          <input
            type="date"
            id="eventDate"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <p className="helper-text">
            ※ 指定した日に営業している店舗のみ検索します(定休日を考慮)
          </p>
        </div>

        {/* 取得件数 */}
        <div className="form-group">
          <label htmlFor="targetCount">取得件数</label>
          <select
            id="targetCount"
            value={targetCount}
            onChange={(e) => setTargetCount(parseInt(e.target.value))}
          >
            <option value={5}>5件</option>
            <option value={10}>10件</option>
            <option value={20}>20件</option>
            <option value={30}>30件</option>
            <option value={50}>50件</option>
          </select>
        </div>

        <button type="submit" disabled={isSearching}>
          🔍 検索する
        </button>
      </form>

      {isSearching && (
        <div className="loading active">
          <div className="spinner"></div>
          <p style={{ marginTop: '10px', color: '#667eea' }}>検索中...</p>
        </div>
      )}

      {errorMessage && (
        <div className="result error">
          <h3>❌ エラー</h3>
          <p>{errorMessage}</p>
          <p style={{ marginTop: '10px', fontSize: '12px' }}>
            詳細はブラウザのコンソール(F12)を確認してください。
          </p>
        </div>
      )}

      {searchResult && (
        <div className="result success">
          <h3>✅ 検索完了!</h3>
          <p>削除件数: {searchResult.deleted_count || 0}件</p>
          <p>検索件数: {searchResult.searched_count || 0}件</p>
          <p>保存件数: {searchResult.saved_to_dynamodb || 0}件</p>

          {searchResult.shops && searchResult.shops.length > 0 ? (
            <div className="shop-list">
              {searchResult.shops.map((shop, index) => {
                const features = getFeatures(shop);
                return (
                  <div key={shop.id} className="shop-item">
                    <div className="shop-name">
                      {index + 1}. {shop.name || 'N/A'}
                    </div>
                    {shop.catch && <div className="shop-catch">💬 {shop.catch}</div>}
                    {(shop.photo_url || shop.logo_image) && (
                      <div className="photo-gallery">
                        {shop.photo_url && (
                          <img
                            src={shop.photo_url}
                            alt="店舗写真"
                            className="shop-photo"
                          />
                        )}
                        {shop.logo_image && (
                          <img
                            src={shop.logo_image}
                            alt="ロゴ"
                            className="shop-photo"
                          />
                        )}
                      </div>
                    )}
                    <div className="shop-info">📍 {shop.address || 'N/A'}</div>
                    {shop.station_name && (
                      <div className="shop-info">🚉 {shop.station_name}</div>
                    )}
                    {shop.access && (
                      <div className="shop-info">🚶 {shop.access}</div>
                    )}
                    <div className="shop-info">🍽️ {shop.genre || 'N/A'}</div>
                    <div className="shop-info">💰 {shop.budget || 'N/A'}</div>
                    <div className="shop-info">
                      👥 {shop.party_capacity || 'N/A'}人
                    </div>
                    {features.length > 0 && (
                      <div className="shop-features">
                        {features.map((feature) => (
                          <span key={feature} className="feature-badge">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                    {shop.url && (
                      <a
                        href={shop.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shop-link"
                      >
                        詳細を見る →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ marginTop: '15px' }}>
              条件に合う店舗が見つかりませんでした。
            </p>
          )}

          <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
            <button
              onClick={handleSaveOrModify}
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
              ボタン：保存
            </button>
            <button
              onClick={handleSaveOrModify}
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
              ボタン：修正
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
    <Footer />
  </div>
  );
};

export default ManagePage;
