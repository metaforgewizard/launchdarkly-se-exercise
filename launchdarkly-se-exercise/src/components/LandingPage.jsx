import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import { useEffect } from 'react';
import { useDemoState } from '../contexts/DemoStateContext.jsx';
import HeroBannerOld from './HeroBannerOld.jsx';
import HeroBannerNew from './HeroBannerNew.jsx';

// FLAG KEY — must match the flag you create in LaunchDarkly.
// See README "LaunchDarkly Console Setup" section for instructions on
// creating this flag with individual + rule-based targeting.
const FLAG_KEY = 'new-hero-banner';

// METRIC EVENT KEY — must match the event key on the metric you create
// in LaunchDarkly for the experimentation extra credit.
// Set up: in LaunchDarkly, create a metric of type "Custom conversion"
// with this exact event key. See README for full walkthrough.
const METRIC_EVENT_KEY = 'hero-cta-clicked';

export default function LandingPage({ trackOnCtaClick = false }) {
  const flags = useFlags();
  const ldClient = useLDClient();
  const newHeroEnabled = flags.newHeroBanner ?? false;

  const { incrementMetricEventCount } = useDemoState();

  // Fire an impression event once per render of this page.
  // Useful as a denominator if you want to compute click-through rate.
  // We only fire this when the experimentation feature is "on" for the
  // current route, to avoid polluting the event stream during Exercise 2.
  useEffect(() => {
    if (trackOnCtaClick && ldClient) {
      ldClient.track('hero-impression');
    }
  }, [trackOnCtaClick, ldClient]);

  // Handler for the hero's CTA button.
  // On the experimentation route, this fires a track() call so the
  // experiment can attribute the click to the current flag variation.
  const handleCtaClick = () => {
    if (trackOnCtaClick && ldClient) {
      ldClient.track(METRIC_EVENT_KEY);
      incrementMetricEventCount();
    }
    // In a real app, this would navigate to signup. For the demo, the
    // tracking is the meaningful side effect.
  };

  return (
    <main className="landing">
      {newHeroEnabled ? (
        <HeroBannerNew onCtaClick={handleCtaClick} />
      ) : (
        <HeroBannerOld onCtaClick={handleCtaClick} />
      )}

      <section id="features" className="landing-features">
        <div className="landing-features__inner">
          <h2 className="landing-section-title">Built for teams that ship</h2>
          <div className="landing-features__grid">
            <div className="landing-feature">
              <div className="landing-feature__icon">⚡</div>
              <h3 className="landing-feature__title">Fast setup</h3>
              <p className="landing-feature__body">
                Go from signup to your first deployment in under fifteen minutes.
                Your team will not need a week of training.
              </p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature__icon">🔒</div>
              <h3 className="landing-feature__title">Enterprise-grade security</h3>
              <p className="landing-feature__body">
                SOC 2 Type II, ISO 27001, and HIPAA compliant. Your security
                team will sign off on the first call.
              </p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature__icon">🔌</div>
              <h3 className="landing-feature__title">Connects to everything</h3>
              <p className="landing-feature__body">
                Native integrations for Slack, Salesforce, Jira, GitHub, and
                seventy-three other tools your team already uses.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-proof">
        <div className="landing-proof__inner">
          <h2 className="landing-section-title">Trusted by teams that move fast</h2>
          <div className="landing-proof__stats">
            <div className="landing-proof__stat">
              <div className="landing-proof__stat-num">12,000+</div>
              <div className="landing-proof__stat-label">teams shipping daily</div>
            </div>
            <div className="landing-proof__stat">
              <div className="landing-proof__stat-num">99.99%</div>
              <div className="landing-proof__stat-label">measured uptime</div>
            </div>
            <div className="landing-proof__stat">
              <div className="landing-proof__stat-num">4.8 / 5</div>
              <div className="landing-proof__stat-label">G2 rating, 600+ reviews</div>
            </div>
          </div>
          <blockquote className="landing-proof__quote">
            "ABC Company replaced three internal tools and a monthly all-hands
            meeting about deploy freezes. We ship on Fridays now."
            <cite>— VP Engineering, midmarket SaaS</cite>
          </blockquote>
        </div>
      </section>

      <section id="pricing" className="landing-final-cta">
        <div className="landing-final-cta__inner">
          <h2>Ready to give it a try?</h2>
          <p>Free for 30 days. No credit card. Cancel anytime, obviously.</p>
          <button className="landing-final-cta__button" onClick={handleCtaClick}>
            Start free trial
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© 2026 ABC Company (fictional, for demo purposes)</span>
        <span className="landing-footer__flag-tag">
          Flag: <code>{FLAG_KEY}</code> = <strong>{String(newHeroEnabled)}</strong>
        </span>
      </footer>
    </main>
  );
}
