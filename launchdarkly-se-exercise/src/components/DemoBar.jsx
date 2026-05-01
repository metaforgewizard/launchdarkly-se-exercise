import { useLocation } from 'react-router-dom';
import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import { useDemoState, CONTEXT_PRESETS } from '../contexts/DemoStateContext.jsx';

// The sticky demo bar. Lives at the bottom of every route. Always visible.
// What it shows depends on which route you're on:
//   /                  -> a brief intro
//   /exercise-1        -> Part 1 controls (flag state, simulate issue button)
//   /exercise-2        -> Part 2 controls (context preset switcher)
//   /extra-credit-1    -> Part 2 controls + metric event controls
//
// Visually styled with LaunchDarkly's brand colors so the evaluator can tell
// at a glance: "this is the demo's instrumentation, not the product."

export default function DemoBar() {
  const { pathname } = useLocation();

  return (
    <aside className="demo-bar" aria-label="Demo controls">
      <div className="demo-bar__inner">
        <div className="demo-bar__brand">
          <span className="demo-bar__brand-mark">◆</span>
          <span className="demo-bar__brand-text">Demo controls</span>
        </div>
        <div className="demo-bar__content">
          {pathname === '/' && <HomeControls />}
          {pathname === '/exercise-1' && <Exercise1Controls />}
          {pathname === '/exercise-2' && <Exercise2Controls />}
          {pathname === '/extra-credit-1' && <ExtraCredit1Controls />}
        </div>
      </div>
    </aside>
  );
}

// =============================================================================
// HOME route — just an intro, no controls.
// =============================================================================
function HomeControls() {
  return (
    <div className="demo-bar__home">
      <p>
        Pick an exercise above. The controls in this bar will change to match
        whatever exercise you're viewing.
      </p>
    </div>
  );
}

