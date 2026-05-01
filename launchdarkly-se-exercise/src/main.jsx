import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import App from './App.jsx';
import { DemoStateProvider } from './contexts/DemoStateContext.jsx';
import './styles/global.css';

// LaunchDarkly initialization.
//
// asyncWithLDProvider initializes the SDK BEFORE the app renders, which prevents
// the brief "default value" flicker you get if you render first and identify later.
// The trade-off is a couple hundred ms of delay at startup; for a demo that's fine.
//
// We start with a default "free user" context. The Exercise 2 demo bar lets you
// switch contexts at runtime via ldClient.identify().
const defaultContext = {
  kind: 'user',
  key: 'free-user-1',
  name: 'Free User (US)',
  tier: 'free',
  region: 'us'
};

const clientSideID = import.meta.env.VITE_LD_CLIENT_SIDE_ID;

if (!clientSideID) {
  // Fail loudly if the env var isn't set. Better to see this error message
  // than to spend 20 minutes debugging why flags are returning fallback values.
  document.getElementById('root').innerHTML = `
    <div style="max-width: 560px; margin: 80px auto; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px;">
      <h1 style="margin-top: 0; font-size: 18px;">Missing LaunchDarkly client-side ID</h1>
      <p>Create a file named <code>.env.local</code> in the project root with this line:</p>
      <pre style="background: #f8f9fa; padding: 12px; border-radius: 4px;">VITE_LD_CLIENT_SIDE_ID=your-client-side-id-here</pre>
      <p>Then restart the dev server with <code>npm run dev</code>. (Vite reads env files only at startup.)</p>
      <p>You can find the client-side ID in your LaunchDarkly console under <strong>Account settings &rarr; Projects &rarr; Environments</strong>.</p>
    </div>
  `;
  throw new Error('VITE_LD_CLIENT_SIDE_ID is not set. See .env.example.');
}

(async () => {
  const LDProvider = await asyncWithLDProvider({
    clientSideID,
    context: defaultContext,
    options: {
      // Enable evaluation reasons so the Exercise 2 demo bar can show
      // "TARGET_MATCH" / "RULE_MATCH" / "FALLTHROUGH" alongside flag values.
      evaluationReasons: true,
      // Stream flag updates in real time. This is what makes Exercise 1's
      // "no page reload" promise possible.
      streaming: true
    }
  });

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <LDProvider>
        <DemoStateProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </DemoStateProvider>
      </LDProvider>
    </React.StrictMode>
  );
})();
