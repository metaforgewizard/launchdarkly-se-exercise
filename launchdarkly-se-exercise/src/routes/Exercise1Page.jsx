import { Link } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useEffect } from 'react';
import { useDemoState } from '../contexts/DemoStateContext.jsx';
import AbcTopNav from '../components/AbcTopNav.jsx';
import OldCheckout from '../components/OldCheckout.jsx';
import NewCheckout from '../components/NewCheckout.jsx';
import RemediationExplainer from '../components/RemediationExplainer.jsx';

// FLAG KEY — must match the flag you create in LaunchDarkly.
// See README "LaunchDarkly Console Setup" section for instructions on
// creating this flag and enabling it for client-side SDKs.
const FLAG_KEY = 'new-checkout';

export default function Exercise1Page() {
  // useFlags returns an object with all flags as camelCased keys.
  // 'new-checkout' becomes 'newCheckout'. This is a quirk of the React SDK.
  const flags = useFlags();
  const newCheckoutEnabled = flags.newCheckout ?? false;

  const { issueSimulated, resetIssue } = useDemoState();

  // When the flag goes from ON back to OFF (the rollback), clear the
  // remediation explainer. The flag flipping off IS the remediation action,
  // so the explainer no longer makes sense once it's off.
  useEffect(() => {
    if (!newCheckoutEnabled && issueSimulated) {
      resetIssue();
    }
  }, [newCheckoutEnabled, issueSimulated, resetIssue]);

  return (
    <div className="abc-page">
      <AbcTopNav active="checkout" />

      <div className="exercise-banner">
        <Link to="/" className="exercise-banner__back">← Exercises</Link>
        <span className="exercise-banner__label">Exercise 1: Release &amp; Remediate</span>
        <span className="exercise-banner__flag">
          Flag: <code>{FLAG_KEY}</code> = <strong>{String(newCheckoutEnabled)}</strong>
        </span>
      </div>

      <main className="abc-main">
        <h1 className="checkout-title">Checkout</h1>

        {newCheckoutEnabled ? <NewCheckout /> : <OldCheckout />}

        {issueSimulated && newCheckoutEnabled && (
          <RemediationExplainer />
        )}
      </main>
    </div>
  );
}