// =============================================================================
// EXERCISE 1 — flag state display + Simulate Issue button (only when flag is ON)
// =============================================================================
function Exercise1Controls() {
  const flags = useFlags();
  const newCheckoutEnabled = flags.newCheckout ?? false;
  const { issueSimulated, setIssueSimulated } = useDemoState();

  return (
    <div className="demo-bar__exercise demo-bar__exercise--1">
      <div className="demo-bar__col">
        <div className="demo-bar__label">Flag</div>
        <div className="demo-bar__value">
          <code>new-checkout</code>
        </div>
      </div>
      <div className="demo-bar__col">
        <div className="demo-bar__label">State</div>
        <div className="demo-bar__value">
          <span className={`demo-bar__pill ${newCheckoutEnabled ? 'demo-bar__pill--on' : 'demo-bar__pill--off'}`}>
            {newCheckoutEnabled ? 'ON' : 'OFF'}
          </span>
          <span className="demo-bar__hint">Toggle in your LaunchDarkly console</span>
        </div>
      </div>
      <div className="demo-bar__col demo-bar__col--actions">
        {newCheckoutEnabled && !issueSimulated && (
          <button
            className="demo-bar__button demo-bar__button--warn"
            onClick={() => setIssueSimulated(true)}
          >
            Simulate issue
          </button>
        )}
        {newCheckoutEnabled && issueSimulated && (
          <span className="demo-bar__status">
            ⚠️ Issue simulated — see explainer above
          </span>
        )}
        {!newCheckoutEnabled && (
          <span className="demo-bar__hint">
            Turn the flag ON to enable the Simulate issue button
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXERCISE 2 — four context preset buttons + active context display
// =============================================================================
function Exercise2Controls() {
  const ldClient = useLDClient();
  const { activePresetId, setActivePresetId } = useDemoState();

  // Read the current flag value via variationDetail so we can show the
  // evaluation reason (TARGET_MATCH / RULE_MATCH / FALLTHROUGH) alongside
  // the value. variationDetail requires evaluationReasons: true in the
  // SDK options (set in main.jsx).
  const detail = ldClient
    ? ldClient.variationDetail('new-hero-banner', false)
    : { value: false, reason: null };

  const handlePresetClick = (preset) => {
    setActivePresetId(preset.id);
    if (ldClient) {
      // identify() switches the active context. The SDK fetches new flag
      // values for the new context and the listener picks them up — this
      // is what makes the hero swap without a page reload.
      ldClient.identify(preset.context);
    }
  };

  const activePreset = CONTEXT_PRESETS.find((p) => p.id === activePresetId);

  return (
    <div className="demo-bar__exercise demo-bar__exercise--2">
      <div className="demo-bar__row">
        <div className="demo-bar__col demo-bar__col--narrow">
          <div className="demo-bar__label">Active context</div>
          <div className="demo-bar__value demo-bar__value--mono">
            {activePreset?.context.key}
            <span className="demo-bar__attrs">
              {' '}tier=<strong>{activePreset?.context.tier}</strong>
              {' '}region=<strong>{activePreset?.context.region}</strong>
            </span>
          </div>
        </div>
        <div className="demo-bar__col demo-bar__col--narrow">
          <div className="demo-bar__label">Flag value</div>
          <div className="demo-bar__value">
            <span className={`demo-bar__pill ${detail.value ? 'demo-bar__pill--on' : 'demo-bar__pill--off'}`}>
              {String(detail.value)}
            </span>
            {detail.reason && (
              <span className="demo-bar__reason">{detail.reason.kind}</span>
            )}
          </div>
        </div>
      </div>
      <div className="demo-bar__row">
        <div className="demo-bar__col">
          <div className="demo-bar__label">Switch context</div>
          <div className="demo-bar__buttons">
            {CONTEXT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={`demo-bar__button ${activePresetId === preset.id ? 'demo-bar__button--active' : ''}`}
                onClick={() => handlePresetClick(preset)}
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXTRA CREDIT 1 — context presets + metric event controls
// =============================================================================
function ExtraCredit1Controls() {
  const ldClient = useLDClient();
  const { activePresetId, setActivePresetId, metricEventCount, incrementMetricEventCount } = useDemoState();

  const detail = ldClient
    ? ldClient.variationDetail('new-hero-banner', false)
    : { value: false, reason: null };

  const handlePresetClick = (preset) => {
    setActivePresetId(preset.id);
    if (ldClient) {
      ldClient.identify(preset.context);
    }
  };

  const handleSimulateMetric = () => {
    if (ldClient) {
      // track() sends a custom event to LaunchDarkly with the given event key.
      // If you've set up a metric in LaunchDarkly with this event key,
      // the event will count toward that metric. If you've also set up an
      // experiment using that metric and the new-hero-banner flag, the
      // experiment will attribute this event to whichever variation the
      // current context is receiving.
      ldClient.track('hero-cta-clicked');
      incrementMetricEventCount();
    }
  };

  const activePreset = CONTEXT_PRESETS.find((p) => p.id === activePresetId);

  return (
    <div className="demo-bar__exercise demo-bar__exercise--ec1">
      <div className="demo-bar__row">
        <div className="demo-bar__col demo-bar__col--narrow">
          <div className="demo-bar__label">Context</div>
          <div className="demo-bar__value demo-bar__value--mono">
            {activePreset?.context.key}
          </div>
        </div>
        <div className="demo-bar__col demo-bar__col--narrow">
          <div className="demo-bar__label">Flag</div>
          <div className="demo-bar__value">
            <span className={`demo-bar__pill ${detail.value ? 'demo-bar__pill--on' : 'demo-bar__pill--off'}`}>
              {String(detail.value)}
            </span>
            {detail.reason && (
              <span className="demo-bar__reason">{detail.reason.kind}</span>
            )}
          </div>
        </div>
        <div className="demo-bar__col demo-bar__col--narrow">
          <div className="demo-bar__label">Events fired this session</div>
          <div className="demo-bar__value demo-bar__value--big">
            {metricEventCount}
          </div>
        </div>
      </div>
      <div className="demo-bar__row">
        <div className="demo-bar__col">
          <div className="demo-bar__label">Switch context</div>
          <div className="demo-bar__buttons">
            {CONTEXT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={`demo-bar__button demo-bar__button--small ${activePresetId === preset.id ? 'demo-bar__button--active' : ''}`}
                onClick={() => handlePresetClick(preset)}
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <div className="demo-bar__col demo-bar__col--actions">
          <button className="demo-bar__button demo-bar__button--primary" onClick={handleSimulateMetric}>
            Simulate metric event
          </button>
          <a
            href="https://app.launchdarkly.com/"
            target="_blank"
            rel="noreferrer"
            className="demo-bar__link"
          >
            Open LaunchDarkly →
          </a>
        </div>
      </div>
    </div>
  );
}
