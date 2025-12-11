import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/TrolleyGame.css';
import Countdown from './Countdown';
import { apiService, type Restaurant, type TournamentMatch, type TournamentResult } from '../../services/api';
import Header from '../common/Header';
import Footer from '../common/Footer';

type GameState = 'countdown' | 'playing' | 'answering' | 'result';
type RoundType = '1回戦' | '準決勝' | '3位決定戦' | '決勝';

interface CurrentMatch {
  round: RoundType;
  matchNumber: number;
  options: [Restaurant, Restaurant];
}

export default function TrolleyGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const [gameState, setGameState] = useState<GameState>('countdown');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [isHoverDisabled, setIsHoverDisabled] = useState(false);

  // 選択肢
  const [allOptions, setAllOptions] = useState<Restaurant[]>([]);

  // トーナメント用の状態
  const [shuffledOptions, setShuffledOptions] = useState<Restaurant[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState<CurrentMatch | null>(null);

  // トーナメントの進行状態
  const [round1Winners, setRound1Winners] = useState<Restaurant[]>([]);
  const [round1Losers, setRound1Losers] = useState<Restaurant[]>([]);
  const [semiFinalWinners, setSemiFinalWinners] = useState<Restaurant[]>([]);
  const [semiFinalLosers, setSemiFinalLosers] = useState<Restaurant[]>([]);
  const [thirdPlaceWinner, setThirdPlaceWinner] = useState<Restaurant | null>(null);
  const [thirdPlaceLoser, setThirdPlaceLoser] = useState<Restaurant | null>(null);

  // Home画面から渡されたレストランデータを受け取る
  useEffect(() => {
    const restaurants = location.state?.restaurants;
    if (!restaurants || restaurants.length === 0) {
      navigate('/');
      return;
    }
    setAllOptions(restaurants);
  }, [location, navigate]);

  // ラウンドに応じたrecommended_peopleのインデックスを取得
  const getRecommendedPersonIndex = (round: RoundType): number => {
    switch (round) {
      case '1回戦':
        return 0; // 1人目
      case '準決勝':
        return 1; // 2人目
      case '3位決定戦':
      case '決勝':
        return 2; // 3人目
      default:
        return 0;
    }
  };

  // テスト用: ランダムなコメントを生成（10~20文字）
  const getRandomComment = () => {
    const comments = [
      'ここ美味しいよ!',
      '雰囲気が最高です',
      'おすすめの店です',
      'コスパが良いです',
      'また行きたい店',
      '接客が素晴らしい',
      '味が絶品でした',
      '落ち着ける空間',
      'デートにぴったり',
      '料理が本格的です',
      '居心地が良い店',
      'ボリューム満点!',
      '新鮮な食材です',
      'リピート確定!',
      'みんなで楽しめる'
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  };

  // Fisher-Yates シャッフル
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startGame = () => {
    // 選択肢をシャッフル
    const shuffled = shuffleArray(allOptions);
    setShuffledOptions(shuffled);
    
    // 状態をリセット
    setMatches([]);
    setRound1Winners([]);
    setRound1Losers([]);
    setSemiFinalWinners([]);
    setSemiFinalLosers([]);
    setThirdPlaceWinner(null);
    setThirdPlaceLoser(null);
    setSelectedAnswer(null);
    setIsAnimating(false);
    setAnimationDirection(null);
    
    setGameState('countdown');
  };

  // allOptionsが設定されたらゲーム開始
  useEffect(() => {
    if (allOptions.length > 0) {
      startGame();
    }
  }, [allOptions]);

  const handleCountdownComplete = () => {
    // 1回戦の最初の対戦を設定
    setCurrentMatch({
      round: '1回戦',
      matchNumber: 1,
      options: [shuffledOptions[0], shuffledOptions[1]],
    });
    setGameState('playing');
  };

  const handleAnswer = (answerIndex: number | null) => {
    if (gameState === 'answering' || answerIndex === null || !currentMatch) return;

    const winner = currentMatch.options[answerIndex];
    const loser = currentMatch.options[1 - answerIndex];

    setSelectedAnswer(answerIndex);
    setGameState('answering');

    // 試合結果を記録
    const match: TournamentMatch = {
      round: currentMatch.round,
      matchNumber: currentMatch.matchNumber,
      options: currentMatch.options,
      winner,
      loser,
      answeredAt: new Date().toISOString(),
    };
    const updatedMatches = [...matches, match];
    setMatches(updatedMatches);

    // アニメーション方向を設定
    setAnimationDirection(answerIndex === 0 ? 'left' : 'right');
    setIsAnimating(true);

    // 決勝の場合は背景アニメーション後に暗転→結果画面
    if (currentMatch.round === '決勝') {
      setTimeout(() => {
        // 背景アニメーション完了後、画面を非表示にして暗転
        setIsAnimating(false);
        setAnimationDirection(null);
        setCurrentMatch(null); // 画面を非表示
        setGameState('result'); // 状態を結果に変更
        
        // 暗転エフェクトのための追加待機
        setTimeout(() => {
          setSelectedAnswer(null);
          proceedToNextMatch(currentMatch, winner, loser, updatedMatches);
        }, 0); // 暗転時間を短縮
      }, 1500); // 背景アニメーション時間
    } else {
      // 通常の試合は1.5秒待機
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationDirection(null);
        setSelectedAnswer(null);
        
        // 次の対戦を決定
        proceedToNextMatch(currentMatch, winner, loser, updatedMatches);
      }, 1500);
    }
  };

  const proceedToNextMatch = (
    match: CurrentMatch,
    winner: Restaurant,
    loser: Restaurant,
    updatedMatches: TournamentMatch[]
  ) => {
    if (match.round === '1回戦') {
      const newWinners = [...round1Winners, winner];
      const newLosers = [...round1Losers, loser];
      setRound1Winners(newWinners);
      setRound1Losers(newLosers);

      if (match.matchNumber < 4) {
        // 次の1回戦
        const nextMatchNum = match.matchNumber + 1;
        setIsHoverDisabled(true);
        setCurrentMatch({
          round: '1回戦',
          matchNumber: nextMatchNum,
          options: [
            shuffledOptions[nextMatchNum * 2 - 2],
            shuffledOptions[nextMatchNum * 2 - 1],
          ],
        });
        setGameState('playing');
        setTimeout(() => setIsHoverDisabled(false), 100);
      } else {
        // 準決勝へ
        setIsHoverDisabled(true);
        setCurrentMatch({
          round: '準決勝',
          matchNumber: 1,
          options: [newWinners[0], newWinners[1]],
        });
        setGameState('playing');
        setTimeout(() => setIsHoverDisabled(false), 100);
      }
    } else if (match.round === '準決勝') {
      const newWinners = [...semiFinalWinners, winner];
      const newLosers = [...semiFinalLosers, loser];
      setSemiFinalWinners(newWinners);
      setSemiFinalLosers(newLosers);

      if (match.matchNumber === 1) {
        // 準決勝第2試合
        setIsHoverDisabled(true);
        setCurrentMatch({
          round: '準決勝',
          matchNumber: 2,
          options: [round1Winners[2], round1Winners[3]],
        });
        setGameState('playing');
        setTimeout(() => setIsHoverDisabled(false), 100);
      } else {
        // 3位決定戦へ
        setIsHoverDisabled(true);
        setCurrentMatch({
          round: '3位決定戦',
          matchNumber: 1,
          options: [newLosers[0], newLosers[1]],
        });
        setGameState('playing');
        setTimeout(() => setIsHoverDisabled(false), 100);
      }
    } else if (match.round === '3位決定戦') {
      setThirdPlaceWinner(winner);
      setThirdPlaceLoser(loser);

      // 決勝へ
      setIsHoverDisabled(true);
      setCurrentMatch({
        round: '決勝',
        matchNumber: 1,
        options: [semiFinalWinners[0], semiFinalWinners[1]],
      });
      setGameState('playing');
      setTimeout(() => setIsHoverDisabled(false), 100);
    } else if (match.round === '決勝') {
      // 最終順位を確定
      if (thirdPlaceWinner && thirdPlaceLoser) {
        const ranking: TournamentResult = {
          first: winner,
          second: loser,
          third: thirdPlaceWinner,
          fourth: thirdPlaceLoser,
          fifth: round1Losers,
        };

        // 結果を保存してから結果ページに遷移
        saveGameResult(shuffledOptions, updatedMatches, ranking);
      }
    }
  };

  const saveGameResult = async (
    _initialOptions: Restaurant[],
    _tournamentMatches: TournamentMatch[],
    ranking: TournamentResult
  ) => {
    // restaurant-info APIを呼び出して詳細情報を取得
    try {
      console.log('📡 Fetching restaurant info...');
      const restaurantInfo = await apiService.getRestaurantInfo();
      console.log('✅ Restaurant info fetched:', restaurantInfo);
      
      // 結果ページに遷移（詳細情報を渡す）
      navigate('/result', {
        state: {
          finalRanking: ranking,
          restaurantInfo: restaurantInfo,
          isSaving: false,
        },
        replace: true,
      });
    } catch (infoError) {
      console.error('⚠️ Failed to fetch restaurant info:', infoError);
      
      // レストラン情報取得失敗でも結果ページに遷移
      navigate('/result', {
        state: {
          finalRanking: ranking,
          isSaving: false,
        },
        replace: true,
      });
    }
  };

  return (
    <div className="page-container">
      <Header pageTitle="トロッコ" />
      <div className="trolley-game page-content-flex">
        {gameState === 'countdown' && (
          <Countdown onComplete={handleCountdownComplete} />
        )}

        {(gameState === 'playing' || gameState === 'answering') && currentMatch && (
          <div 
            className={`game-screen ${isAnimating ? `animating-${animationDirection}` : ''}`}
          >
            {/* 次の背景レイヤー - 決勝では表示しない */}
            {currentMatch.round !== '決勝' && <div className="background-next"></div>}
            
            {/* 左側のアバター */}
            <div 
              className={`avatar avatar-left ${isAnimating ? 'avatar-fade-out' : ''}`}
            >
              <div className="avatar-comment">
                {currentMatch.options[0]?.recommended_people?.[getRecommendedPersonIndex(currentMatch.round)]?.comment || getRandomComment()}
              </div>
              <img 
                src="/images/avatar_left.png" 
                alt="Avatar Left" 
                className="avatar-image"
              />
              <div className="avatar-name">
                {currentMatch.options[0]?.recommended_people?.[getRecommendedPersonIndex(currentMatch.round)]?.name || 'User'}
              </div>
            </div>

            {/* 右側のアバター */}
            <div 
              className={`avatar avatar-right ${isAnimating ? 'avatar-fade-out' : ''}`}
            >
              <div className="avatar-comment">
                {currentMatch.options[1]?.recommended_people?.[getRecommendedPersonIndex(currentMatch.round)]?.comment || getRandomComment()}
              </div>
              <img 
                src="/images/avatar_right.png" 
                alt="Avatar Right" 
                className="avatar-image"
              />
              <div className="avatar-name">
                {currentMatch.options[1]?.recommended_people?.[getRecommendedPersonIndex(currentMatch.round)]?.name || 'User'}
              </div>
            </div>
            
            <div className="game-header">
              <div className="tournament-info">
                <div className="round-name">どっちに行く?</div>
              </div>
            </div>

            {/* トロッコの表示 */}
            <div className="trolley-container">
              <img 
                src="/images/trolley_1.png" 
                alt="トロッコ" 
                className="trolley-image"
              />
            </div>

            <div className="answer-buttons">
              {currentMatch.options.map((option, index) => (
                <button
                  key={`${currentMatch.round}-${currentMatch.matchNumber}-${index}-${option.shop_id}`}
                  className={`answer-btn ${
                    gameState === 'answering' && index === selectedAnswer
                      ? 'selected'
                      : ''
                  } ${isHoverDisabled ? 'no-hover' : ''}`}
                  onClick={() => handleAnswer(index)}
                  disabled={gameState === 'answering'}
                >
                  {option.photo_url && (
                    <div className="restaurant-photo">
                      <img src={option.photo_url} alt={option.name} />
                    </div>
                  )}
                  <div className="restaurant-info">
                    <div className="restaurant-name">{option.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
