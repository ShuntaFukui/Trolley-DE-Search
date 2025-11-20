import { useState } from 'react';
import './TrolleyGame.css';
import Countdown from './Countdown';

interface Question {
  id: number;
  options: string[];
}

const questions: Question[] = [
  {
    id: 1,
    options: ['犬派', '猫派'],
  },
  {
    id: 2,
    options: ['朝型', '夜型'],
  },
  {
    id: 3,
    options: ['海派', '山派'],
  },
  {
    id: 4,
    options: ['暑い夏', '寒い冬'],
  },
  {
    id: 5,
    options: ['ご飯', 'パン'],
  },
];

type GameState = 'start' | 'countdown' | 'playing' | 'answering' | 'result';

export default function TrolleyGame() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);

  const startGame = () => {
    setGameState('countdown');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsAnimating(false);
    setAnimationDirection(null);
  };

  const handleCountdownComplete = () => {
    setGameState('playing');
  };

  const handleAnswer = (answerIndex: number | null) => {
    if (gameState === 'answering') return;

    setSelectedAnswer(answerIndex);
    setGameState('answering');

    // アニメーション方向を設定
    setAnimationDirection(answerIndex === 0 ? 'left' : 'right');
    setIsAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
      setAnimationDirection(null);
      setSelectedAnswer(null); // 選択状態をリセット
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setGameState('playing');
      } else {
        setGameState('result');
      }
    }, 1500);
  };

  return (
    <div className="trolley-game">
      {gameState === 'start' && (
        <div className="start-screen">
          <div className="game-title">
            <div className="title-main">トロッコ DE サーチ</div>
            <div className="title-sub">TROLLEY de SEARCH</div>
          </div>
          <div className="game-info">
            <p>２択に答えてゴールを目指せ！</p>
            <p className="question-count">全{questions.length}問</p>
          </div>
          <button className="start-button" onClick={startGame}>
            スタート
          </button>
        </div>
      )}

      {gameState === 'countdown' && (
        <Countdown onComplete={handleCountdownComplete} />
      )}

      {(gameState === 'playing' || gameState === 'answering') && (
        <div 
          className={`game-screen ${isAnimating ? `animating-${animationDirection}` : ''}`}
        >
          {/* 次の背景レイヤー */}
          <div className="background-next"></div>
          
          <div className="game-header">
            <div className="question-number">
              第{currentQuestion + 1}問 / 全{questions.length}問
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
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                className={`answer-btn ${
                  gameState === 'answering' && index === selectedAnswer
                    ? 'selected'
                    : ''
                }`}
                onClick={() => handleAnswer(index)}
                disabled={gameState === 'answering'}
              >
                <span className="answer-text">{option}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="result-screen">
          <div className="result-title">終了！</div>
          <button className="retry-button" onClick={startGame}>
            もう一度プレイ
          </button>
        </div>
      )}
    </div>
  );
}
