// The "old" checkout — what users see when new-checkout flag is OFF.
// Visually plain and a bit dated to make the contrast with the new
// version obvious in a screenshot.

export default function OldCheckout() {
  return (
    <div className="checkout checkout--old">
      <div className="checkout__variant-tag">Current checkout (stable)</div>

      <div className="checkout__summary">
        <h2 className="checkout__summary-title">Order Summary</h2>
        <table className="checkout__items">
          <tbody>
            <tr>
              <td>ABC Pro Plan — Annual</td>
              <td className="checkout__price">$1,188.00</td>
            </tr>
            <tr>
              <td>Onboarding (one-time)</td>
              <td className="checkout__price">$199.00</td>
            </tr>
            <tr className="checkout__total-row">
              <td>Total</td>
              <td className="checkout__price">$1,387.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      <form className="checkout__form" onSubmit={(e) => e.preventDefault()}>
        <label className="checkout__label">
          Card number
          <input className="checkout__input" type="text" placeholder="1234 1234 1234 1234" />
        </label>
        <div className="checkout__row">
          <label className="checkout__label">
            Expiry
            <input className="checkout__input" type="text" placeholder="MM / YY" />
          </label>
          <label className="checkout__label">
            CVC
            <input className="checkout__input" type="text" placeholder="123" />
          </label>
        </div>
        <label className="checkout__label">
          Billing email
          <input className="checkout__input" type="email" placeholder="you@company.com" />
        </label>
        <button type="submit" className="checkout__submit checkout__submit--old">
          Complete purchase
        </button>
      </form>
    </div>
  );
}
