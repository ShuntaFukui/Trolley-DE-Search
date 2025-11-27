import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TrolleyGame from '../components/game/TrolleyGame';
import ResultPage from '../components/result/ResultPage';
import '../styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrolleyGame />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
