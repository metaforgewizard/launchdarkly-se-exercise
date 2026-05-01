import { createContext, useContext, useState, useCallback } from 'react';

// This is the React Context API — a way to share state across components
// without prop-drilling. It is unrelated to LaunchDarkly contexts (which
// describe the user evaluating a flag). Same word, different things.
//
// We use it here so the bottom demo bar and the page content can share
// state. For example, when the user clicks "Simulate Issue" on Exercise 1,
// the page body shows the remediation explainer — that state lives here.

const DemoStateContext = createContext(null);

// The four context presets used by Exercise 2's demo bar.
// Each one is designed to demonstrate a specific targeting outcome.
//
// IMPORTANT: these contexts are evaluated against the targeting rules you
// set up in the LaunchDarkly console for the `new-hero-banner` flag. If you
// haven't configured those rules, all four will return the flag's default
// (FALLTHROUGH) and the demo will not show targeting differences.
// See README for the rule setup walkthrough.
export const CONTEXT_PRESETS = [
  {
    id: 'free',
    label: 'Free user (US)',
    description: 'No targeting match — falls through to default rule (OFF)',
    context: {
      kind: 'user',
      key: 'free-user-1',
      name: 'Free User (US)',
      tier: 'free',
      region: 'us'
    }
  },
  {
    id: 'enterprise',
    label: 'Enterprise (US)',
    description: 'Matches rule: tier is enterprise (ON)',
    context: {
      kind: 'user',
      key: 'enterprise-user-1',
      name: 'Enterprise User (US)',
      tier: 'enterprise',
      region: 'us'
    }
  },
  {
    id: 'eu',
    label: 'EU customer',
    description: 'Matches rule: region is eu (ON) — tier is irrelevant',
    context: {
      kind: 'user',
      key: 'eu-user-1',
      name: 'EU Customer',
      tier: 'pro',
      region: 'eu'
    }
  },
  {
    id: 'beta',
    label: 'Beta tester',
    description: 'Individually targeted by key (ON) — overrides rules',
    context: {
      kind: 'user',
      key: 'beta-tester-1',
      name: 'Beta Tester',
      tier: 'free',
      region: 'us'
    }
  }
];

export function DemoStateProvider({ children }) {
  // Exercise 1 state
  const [issueSimulated, setIssueSimulated] = useState(false);

  // Exercise 2 state — which preset is currently active.
  // The actual context switch happens via ldClient.identify(), but we
  // track the preset id here so the UI can highlight the active button.
  const [activePresetId, setActivePresetId] = useState('free');

  // Extra Credit 1 state — count of metric events fired this session.
  // This is just for UI feedback; LaunchDarkly is the source of truth.
  const [metricEventCount, setMetricEventCount] = useState(0);

  const incrementMetricEventCount = useCallback(() => {
    setMetricEventCount((c) => c + 1);
  }, []);

  const resetIssue = useCallback(() => {
    setIssueSimulated(false);
  }, []);

  const value = {
    issueSimulated,
    setIssueSimulated,
    resetIssue,
    activePresetId,
    setActivePresetId,
    metricEventCount,
    incrementMetricEventCount
  };

  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
}

// Hook for consuming the context. Throws if used outside the provider,
// which catches the "I forgot to wrap the app" mistake at dev time.
export function useDemoState() {
  const ctx = useContext(DemoStateContext);
  if (!ctx) {
    throw new Error('useDemoState must be used inside a DemoStateProvider');
  }
  return ctx;
}
