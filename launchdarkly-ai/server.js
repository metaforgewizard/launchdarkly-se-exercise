// =============================================================================
// LaunchDarkly SE Technical Exercise — Extra Credit 2: AI Configs
// =============================================================================
// What this server does:
//   1. Initializes the LaunchDarkly server SDK and the LaunchDarkly AI SDK.
//   2. Serves a small static chat UI from /public.
//   3. Exposes POST /chat, which:
//        a. Builds a LaunchDarkly context from the requested persona,
//        b. Asks LaunchDarkly which AI Config variation to serve (model + system prompt),
//        c. Calls Anthropic Claude with that configuration,
//        d. Records duration, token usage, and success/error to LaunchDarkly via the tracker,
//        e. Returns the model's response plus the resolved variation name to the UI.
//
// The point of the demo: the same code path serves different prompts and different
// models depending on who the user is. Toggle a targeting rule in the LaunchDarkly
// UI and the very next message uses the new configuration. No restart, no redeploy.
//
// Two AI Config variations are expected (created in the LaunchDarkly UI per the README):
//   - friendly-haiku — claude-haiku-4-5, warm/casual system prompt (default)
//   - expert-sonnet  — claude-sonnet-4-6, terse/expert system prompt (premium tier)
// =============================================================================

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import * as LaunchDarkly from '@launchdarkly/node-server-sdk';
import { initAi } from '@launchdarkly/server-sdk-ai';
import Anthropic from '@anthropic-ai/sdk';

// -----------------------------------------------------------------------------
// Config & sanity checks
// -----------------------------------------------------------------------------

