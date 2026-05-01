// The "old" hero shown when new-hero-banner is OFF.
// Conservative copy, single CTA, plain layout.

export default function HeroBannerOld({ onCtaClick }) {
  return (
    <section className="hero hero--old">
      <div className="hero__inner">
        <h1 className="hero__title">
          Streamline your team's workflow
        </h1>
        <p className="hero__sub">
          ABC Company helps growing teams keep their projects on track,
          their stakeholders informed, and their deploys boring.
        </p>
        <div className="hero__cta-row">
          <button className="hero__cta hero__cta--primary" onClick={onCtaClick}>
            Get started
          </button>
        </div>
        <p className="hero__variant-tag">Hero v1 (control)</p>
      </div>
    </section>
  );
}
