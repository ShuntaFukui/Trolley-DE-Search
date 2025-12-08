import { useNavigate } from 'react-router-dom';
import '../../styles/TrolleyGame.css';
import Header from '../common/Header';
import Footer from '../common/Footer';

export default function Home() {
  const navigate = useNavigate();

  const handleStart = () => {
    // home > manage へ遷移
    navigate('/manage');
  };

  return (
    <div className="page-container">
      <Header pageTitle="ホーム" />
      <div className="trolley-game page-content-flex">
        <div className="start-screen">
          <button 
            className="start-button" 
            onClick={handleStart}
          >
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="start-button-logo"
            />
            <span className="start-button-text">探しに行く</span>
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
