import { Link } from 'react-router-dom';
import AbcTopNav from '../components/AbcTopNav.jsx';
import LandingPage from '../components/LandingPage.jsx';

export default function Exercise2Page() {
  return (
    <div className="abc-page">
      <AbcTopNav active="home" />

      <div className="exercise-banner">
        <Link to="/" className="exercise-banner__back">← Exercises</Link>
        <span className="exercise-banner__label">Exercise 2: Targeting</span>
        <span className="exercise-banner__hint">
          Use the demo bar below to switch contexts
        </span>
      </div>

      <LandingPage />
    </div>
  );
}