// `fileURLToPath(new URL('./public', import.meta.url))` is the cross-platform
// correct way to resolve a sibling directory in ES modules. We deliberately
// avoid `new URL(...).pathname` because on Windows that returns paths like
// `/C:/Users/...` (with a leading slash) which Express static middleware
// can't resolve. Going through fileURLToPath produces a real OS path on
// both Linux/macOS (`/home/.../public`) and Windows (`C:\...\public`).
const PUBLIC_DIR = fileURLToPath(new URL('./public', import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

// The AI Config key in LaunchDarkly. The README walks the user through creating this.
// If you rename the AI Config in the LaunchDarkly UI, update this value to match.
const AI_CONFIG_KEY = 'support-chatbot';

if (!process.env.LD_SDK_KEY) {
  console.error('Missing LD_SDK_KEY. Copy .env.example to .env and fill it in.');
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

// -----------------------------------------------------------------------------
// Personas — the demo's "users"
// -----------------------------------------------------------------------------
// These are the sample contexts the UI lets you switch between. The persona
// dropdown sends a `personaKey` to the server, and the server looks it up here
// to build the LaunchDarkly context for the AI Config evaluation.
//
// `tier: 'premium'` is what the targeting rule in LaunchDarkly will key off of.
// `key: 'individual-vip-user'` is the value used for the individual target.
//
// Single source of truth: the UI fetches this list from /personas so we never
// have to keep two copies of the persona definitions in sync.
// -----------------------------------------------------------------------------

const PERSONAS = [
  {
    personaKey: 'free-user',
    label: 'Maria — Free tier user',
    description: 'Targeting falls through to the default variation (friendly-haiku).',
    context: {
      kind: 'user',
      key: 'user-maria-free-001',
      name: 'Maria Chen',
      email: 'maria@example.com',
      tier: 'free',
    },
  },
  {
    personaKey: 'premium-user',
    label: 'David — Premium tier user',
    description: 'Targeting rule on tier="premium" routes to expert-sonnet.',
    context: {
      kind: 'user',
      key: 'user-david-premium-001',
      name: 'David Park',
      email: 'david@example.com',
      tier: 'premium',
    },
  },
  {
    personaKey: 'vip-user',
    label: 'Priya — Individually targeted user',
    description: 'Individual target on this user key overrides any rule.',
    context: {
      kind: 'user',
      key: 'individual-vip-user',
      name: 'Priya Singh',
      email: 'priya@example.com',
      tier: 'free', // tier says free, but individual targeting wins
    },
  },
];

function findPersona(personaKey) {
  return PERSONAS.find((p) => p.personaKey === personaKey);
}

// -----------------------------------------------------------------------------
// LaunchDarkly initialization
// -----------------------------------------------------------------------------
// One shared LDClient and one shared LDAIClient for the lifetime of the process.
// Per the LaunchDarkly docs: do NOT create a new client per request.

const ldClient = LaunchDarkly.init(process.env.LD_SDK_KEY);
let aiClient;

try {
  await ldClient.waitForInitialization({ timeout: 10 });
  aiClient = initAi(ldClient);
  console.log('✓ LaunchDarkly AI SDK initialized');
} catch (err) {
  // We don't exit here — the server will still respond using the fallback config
  // defined below. This is the recommended graceful-degradation pattern.
  console.error('LaunchDarkly initialization failed; will use fallback config:', err.message);
  aiClient = initAi(ldClient);
}

// -----------------------------------------------------------------------------
// Anthropic client
// -----------------------------------------------------------------------------

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// -----------------------------------------------------------------------------
// Anthropic-specific metrics extractor for the LD AI SDK tracker
// -----------------------------------------------------------------------------
// The LaunchDarkly Node AI SDK ships built-in metrics extractors for OpenAI,
// Bedrock Converse, and Vercel AI SDK responses. There isn't a built-in one
// for the native Anthropic SDK, so we write our own — this is the documented
// "manual" pattern. The tracker calls this function with the Anthropic response
// after the model call returns, and we hand back a normalized metrics object.
//
// Anthropic responses include: response.usage.input_tokens, response.usage.output_tokens.
// Anything missing falls back to 0 so the tracker never throws on partial data.

function anthropicMetricsExtractor(response) {
  const usage = response?.usage ?? {};
  return {
    success: true,
    usage: {
      total: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
      input: usage.input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
    },
  };
}

// -----------------------------------------------------------------------------
// The fallback config — used if LaunchDarkly is unreachable
// -----------------------------------------------------------------------------
// If the SDK can't talk to LaunchDarkly (offline, bad SDK key, etc.) it returns
// this fallback rather than throwing. The README discusses why this matters
// for resilience: your AI feature stays up even when your config service is down.

const fallbackConfig = {
  enabled: true,
  model: { name: 'claude-haiku-4-5' },
  messages: [
    {
      role: 'system',
      content:
        'You are a friendly customer support agent for ABC Company. ' +
        'Be warm and conversational. (This is the fallback prompt used when LaunchDarkly is unreachable.)',
    },
  ],
};

// -----------------------------------------------------------------------------
// Express setup
// -----------------------------------------------------------------------------

const app = express();
app.use(express.json({ limit: '64kb' }));

// Serve the static UI from the public/ directory next to this file.
// PUBLIC_DIR is resolved at the top of the file in a cross-platform way.
app.use(express.static(PUBLIC_DIR));

// Explicit root route — serves index.html. Belt-and-suspenders alongside the
// static middleware: if anything ever goes wrong with the static path,
// res.sendFile gives you a clear error in the response and the console
// instead of an opaque "Cannot GET /".
app.get('/', (_req, res, next) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'), (err) => {
    if (err) {
      console.error(`Failed to serve index.html from ${PUBLIC_DIR}:`, err.message);
      next(err);
    }
  });
});

// GET /personas — the UI calls this on load to populate the persona dropdown.
// We strip the LD context off so we're not leaking targeting structure to the client
// for no reason; the UI only needs the label and description.
app.get('/personas', (_req, res) => {
  res.json(
    PERSONAS.map((p) => ({
      personaKey: p.personaKey,
      label: p.label,
      description: p.description,
    })),
  );
});

