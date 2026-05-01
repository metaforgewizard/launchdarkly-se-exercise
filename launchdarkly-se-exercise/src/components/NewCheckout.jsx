// The "new" checkout — what users see when new-checkout flag is ON.
// Visually distinct from the old one so the flag flip is obviously
// effective. Adds a "New" badge, restructures into a single column,
// and uses a bolder CTA.

export default function NewCheckout() {
  return (
    <div className="checkout checkout--new">
      <div className="checkout__variant-tag checkout__variant-tag--new">
        ✨ New streamlined checkout
      </div>

      <div className="checkout__summary checkout__summary--new">
        <h2 className="checkout__summary-title">You're almost done</h2>
        <p className="checkout__summary-sub">
          One page, autofilled where possible, and live validation.
        </p>

        <div className="checkout__line-items">
          <div className="checkout__line-item">
            <span>ABC Pro Plan — Annual</span>
            <span className="checkout__price">$1,188.00</span>
          </div>
          <div className="checkout__line-item">
            <span>Onboarding (one-time)</span>
            <span className="checkout__price">$199.00</span>
          </div>
          <div className="checkout__line-item checkout__line-item--total">
            <span>Total today</span>
            <span className="checkout__price">$1,387.00</span>
          </div>
        </div>
      </div>

      <form className="checkout__form checkout__form--new" onSubmit={(e) => e.preventDefault()}>
        <label className="checkout__label">
          Card details
          <input
            className="checkout__input checkout__input--new"
            type="text"
            placeholder="Card number, expiry, CVC"
          />
        </label>
        <label className="checkout__label">
          Email
          <input
            className="checkout__input checkout__input--new"
            type="email"
            placeholder="you@company.com"
          />
        </label>
        <button type="submit" className="checkout__submit checkout__submit--new">
          Pay $1,387.00
        </button>
        <p className="checkout__reassurance">
          🔒 Secured by Stripe · 30-day money-back guarantee
        </p>
      </form>
    </div>
  );
}
