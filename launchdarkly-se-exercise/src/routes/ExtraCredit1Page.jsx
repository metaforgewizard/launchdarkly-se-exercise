import { Link } from 'react-router-dom';
import AbcTopNav from '../components/AbcTopNav.jsx';
import LandingPage from '../components/LandingPage.jsx';

export default function ExtraCredit1Page() {
  return (
    <div className="abc-page">
      <AbcTopNav active="home" />

      <div className="exercise-banner">
        <Link to="/" className="exercise-banner__back">← Exercises</Link>
        <span className="exercise-banner__label">Extra Credit 1: Experimentation</span>
        <span className="exercise-banner__hint">
          Switch contexts and fire metric events in the demo bar
        </span>
      </div>

      <LandingPage trackOnCtaClick={true} />
    </div>
  );
}
