# Extra Credit 2: AI Configs — ABC Company Support Chatbot

A self-contained server + browser chat UI demonstrating LaunchDarkly **AI Configs** with Anthropic's Claude. This is Extra Credit 2 of the LaunchDarkly SE Technical Exercise. It lives in its own folder because, unlike the main exercise (which is a pure client-side React app), AI Configs require a server-side SDK — the LLM provider key cannot be exposed in the browser.

This subproject is **independent** from the main project: its own `package.json`, its own `node_modules`, its own run command. The main project is a client-side React app on port `5173`; this one is a Node.js server on port `3001`. They don't talk to each other.

## What this demonstrates

The exercise asks for an AI configuration that lets a product manager change prompts and models without code changes. This implementation goes a step further and ties it back to the targeting concept from Part 2:

- **AI Config** named `support-chatbot` with two variations:
  - `friendly-haiku` — `claude-haiku-4-5`, casual/empathetic prompt — the default.
  - `expert-sonnet` — `claude-sonnet-4-6`, terse/expert prompt — for premium users.
- **Targeting rule**: contexts with `tier: "premium"` get `expert-sonnet`; everyone else gets `friendly-haiku`.
- **Individual target**: a specific user (`individual-vip-user`) is pinned to `expert-sonnet` regardless of their tier — same primitive as the individual targeting demo in Part 2 of the main project.
- **Live updates**: edit a system prompt in the LaunchDarkly UI and the very next message uses the new prompt. No restart, no redeploy.
- **Metrics**: every model call records duration and token usage to the AI Config's Monitoring tab in the LaunchDarkly UI via the AI SDK's `tracker.trackMetricsOf` helper.

## Architecture

```
┌──────────────────────┐        POST /chat        ┌────────────────────────────┐
│  Browser (chat UI)   │ ───────────────────────► │  Express server (port 3001)│
│  /public/index.html  │                          │  - LD Server SDK           │
│  /public/chat.js     │ ◄─── reply + variation ──│  - LD AI SDK               │
└──────────────────────┘                          │  - Anthropic SDK           │
                                                  └────────────┬───────────────┘
                                                               │
                                          completionConfig()   │
                                          ─────────────────►   ▼
                                                     ┌─────────────────┐
                                                     │  LaunchDarkly   │
                                                     │  AI Configs     │
                                                     └─────────────────┘
                                                               │
                                          messages.create()    ▼
                                                     ┌─────────────────┐
                                                     │  Anthropic API  │
                                                     └─────────────────┘
```

Two SDKs work together on the server:

- **`@launchdarkly/node-server-sdk`** — the standard server SDK. Provides the `LDClient` that does flag evaluation and event delivery.
- **`@launchdarkly/server-sdk-ai`** — the AI Configs add-on. Wraps `LDClient` with `LDAIClient`, which exposes `completionConfig()` for retrieving model + prompt configurations and `tracker.trackMetricsOf()` for recording metrics.

## Prerequisites

