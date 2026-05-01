/**
 * All AI calls go through the Express backend proxy.
 * No API key is ever used in frontend code.
 */
export async function callGemini(prompt, systemInstruction = '', history = []) {
  const controller = new AbortController();
  // Increased timeout to 60s to allow backend retry logic to complete on rate limits
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction, history }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Something went wrong (status ${response.status})`);
    }

    const data = await response.json();
    return data.text || 'Unable to load content. Please try again.';
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  }
}

/**
 * Helper to build a Gemini-format message object.
 * Gemini uses 'model' (not 'assistant') for AI responses.
 */
export function geminiMessage(role, text) {
  return {
    role, // 'user' or 'model'
    parts: [{ text }],
  };
}
