import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../components/home/Home';
import ManagePage from '../components/search/ManagePage';
import TrolleyGame from '../components/game/TrolleyGame';
import ResultPage from '../components/result/ResultPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/game" element={<TrolleyGame />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
