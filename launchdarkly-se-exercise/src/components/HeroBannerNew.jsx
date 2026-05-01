// The "new" hero shown when new-hero-banner is ON.
// Bolder copy, two CTAs, eyebrow text, and a visual "✨ New" treatment.

export default function HeroBannerNew({ onCtaClick }) {
  return (
    <section className="hero hero--new">
      <div className="hero__inner">
        <span className="hero__eyebrow">✨ NEW</span>
        <h1 className="hero__title hero__title--new">
          Ship faster. Break less.
          <br />
          Sleep better.
        </h1>
        <p className="hero__sub hero__sub--new">
          The fastest-shipping teams use ABC Company to roll out features safely,
          measure their impact, and roll back instantly when something's off —
          all without a single redeploy.
        </p>
        <div className="hero__cta-row">
          <button className="hero__cta hero__cta--primary hero__cta--new" onClick={onCtaClick}>
            Start free trial →
          </button>
          <button className="hero__cta hero__cta--secondary">
            Watch 2-minute demo
          </button>
        </div>
        <p className="hero__variant-tag hero__variant-tag--new">Hero v2 (treatment)</p>
      </div>
    </section>
  );
}