- **Node.js 18+** (the LD AI SDK requires Node 18 or higher, and we use top-level `await`). Check with `node --version`.
- **A LaunchDarkly account with AI Configs enabled.** AI Configs is an add-on — if "AI Configs" doesn't appear in your LaunchDarkly sidebar, contact your account team. The 14-day free trial includes it by default.
- **An Anthropic API key.** Get one at [console.anthropic.com](https://console.anthropic.com/) → API keys → Create key. A few dollars of credit will run thousands of demo turns; `claude-haiku-4-5` calls cost fractions of a penny each.

## Setup

### 1. Install

```bash
cd launchdarkly-ai
npm install
```

### 2. Configure environment variables

Copy the example file and fill in both keys:

```bash
cp .env.example .env
```

Open `.env` and set:

```
LD_SDK_KEY=sdk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Where to find each key:

- **`LD_SDK_KEY`** — In LaunchDarkly: **Project settings** → **Environments** → copy the **SDK key** for the environment you want (typically `Production` or `Test`).
  > **Important:** This is the *server-side* SDK key, not the *client-side* ID. The main project (the React app) uses the client-side ID; this server uses the SDK key. They are different values. Mixing them up will cause initialization to fail.
- **`ANTHROPIC_API_KEY`** — From [console.anthropic.com](https://console.anthropic.com/) → API keys.

Both values are secret. `.env` is git-ignored.

### 3. Create the AI Config in LaunchDarkly

This is the heart of the demo. Follow these steps in the LaunchDarkly UI:

#### 3a. Create the AI Config

1. In the LaunchDarkly sidebar, click **AI Configs**.
2. Click **Create AI Config**.
3. Set:
   - **Name**: `Support Chatbot`
   - **Key**: `support-chatbot` (must match exactly — this is what `server.js` looks up)
   - **Mode**: `Completion`
4. Click **Create**.

#### 3b. Create the first variation: `friendly-haiku`

1. On the AI Config's **Variations** tab, click **Create variation**.
2. Set:
   - **Name**: `friendly-haiku`
   - **Model**: `claude-haiku-4-5`
     - If `claude-haiku-4-5` isn't in the dropdown, you can pick "Custom" and type the model name. Any current Claude model works; Haiku is cheap and fast for the friendly variation.
   - **Parameters**:
     - `temperature`: `0.8`
     - `maxTokens`: `400`
3. **Messages**: add a single message with role **System** and this content:

   ```
   You are Aria, a friendly customer support agent for ABC Company. Be warm, conversational, and empathetic. Use casual language. It's okay to use light humor when appropriate. Greet the customer by name when relevant. The customer's name is {{customerName}}.

   If a customer asks about something outside your knowledge, gently let them know and suggest they reach out to a human agent.
   ```

4. Click **Save variation**.

#### 3c. Create the second variation: `expert-sonnet`

1. Click **Create variation** again.
2. Set:
   - **Name**: `expert-sonnet`
   - **Model**: `claude-sonnet-4-6`
   - **Parameters**:
     - `temperature`: `0.3`
     - `maxTokens`: `400`
3. **Messages**: add a System message with this content:

   ```
   You are a senior technical support engineer for ABC Company. Be direct, precise, and technical. Skip pleasantries. Lead with the answer. If the question lacks specifics, ask exactly the question needed to disambiguate — no more. Cite documentation conventions when relevant (e.g., "see /docs/api/v2"). The user is {{customerName}}, a premium-tier customer who values brevity over warmth.
   ```

4. Click **Save variation**.

#### 3d. Configure targeting

1. Go to the AI Config's **Targeting** tab.
2. **Set the default rule** (the fall-through when nothing else matches):
   - Click the default targeting and set it to **Serve `friendly-haiku`**.
3. **Add a tier-based rule**:
   - Click **+ Add rule**.
   - Name: `Premium tier gets expert variation`
   - Condition: `tier` `is one of` `premium`
     - You may need to type `tier` as a custom attribute the first time — the dropdown only shows attributes LaunchDarkly has seen before.
   - Serve: `expert-sonnet`
4. **Add an individual target**:
   - Click **+ Add individual target** (or scroll to the **Individual targets** section above the rules).
   - For variation `expert-sonnet`, add the user key: `individual-vip-user`
5. **Toggle targeting ON** at the top of the page.
6. Click **Review and save**.

> **About targeting precedence:** LaunchDarkly evaluates individual targets first, then rules in order, then the default. So `individual-vip-user` always gets `expert-sonnet` even though that user's `tier` attribute is `free`. This is the same precedence model demonstrated in Part 2 of the main exercise — just applied to a richer primitive.

### 4. Run the server

```bash
npm start
```

You'll see:

```
✓ LaunchDarkly AI SDK initialized
✓ Chatbot demo running at http://localhost:3001
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## How to demo it

The UI has three personas in the dropdown:

| Persona | Tier | Expected variation | Why |
|---|---|---|---|
| Maria — Free tier | `free` | `friendly-haiku` | Falls through to default |
| David — Premium tier | `premium` | `expert-sonnet` | Matches the targeting rule |
| Priya — Individually targeted | `free` | `expert-sonnet` | Individual target overrides the rule |

A good demo flow:

1. **Send the same question as each persona** — try something like *"How do I export my data?"* — and watch the tone, depth, and length of the response change.
2. **Watch the "LaunchDarkly served" panel** in the sidebar. It updates after every message to show which variation and model LaunchDarkly served. The panel is the moment that sells the targeting story: same code path, different config, different output.
3. **Edit a variation in the LaunchDarkly UI mid-conversation.** Change the system prompt of `friendly-haiku` to something obviously different (e.g., make Aria respond in pirate dialect). Save. Send another message as Maria. The next reply uses the new prompt. No restart.
4. **Open the AI Config's Monitoring tab in the LaunchDarkly UI** to see token usage and latency by variation. This is what `tracker.trackMetricsOf` is feeding.

## Code tour

A few lines worth highlighting if you're reading the source:

- **`server.js` — `aiClient.completionConfig(...)`**. This is the AI SDK's main entry point. It evaluates targeting using the persona's context, and returns the resolved model + messages plus a `createTracker()` factory. The fallback config defined above it is used only if LaunchDarkly is unreachable, which is the recommended graceful-degradation pattern.

- **`server.js` — `aiConfig.createTracker()`**. The tracker is what records metrics back to LaunchDarkly. It carries metadata (`runId`, `variationKey`, `modelName`) automatically, so we don't have to thread that through ourselves. We use `tracker.getTrackData()` to get the variation key and model name to display in the UI's "LaunchDarkly served" panel — that's how the UI knows what was actually served.

- **`server.js` — `anthropicMetricsExtractor`**. The LaunchDarkly Node AI SDK ships built-in tracking helpers for OpenAI (`trackOpenAIMetrics`), Bedrock Converse (`trackBedrockConverseMetrics`), and the Vercel AI SDK — but not for the native Anthropic SDK. So we write our own extractor: pull `input_tokens` and `output_tokens` off the Anthropic response, return them in the shape `trackMetricsOf` expects. This is the "manual" tracking pattern the LaunchDarkly docs describe for non-built-in providers, and the same shape OpenAIProvider's built-in extractor returns.

- **`server.js` — message-shape translation**. LaunchDarkly returns messages with `role: 'system' | 'user' | 'assistant'`, but the Anthropic Messages API takes the system prompt as a top-level `system` parameter, not as a message. We split them before calling Anthropic. This is the kind of small adapter SEs walk customers through when the AI SDK doesn't have a built-in helper for their chosen provider.

- **`server.js` — `tracker.trackMetricsOf(extractor, modelCallFn)`**. Wraps the model call. Times it, awaits it, hands the response to the extractor for token counts, records duration + tokens + success to LaunchDarkly. Returns the original response unchanged. The tracker is the bridge between "I made a model call" and "the AI Config Monitoring tab shows my numbers."

## Troubleshooting

- **`AI Config is disabled or not found`** — The config key in `server.js` (`support-chatbot`) doesn't match what you created in the LaunchDarkly UI, OR targeting is toggled OFF for the AI Config, OR you're connected to the wrong environment. Double-check the key, the targeting toggle, and that your `LD_SDK_KEY` corresponds to the environment where the AI Config exists.
- **`401 Unauthorized` from Anthropic** — Bad `ANTHROPIC_API_KEY`. Regenerate at console.anthropic.com.
- **"LaunchDarkly initialization failed; will use fallback config"** — Either the SDK key is invalid (typically because you used the client-side ID by mistake) or the environment can't reach `app.launchdarkly.com`. The server will still respond using the fallback prompt defined in `server.js`, but it won't reflect any UI changes.
- **No metrics showing up in the Monitoring tab** — Metrics flush in batches. Send a few messages, wait ~30 seconds, refresh. If you Ctrl+C the server, it explicitly flushes before exiting, so a clean shutdown won't lose data.
- **`claude-haiku-4-5` or `claude-sonnet-4-6` rejected by Anthropic** — Anthropic ships new model versions periodically. If a model name in this README is older than the latest, swap to the current one in the LaunchDarkly UI. The current model list is at [docs.anthropic.com/en/docs/about-claude/models](https://docs.anthropic.com/en/docs/about-claude/models).

## What this would extend to

The exercise also offers an optional "experiment" component for AI Configs. The wiring is in place: every `/chat` call records token and duration metrics tagged with the served variation. To turn this into a real experiment, you'd:

1. Create a metric in LaunchDarkly tracking output tokens (or a custom satisfaction event).
2. Create an experiment using the `support-chatbot` AI Config and that metric.
3. Let traffic accumulate.
4. Read the results on the experiment's Results tab.

Same pattern as the experiment in Extra Credit 1 of the main project, applied to AI Configs. Skipped here in the interest of time, but the wiring doesn't change.
