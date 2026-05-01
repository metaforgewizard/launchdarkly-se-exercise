// =============================================================================
// Chat UI for the AI Configs demo
// =============================================================================
// All in vanilla JS, no build step. The UI does three things:
//   1. Loads the persona list from /personas and populates the dropdown.
//   2. POSTs the user's message + selected persona to /chat.
//   3. Renders the assistant's reply, and updates the "LaunchDarkly served"
//      panel with the variation, model, and token counts that came back.
// =============================================================================

const personaSelect = document.getElementById('persona-select');
const personaDescription = document.getElementById('persona-description');
const resolvedVariation = document.getElementById('resolved-variation');
const resolvedModel = document.getElementById('resolved-model');
const resolvedTokens = document.getElementById('resolved-tokens');
const chatLog = document.getElementById('chat-log');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatSubmit = document.getElementById('chat-submit');

let personas = [];

// ---------------------------------------------------------------------------
// Load personas on startup
// ---------------------------------------------------------------------------

async function loadPersonas() {
  try {
    const res = await fetch('/personas');
    if (!res.ok) throw new Error(`Failed to load personas (${res.status})`);
    personas = await res.json();
  } catch (err) {
    console.error(err);
    appendSystemMessage(
      `Could not load personas from the server. Is it running? (${err.message})`,
    );
    return;
  }

  personaSelect.innerHTML = '';
  for (const p of personas) {
    const opt = document.createElement('option');
    opt.value = p.personaKey;
    opt.textContent = p.label;
    personaSelect.appendChild(opt);
  }
  updatePersonaDescription();
}

function updatePersonaDescription() {
  const current = personas.find((p) => p.personaKey === personaSelect.value);
  personaDescription.textContent = current?.description ?? '';
}

personaSelect.addEventListener('change', () => {
  updatePersonaDescription();
  // Reset the resolved panel — values from the previous persona shouldn't linger.
  resolvedVariation.textContent = '—';
  resolvedModel.textContent = '—';
  resolvedTokens.textContent = '—';
  appendSystemMessage(`Switched to: ${personaSelect.options[personaSelect.selectedIndex].text}`);
});

// ---------------------------------------------------------------------------
// Chat form
// ---------------------------------------------------------------------------

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  chatInput.value = '';
  setBusy(true);

  const thinkingNode = appendMessage('assistant', '…', { pending: true });

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personaKey: personaSelect.value,
        userMessage,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed with status ${res.status}`);
    }

    const data = await res.json();
    thinkingNode.querySelector('.bubble__text').textContent = data.reply;
    thinkingNode.classList.remove('bubble--pending');

    // Update the "LaunchDarkly served" panel.
    resolvedVariation.textContent = data.variationKey || '—';
    resolvedModel.textContent = data.modelName || '—';
    resolvedTokens.textContent =
      data.tokens ? `${data.tokens.input} in / ${data.tokens.output} out` : '—';
  } catch (err) {
    console.error(err);
    thinkingNode.querySelector('.bubble__text').textContent =
      `Error: ${err.message}`;
    thinkingNode.classList.remove('bubble--pending');
    thinkingNode.classList.add('bubble--error');
  } finally {
    setBusy(false);
    chatInput.focus();
  }
});

// Submit on Enter, newline on Shift+Enter — standard chat ergonomics.
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function appendMessage(role, text, { pending = false } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `bubble bubble--${role}${pending ? ' bubble--pending' : ''}`;

  const label = document.createElement('div');
  label.className = 'bubble__label';
  label.textContent = role === 'user' ? 'You' : 'Assistant';

  const body = document.createElement('div');
  body.className = 'bubble__text';
  body.textContent = text;

  wrapper.appendChild(label);
  wrapper.appendChild(body);
  chatLog.appendChild(wrapper);
  chatLog.scrollTop = chatLog.scrollHeight;
  return wrapper;
}

function appendSystemMessage(text) {
  const node = document.createElement('div');
  node.className = 'system-line';
  node.textContent = text;
  chatLog.appendChild(node);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setBusy(isBusy) {
  chatSubmit.disabled = isBusy;
  chatInput.disabled = isBusy;
  chatSubmit.textContent = isBusy ? 'Sending…' : 'Send';
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

loadPersonas();
