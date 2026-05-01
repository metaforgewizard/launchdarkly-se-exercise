import { Routes, Route } from 'react-router-dom';
import HomePage from './routes/HomePage.jsx';
import Exercise1Page from './routes/Exercise1Page.jsx';
import Exercise2Page from './routes/Exercise2Page.jsx';
import ExtraCredit1Page from './routes/ExtraCredit1Page.jsx';
import DemoBar from './components/DemoBar.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/exercise-1" element={<Exercise1Page />} />
          <Route path="/exercise-2" element={<Exercise2Page />} />
          <Route path="/extra-credit-1" element={<ExtraCredit1Page />} />
        </Routes>
      </main>
      <DemoBar />
    </div>
  );
}
