# LaunchDarkly SE Technical Exercise

A full-stack take-home for the LaunchDarkly Sales Engineer role. Two subprojects, each demonstrating a distinct LaunchDarkly capability. Parts 1, 2, and Extra Credit 1 are a single client-side React/Vite app. Extra Credit 2 (AI Configs) is a separate Node.js + Express server, because AI Configs requires a server-side SDK and an LLM provider key — neither of which can safely live in browser code.

The two subprojects are independent. They don't talk to each other. They share a repo because they share a story.

## Repository layout

```
.
├── docker-compose.yml                ← run both subprojects with one command
├── .env.example                      ← three keys live here for docker-compose
├── launchdarkly-se-exercise/         ← Parts 1, 2, Extra Credit 1 (React + Vite)
│   ├── Dockerfile
│   ├── README.md                     ← detailed setup, console walkthrough
│   └── src/
└── launchdarkly-ai/                  ← Extra Credit 2: AI Configs (Node + Express)
    ├── Dockerfile
    ├── README.md                     ← detailed setup, AI Config walkthrough
    ├── server.js
    └── public/
```

The two subproject READMEs are the source of truth for what each demo does, the LaunchDarkly console setup each one requires, and how to walk through the demo. This top-level README only covers running the two together.

## How exercise components map to the prompt

|Prompt section|Where it lives|
|-|-|
|Part 1: Release \& Remediate|`launchdarkly-se-exercise` → `/exercise-1`|
|Part 2: Targeting|`launchdarkly-se-exercise` → `/exercise-2`|
|Extra Credit: Experimentation|`launchdarkly-se-exercise` → `/extra-credit-1`|
|Extra Credit: AI Configs|`launchdarkly-ai` → `http://localhost:3001`|

## Running everything (Docker — recommended)

You need Docker Desktop (or Docker Engine with the Compose plugin) and three keys: a LaunchDarkly **client-side ID**, a LaunchDarkly **SDK key**, and an **Anthropic API key**.

### 1\. Get the keys

The two LaunchDarkly keys come from your LaunchDarkly account: **Account settings → Projects → Environments**. The client-side ID and the SDK key are different values in different columns of that page. They are not interchangeable.

The Anthropic API key can come from one of two places, depending on context:

* **If you're an evaluator I've shared this repo with:** I'll send you a pre-funded, spend-capped key out-of-band (email or whatever channel we agreed on). Use that.
* **Otherwise:** create one at [https://console.anthropic.com/](https://console.anthropic.com/) → **API keys** → **Create key**.

### 2\. Configure

```bash
cp .env.example .env
# Open .env and fill in all three values.
```

### 3\. Set up the LaunchDarkly side

Each subproject needs its own LaunchDarkly resources (flags, contexts, AI Configs) created in the console. The walkthroughs are in the subproject READMEs. **Do this before starting the containers** — both apps will run without the LaunchDarkly resources, but the demos will be inert.

* For Parts 1, 2, and Extra Credit 1: see [`launchdarkly-se-exercise/README.md`](./launchdarkly-se-exercise/README.md), section "Set up the two feature flags in LaunchDarkly" (and "Configure the metric / experiment" for EC1).
* For Extra Credit 2: see [`launchdarkly-ai/README.md`](./launchdarkly-ai/README.md), section "Create the AI Config in LaunchDarkly".

### 4\. Start

```bash
docker compose up --build
```

`--build` is important on the first run, and any time you change `.env`. See the gotcha below.

When the containers are up:

* **Web app** (Parts 1, 2, EC1) — [http://localhost:5173](http://localhost:5173)
* **AI demo** (EC2) — [http://localhost:3001](http://localhost:3001)

To stop: `Ctrl+C`, then `docker compose down`.

### A gotcha worth understanding

Vite is a build-time tool. It reads `VITE\\\_\\\*` env vars when it builds the JavaScript bundle and bakes the values directly into the emitted code. They cannot be changed at container runtime. Practical consequence: **if you change `VITE\\\_LD\\\_CLIENT\\\_SIDE\\\_ID` in `.env`, you must run `docker compose up --build`**. A plain `docker compose up` will reuse the cached image and the old value will persist.

The two server-side keys (`LD\\\_SDK\\\_KEY`, `ANTHROPIC\\\_API\\\_KEY`) don't have this problem — they're read at runtime by the Node server, so changing `.env` and restarting with `docker compose up` (no rebuild) picks them up.

## Running everything (without Docker)

If you'd rather run natively, follow the setup steps in each subproject README. The two subprojects are fully independent — you can run either without the other.

* `cd launchdarkly-se-exercise \\\&\\\& npm install \\\&\\\& npm run dev`
* `cd launchdarkly-ai \\\&\\\& npm install \\\&\\\& npm start`

You'll need Node 20+ for both.

## Common questions a reviewer might have

**Why two separate projects, not one app with a backend?**
The main exercise (Parts 1, 2, EC1) is fully achievable with a client-side SDK. Adding a backend would have been ceremony without value. AI Configs is the opposite: it requires a server-side SDK by design. The two subprojects living side-by-side reflects that constraint honestly.

**Where are the LaunchDarkly resources defined?**
In your LaunchDarkly account, manually, by you, following the steps in each subproject README. There's nothing magical about the resources — they're a few flags and one AI Config — and the walkthrough captures the small but important details (e.g., enabling "SDKs using Client-side ID", which is the #1 cause of "why doesn't my React app see the flag").

**Why nginx for the web app instead of `vite preview`?**
`vite preview` is a development convenience, not a production server. nginx is small (\~20MB image), well-understood, and gets the SPA-routing fallback right with one line of config.

## 

## Verifying it works

After both containers are up, the fastest way to confirm everything is wired correctly:

1. Open [http://localhost:5173](http://localhost:5173). You should see the LaunchDarkly-styled exercises front door.
2. Click into "Exercise 1: Release \& Remediate". The page should render the old checkout. Toggle the `new-checkout` flag in your LaunchDarkly console — within a second, the page should swap to the new checkout. (If it doesn't, the most likely cause is "SDKs using Client-side ID" not being enabled on the flag — see the SE README's troubleshooting section.)
3. Open [http://localhost:3001](http://localhost:3001). You should see the chatbot UI with three personas in the dropdown.
4. Send the same question as Maria, then as David, then as Priya. The "LaunchDarkly served" panel on the left should show different variations and models for each persona — that's the targeting story end-to-end.

## Layout of this submission, again, for the busy reviewer

If you have ten minutes:

1. Read this file (you're here).
2. Skim [`launchdarkly-se-exercise/README.md`](./launchdarkly-se-exercise/README.md) — it's the substantive one.
3. `docker compose up --build` and click through the three routes.



If you have thirty minutes, also:
4. Read [`launchdarkly-ai/README.md`](./launchdarkly-ai/README.md).
5. Set up the AI Config in LaunchDarkly and try the chatbot with all three personas.

