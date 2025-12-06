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
        setCurrentMatch({
          round: '1回戦',
          matchNumber: nextMatchNum,
          options: [
            shuffledOptions[nextMatchNum * 2 - 2],
            shuffledOptions[nextMatchNum * 2 - 1],
          ],
        });
        setGameState('playing');
      } else {
        // 準決勝へ
        setCurrentMatch({
          round: '準決勝',
          matchNumber: 1,
          options: [newWinners[0], newWinners[1]],
        });
        setGameState('playing');
      }
    } else if (match.round === '準決勝') {
      const newWinners = [...semiFinalWinners, winner];
      const newLosers = [...semiFinalLosers, loser];
      setSemiFinalWinners(newWinners);
      setSemiFinalLosers(newLosers);

      if (match.matchNumber === 1) {
        // 準決勝第2試合
        setCurrentMatch({
          round: '準決勝',
          matchNumber: 2,
          options: [round1Winners[2], round1Winners[3]],
        });
        setGameState('playing');
      } else {
        // 3位決定戦へ
        setCurrentMatch({
          round: '3位決定戦',
          matchNumber: 1,
          options: [newLosers[0], newLosers[1]],
        });
        setGameState('playing');
      }
    } else if (match.round === '3位決定戦') {
      setThirdPlaceWinner(winner);
      setThirdPlaceLoser(loser);

      // 決勝へ
      setCurrentMatch({
        round: '決勝',
        matchNumber: 1,
        options: [semiFinalWinners[0], semiFinalWinners[1]],
      });
      setGameState('playing');
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
    initialOptions: Restaurant[],
    tournamentMatches: TournamentMatch[],
    ranking: TournamentResult
  ) => {
    try {
      const result = await apiService.saveResult({
        tournament: {
          initialOptions,
          matches: tournamentMatches,
          finalRanking: ranking,
        },
        completedAt: new Date().toISOString(),
      });
      console.log('✅ Game result saved:', result);
      
      // 結果ページに遷移
      navigate('/result', {
        state: {
          finalRanking: ranking,
          isSaving: false,
        },
        replace: true,
      });
    } catch (error) {
      console.error('❌ Failed to save game result:', error);
      
      // エラーがあっても結果ページに遷移
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
    <div className="trolley-game" style={{ flex: 1 }}>
      {gameState === 'countdown' && (
        <Countdown onComplete={handleCountdownComplete} />
      )}

      {(gameState === 'playing' || gameState === 'answering') && currentMatch && (
        <div 
          className={`game-screen ${isAnimating ? `animating-${animationDirection}` : ''}`}
        >
          {/* 次の背景レイヤー - 決勝では表示しない */}
          {currentMatch.round !== '決勝' && <div className="background-next"></div>}
          
          <div className="game-header">
            <div className="tournament-info">
              <div className="round-name">{currentMatch.round}</div>
              <div className="match-info">
                {currentMatch.round === '1回戦' && `第${currentMatch.matchNumber}試合`}
                {currentMatch.round === '準決勝' && `第${currentMatch.matchNumber}試合`}
              </div>
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
                key={option.shop_id}
                className={`answer-btn ${
                  gameState === 'answering' && index === selectedAnswer
                    ? 'selected'
                    : ''
                }`}
                onClick={() => handleAnswer(index)}
                disabled={gameState === 'answering'}
              >
                <div className="restaurant-info">
                  <div className="restaurant-name">{option.name}</div>
                  <div className="restaurant-genre">{option.genre}</div>
                  <div className="restaurant-catch">{option.catch}</div>
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
