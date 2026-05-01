import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header__brand">
          <span className="home-header__logo-mark">◆</span>
          <span className="home-header__logo-text">LaunchDarkly</span>
        </div>
        <h1 className="home-header__title">
          Technical Exercise for ABC Company
        </h1>
        <p className="home-header__subtitle">
          A sample app demonstrating feature flags, targeting, and experimentation
          in a fictional B2B SaaS product.
        </p>
      </header>

      <section className="home-intro">
        <p>
          This submission contains three demos. Each one is scoped to a specific
          exercise from the technical prompt and lives at its own route. The control
          bar pinned to the bottom of every page is the demo's instrumentation —
          use it to drive the demos without changing code.
        </p>
        <p>
          The bar's contents change depending on which exercise you're viewing.
          Toggle flags from your LaunchDarkly console to drive Exercise 1; switch
          contexts in the bar to drive Exercise 2; fire metric events to drive
          Extra Credit 1.
        </p>
      </section>

      <section className="home-cards">
        <Link to="/exercise-1" className="home-card">
          <div className="home-card__label">Exercise 1</div>
          <h2 className="home-card__title">Release &amp; Remediate</h2>
          <p className="home-card__body">
            A checkout flow wrapped in a feature flag. Toggle the flag in your
            LaunchDarkly console to release the new checkout instantly — no
            page reload. The demo shows what production remediation looks like
            when an issue is detected.
          </p>
          <div className="home-card__cta">View demo →</div>
        </Link>

        <Link to="/exercise-2" className="home-card">
          <div className="home-card__label">Exercise 2</div>
          <h2 className="home-card__title">Targeting</h2>
          <p className="home-card__body">
            ABC Company's landing page hero changes based on user context.
            Switch contexts in the demo bar to watch individual targeting
            and rule-based targeting fire — including how individual targets
            override rules.
          </p>
          <div className="home-card__cta">View demo →</div>
        </Link>

        <Link to="/extra-credit-1" className="home-card">
          <div className="home-card__label">Extra Credit 1</div>
          <h2 className="home-card__title">Experimentation</h2>
          <p className="home-card__body">
            The same landing page as Exercise 2, with metric events layered on
            top. Fire <code>track()</code> calls from the demo bar to feed an
            experiment configured in your LaunchDarkly console.
          </p>
          <div className="home-card__cta">View demo →</div>
        </Link>
      </section>

      <footer className="home-footer">
        <p>
          See the README in the repository root for setup, the LaunchDarkly console
          configuration walkthrough, and notes on how each exercise maps to the prompt's
          requirements.
        </p>
      </footer>
    </div>
  );
}
