import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ── Gemini proxy endpoint ──────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { prompt, systemInstruction, history = [] } = req.body;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured.' });
  }

  // Build contents array from history or single prompt
  const contents = history.length > 0
    ? history
    : [{ role: 'user', parts: [{ text: prompt }] }];

  const body = {
    contents,
    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const makeRequest = async (retryCount = 0) => {
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`Gemini API error (${geminiRes.status}):`, errText);

      // Auto-retry with exponential backoff on rate limit (429) or server error (5xx)
      if ((geminiRes.status === 429 || geminiRes.status >= 500) && retryCount < 3) {
        const baseDelay = Math.pow(2, retryCount) * 2000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        console.log(`Rate limited or server error — retrying in ${Math.round(delay)}ms (Attempt ${retryCount + 1}/3)...`);
        await new Promise((r) => setTimeout(r, delay));
        return makeRequest(retryCount + 1);
      }

      // Parse error for user-friendly message
      let userMessage = 'Failed to get response from AI service.';
      try {
        const errJson = JSON.parse(errText);
        const status = errJson?.error?.status;
        if (geminiRes.status === 429 || status === 'RESOURCE_EXHAUSTED') {
          userMessage = 'AI service is rate-limited. Please wait a moment and try again.';
        } else if (geminiRes.status === 403 || status === 'PERMISSION_DENIED') {
          userMessage = 'API key is invalid or lacks permissions.';
        }
      } catch (_) { /* ignore parse errors */ }

      const error = new Error(userMessage);
      error.status = geminiRes.status;
      throw error;
    }

    return geminiRes.json();
  };

  try {
    const data = await makeRequest();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'No response generated.';

    res.json({ text });
  } catch (err) {
    console.error('Gemini proxy error:', err.message);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Failed to reach AI service. Please try again.' });
  }
});

// ── Serve React build (SPA fallback) ──────────────────────────────────────
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`CivicPath running on port ${PORT}`));
