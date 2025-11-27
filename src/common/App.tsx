import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../components/home/Home';
import TrolleyGame from '../components/game/TrolleyGame';
import ResultPage from '../components/result/ResultPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<TrolleyGame />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
