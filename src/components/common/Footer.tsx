import React from 'react';
import '../../styles/index.css';

interface FooterProps {
  onStartGame?: () => void;
  canStartGame?: boolean;
}

const Footer: React.FC<FooterProps> = ({ onStartGame, canStartGame = false }) => {
  // ManagePageからの呼び出し時はゲーム開始ボタンのみ表示
  if (onStartGame) {
    return (
      <footer className="app-footer">
        <div className="footer-content">
          <button
            onClick={onStartGame}
            disabled={!canStartGame}
            className="footer-game-button"
          >
            🎮 ゲーム開始
          </button>
        </div>
        <div className="footer-team-name">Team I "Neptune"</div>
      </footer>
    );
  }

  // 通常のFooter
  return (
    <footer className="app-footer footer-empty">
      <div className="footer-team-name">Team I "Neptune"</div>
    </footer>
  );
};

export default Footer;
