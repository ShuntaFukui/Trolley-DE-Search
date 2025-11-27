import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/TrolleyGame.css';
import Countdown from './Countdown';
import { apiService, type Restaurant, type TournamentMatch, type TournamentResult } from '../../services/api';

type GameState = 'start' | 'countdown' | 'playing' | 'answering' | 'result' | 'loading';
type RoundType = '1回戦' | '準決勝' | '3位決定戦' | '決勝';

interface CurrentMatch {
  round: RoundType;
  matchNumber: number;
  options: [Restaurant, Restaurant];
}

export default function TrolleyGame() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('loading');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);

  // 選択肢
  const [allOptions, setAllOptions] = useState<Restaurant[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);

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

  // 初回マウント時に選択肢を取得
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setGameState('loading');
        const options = await apiService.getOptions();
        setAllOptions(options);
        setLoadingError(null);
        setGameState('start');
      } catch (error) {
        console.error('Failed to load options:', error);
        setLoadingError('選択肢の読み込みに失敗しました');
        setGameState('start');
      }
    };

    fetchOptions();
  }, []);

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
    // 選択肢が取得できていない場合は開始しない
    if (allOptions.length === 0) {
      setLoadingError('選択肢が読み込まれていません');
      return;
    }

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

    setTimeout(() => {
      setIsAnimating(false);
      setAnimationDirection(null);
      setSelectedAnswer(null);
      
      // 次の対戦を決定
      proceedToNextMatch(currentMatch, winner, loser, updatedMatches);
    }, 1500);
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
    <div className="trolley-game">
      {gameState === 'loading' && (
        <div className="start-screen">
          <div className="game-title">
            <div className="title-main">トロッコ DE サーチ</div>
            <div className="title-sub">TROLLEY de SEARCH</div>
          </div>
          <div className="game-info">
            <p className="loading-message">選択肢を読み込み中...</p>
          </div>
        </div>
      )}

      {gameState === 'start' && (
        <div className="start-screen">
          <div className="game-title">
            <div className="title-main">トロッコ DE サーチ</div>
            <div className="title-sub">TROLLEY de SEARCH</div>
          </div>
          <div className="game-info">
            <p>トーナメント形式で好みを決定！</p>
            <p className="question-count">全7試合（1回戦4試合・準決勝2試合・3位決定戦・決勝）</p>
            {loadingError && <p className="error-message">{loadingError}</p>}
          </div>
          <button className="start-button" onClick={startGame} disabled={allOptions.length === 0}>
            スタート
          </button>
        </div>
      )}

      {gameState === 'countdown' && (
        <Countdown onComplete={handleCountdownComplete} />
      )}

      {(gameState === 'playing' || gameState === 'answering') && currentMatch && (
        <div 
          className={`game-screen ${isAnimating ? `animating-${animationDirection}` : ''}`}
        >
          {/* 次の背景レイヤー */}
          <div className="background-next"></div>
          
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
  );
}
