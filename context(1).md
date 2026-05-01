# CivicPath — AI Agent Build Context

## Project Overview

**App Name:** CivicPath  
**Tagline:** "Democracy is a process. Let's walk through it together."  
**Type:** Full-stack React + Node.js application, containerized and deployed on Google Cloud Run  
**Purpose:** An AI-powered interactive guide that educates users about the complete election lifecycle from their personal perspective — as a voter, candidate, or curious citizen.  
**Challenge:** Election Process Education — create an assistant that helps users understand the election process, timelines, and steps in an interactive and easy-to-follow way.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend Framework | React 18 + Vite |
| Backend | Node.js + Express |
| AI | Google Gemini API (server-side only) |
| Model | `gemini-2.0-flash` |
| Styling | Tailwind CSS via PostCSS |
| Icons | `lucide-react` |
| State | React `useState` / `useReducer` |
| Container | Docker (multi-stage build) |
| Hosting | Google Cloud Run |
| Secrets | GCP Secret Manager |
| Storage | In-memory only (no database) |

> **Security principle:** The Gemini API key never touches the frontend. All Gemini calls are made server-side by Express. The React app calls `/api/generate` on the same origin — no key exposed in the browser.

---

## Project Structure

```
civicpath/
├── client/                          # React frontend (Vite)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                 # React entry point
│       ├── index.css                # Tailwind base imports
│       └── App.jsx                  # Root component + all sub-components
│
├── server/                          # Node.js/Express backend
│   ├── index.js                     # Express server — Gemini proxy + static serving
│   └── package.json
│
├── Dockerfile                       # Multi-stage build
├── .dockerignore
├── .env.example                     # Template — never commit real .env
└── .gitignore
```

### How the Two Sides Talk

The React frontend never calls Gemini directly. Every AI request goes to the Express backend at `/api/generate`, which holds the API key securely and forwards the request to Gemini. The response flows back through Express to the browser.

```
Browser (React)
    │
    │  POST /api/generate
    │  { prompt, systemInstruction, history }
    ▼
Express Server (Cloud Run container)
    │
    │  POST generativelanguage.googleapis.com
    │  Authorization: key from Secret Manager
    ▼
Gemini API
```

For all other routes (`GET *`), Express serves the compiled React static files from `client/dist/`.

---

## Backend: Express Server (`server/index.js`)

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
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

  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: err });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'No response generated.';

    res.json({ text });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    res.status(500).json({ error: 'Failed to reach Gemini API.' });
  }
});

