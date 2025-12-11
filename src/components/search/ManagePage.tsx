import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/index.css';
import { apiService } from '../../services/api';
import type { Area, SearchResult, FormResponse } from '../../services/api';
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
  const [partyCapacity, setPartyCapacity] = useState<number | ''>(''); // 初期状態は空欄
  const [eventDate, setEventDate] = useState('');
  // const [targetCount, setTargetCount] = useState(10);

  // Google Form関連の状態
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [formResponse, setFormResponse] = useState<FormResponse | null>(null);
  const [isFetchingForm, setIsFetchingForm] = useState(false);

  // 検索結果の状態
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isStartingGame, setIsStartingGame] = useState(false); // ゲーム開始中の状態

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
        target_count: 30,
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

  // ゲーム開始ボタン押下時の処理
  const handleStartGame = async () => {
    const shops = searchResult?.shops || searchResult?.selected_shops || [];
    if (!searchResult || shops.length === 0) {
      alert('検索結果がありません');
      return;
    }

    setIsStartingGame(true); // ローディング開始

    try {
      console.log('select-restaurants API呼び出し開始...');

      // select-restaurants APIを呼び出してAI選定を実行
      const selectedResult = await apiService.selectRestaurants();

      console.log('select-restaurants API レスポンス:', selectedResult);

      if (!selectedResult.selected_shops || selectedResult.selected_shops.length === 0) {
        alert('店舗の選定に失敗しました');
        return;
      }

      // manage > game へ遷移（AI選定された店舗を渡す）
      navigate('/game', {
        state: {
          restaurants: selectedResult.selected_shops
        }
      });
    } catch (error) {
      console.error('select-restaurants API エラー:', error);
      alert('店舗選定中にエラーが発生しました: ' + (error as Error).message);
    } finally {
      setIsStartingGame(false); // ローディング終了
    }
  };

  return (
    <div className="manage-page-container">
      <Header pageTitle="検索" />
      <div className="manage-page-content">
        <div className="container manage-container">
          <div className="manage-header">
            <button
              onClick={() => navigate('/')}
              className="manage-back-button"
            >
              ホームに戻る
            </button>
          </div>
          <h1>🍴店舗検索</h1>
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
              {isFetchingForm ? '取得中...' : '回答を取得'}
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
                    <div className="stat-label">回答数</div>
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
                    <option value="">広域エリアを選択してください</option>
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
                    ※ 詳細エリアの入力は任意です
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
                onChange={(e) => setPartyCapacity(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="人数を入力してください"
                required
              />
              <p
                className="helper-text"
                style={{
                  color: formResponse && partyCapacity !== formResponse.attendance_yes ? '#ff6b6b' : formResponse ? '#ffffff' : '#0f3460',
                  fontWeight: formResponse ? '600' : 'normal',
                }}
              >
                {formResponse
                  ? partyCapacity !== formResponse.attendance_yes
                    ? `※ Google Formの参加人数(${formResponse.attendance_yes}名)と異なります。`
                    : ''
                  : '※ フォーム回答を取得すると自動設定されます'}
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
                ※ 指定した日に営業している店舗のみ検索します
              </p>
            </div>

            {/* 取得件数
            <div className="form-group">
              <label htmlFor="targetCount">取得件数</label>
              <input
                type="range"
                id="targetCount"
                min="10"
                max="50"
                step="10"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value))}
                className="manage-slider-container"
              />
              <div className="manage-slider-labels">
                <span>狭く</span>
                <span>広く</span>
              </div>
            </div> */}

            <button type="submit" disabled={isSearching}>
              検索する
            </button>
          </form>

          {isSearching && (
            <div className="loading active">
              <div className="spinner"></div>
              <p className="manage-loading-text">検索中...</p>
            </div>
          )}

          {errorMessage && (
            <div className="result error">
              <h3>❌ エラー</h3>
              <p>{errorMessage}</p>
              <p className="manage-error-details">
                詳細はブラウザのコンソール(F12)を確認してください。
              </p>
            </div>
          )}

          {searchResult && (
            <div className="result success">
              <h3>✅ 検索完了!</h3>

              {
                (!searchResult.shops && !searchResult.selected_shops) || ((searchResult.shops?.length || 0) === 0 && (searchResult.selected_shops?.length || 0) === 0) ? (
                  <p className="manage-result-text">
                    条件に合う店舗が見つかりませんでした。
                  </p>
                ) :  <p className="manage-result-text">
                    ゲームを始めましょう！
                  </p>
              }
            </div>
          )}
        </div>

        {/* ゲーム開始ローディングオーバーレイ */}
        {isStartingGame && (
          <div className="game-loading-overlay">
            <div className="game-loading-content">
              <div className="game-loading-trolley">
                <img src="/images/trolley.webp" alt="トロッコ" className="game-loading-trolley-image" />
              </div>
              <div className="game-loading-text">
                <div className="game-loading-title">店舗を選定中</div>
                <div className="game-loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer
        onStartGame={handleStartGame}
        canStartGame={!!(searchResult && ((searchResult.shops && searchResult.shops.length > 0) || (searchResult.selected_shops && searchResult.selected_shops.length > 0)) && !isStartingGame)}
      />
    </div>
  );
};

export default ManagePage;
