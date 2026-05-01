# LaunchDarkly SE Technical Exercise — ABC Company

A sample app built for the LaunchDarkly Sales Engineer technical exercise. It demonstrates feature flags, runtime targeting, and experimentation in a fictional B2B SaaS product called **ABC Company**.

The app is a single React frontend, client-side only, using the LaunchDarkly React Web SDK. There is no backend.

## What's in here

The submission contains three demos, each at its own route:

| Route | Exercise | What it shows |
|---|---|---|
| `/` | — | Front door. Cards linking to the three demos below. |
| `/exercise-1` | **Part 1: Release & Remediate** | A checkout flow wrapped in a feature flag, with an instant-rollback story and a production-style remediation explainer. |
| `/exercise-2` | **Part 2: Targeting** | A landing page hero banner that changes based on user context. Demonstrates individual targeting and rule-based targeting, including how individual targets override rules. |
| `/extra-credit-1` | **Extra Credit: Experimentation** | The same landing page as Exercise 2, with `track()` calls layered on. Feeds an experiment configured in your LaunchDarkly console. |

A sticky **demo control bar** lives at the bottom of every page. Its contents change to match the current route. It's visually styled with LaunchDarkly's brand colors so the evaluator can tell at a glance which UI is "the demo" and which UI is "the fictional product."

## Prerequisites