// ── Serve React build (SPA fallback) ──────────────────────────────────────
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;  // Cloud Run injects PORT automatically
app.listen(PORT, () => console.log(`CivicPath running on port ${PORT}`));
```

**`server/package.json`:**
```json
{
  "name": "civicpath-server",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

---

## Frontend: Vite Config (`client/vite.config.js`)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // In local dev, proxy /api calls to Express running on 8080
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
```

This proxy means developers run `npm run dev` (Vite on port 5173) and `node server/index.js` (Express on 8080) simultaneously in local dev, and `/api/generate` calls are forwarded transparently. In production on Cloud Run, both are served from the same Express process on the same port — no proxy needed.

**`client/package.json`:**
```json
{
  "name": "civicpath-client",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## Dockerfile (Multi-Stage Build)

```dockerfile
# ── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build
# Output: /app/client/dist


# ── Stage 2: Production server image ──────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy Express server
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/

# Copy built React app from Stage 1
COPY --from=frontend-build /app/client/dist ./client/dist

# Cloud Run sets PORT env var automatically (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.js"]
```

**`.dockerignore`:**
```
node_modules
client/node_modules
server/node_modules
client/.vite
client/dist
.env
.git
.gitignore
*.md
```

---

## GCP Cloud Run Deployment

### One-Time Setup

```bash
# 1. Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com

# 3. Store Gemini API key in Secret Manager
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy=automatic

# 4. Grant Cloud Run service account access to the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Build & Deploy

```bash
# 5. Build container image via Cloud Build
gcloud builds submit \
  --tag gcr.io/YOUR_PROJECT_ID/civicpath \
  .

# 6. Deploy to Cloud Run
gcloud run deploy civicpath \
  --image gcr.io/YOUR_PROJECT_ID/civicpath \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

### Subsequent Deploys (CI/CD pattern)

```bash
# Rebuild image and redeploy in one command
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/civicpath . && \
gcloud run deploy civicpath \
  --image gcr.io/YOUR_PROJECT_ID/civicpath \
  --region us-central1
```

### Environment Variables Summary

| Variable | Source | Used by |
|---|---|---|
| `PORT` | Injected by Cloud Run automatically | `server/index.js` |
| `GEMINI_API_KEY` | GCP Secret Manager via `--set-secrets` | `server/index.js` |

Never hardcode `GEMINI_API_KEY` anywhere in the codebase. It must only ever come from the runtime environment.

**`.env.example` (commit this, not `.env`):**
```
# Copy to .env for local development — never commit .env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8080
```

---

## Local Development Workflow

```bash
# Terminal 1 — Start Express backend
cd server && npm install && node index.js
# Runs on http://localhost:8080

# Terminal 2 — Start Vite frontend dev server
cd client && npm install && npm run dev
# Runs on http://localhost:5173
# /api calls are proxied to :8080 via vite.config.js

# Visit http://localhost:5173 in browser
```

For local dev, create `server/.env` with your real key and load it:
```javascript
// Add to top of server/index.js for local dev only
import 'dotenv/config';  // npm install dotenv --save-dev
```

---



### Visual Tone
Clean, modern civic-tech aesthetic. Inspired by editorial design and high-quality government reform organizations. NOT a typical government website. Think Bloomberg CityLab meets Stripe's documentation clarity.

### Color Palette (CSS variables via inline styles or Tailwind)
| Role | Value |
|---|---|
| Background | `#F8F7F4` (warm off-white) |
| Surface | `#FFFFFF` |
| Primary | `#1B2F5E` (deep navy) |
| Accent | `#E8A020` (warm amber) |
| Text Primary | `#111827` |
| Text Secondary | `#6B7280` |
| Success | `#10B981` |
| Border | `#E5E7EB` |

### Typography
- **Display / Headings:** Use `font-serif` (Georgia fallback) for major headlines — gives civic gravitas
- **Body / UI:** Clean sans-serif (`font-sans`) for all UI elements
- **Code/Data:** Monospace for dates and deadlines

### Motion & Interaction
- Slide-in animations for onboarding cards (CSS transitions, 300ms ease)
- Fade + scale for screen transitions
- Subtle hover states on all clickable elements (scale 1.02, shadow lift)
- Left border stripe on selected timeline items (amber, 4px)
- Badge unlock animation (scale from 0.5 to 1.0 with bounce)

---

## Application Architecture

### State Shape

```javascript
const initialState = {
  // Onboarding
  screen: 'welcome',          // 'welcome' | 'timeline' | 'scenario' | 'badges'
  onboarding: {
    country: '',
    region: '',
    role: '',                 // 'voter' | 'candidate' | 'citizen'
    experience: '',           // 'first-time' | 'experienced'
    step: 0,                  // 0, 1, 2 — which onboarding question is active
    complete: false,
  },
  // Timeline
  selectedPhase: null,        // phase id string
  phaseContent: {},           // { [phaseId]: string } — cached Claude responses
  phaseLoadingId: null,       // which phase is currently fetching
  completedPhases: [],        // array of phase ids user has visited
  // Scenario
  currentScenario: null,      // { phaseId, scenarioIndex }
  scenarioResponse: '',       // Claude's response to scenario choice
  selectedOption: null,       // index of chosen option
  completedScenarios: [],     // array of phase ids with completed scenarios
  // Chat Drawer
  chatOpen: false,
  chatMessages: [],           // [{ role: 'user'|'assistant', content: string }]
  chatInput: '',
  chatLoading: false,
  // Badges
  badges: [],                 // earned badge ids
}
```

### Screens / Views
1. **Welcome** — Onboarding flow (3 sequential question cards)
2. **Timeline** — Split-panel: left timeline list + right detail panel
3. **Scenario** — Overlays the detail panel with a scenario challenge card
4. **Badges** — Progress and achievements shelf

The chat drawer is a persistent overlay available on all screens.

---

## Screen-by-Screen Specification

---

### Screen 1: Welcome / Onboarding

**Layout:** Full viewport. Centered content column, max-width 560px. Background is the warm off-white. A subtle decorative pattern (small dot grid or diagonal lines) in the background adds texture.

**Header section:**
- Small "CivicPath" wordmark at top center
- Large serif headline: *"Democracy is a process. Let's walk through it together."*
- Subtext: *"Answer 3 quick questions and we'll build your personalized election guide."*
- A minimal SVG illustration of a ballot box or capitol building (inline SVG, simple line art in navy)

**Question Cards (appear sequentially, slide in from right):**

**Card 1 — Location:**
- Label: "Where are you voting?"
- A searchable text input for country
- Below it, a conditional text input for state/region (appears after country is typed)
- "Next" button in navy with amber arrow icon

**Card 2 — Role (3 large tiles in a row):**
- **Voter** — icon: checkmark ballot — description: "I want to participate in an election"
- **Candidate** — icon: megaphone — description: "I'm running for office"
- **Curious Citizen** — icon: book — description: "I want to understand how it all works"
- Tiles have a navy border on hover, filled navy background when selected
- Selecting a tile auto-advances (no "Next" button needed)

**Card 3 — Experience (2 tiles):**
- **First time** — "This is new to me"
- **I've done this before** — "I want a refresher"
- Same auto-advance behavior

**Final CTA:**
- After card 3 is answered, a "Build My Roadmap →" button appears with a subtle pulse animation
- Clicking it transitions to the Timeline screen with a fade

---

### Screen 2: Timeline (Core Experience)

**Layout:** Two-column split. Left panel is 320px fixed width. Right panel fills remaining space. Both panels are full-height scrollable independently.

---

**Left Panel — Phase Timeline:**

A vertical list of election phase cards. Each card contains:
- Phase number (small, muted, top-left)
- Phase name (bold, medium font)
- Short descriptor (one line, muted text)
- Date/deadline chip (small amber pill)
- Status icon: empty circle (not visited) → filled checkmark (visited) → star (scenario completed)

**Selected state:** Navy left border (4px), light navy background tint, phase name in full navy.

**Phase data (hardcoded array):**

```javascript
const ELECTION_PHASES = [
  {
    id: 'registration',
    number: '01',
    name: 'Voter Registration',
    descriptor: 'Establish your right to vote',
    deadline: 'Varies by state',
    icon: 'ClipboardCheck',
  },
  {
    id: 'candidate-filing',
    number: '02',
    name: 'Candidate Filing',
    descriptor: 'Officially declare your candidacy',
    deadline: '6–12 months before election',
    icon: 'FileText',
  },
  {
    id: 'primary',
    number: '03',
    name: 'Primary Election',
    descriptor: 'Parties select their nominees',
    deadline: 'Varies by state',
    icon: 'Vote',
  },
  {
    id: 'campaign-period',
    number: '04',
    name: 'Campaign Period',
    descriptor: 'Candidates make their case',
    deadline: 'Weeks to months',
    icon: 'Megaphone',
  },
  {
    id: 'election-day',
    number: '05',
    name: 'Election Day',
    descriptor: 'Citizens cast their votes',
    deadline: 'First Tuesday after first Monday in November',
    icon: 'CalendarCheck',
  },
  {
    id: 'counting',
    number: '06',
    name: 'Vote Counting & Certification',
    descriptor: 'Ballots are tallied and results certified',
    deadline: 'Days to weeks after election',
    icon: 'BarChart2',
  },
  {
    id: 'transition',
    number: '07',
    name: 'Transition & Inauguration',
    descriptor: 'Power transfers to elected officials',
    deadline: 'Jan 20 (US Presidential)',
    icon: 'Flag',
  },
];
```

---

**Right Panel — Detail Panel:**

When no phase is selected (initial state):
- Empty state message: "← Select a phase to explore it"
- Subtle illustration or decorative element

When a phase is selected, the panel shows:

**Top section:**
- Phase name in large serif heading
- "What this means for you" subheading (personalized based on role from onboarding)
- A role badge chip: e.g., "👤 Voter perspective"

**Claude Content Area:**
- A loading skeleton (3 animated shimmer bars) while Claude is fetching
- Claude's personalized explanation rendered as formatted text once loaded
- Content is **cached** in `phaseContent` state so revisiting a phase doesn't re-fetch

**Quick Facts Row:**
- 3 pill chips with bite-sized facts, hardcoded per phase per role
- Example for Election Day / Voter: "Polls open 6am–8pm in most states" | "Photo ID required in 35 states" | "Provisional ballots available if not on rolls"

**Bottom CTA:**
- "Test Your Knowledge →" button in amber — triggers Scenario mode for this phase
- Only show if phase has a scenario defined

---

### Screen 3: Scenario Mode

Scenario mode **replaces** the right panel content (left timeline stays visible).

**Layout:**

**Top:** Small breadcrumb: "Election Day › Scenario"

**Scenario Card:**
- Phase icon in a large navy circle at top
- "What Would You Do?" label in small caps amber text
- Scenario text in large, readable body font (2–3 sentences, second person)
- Scenario is **hardcoded** per phase (see scenarios data below)

**Answer Options (3–4 cards, full width, stacked):**
- Each option is a card with a letter label (A, B, C, D) and 1–2 sentence response
- Hover: slight navy border
- On click: selected option gets a navy background, others dim

**Claude Response Area (appears after selection):**
- Animated slide-down reveal
- If correct: green checkmark icon + affirming explanation
- If incorrect: amber X icon + gentle correction with the right answer
- Claude response is fetched when user clicks an option

**Navigation:**
- "Back to Timeline" link (top left of panel)
- After Claude responds: "Continue →" returns to detail panel and marks phase with a star

**Hardcoded Scenario Data:**

```javascript
const SCENARIOS = {
  registration: {
    text: "It's 30 days before Election Day and you just moved to a new address. You're worried your voter registration is outdated. What should you do?",
    options: [
      { label: 'A', text: 'Do nothing — your old registration is still valid anywhere in the state.' },
      { label: 'B', text: 'Update your voter registration with your new address immediately.' },
      { label: 'C', text: 'Show up on Election Day with a utility bill — that\'s enough proof of address.' },
      { label: 'D', text: 'Register at the polling place on Election Day.' },
    ],
    correctIndex: 1,
  },
  'election-day': {
    text: "You arrive at your polling place and the poll worker says your name isn't on the voter rolls, even though you registered 2 months ago. The polls close in 3 hours. What do you do?",
    options: [
      { label: 'A', text: 'Leave and accept that you can\'t vote today.' },
      { label: 'B', text: 'Call your local election office immediately to verify your registration status.' },
      { label: 'C', text: 'Ask for a provisional ballot and cast your vote — it will be counted if your registration is confirmed.' },
      { label: 'D', text: 'Go to a different polling location and try again.' },
    ],
    correctIndex: 2,
  },
  primary: {
    text: "You support a candidate in an upcoming primary but you're registered as an independent. Your friend says you can't vote in the primary. Is your friend right?",
    options: [
      { label: 'A', text: 'Yes, only registered party members can ever vote in primaries.' },
      { label: 'B', text: 'No — independents can always vote in any primary they choose.' },
      { label: 'C', text: 'It depends on your state — some have open primaries, others are closed to registered party members only.' },
      { label: 'D', text: 'Only if you re-register as a party member at least 1 year in advance.' },
    ],
    correctIndex: 2,
  },
  'campaign-period': {
    text: "You're a first-time candidate and a local business owner offers to donate $10,000 cash directly to you personally to help your campaign. What should you do?",
    options: [
      { label: 'A', text: 'Accept it — cash donations are fine as long as you report them later.' },
      { label: 'B', text: 'Decline — cash contributions above legal limits and direct personal payments violate campaign finance law.' },
      { label: 'C', text: 'Accept only $2,500 and return the rest.' },
      { label: 'D', text: 'Accept it but keep it separate from your personal bank account.' },
    ],
    correctIndex: 1,
  },
};
```

---

### Persistent: "Ask Anything" Chat Drawer

**Trigger:** Floating button in top-right nav ("Ask Anything" with a chat bubble icon). On mobile, becomes a floating action button (bottom-right corner).

**Drawer behavior:**
- Slides in from the right, 420px wide on desktop
- A semi-transparent dark overlay covers the rest of the screen (click to dismiss)
- Drawer does NOT replace or navigate away from current screen

**Drawer layout:**
- **Header:** "Ask CivicPath" title + close (X) button
- **Context chip:** Shows user's role and country (e.g., "🗳 Voter · United States") — so Claude knows context
- **Message thread:** Scrollable. User bubbles right-aligned (navy bg, white text). Claude bubbles left-aligned (white bg, navy text, subtle shadow). Each Claude message has a small CivicPath logo avatar.
- **Input bar:** Text input + Send button. Placeholder: "Ask anything about elections..."
- **Loading indicator:** Animated typing dots in a Claude bubble while fetching

**System prompt for chat (passed via `systemInstruction` in every API call):**
```
You are CivicPath, a friendly and knowledgeable election education assistant. 
The user is a [ROLE] in [COUNTRY/REGION] with [EXPERIENCE LEVEL] experience.
Your job is to explain election processes, timelines, and civic concepts in plain, 
jargon-free language. Always be actionable — end responses with a clear next step 
or key takeaway. Keep responses concise (3–5 sentences max unless asked for more). 
Never discuss candidates, political parties, or share political opinions. 
Stay strictly educational and nonpartisan.
```
Replace `[ROLE]`, `[COUNTRY/REGION]`, and `[EXPERIENCE LEVEL]` with values from onboarding state.

**Chat includes full conversation history** in each API call (multi-turn context).

---

### Screen 4: Badges & Progress

**Access:** Click the progress indicator in the top nav bar.

**Layout:** Full-screen overlay or separate screen. Grid of badge cards, 3 per row.

**Badge Card:**
- Circle emblem (80px) with icon inside
- Badge name below
- Short unlock condition description
- Locked: grayscale + padlock overlay
- Unlocked: full color + subtle glow shadow
- First-time unlock: CSS scale animation from 0.5 → 1.0 with bounce

**Badge Definitions:**

```javascript
const BADGES = [
  {
    id: 'registered',
    name: 'Registration Pro',
    description: 'Explored the Voter Registration phase',
    icon: 'ClipboardCheck',
    color: '#10B981',
    unlockCondition: (state) => state.completedPhases.includes('registration'),
  },
  {
    id: 'primary-school',
    name: 'Primary School',
    description: 'Explored the Primary Election phase',
    icon: 'GraduationCap',
    color: '#3B82F6',
    unlockCondition: (state) => state.completedPhases.includes('primary'),
  },
  {
    id: 'ballot-decoder',
    name: 'Ballot Decoder',
    description: 'Completed the Election Day scenario',
    icon: 'Search',
    color: '#E8A020',
    unlockCondition: (state) => state.completedScenarios.includes('election-day'),
  },
  {
    id: 'campaign-trail',
    name: 'On the Trail',
    description: 'Explored the Campaign Period phase',
    icon: 'Megaphone',
    color: '#8B5CF6',
    unlockCondition: (state) => state.completedPhases.includes('campaign-period'),
  },
  {
    id: 'scenario-ace',
    name: 'Scenario Ace',
    description: 'Completed 3 or more scenarios',
    icon: 'Star',
    color: '#F59E0B',
    unlockCondition: (state) => state.completedScenarios.length >= 3,
  },
  {
    id: 'full-cycle',
    name: 'Full Cycle',
    description: 'Explored all 7 election phases',
    icon: 'Award',
    color: '#1B2F5E',
    unlockCondition: (state) => state.completedPhases.length >= 7,
  },
];
```

**Progress bar:** Below badge grid. Label: "Your Journey" + percentage complete (based on phases visited / 7).

---

## Gemini API Integration

### Phase Detail — System Instruction + Prompt

Pass the persona as `systemInstruction` and the specific request as the user `content`:

**systemInstruction:**
```
You are CivicPath, an election education assistant. You explain election topics in plain, 
jargon-free language. No political opinions. Strictly educational and nonpartisan.
Do not use bullet points — write in flowing, readable prose. Keep responses to 4–6 sentences.
```

**User prompt:**
```
Explain the "[PHASE_NAME]" phase of the election process to a [ROLE] in [COUNTRY/REGION] 
who has [EXPERIENCE LEVEL] experience with elections.

Be specific, practical, and personalized to their role.
Focus on what this phase means FOR THEM — what they need to do, watch for, or understand.
```

### Scenario Response — System Instruction + Prompt

**systemInstruction:**
```
You are CivicPath, an election education assistant. Be encouraging, never condescending.
Write in a conversational tone. No bullet points. No political opinions. Strictly educational.
End every response with one clear, actionable takeaway.
```

**User prompt:**
```
The user is a [ROLE] in [COUNTRY/REGION]. They were presented with this election scenario:

"[SCENARIO_TEXT]"

They chose option [SELECTED_OPTION_LABEL]: "[SELECTED_OPTION_TEXT]"
The correct answer is option [CORRECT_OPTION_LABEL]: "[CORRECT_OPTION_TEXT]"

[If correct]: Affirm their choice warmly and explain in 2–3 sentences WHY this was the right move, 
adding one additional insight they might not have known.

[If incorrect]: Gently explain in 2–3 sentences why their choice wasn't the best option, 
then clearly explain what the right move is and why.
```

### Frontend API Call Function (`client/src/App.jsx`)

The frontend **never calls Gemini directly**. It calls the Express proxy at `/api/generate`. No API key needed in any frontend code.

```javascript
// All AI calls go through the Express backend proxy
async function callGemini(prompt, systemInstruction = '', history = []) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction, history }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.text || 'Unable to load content. Please try again.';
}
```

**Multi-turn chat history format (Gemini shape, stored in React state):**
```javascript
const geminiMessage = (role, text) => ({
  role,           // 'user' or 'model'  (NOT 'assistant')
  parts: [{ text }],
});

// Example chatMessages state array:
const chatMessages = [
  geminiMessage('user', 'What is a primary election?'),
  geminiMessage('model', 'A primary election is...'),
  geminiMessage('user', 'Who can vote in one?'),
];
```

Cache phase detail responses in the `phaseContent` state object using `phaseId` as the key. Never re-fetch a phase that already has cached content.

---

## Navigation & Top Bar

The top nav bar is fixed, full-width, height ~56px, white background with a bottom border.

**Left:** "CivicPath" wordmark — clicking returns to the timeline (if onboarding is complete)

**Center:** Compact progress indicator — 7 small dots, one per phase. Filled/colored dots for visited phases. Clicking the center area navigates to the Badges screen.

**Right:** "Ask Anything" button — navy outline button with chat bubble icon (Lucide `MessageCircle`). Clicking opens the chat drawer.

During onboarding (Screen 1), the nav bar shows only the wordmark — no progress or chat button yet.

---

## Routing / Screen Transitions

There is no React Router. Screen changes are managed entirely via the `screen` value in state. Wrap all screen renders in a parent div with a CSS transition class:

```javascript
<div style={{ opacity: 1, transition: 'opacity 0.3s ease' }}>
  {screen === 'welcome' && <WelcomeScreen />}
  {screen === 'timeline' && <TimelineScreen />}
  {screen === 'badges' && <BadgesScreen />}
</div>
```

The chat drawer renders outside this wrapper so it's always on top via `position: fixed`.

---

## Error Handling

- Wrap all `callGemini()` calls in try/catch
- On error: show an inline error message in the content area with a "Try Again" button
- Chat drawer: show "Couldn't connect. Try again." in a CivicPath bubble on failure
- Never leave the user on a blank loading state for more than 8 seconds — show a timeout message
- If the Express server returns a non-200 status, surface a human-readable error (not a raw status code)

---

## Accessibility

- All interactive elements have clear focus states (navy outline, 2px offset)
- Color is never the sole indicator of state — always pair with icon or text
- All images/illustrations have `aria-label` or `aria-hidden` as appropriate
- Keyboard navigation: Escape closes the chat drawer; Enter submits chat input

---

## Mobile Breakpoints

Apply these layout changes at viewport width < 768px:

| Desktop | Mobile |
|---|---|
| Two-column timeline layout | Single column; phase list becomes horizontal scrollable chips at top |
| Phase detail in right panel | Detail slides up as bottom sheet (70vh height, rounded top corners) |
| Chat drawer (420px, right side) | Chat drawer is full-screen |
| "Ask Anything" in nav | Floating action button, bottom-right, navy circle with chat icon |

---

## File Delivery

The agent must produce the following files:

```
civicpath/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       └── App.jsx          ← All React components live here
│
├── server/
│   ├── index.js             ← Express server + Gemini proxy
│   └── package.json
│
├── Dockerfile
├── .dockerignore
└── .env.example
```

**`client/src/App.jsx` component tree:**
```
App (root, holds all state)
├── TopNav
├── WelcomeScreen
│   └── OnboardingCard (x3)
├── TimelineScreen
│   ├── PhaseList (left panel)
│   │   └── PhaseCard (x7)
│   └── DetailPanel (right panel)
│       ├── PhaseDetail
│       └── ScenarioCard
├── BadgesScreen
│   └── BadgeCard (x6)
└── ChatDrawer (always rendered, shown/hidden via state)
```

All sub-components are defined as named functions in `App.jsx` above the default `App` export. No separate component files needed.

---

## Summary Checklist for the Agent

**Project Structure**
- [ ] `client/` folder with Vite + React 18 setup
- [ ] `server/` folder with Express server
- [ ] `Dockerfile` with multi-stage build (frontend build → production image)
- [ ] `.dockerignore` excluding node_modules, .env, dist
- [ ] `.env.example` committed (never `.env` itself)

**Backend (`server/index.js`)**
- [ ] `POST /api/generate` endpoint proxies to Gemini using server-side `GEMINI_API_KEY`
- [ ] `GET *` serves `client/dist` static files (SPA fallback)
- [ ] Listens on `process.env.PORT || 8080`
- [ ] `GEMINI_API_KEY` read from `process.env` only — never hardcoded
- [ ] Gemini message format used: `role: 'user'`/`'model'`, `parts: [{ text }]`
- [ ] `systemInstruction` passed as separate field in Gemini request body
- [ ] Error responses return JSON with an `error` field and appropriate HTTP status

**Frontend (`client/src/App.jsx`)**
- [ ] `callGemini()` calls `/api/generate` — no direct Gemini calls, no API key in frontend
- [ ] All 4 screens: Welcome, Timeline, Badges + Chat Drawer
- [ ] Tailwind CSS for all styling
- [ ] `lucide-react` for all icons
- [ ] Phase content cached in state — no duplicate API calls
- [ ] Scenario logic for at least 4 phases
- [ ] 6 badges with correct unlock conditions
- [ ] Chat drawer with multi-turn conversation history in Gemini format
- [ ] Mobile-responsive layout
- [ ] Error handling on all `callGemini()` calls
- [ ] No localStorage / sessionStorage usage
- [ ] Screen transitions managed via state (no React Router)
- [ ] Onboarding context injected into all Gemini prompts via `systemInstruction`

**Vite Config**
- [ ] `/api` proxy to `http://localhost:8080` configured for local dev

**Cloud Run**
- [ ] `GEMINI_API_KEY` stored in GCP Secret Manager
- [ ] Secret mounted via `--set-secrets GEMINI_API_KEY=gemini-api-key:latest`
- [ ] Container exposes port 8080
- [ ] `--allow-unauthenticated` flag set (public app)
- [ ] `--min-instances 0` for cost efficiency (scales to zero when idle)
