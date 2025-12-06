import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../components/home/Home';
import ManagePage from '../components/search/ManagePage';
import ConfirmPage from '../components/confirm/ConfirmPage';
import StartPage from '../components/start/StartPage';
import TrolleyGame from '../components/game/TrolleyGame';
import ResultPage from '../components/result/ResultPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/confirm" element={<ConfirmPage />} />
        <Route path="/start" element={<StartPage />} />
        <Route path="/game" element={<TrolleyGame />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