// POST /chat — the main endpoint.
// Body: { personaKey: string, userMessage: string }
// Response: { reply: string, variationKey: string, modelName: string, tokens: { input, output } }
app.post('/chat', async (req, res) => {
  const { personaKey, userMessage } = req.body ?? {};

  if (typeof userMessage !== 'string' || !userMessage.trim()) {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  const persona = findPersona(personaKey);
  if (!persona) {
    return res.status(400).json({ error: `Unknown personaKey: ${personaKey}` });
  }

  try {
    // -----------------------------------------------------------------------
    // Step 1: Ask LaunchDarkly which AI Config variation to serve.
    // -----------------------------------------------------------------------
    // The completionConfig() call evaluates targeting rules using the persona's
    // context attributes and returns the resolved model + messages + a tracker.
    // The fallback is used only if LaunchDarkly is unreachable.
    //
    // The 4th arg is for template variables — placeholders like {{customerName}}
    // in the AI Config's messages. We pass `name` so the system prompt can
    // address the user by name if the variation uses it.
    const aiConfig = await aiClient.completionConfig(
      AI_CONFIG_KEY,
      persona.context,
      fallbackConfig,
      { customerName: persona.context.name },
    );

    if (!aiConfig.enabled) {
      // The variation explicitly disabled the AI Config (or the AI Config doesn't exist
      // and we fell through to a disabled fallback). Surface this clearly.
      return res.status(503).json({
        error: 'AI Config is disabled or not found in LaunchDarkly. Check the AI Config setup steps in the README.',
      });
    }

    // The tracker is created on demand from the resolved config. It carries the
    // runId, variationKey, modelName etc. that get attached to recorded metrics.
    const tracker = aiConfig.createTracker();
    const trackData = tracker.getTrackData();

    // -----------------------------------------------------------------------
    // Step 2: Translate LaunchDarkly's message format to Anthropic's API shape.
    // -----------------------------------------------------------------------
    // LaunchDarkly returns messages with roles "system", "user", "assistant".
    // The Anthropic Messages API takes the system prompt as a top-level `system`
    // parameter, NOT as a message with role: 'system'. So we split them.
    const ldMessages = aiConfig.messages ?? [];
    const systemPrompt = ldMessages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const conversationMessages = ldMessages.filter((m) => m.role !== 'system');

    // Append the user's actual question to the conversation.
    conversationMessages.push({ role: 'user', content: userMessage });

    // -----------------------------------------------------------------------
    // Step 3: Call Anthropic, wrapped by the LaunchDarkly tracker.
    // -----------------------------------------------------------------------
    // tracker.trackMetricsOf takes (extractor, modelCallFn). It:
    //   - Times the model call,
    //   - Awaits the response,
    //   - Hands the response to the extractor to pull token counts and success status,
    //   - Records duration + tokens + success/error to LaunchDarkly,
    //   - Returns the original response unchanged.
    //
    // The metrics show up on the AI Config's Monitoring tab in the LaunchDarkly UI.
    const response = await tracker.trackMetricsOf(
      anthropicMetricsExtractor,
      () =>
        anthropic.messages.create({
          model: aiConfig.model?.name ?? 'claude-haiku-4-5',
          max_tokens:
            (aiConfig.model?.parameters?.maxTokens) ??
            (aiConfig.model?.parameters?.max_tokens) ??
            512,
          temperature:
            (aiConfig.model?.parameters?.temperature) ?? 0.7,
          system: systemPrompt || undefined,
          messages: conversationMessages,
        }),
    );

    // Anthropic returns content as an array of blocks. For our text-only chat,
    // we concatenate any text blocks.
    const reply = (response.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // -----------------------------------------------------------------------
    // Step 4: Tell the UI what just happened.
    // -----------------------------------------------------------------------
    // We surface the resolved variation key and model so the demo UI can show
    // "you're talking to expert-sonnet (claude-sonnet-4-6)" — this is the moment
    // that sells the targeting story. Different persona → different panel.
    res.json({
      reply,
      variationKey: trackData.variationKey || '(fallback)',
      modelName: trackData.modelName || aiConfig.model?.name || 'unknown',
      tokens: {
        input: response.usage?.input_tokens ?? 0,
        output: response.usage?.output_tokens ?? 0,
      },
    });
  } catch (err) {
    console.error('Error handling /chat:', err);
    res.status(500).json({
      error: err.message || 'Internal server error',
    });
  }
});

// -----------------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------------

const server = app.listen(PORT, () => {
  console.log(`✓ Chatbot demo running at http://localhost:${PORT}`);
  console.log(`  Static UI dir: ${PUBLIC_DIR}`);
  if (!existsSync(PUBLIC_DIR)) {
    console.error(
      '  ⚠ The public/ directory does not exist at the path above. The UI will 404.\n' +
      '    Make sure the public/ folder (with index.html, chat.js, styles.css) is\n' +
      '    next to server.js. Re-check that the files unpacked correctly.',
    );
  } else {
    console.log('  Open that URL in your browser to use the demo.');
  }
});

// Flush analytics events on shutdown so the LD Monitoring tab doesn't lose
// the last few seconds of data when you Ctrl+C.
function shutdown(signal) {
  console.log(`\n${signal} received — flushing LaunchDarkly events and exiting...`);
  server.close(async () => {
    try {
      await ldClient.flush();
      await ldClient.close();
    } catch (err) {
      console.error('Error during shutdown:', err);
    }
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));