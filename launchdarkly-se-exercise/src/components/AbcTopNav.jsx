import { Link } from 'react-router-dom';

// The top nav for the ABC Company landing page and checkout flow.
// Visually distinct from the LaunchDarkly-styled exercises landing page
// so the evaluator can tell at a glance "this is the fictional product"
// vs. "this is the demo's chrome."
export default function AbcTopNav({ active }) {
  return (
    <nav className="abc-nav" aria-label="ABC Company navigation">
      <div className="abc-nav__brand">
        <Link to="/exercise-2" className="abc-nav__logo">
          <span className="abc-nav__logo-mark">▲</span>
          <span className="abc-nav__logo-text">ABC Company</span>
        </Link>
      </div>
      <div className="abc-nav__links">
        <Link
          to="/exercise-2"
          className={`abc-nav__link ${active === 'home' ? 'abc-nav__link--active' : ''}`}
        >
          Home
        </Link>
        <a href="#features" className="abc-nav__link">Features</a>
        <a href="#pricing" className="abc-nav__link">Pricing</a>
        <Link
          to="/exercise-1"
          className={`abc-nav__cta ${active === 'checkout' ? 'abc-nav__cta--active' : ''}`}
        >
          Checkout →
        </Link>
      </div>
    </nav>
  );
}
