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

  // 画像を事前読み込みする関数
  const preloadImages = (shops: any[]) => {
    console.log('画像の事前読み込み開始...', shops.length, '枚');
    const imagePromises = shops
      .filter(shop => shop.photo_url)
      .map(shop => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            console.log('画像読み込み完了:', shop.name);
            resolve(img);
          };
          img.onerror = () => {
            console.warn('画像読み込み失敗:', shop.name, shop.photo_url);
            resolve(null); // エラーでも続行
          };
          img.src = shop.photo_url;
        });
      });
    
    return Promise.all(imagePromises);
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

      // recommended_peopleの事前処理: 1人または2人の場合は複製して3人にする
      // 0人の場合は重複回避アルゴリズムの対象外（そのまま残す）
      const preprocessRecommendedPeople = (restaurants: any[]) => {
        return restaurants.map(restaurant => {
          const people = restaurant.recommended_people || [];
          
          if (people.length === 0) {
            // 0人の場合はそのまま
            console.log(`店舗「${restaurant.name}」: recommended_people なし（スキップ）`);
            return restaurant;
          } else if (people.length === 1) {
            // 1人の場合は3人に複製
            console.log(`店舗「${restaurant.name}」: recommended_people 1人 → 3人に複製`);
            return {
              ...restaurant,
              recommended_people: [
                { ...people[0] },
                { ...people[0] },
                { ...people[0] }
              ]
            };
          } else if (people.length === 2) {
            // 2人の場合は1人目を複製して3人に
            console.log(`店舗「${restaurant.name}」: recommended_people 2人 → 3人に複製`);
            return {
              ...restaurant,
              recommended_people: [
                { ...people[0] },
                { ...people[1] },
                { ...people[0] }  // 1人目を複製
              ]
            };
          } else {
            // 3人以上の場合はそのまま
            return restaurant;
          }
        });
      };

      // 事前処理を実行
      const preprocessedShops = preprocessRecommendedPeople(selectedResult.selected_shops);

      // 重複チェック関数: 各位置で重複がないか確認（recommended_peopleが0人の店舗は除外）
      const checkDuplicates = (restaurants: any[]): { hasDuplicates: boolean, duplicates: any[] } => {
        const duplicates: any[] = [];
        
        for (let pos = 0; pos < 3; pos++) {
          const namesAtPos = new Map<string, number[]>();
          
          restaurants.forEach((r, idx) => {
            const person = r.recommended_people?.[pos];
            if (person?.name) {
              if (!namesAtPos.has(person.name)) {
                namesAtPos.set(person.name, []);
              }
              namesAtPos.get(person.name)!.push(idx + 1);
            }
          });
          
          namesAtPos.forEach((indices, name) => {
            if (indices.length > 1) {
              duplicates.push({ position: pos, name, restaurantIndices: indices });
            }
          });
        }
        
        return { hasDuplicates: duplicates.length > 0, duplicates };
      };

      // 全レストランのrecommended_peopleを重複しないように配列順序を最適化
      // トーナメントの構造:
      // - 1回戦: 8店舗全て → インデックス0を使用
      // - 準決勝: 勝者4店舗 → インデックス1を使用  
      // - 決勝/3位決定戦: 勝者2店舗 → インデックス2を使用
      const optimizeRecommendedPeopleSinglePass = (restaurants: any[]) => {
        console.log('=== ラベリング最適化開始 ===');
        console.log('レストラン数:', restaurants.length);
        
        // まず、各レストランの元の推奨者を確認
        restaurants.forEach((r, idx) => {
          console.log(`店舗${idx + 1} (${r.name}):`, 
            r.recommended_people?.map((p: any) => p.name).join(', ') || 'なし'
          );
        });

        // 結果を格納する配列（各レストランの最適化された推奨者リスト）
        const results: any[] = [];
        
        // 位置ごとの割り当て追跡: 位置 -> [{restaurantIndex, person}, ...]
        const positionAssignments: Map<number, Map<string, { restaurantIndex: number, person: any }>> = new Map([
          [0, new Map()],
          [1, new Map()],
          [2, new Map()]
        ]);

        // レストランごとに処理
        for (let restaurantIndex = 0; restaurantIndex < restaurants.length; restaurantIndex++) {
          const restaurant = restaurants[restaurantIndex];
          const people = restaurant.recommended_people || [];
          
          // recommended_peopleが0人の店舗は最適化の対象外（そのまま追加）
          if (people.length === 0) {
            console.log(`店舗${restaurantIndex + 1} (${restaurant.name}): recommended_people なし（スキップ）`);
            results.push(restaurant);
            continue;
          }

          console.log(`\n--- 店舗${restaurantIndex + 1} (${restaurant.name}) 処理開始 ---`);
          console.log('元の推奨者:', people.map((p: any) => p.name).join(', '));

          const optimizedPeople = new Array(3).fill(null);
          const usedInThisRestaurant = new Set<string>();

          // 3つの位置それぞれについて処理
          for (let targetPos = 0; targetPos < 3; targetPos++) {
            let assigned = false;

            // ステップ1: 元の位置にいた人物を試す
            if (people[targetPos]) {
              const person = people[targetPos];
              const name = person.name;
              const posMap = positionAssignments.get(targetPos)!;
              
              if (!posMap.has(name) && !usedInThisRestaurant.has(name)) {
                optimizedPeople[targetPos] = { ...person, label: targetPos };
                posMap.set(name, { restaurantIndex, person });
                usedInThisRestaurant.add(name);
                assigned = true;
                console.log(`位置${targetPos}: ${name} (元の位置)`);
              }
            }

            // ステップ2: このレストランの他の人物を試す
            if (!assigned) {
              for (const person of people) {
                const name = person.name;
                const posMap = positionAssignments.get(targetPos)!;
                
                if (!posMap.has(name) && !usedInThisRestaurant.has(name)) {
                  optimizedPeople[targetPos] = { ...person, label: targetPos };
                  posMap.set(name, { restaurantIndex, person });
                  usedInThisRestaurant.add(name);
                  assigned = true;
                  console.log(`位置${targetPos}: ${name} (代替候補)`);
                  break;
                }
              }
            }

            // ステップ3: 強制入れ替え - すでに使用されている人物を入れ替える
            if (!assigned) {
              console.warn(`⚠️ 位置${targetPos}で通常の割り当てができませんでした。強制入れ替えを試みます...`);
              
              const posMap = positionAssignments.get(targetPos)!;
              
              // このレストランの候補者のうち、すでにこの位置に割り当てられている人物を探す
              for (const person of people) {
                const name = person.name;
                
                if (usedInThisRestaurant.has(name)) {
                  continue; // このレストランで既に使用済み
                }
                
                if (posMap.has(name)) {
                  // この人物は他のレストランで使用されている
                  const previousAssignment = posMap.get(name)!;
                  const prevRestaurantIndex = previousAssignment.restaurantIndex;
                  const prevRestaurant = results[prevRestaurantIndex];
                  
                  console.log(`  🔄 入れ替え対象: ${name} (店舗${prevRestaurantIndex + 1}で使用中)`);
                  
                  // 前のレストランの候補者から、まだこの位置に使われていない人物を探す
                  const prevPeople = restaurants[prevRestaurantIndex].recommended_people || [];
                  let replacementFound = false;
                  
                  for (const prevPerson of prevPeople) {
                    const prevName = prevPerson.name;
                    
                    // この人物が現在の位置で使われておらず、前のレストランでも他の位置で使われていない場合
                    if (!posMap.has(prevName)) {
                      const prevUsedNames = new Set(
                        prevRestaurant.recommended_people
                          .filter((p: any) => p.label !== targetPos)
                          .map((p: any) => p.name)
                      );
                      
                      if (!prevUsedNames.has(prevName)) {
                        // 入れ替え実行
                        console.log(`  ✅ 入れ替え実行: ${prevName} を店舗${prevRestaurantIndex + 1}の位置${targetPos}に、${name} を店舗${restaurantIndex + 1}の位置${targetPos}に`);
                        
                        // 前のレストランの位置を更新
                        prevRestaurant.recommended_people = prevRestaurant.recommended_people.map((p: any) =>
                          p.label === targetPos ? { ...prevPerson, label: targetPos } : p
                        );
                        
                        // 位置マップを更新
                        posMap.delete(name);
                        posMap.set(prevName, { restaurantIndex: prevRestaurantIndex, person: prevPerson });
                        
                        // 現在のレストランに割り当て
                        optimizedPeople[targetPos] = { ...person, label: targetPos };
                        posMap.set(name, { restaurantIndex, person });
                        usedInThisRestaurant.add(name);
                        assigned = true;
                        replacementFound = true;
                        break;
                      }
                    }
                  }
                  
                  if (replacementFound) break;
                }
              }
              
              if (!assigned) {
                console.error(`❌ 店舗${restaurantIndex + 1}の位置${targetPos}に割り当てる人物が見つかりませんでした（入れ替えも失敗）`);
              }
            }
          }

          // nullを元のデータで埋める（配列を常に3要素に保つ）
          for (let i = 0; i < 3; i++) {
            if (optimizedPeople[i] === null && people[i]) {
              optimizedPeople[i] = { ...people[i], label: i };
              console.warn(`⚠️ 位置${i}をnullから元データで補完: ${people[i].name}`);
            }
          }

          const result = {
            ...restaurant,
            recommended_people: optimizedPeople.filter(p => p !== null)
          };

          // 配列が3つ未満の場合は警告
          if (result.recommended_people.length < 3) {
            console.error(`❌ 店舗${restaurantIndex + 1}のrecommended_peopleが${result.recommended_people.length}要素しかありません！`);
            console.error(`  元データ:`, people.map((p: any) => p.name).join(', '));
            console.error(`  最適化後:`, result.recommended_people.map((p: any) => p.name).join(', '));
          }

          console.log(`店舗${restaurantIndex + 1} 最適化完了:`, 
            result.recommended_people.map((p: any) => `${p.name}[${p.label}]`).join(', ')
          );

          results.push(result);
        }

        console.log('\n=== 位置別割り当て状況 ===');
        positionAssignments.forEach((nameMap, pos) => {
          const names = Array.from(nameMap.keys());
          console.log(`位置${pos} (${pos === 0 ? '1回戦' : pos === 1 ? '準決勝' : '決勝/3位決定戦'}):`, 
            names.join(', '), `(${names.length}/${restaurants.length}人)`
          );
        });

        return results;
      };

      // 繰り返しアルゴリズム: 重複がなくなるまで最適化を繰り返す
      const optimizeRecommendedPeople = (restaurants: any[], maxIterations: number = 10): any[] => {
        let currentRestaurants = restaurants;
        let iteration = 0;
        
        console.log('\n========================================');
        console.log('🔄 反復最適化アルゴリズム開始');
        console.log('========================================\n');
        
        while (iteration < maxIterations) {
          iteration++;
          console.log(`\n--- 第${iteration}回目の最適化 ---`);
          
          // 1回の最適化を実行
          const optimized = optimizeRecommendedPeopleSinglePass(currentRestaurants);
          
          // 重複チェック
          const { hasDuplicates, duplicates } = checkDuplicates(optimized);
          
          if (!hasDuplicates) {
            console.log('\n✅ 重複なし！最適化完了');
            console.log(`合計試行回数: ${iteration}回`);
            return optimized;
          }
          
          console.warn(`\n⚠️ 重複が残っています:`);
          duplicates.forEach(dup => {
            console.warn(`  位置${dup.position}: ${dup.name} が店舗 ${dup.restaurantIndices.join(', ')} で重複`);
          });
          
          // 重複がある場合、入れ替えを試みる
          console.log('\n🔄 追加の入れ替え処理を実行...');
          
          // 各重複について入れ替えを試みる
          duplicates.forEach(dup => {
            const { position, name, restaurantIndices } = dup;
            
            // 最後のレストランの該当人物を別の人物と入れ替える
            const lastRestIdx = restaurantIndices[restaurantIndices.length - 1] - 1;
            const lastRest = optimized[lastRestIdx];
            const people = lastRest.recommended_people;
            
            if (!people || people.length < 3) {
              console.error(`  ❌ 店舗${lastRestIdx + 1}のrecommended_peopleが不完全です (長さ: ${people?.length || 0})`);
              return;
            }
            
            // この位置で使われていない他の候補を探す
            const usedNamesAtPos = new Set<string>();
            optimized.forEach((r: any, idx: number) => {
              if (idx !== lastRestIdx && r.recommended_people?.[position]) {
                usedNamesAtPos.add(r.recommended_people[position].name);
              }
            });
            
            // 入れ替え可能な候補を探す
            let swapped = false;
            for (let i = 0; i < people.length; i++) {
              if (people[i] && people[i].label !== position && !usedNamesAtPos.has(people[i].name)) {
                // 入れ替え実行
                console.log(`  🔄 店舗${lastRestIdx + 1}: 位置${position}を ${name} から ${people[i].name} に変更`);
                
                // 配列を再構築（位置を保持）
                const newPeople = [...people];
                const targetPerson = newPeople[position];
                const sourcePerson = newPeople[i];
                
                newPeople[position] = { ...sourcePerson, label: position };
                newPeople[i] = { ...targetPerson, label: i };
                
                lastRest.recommended_people = newPeople;
                swapped = true;
                break;
              }
            }
            
            if (!swapped) {
              console.warn(`  ❌ 店舗${lastRestIdx + 1}の位置${position}で入れ替え候補が見つかりませんでした`);
            }
          });
          
          // 次の反復に進む
          currentRestaurants = optimized;
        }
        
        console.error(`\n❌ 最大試行回数(${maxIterations}回)に達しました。重複が残っています。`);
        const { duplicates } = checkDuplicates(currentRestaurants);
        duplicates.forEach(dup => {
          console.error(`  位置${dup.position}: ${dup.name} が店舗 ${dup.restaurantIndices.join(', ')} で重複`);
        });
        
        return currentRestaurants;
      };

      // ラベル重複を解消（配列順序を最適化、重複がなくなるまで繰り返し）
      // 事前処理済みのデータを使用
      const optimizedRestaurants = optimizeRecommendedPeople(preprocessedShops);
      
      console.log('ラベリング最適化完了:', optimizedRestaurants);

      // ローディング中に画像を事前読み込み
      await preloadImages(optimizedRestaurants);
      console.log('すべての画像の事前読み込み完了');

      // manage > game へ遷移（ラベリング済みの店舗を渡す）
      navigate('/game', {
        state: {
          restaurants: optimizedRestaurants
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

            <button type="submit" className="fetch-btn" disabled={isSearching}>
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