- **Node.js 18+** and **npm** (Node 20 LTS recommended). Check with `node --version`.
- **A LaunchDarkly account.** A [free trial](https://launchdarkly.com/start-trial/) is fine.
- A modern browser. The LaunchDarkly streaming connection requires `EventSource` support (any current Chrome, Firefox, Safari, or Edge).

## Setup

### 1. Clone and install

```bash
git clone <this-repo-url>
cd launchdarkly-se-exercise
npm install
```

### 2. Configure the LaunchDarkly client-side ID

Copy the example env file and fill in your client-side ID:

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

```
VITE_LD_CLIENT_SIDE_ID=your-client-side-id-here
```

You can find your client-side ID in the LaunchDarkly UI:

> **Account settings** → **Projects** → *(your project)* → **Environments** → copy the **Client-side ID** for the environment you want to use.

Important distinctions:

- The **Client-side ID** is what you want. It's safe to expose in browser code.
- The **SDK key** is for server-side SDKs. It is secret. **Never** put it in `.env.local` for this app — it would be exposed to anyone who opens DevTools.
- The **Mobile key** is for native mobile apps. Not used here.

> **Note:** Vite reads env files only at startup. If you change `.env.local` while the dev server is running, you must stop (`Ctrl+C`) and restart (`npm run dev`).

### 3. Set up the two feature flags in LaunchDarkly

This app references two flags. You'll need to create them in your LaunchDarkly environment with the exact keys below.

#### Flag 1: `new-checkout` (used by Exercise 1)

1. In LaunchDarkly, go to **Flags → Create flag**.
2. **Name:** `New checkout`
3. **Key:** `new-checkout` *(must match exactly)*
4. **Flag type:** Boolean
5. Under **Configuration**, check **SDKs using Client-side ID**. *(This is the #1 cause of "the flag won't show up in my React app" — easy to miss.)*
6. Save the flag. By default, it's OFF and serves `false` to everyone.

That's all the setup Exercise 1 needs. Targeting rules are not required.

#### Flag 2: `new-hero-banner` (used by Exercise 2 and Extra Credit 1)

1. **Flags → Create flag**.
2. **Name:** `New hero banner`
3. **Key:** `new-hero-banner` *(must match exactly)*
4. **Flag type:** Boolean
5. Check **SDKs using Client-side ID**.
6. Save the flag.

Then add **targeting** to it. On the flag's **Targeting** tab:

**Individual target:** under "Target individuals," add `beta-tester-1` to the list of keys served `true`.

**Rule 1:** click **Add rule**.
- Name: "Enterprise tier"
- If `tier` is one of `enterprise` → serve `true`

**Rule 2:** click **Add rule** again.
- Name: "EU region"
- If `region` is one of `eu` → serve `true`

**Default rule:** keep it set to serve `false`.

**Toggle the flag ON** at the top of the Targeting tab. (The flag has to be on for the targeting rules to apply at all — otherwise everyone gets the "off" variation regardless of context.)

> **A note on attribute names:** when you add a rule, LaunchDarkly will offer a dropdown of attributes it has seen in evaluation events. If `tier` and `region` aren't there yet, type them in manually — the SDK will start sending them as soon as the app evaluates the flag with one of the preset contexts.

### 4. Run the app

```bash
npm run dev
```

The app opens at <http://localhost:5173>. You should see the LaunchDarkly-styled exercises front door.

## Walking through each exercise

### Exercise 1: Release & Remediate (`/exercise-1`)

**The story:** ABC Company's engineering team is rolling out a redesigned checkout flow. They want to release it safely and roll it back instantly if anything goes wrong.

**To test:**

1. Open `/exercise-1`. The flag `new-checkout` is OFF, so the **old checkout** appears.
2. In the LaunchDarkly UI, toggle `new-checkout` to **ON**. Within a second, the page swaps to the **new checkout** — no reload. The bottom demo bar's flag pill changes from OFF to ON.
3. With the flag ON, the demo bar shows a **Simulate issue** button. Click it. A yellow remediation explainer appears in the page body explaining what would happen in production: an observability tool detects the error, fires a webhook, and the flag flips. The demo includes a `curl` snippet showing the LaunchDarkly REST API call that does the actual work.
4. To "remediate," toggle the flag back to **OFF** in the LaunchDarkly UI. The page reverts to the old checkout instantly. The remediation explainer disappears.

**What this exercise demonstrates:**
- A boolean feature flag wrapping a real component
- The streaming connection delivering flag changes in real time (the listener requirement)
- A clear, narrated explanation of what production remediation looks like, including the API call that would be triggered automatically by an observability tool

### Exercise 2: Targeting (`/exercise-2`)

**The story:** ABC Company is rolling out a new hero banner on the landing page. They want to validate it with specific cohorts before showing it to everyone.

**To test:**

1. Open `/exercise-2`. The default context is "Free user (US)" — `tier=free`, `region=us`. None of the targeting rules match, so the flag falls through to the default (OFF) and the **old hero** is shown. The demo bar shows `FALLTHROUGH` as the evaluation reason.
2. In the demo bar, click **Enterprise (US)**. The active context switches to `enterprise-user-1` with `tier=enterprise`. The flag flips to ON via Rule 1, and the **new hero** appears instantly. The demo bar shows `RULE_MATCH` as the reason.
3. Click **EU customer**. Context switches to `tier=pro, region=eu`. Rule 2 fires (region match) and the new hero stays. Notice that `tier` is `pro` here — not `enterprise` — but the EU rule fires independently of tier.
4. Click **Beta tester**. Context switches to `beta-tester-1` with `tier=free, region=us`. None of the rules match this context, but `beta-tester-1` is in the individual targets list, so the flag is served `true`. The demo bar shows `TARGET_MATCH` as the reason. **This is the demo's punchline:** individual targets override rules, even when the rules wouldn't otherwise fire.
5. Click back to **Free user (US)** to confirm the page reverts to the old hero.

**What this exercise demonstrates:**
- Context attributes (`key`, `tier`, `region`) drive flag evaluation
- Both individual targeting and rule-based targeting working together
- The evaluation order: **individual targets first, then rules in order, then default**
- Live context switching at runtime via `ldClient.identify()`, with no page reload

### Extra Credit 1: Experimentation (`/extra-credit-1`)

**The story:** ABC Company's PM wants to know whether the new hero actually drives more clicks on the trial CTA than the old one.

**The setup is the same as Exercise 2, plus a metric and an experiment in the LaunchDarkly console.** The app code is already firing `track()` calls for you on this route — you just need to wire up the LaunchDarkly side.

**Configure the metric:**

1. In LaunchDarkly, go to **Experiments → Metrics → Create metric**.
2. **Name:** `Hero CTA clicks`
3. **Event source:** LaunchDarkly hosted events
4. **Event kind:** Custom (conversion)
5. **Event key:** `hero-cta-clicked` *(must match exactly — this is what the app's `track()` call sends)*
6. **Unit aggregation:** Occurrence (counts every event, not just one per user)
7. Save.

**Configure the experiment:**

1. **Experiments → Create experiment.**
2. **Name:** "Hero banner CTA test"
3. **Hypothesis:** "If we replace the conservative hero with the bolder treatment, the trial-signup CTA click rate will increase."
4. **Randomization unit:** `user`
5. **Add metric:** select `Hero CTA clicks` and mark it as the **primary metric**.
6. **Choose flag:** `new-hero-banner`
7. **Audience:** for the demo, target the default rule with a 50/50 traffic split between the two variations.
8. Save and **Start experiment iteration**.

**To test:**

1. Open `/extra-credit-1`. Use the demo bar to switch contexts as in Exercise 2.
2. With any context active, click **Simulate metric event** in the demo bar. This fires `ldClient.track('hero-cta-clicked')` with the current context attached. The session counter in the demo bar increments to give you immediate visual feedback.
3. Open the experiment's **Results** tab in LaunchDarkly. Within a minute or two, the events should appear. Run for long enough to gather meaningful sample sizes (the exact threshold depends on your traffic; for a demo you can simulate dozens of clicks across multiple contexts to populate the chart).
4. The **Open LaunchDarkly →** link in the demo bar takes you straight to your account.

**What this exercise demonstrates:**
- Custom metric event instrumentation via the SDK's `track()` method
- An experiment connecting a feature flag, a metric, and a hypothesis
- The point that experimentation is a layer on top of targeting — the same flag, same contexts, same SDK instance

> **On the metric data:** because this is a demo with synthetic events, the experiment results aren't a real statistical signal. The point is to show that the wiring is correct — events flow from the app to the metric, the metric flows into the experiment, and the experiment surfaces a comparison. In production you'd wait for natural traffic to accumulate.

## Project structure

```
launchdarkly-se-exercise/
├── .dockerignore                # Excludes node_modules, dist, etc. from Docker build context
├── .env.example                 # Template for VITE_LD_CLIENT_SIDE_ID
├── .gitignore                   # Excludes node_modules, .env.local, etc.
├── Dockerfile                   # Multi-stage: vite build → nginx serve
├── index.html                   # Vite entry point
├── package.json                 # Dependencies
├── vite.config.js               # Vite config (port 5173)
├── README.md                    # This file
└── src/
    ├── main.jsx                  # App entry. Wires up LaunchDarkly + router.
    ├── App.jsx                   # Top-level layout with routes and demo bar.
    ├── contexts/
    │   └── DemoStateContext.jsx  # Shared UI state (issue simulated, active preset, etc.)
    ├── routes/
    │   ├── HomePage.jsx          # /
    │   ├── Exercise1Page.jsx     # /exercise-1
    │   ├── Exercise2Page.jsx     # /exercise-2
    │   └── ExtraCredit1Page.jsx  # /extra-credit-1
    ├── components/
    │   ├── DemoBar.jsx           # Sticky bottom bar — the demo's instrumentation.
    │   ├── AbcTopNav.jsx         # ABC Company's top nav.
    │   ├── OldCheckout.jsx       # Exercise 1: flag-OFF variant.
    │   ├── NewCheckout.jsx       # Exercise 1: flag-ON variant.
    │   ├── RemediationExplainer.jsx  # Exercise 1: production-thinking note.
    │   ├── LandingPage.jsx       # Exercises 2 + EC1: shared landing page.
    │   ├── HeroBannerOld.jsx     # flag-OFF hero variant.
    │   └── HeroBannerNew.jsx     # flag-ON hero variant.
    └── styles/
        └── global.css            # All styles in one file.
```

## How the LaunchDarkly integration works

A short tour for anyone reading the code:

- **Initialization** happens in `src/main.jsx` via `asyncWithLDProvider`. The SDK is initialized *before* the app renders, which prevents the brief "default value flicker" you'd get from rendering first and identifying later. The trade-off is a couple hundred milliseconds of startup delay.

- **Reading flag values** uses the `useFlags()` hook. The hook returns all flags as an object with camelCased keys — so `new-checkout` becomes `flags.newCheckout` and `new-hero-banner` becomes `flags.newHeroBanner`. The hook subscribes the component to flag updates, so toggling a flag in the LaunchDarkly UI re-renders any component that reads it.

- **Switching contexts** at runtime uses `ldClient.identify(newContext)`. Called from the Exercise 2 demo bar's preset buttons. The SDK fetches new flag values for the new context and the listener picks them up.

- **Evaluation reasons** (the `TARGET_MATCH` / `RULE_MATCH` / `FALLTHROUGH` labels in the demo bar) come from `ldClient.variationDetail(flagKey, default)`. This requires `evaluationReasons: true` in the SDK options — set in `main.jsx`.

- **Custom event tracking** uses `ldClient.track(eventKey)`. Called from the Extra Credit 1 demo bar's "Simulate metric event" button and from the hero CTA's click handler when on the experimentation route.

## Troubleshooting

**"Missing LaunchDarkly client-side ID" error on startup.** You haven't created `.env.local` or it's missing the `VITE_LD_CLIENT_SIDE_ID` line. See setup step 2.

**Flag value is always `false`, even when toggled ON.** Most likely: you forgot to check **SDKs using Client-side ID** when you created the flag. Find the flag, open its right sidebar, scroll to **Advanced** or **Configuration**, and toggle that on.

**Targeting rules don't seem to fire.** Two common causes:
- The flag itself is OFF at the top of the Targeting tab. Targeting rules only fire when the flag is on.
- Attribute names don't match. Make sure the rules use exactly `tier` and `region` (lowercase, no spaces).

**Page doesn't update when I toggle the flag.** The streaming connection might have failed. Check the browser console for errors. If you see `LaunchDarklyFlagFetchError`, the SDK is having network trouble. Refresh the page; the SDK will reconnect.

**`ldClient.identify()` doesn't change the flag value.** If you've called `identify` in rapid succession (multiple times within a few hundred ms), the SDK may serve stale values. The demo's preset buttons are debounced naturally by user clicks, so this shouldn't happen — but if you're testing programmatically, space your calls out.

## Notes for the reviewer

A few decisions worth surfacing:

- **Client-side only, no backend.** The exercise's required parts (flag evaluation, targeting, listener-based instant updates) and Extra Credit 1 (custom metric events for experimentation) are all natively supported by the React Web SDK. Adding a backend would be ceremony without value.

- **AI Configs (Extra Credit 2) lives in a sibling folder, not this one.** Unlike experimentation, AI Configs requires a server-side SDK (it uses the SDK key, which can't be put in browser code) and a server-side LLM provider call. So I built it as a separate Node.js + Express service in `../launchdarkly-ai`. The top-level repo README explains how to run both at once with docker-compose.

- **The sticky demo bar uses LaunchDarkly's brand colors deliberately**, while the ABC Company landing page uses a different palette (warm neutral + teal + purple accents). That visual contrast is the point: it makes obvious what's the demo's instrumentation versus what's the fictional product. A real landing page wouldn't have a "switch context" button in its main UI.

- **The remediation explainer in Exercise 1 includes a `curl` snippet** showing the LaunchDarkly REST API call that would actually flip the flag in production. The exercise prompt allows manual remediation as the bar to clear; including the API call is an attempt to show that I understand what the automated version looks like, even though I'm not building the webhook plumbing for the demo.
