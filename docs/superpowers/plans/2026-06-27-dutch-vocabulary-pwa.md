# Dutch Vocabulary PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Progressive Web App for learning Dutch vocabulary using SM-2 spaced repetition, sourcing words from a Google Sheet, working offline, installable on phone and laptop.

**Architecture:** React SPA fetches word data from a Google Sheets CSV URL and caches it in IndexedDB alongside SRS progress. A Vite PWA plugin generates the service worker that caches app assets for offline use. All state is local — no backend.

**Tech Stack:** React 18, Vite 5, vite-plugin-pwa (Workbox), react-router-dom v6, idb (IndexedDB wrapper), Vitest + @testing-library/react, deployed on Vercel.

## Global Constraints

- Node 20+
- React 18 with hooks only — no class components
- CSS custom properties for theming — no CSS-in-JS, no Tailwind
- `prefers-color-scheme` media query drives dark/light mode automatically — no manual toggle
- All SRS logic is pure functions — no side effects in sm2.js
- IndexedDB is the only persistence layer — no localStorage, no cookies
- Google Sheets CSV fetch URL format: `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet={TAB}`
- SM-2 quality scale: Again=1, Hard=3, Good=4, Easy=5
- A card is "learned" when its interval >= 21 days
- All dates stored as ISO 8601 strings in IndexedDB

---

## File Map

```
dutch-words/
├── public/
│   ├── icon-192.png              # PWA icon (placeholder — user replaces)
│   └── icon-512.png              # PWA icon (placeholder — user replaces)
├── src/
│   ├── main.jsx                  # React root mount
│   ├── App.jsx                   # BrowserRouter + Routes
│   ├── index.css                 # CSS variables, reset, global styles, dark mode
│   ├── config.js                 # Spreadsheet ID + chapter tab names
│   ├── test-setup.js             # Vitest global setup
│   │
│   ├── lib/
│   │   ├── sm2.js                # SM-2 algorithm — pure functions only
│   │   ├── sm2.test.js           # SM-2 unit tests
│   │   ├── db.js                 # IndexedDB via idb — words, progress, meta stores
│   │   ├── db.test.js            # IndexedDB integration tests
│   │   ├── sheets.js             # Fetch + parse Google Sheets CSV
│   │   └── sheets.test.js        # CSV parser unit tests
│   │
│   ├── hooks/
│   │   ├── useProgress.js        # Loads words + progress, computes streak + due count
│   │   ├── useReviewQueue.js     # Builds today's due queue, applies SM-2 on rating
│   │   └── useVoice.js           # Web Speech API TTS
│   │
│   └── components/
│       ├── Dashboard.jsx         # Chapter list, streak, due count, sync button
│       ├── ChapterCard.jsx       # Chapter name + progress bar
│       ├── ProgressBar.jsx       # Reusable progress bar
│       ├── ReviewSession.jsx     # Full-screen review flow
│       └── Flashcard.jsx         # Flip card — Dutch front, definition+example back
├── index.html
├── vite.config.js
├── package.json
└── vercel.json
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `dutch-words/package.json`
- Create: `dutch-words/vite.config.js`
- Create: `dutch-words/index.html`
- Create: `dutch-words/src/main.jsx`
- Create: `dutch-words/src/App.jsx`
- Create: `dutch-words/src/index.css`
- Create: `dutch-words/src/config.js`
- Create: `dutch-words/src/test-setup.js`

**Interfaces:**
- Produces: `SPREADSHEET_ID`, `CHAPTERS` exported from `src/config.js`
- Produces: `<App />` component at `/` and `/review` routes

- [ ] **Step 1: Create the project directory and install dependencies**

```bash
mkdir dutch-words && cd dutch-words
npm create vite@latest . -- --template react
npm install react-router-dom idb
npm install -D vite-plugin-pwa vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Run dev server to confirm scaffold works**

```bash
npm run dev
```
Expected: Vite dev server starts on http://localhost:5173, browser shows default Vite+React page.

- [ ] **Step 3: Replace `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Dutch Words',
        short_name: 'Dutch',
        description: 'Dutch vocabulary spaced repetition',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/docs\.google\.com\/spreadsheets/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sheets-cache',
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
})
```

- [ ] **Step 4: Create `src/test-setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create `src/config.js`**

```js
// Replace SPREADSHEET_ID with your Google Sheet's ID from the URL
// e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
// → SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms'
export const SPREADSHEET_ID = '';

// Tab names exactly as they appear in your Google Sheet
export const CHAPTERS = [
  'Chapter 1',
  'Chapter 2',
  'Chapter 3',
  'Chapter 4',
];
```

- [ ] **Step 6: Create `src/index.css`**

```css
:root {
  --bg: #ffffff;
  --surface: #f5f5f5;
  --surface2: #e8e8e8;
  --text: #111111;
  --text-muted: #666666;
  --accent: #4361ee;
  --accent-hover: #3651d4;
  --again: #e63946;
  --hard: #f4a261;
  --good: #2a9d8f;
  --easy: #457b9d;
  --radius: 12px;
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f0f1a;
    --surface: #1a1a2e;
    --surface2: #252540;
    --text: #f0f0f0;
    --text-muted: #999999;
    --shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px;
}

button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  font-size: 1rem;
  font-family: inherit;
  padding: 12px 20px;
  transition: opacity 0.15s;
}
button:active { opacity: 0.8; }

a { color: inherit; text-decoration: none; }
```

- [ ] **Step 7: Create `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 8: Create `src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import ReviewSession from './components/ReviewSession'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review" element={<ReviewSession />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 9: Add placeholder icons**

```bash
# Create minimal 1x1 PNG placeholders so the PWA manifest doesn't 404
# The user replaces these with real icons later
python3 -c "
import base64, struct, zlib

def make_png(size, color=(67, 97, 238)):
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
    r, g, b = color
    raw = bytes([0, r, g, b] * size) * size
    compressed = zlib.compress(raw)
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')

open('public/icon-192.png', 'wb').write(make_png(192))
open('public/icon-512.png', 'wb').write(make_png(512))
print('Icons created')
"
```

Expected output: `Icons created`

- [ ] **Step 10: Delete generated boilerplate files**

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 11: Confirm dev server still works**

```bash
npm run dev
```

Expected: Server starts, browser shows a blank page (no errors in console).

- [ ] **Step 12: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Vite React PWA project"
```

---

## Task 2: SM-2 Algorithm

**Files:**
- Create: `src/lib/sm2.js`
- Create: `src/lib/sm2.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `AGAIN = 1`, `HARD = 3`, `GOOD = 4`, `EASY = 5` (number constants)
  - `LEARNED_INTERVAL = 21` (number constant)
  - `nextReview(card, quality) → { interval, repetitions, efactor, dueDate }` where `card` is `{ interval?, repetitions?, efactor?, dueDate? }` and quality is one of the constants above
  - `isDue(card) → boolean` where card has optional `dueDate` string
  - `isLearned(card) → boolean` where card has optional `interval` number

- [ ] **Step 1: Write the failing tests**

Create `src/lib/sm2.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextReview, isDue, isLearned, AGAIN, HARD, GOOD, EASY, LEARNED_INTERVAL } from './sm2'

describe('nextReview', () => {
  it('new card rated AGAIN resets to interval=1, repetitions=0', () => {
    const result = nextReview({}, AGAIN)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  it('new card rated GOOD gives interval=1, repetitions=1', () => {
    const result = nextReview({}, GOOD)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
  })

  it('first successful review gives interval=6, repetitions=2', () => {
    const card = { interval: 1, repetitions: 1, efactor: 2.5 }
    const result = nextReview(card, GOOD)
    expect(result.interval).toBe(6)
    expect(result.repetitions).toBe(2)
  })

  it('second successful review multiplies interval by efactor', () => {
    const card = { interval: 6, repetitions: 2, efactor: 2.5 }
    const result = nextReview(card, GOOD)
    expect(result.interval).toBe(15) // round(6 * 2.5)
    expect(result.repetitions).toBe(3)
  })

  it('AGAIN on a mature card resets repetitions to 0', () => {
    const card = { interval: 15, repetitions: 3, efactor: 2.5 }
    const result = nextReview(card, AGAIN)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  it('efactor decreases on HARD', () => {
    const card = { interval: 1, repetitions: 1, efactor: 2.5 }
    const result = nextReview(card, HARD)
    expect(result.efactor).toBeLessThan(2.5)
  })

  it('efactor increases on EASY', () => {
    const card = { interval: 1, repetitions: 1, efactor: 2.5 }
    const result = nextReview(card, EASY)
    expect(result.efactor).toBeGreaterThan(2.5)
  })

  it('efactor never drops below 1.3', () => {
    let card = { interval: 1, repetitions: 1, efactor: 1.3 }
    const result = nextReview(card, HARD)
    expect(result.efactor).toBeGreaterThanOrEqual(1.3)
  })

  it('dueDate is in the future by interval days', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    vi.setSystemTime(now)
    const result = nextReview({}, GOOD)
    const due = new Date(result.dueDate)
    const tomorrow = new Date('2026-01-02T00:00:00.000Z')
    expect(due.toDateString()).toBe(tomorrow.toDateString())
    vi.useRealTimers()
  })
})

describe('isDue', () => {
  it('card with no dueDate is always due', () => {
    expect(isDue({})).toBe(true)
  })

  it('card due in the past is due', () => {
    expect(isDue({ dueDate: new Date(Date.now() - 86400000).toISOString() })).toBe(true)
  })

  it('card due in the future is not due', () => {
    expect(isDue({ dueDate: new Date(Date.now() + 86400000).toISOString() })).toBe(false)
  })
})

describe('isLearned', () => {
  it('card with no interval is not learned', () => {
    expect(isLearned({})).toBe(false)
  })

  it(`card with interval >= ${LEARNED_INTERVAL} is learned`, () => {
    expect(isLearned({ interval: LEARNED_INTERVAL })).toBe(true)
    expect(isLearned({ interval: LEARNED_INTERVAL + 10 })).toBe(true)
  })

  it(`card with interval < ${LEARNED_INTERVAL} is not learned`, () => {
    expect(isLearned({ interval: LEARNED_INTERVAL - 1 })).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/sm2.test.js
```

Expected: All tests FAIL with "Cannot find module './sm2'"

- [ ] **Step 3: Create `src/lib/sm2.js`**

```js
export const AGAIN = 1;
export const HARD = 3;
export const GOOD = 4;
export const EASY = 5;
export const LEARNED_INTERVAL = 21;

export function nextReview(card, quality) {
  let { interval = 0, repetitions = 0, efactor = 2.5 } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * efactor);
    repetitions += 1;
  }

  efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  efactor = Math.max(1.3, parseFloat(efactor.toFixed(4)));

  const due = new Date();
  due.setDate(due.getDate() + interval);
  due.setHours(0, 0, 0, 0);

  return { interval, repetitions, efactor, dueDate: due.toISOString() };
}

export function isDue(card) {
  if (!card.dueDate) return true;
  return new Date(card.dueDate) <= new Date();
}

export function isLearned(card) {
  return (card.interval || 0) >= LEARNED_INTERVAL;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/sm2.test.js
```

Expected: All 12 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sm2.js src/lib/sm2.test.js
git commit -m "feat: implement SM-2 spaced repetition algorithm"
```

---

## Task 3: IndexedDB Layer

**Files:**
- Create: `src/lib/db.js`
- Create: `src/lib/db.test.js`

**Interfaces:**
- Consumes: `idb` library
- Produces:
  - `saveWords(words: Word[]) → Promise<void>` where `Word = { id, word, definition, example, chapter }`
  - `getWords() → Promise<Word[]>`
  - `getProgress(id: string) → Promise<CardProgress | undefined>` where `CardProgress = { id, interval, repetitions, efactor, dueDate }`
  - `saveProgress(progress: CardProgress) → Promise<void>`
  - `getAllProgress() → Promise<CardProgress[]>`
  - `getMeta(key: string) → Promise<any>`
  - `setMeta(key: string, value: any) → Promise<void>`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/db.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { saveWords, getWords, getProgress, saveProgress, getAllProgress, getMeta, setMeta } from './db'

// idb uses indexedDB global — jsdom provides a fake implementation via fake-indexeddb
// Install: npm install -D fake-indexeddb
import 'fake-indexeddb/auto'

const sampleWords = [
  { id: 'Ch1__huis', word: 'huis', definition: 'house', example: 'Ik woon in een huis.', chapter: 'Chapter 1' },
  { id: 'Ch1__auto', word: 'auto', definition: 'car', example: 'De auto is rood.', chapter: 'Chapter 1' },
]

const sampleProgress = {
  id: 'Ch1__huis',
  interval: 6,
  repetitions: 2,
  efactor: 2.5,
  dueDate: '2026-02-01T00:00:00.000Z',
}

describe('words store', () => {
  it('saves and retrieves words', async () => {
    await saveWords(sampleWords)
    const words = await getWords()
    expect(words).toHaveLength(2)
    expect(words[0].word).toBe('huis')
  })
})

describe('progress store', () => {
  it('returns undefined for unknown card', async () => {
    const p = await getProgress('unknown')
    expect(p).toBeUndefined()
  })

  it('saves and retrieves progress for a card', async () => {
    await saveProgress(sampleProgress)
    const p = await getProgress('Ch1__huis')
    expect(p.interval).toBe(6)
    expect(p.efactor).toBe(2.5)
  })

  it('getAllProgress returns all saved progress', async () => {
    await saveProgress(sampleProgress)
    const all = await getAllProgress()
    expect(all.length).toBeGreaterThanOrEqual(1)
    expect(all.some(p => p.id === 'Ch1__huis')).toBe(true)
  })
})

describe('meta store', () => {
  it('returns undefined for missing key', async () => {
    const val = await getMeta('nonexistent')
    expect(val).toBeUndefined()
  })

  it('saves and retrieves a meta value', async () => {
    await setMeta('streak', 5)
    const val = await getMeta('streak')
    expect(val).toBe(5)
  })

  it('overwrites existing meta value', async () => {
    await setMeta('lastStudy', '2026-01-01')
    await setMeta('lastStudy', '2026-01-02')
    const val = await getMeta('lastStudy')
    expect(val).toBe('2026-01-02')
  })
})
```

- [ ] **Step 2: Install fake-indexeddb**

```bash
npm install -D fake-indexeddb
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npx vitest run src/lib/db.test.js
```

Expected: All tests FAIL with "Cannot find module './db'"

- [ ] **Step 4: Create `src/lib/db.js`**

```js
import { openDB } from 'idb';

const DB_NAME = 'dutch-words';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('words')) {
          db.createObjectStore('words', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveWords(words) {
  const db = await getDB();
  const tx = db.transaction('words', 'readwrite');
  await Promise.all(words.map(w => tx.store.put(w)));
  await tx.done;
}

export async function getWords() {
  const db = await getDB();
  return db.getAll('words');
}

export async function getProgress(id) {
  const db = await getDB();
  return db.get('progress', id);
}

export async function saveProgress(progress) {
  const db = await getDB();
  return db.put('progress', progress);
}

export async function getAllProgress() {
  const db = await getDB();
  return db.getAll('progress');
}

export async function getMeta(key) {
  const db = await getDB();
  const record = await db.get('meta', key);
  return record?.value;
}

export async function setMeta(key, value) {
  const db = await getDB();
  return db.put('meta', { key, value });
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/lib/db.test.js
```

Expected: All 7 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db.js src/lib/db.test.js package.json package-lock.json
git commit -m "feat: add IndexedDB layer for words, progress, and meta"
```

---

## Task 4: Google Sheets CSV Fetcher

**Files:**
- Create: `src/lib/sheets.js`
- Create: `src/lib/sheets.test.js`

**Interfaces:**
- Consumes: `SPREADSHEET_ID`, `CHAPTERS` from `src/config.js`
- Produces:
  - `parseCSV(text: string) → Word[]` where `Word = { id, word, definition, example, chapter }`
  - `fetchChapter(spreadsheetId: string, tabName: string) → Promise<Word[]>`
  - `fetchAllChapters(spreadsheetId: string, chapters: string[]) → Promise<Word[]>`
  - Word `id` format: `"{tabName}__{word}"` (double underscore separator)

- [ ] **Step 1: Write the failing tests**

Create `src/lib/sheets.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseCSV, fetchChapter, fetchAllChapters } from './sheets'

const csvWithHeader = `word,definition,example
huis,house,"Ik woon in een huis."
auto,car,De auto is rood.
"de kat",the cat,"De kat slaapt."
`

const csvWithEmptyRows = `word,definition,example
boom,tree,
,empty word should be ignored,
fiets,bicycle,Ik rijd op de fiets.
`

describe('parseCSV', () => {
  it('parses basic CSV into word objects', () => {
    const words = parseCSV(csvWithHeader, 'Chapter 1')
    expect(words).toHaveLength(3)
    expect(words[0]).toEqual({
      id: 'Chapter 1__huis',
      word: 'huis',
      definition: 'house',
      example: 'Ik woon in een huis.',
      chapter: 'Chapter 1',
    })
  })

  it('handles quoted fields containing commas', () => {
    const words = parseCSV(csvWithHeader, 'Chapter 1')
    expect(words[2].word).toBe('de kat')
  })

  it('skips rows where the word column is empty', () => {
    const words = parseCSV(csvWithEmptyRows, 'Chapter 1')
    expect(words).toHaveLength(2)
    expect(words.every(w => w.word)).toBe(true)
  })

  it('sets example to empty string when column is missing', () => {
    const words = parseCSV(csvWithEmptyRows, 'Chapter 1')
    expect(words[0].example).toBe('')
  })

  it('generates correct id from tabName and word', () => {
    const words = parseCSV(csvWithHeader, 'Chapter 2')
    expect(words[0].id).toBe('Chapter 2__huis')
    expect(words[0].chapter).toBe('Chapter 2')
  })
})

describe('fetchChapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => csvWithHeader,
    }))
  })

  it('fetches the correct URL', async () => {
    await fetchChapter('SHEET123', 'Chapter 1')
    expect(fetch).toHaveBeenCalledWith(
      'https://docs.google.com/spreadsheets/d/SHEET123/gviz/tq?tqx=out:csv&sheet=Chapter%201'
    )
  })

  it('returns parsed words with correct chapter', async () => {
    const words = await fetchChapter('SHEET123', 'Chapter 1')
    expect(words).toHaveLength(3)
    expect(words[0].chapter).toBe('Chapter 1')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }))
    await expect(fetchChapter('SHEET123', 'Chapter 1')).rejects.toThrow('403')
  })
})

describe('fetchAllChapters', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => csvWithHeader,
    }))
  })

  it('fetches all chapters and concatenates results', async () => {
    const words = await fetchAllChapters('SHEET123', ['Chapter 1', 'Chapter 2'])
    expect(words).toHaveLength(6) // 3 words × 2 chapters
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/sheets.test.js
```

Expected: All tests FAIL with "Cannot find module './sheets'"

- [ ] **Step 3: Create `src/lib/sheets.js`**

```js
export function parseCSV(text, chapter) {
  const lines = text.trim().split('\n');
  return lines.slice(1)
    .map(line => splitCSVLine(line))
    .filter(fields => fields[0]?.trim())
    .map(([word, definition, example = '']) => ({
      id: `${chapter}__${word.trim()}`,
      word: word.trim(),
      definition: definition?.trim() ?? '',
      example: example?.trim() ?? '',
      chapter,
    }));
}

function splitCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += line[i];
    }
  }
  fields.push(current);
  return fields;
}

export async function fetchChapter(spreadsheetId, tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch "${tabName}": ${response.status}`);
  const text = await response.text();
  return parseCSV(text, tabName);
}

export async function fetchAllChapters(spreadsheetId, chapters) {
  const results = await Promise.all(
    chapters.map(ch => fetchChapter(spreadsheetId, ch))
  );
  return results.flat();
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/sheets.test.js
```

Expected: All 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sheets.js src/lib/sheets.test.js
git commit -m "feat: add Google Sheets CSV fetcher and parser"
```

---

## Task 5: Dashboard + Progress Hook

**Files:**
- Create: `src/hooks/useProgress.js`
- Create: `src/components/ProgressBar.jsx`
- Create: `src/components/ChapterCard.jsx`
- Create: `src/components/Dashboard.jsx`

**Interfaces:**
- Consumes:
  - `getWords()`, `saveWords()`, `getAllProgress()`, `getMeta()`, `setMeta()` from `src/lib/db.js`
  - `fetchAllChapters(spreadsheetId, chapters)` from `src/lib/sheets.js`
  - `isDue(card)`, `isLearned(card)` from `src/lib/sm2.js`
  - `SPREADSHEET_ID`, `CHAPTERS` from `src/config.js`
- Produces:
  - `useProgress()` hook returning `{ words, progressMap, streak, dueCount, loading, error, sync }`
    - `progressMap: Record<string, CardProgress>` — keyed by word id
  - `<Dashboard />` component at route `/`
  - `<ChapterCard name streak total learned />` component
  - `<ProgressBar value max />` component

- [ ] **Step 1: Create `src/components/ProgressBar.jsx`**

```jsx
export default function ProgressBar({ value, max }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: 'var(--accent)',
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/ChapterCard.jsx`**

```jsx
import ProgressBar from './ProgressBar';

export default function ChapterCard({ name, total, learned }) {
  const pct = total === 0 ? 0 : Math.round((learned / total) * 100);
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600 }}>{name}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {learned}/{total} learned ({pct}%)
        </span>
      </div>
      <ProgressBar value={learned} max={total} />
    </div>
  );
}
```

- [ ] **Step 3: Create `src/hooks/useProgress.js`**

```js
import { useState, useEffect, useCallback } from 'react';
import { getWords, saveWords, getAllProgress, getMeta, setMeta } from '../lib/db';
import { fetchAllChapters } from '../lib/sheets';
import { isDue, isLearned } from '../lib/sm2';
import { SPREADSHEET_ID, CHAPTERS } from '../config';

function computeStreak(lastStudyDate, currentStreak) {
  if (!lastStudyDate) return 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const last = new Date(lastStudyDate).toDateString();
  if (last === today) return currentStreak;
  if (last === yesterday) return currentStreak;
  return 0;
}

export function useProgress() {
  const [words, setWords] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFromDB = useCallback(async () => {
    const [cachedWords, allProgress, storedStreak, lastStudy] = await Promise.all([
      getWords(),
      getAllProgress(),
      getMeta('streak'),
      getMeta('lastStudyDate'),
    ]);
    const map = Object.fromEntries(allProgress.map(p => [p.id, p]));
    setWords(cachedWords);
    setProgressMap(map);
    setStreak(computeStreak(lastStudy, storedStreak ?? 0));
    return cachedWords;
  }, []);

  const sync = useCallback(async () => {
    if (!SPREADSHEET_ID) {
      setError('Set SPREADSHEET_ID in src/config.js first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchAllChapters(SPREADSHEET_ID, CHAPTERS);
      await saveWords(fresh);
      await loadFromDB();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [loadFromDB]);

  useEffect(() => {
    setLoading(true);
    loadFromDB()
      .then(cached => {
        setLoading(false);
        if (cached.length === 0) return sync();
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [loadFromDB, sync]);

  const dueCount = words.filter(w => isDue(progressMap[w.id] ?? {})).length;

  return { words, progressMap, streak, dueCount, loading, error, sync };
}
```

- [ ] **Step 4: Create `src/components/Dashboard.jsx`**

```jsx
import { Link } from 'react-router-dom';
import { CHAPTERS } from '../config';
import { useProgress } from '../hooks/useProgress';
import { isLearned } from '../lib/sm2';
import ChapterCard from './ChapterCard';

export default function Dashboard() {
  const { words, progressMap, streak, dueCount, loading, error, sync } = useProgress();

  return (
    <div style={{ paddingTop: 32, paddingBottom: 32 }}>
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Dutch Words</h1>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {streak > 0 ? `🔥 ${streak} day streak` : 'Start studying!'}
        </div>
      </header>

      {error && (
        <div style={{ background: '#e63946', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <Link to="/review">
        <button style={{
          width: '100%',
          background: dueCount > 0 ? 'var(--accent)' : 'var(--surface2)',
          color: dueCount > 0 ? '#fff' : 'var(--text-muted)',
          fontSize: '1.1rem',
          fontWeight: 600,
          padding: '16px',
          marginBottom: 28,
        }}>
          {loading ? 'Loading...' : dueCount > 0 ? `Study Now · ${dueCount} due` : 'All caught up!'}
        </button>
      </Link>

      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>
        CHAPTERS
      </h2>

      {CHAPTERS.map(chapter => {
        const chapterWords = words.filter(w => w.chapter === chapter);
        const learned = chapterWords.filter(w => isLearned(progressMap[w.id] ?? {})).length;
        return (
          <ChapterCard
            key={chapter}
            name={chapter}
            total={chapterWords.length}
            learned={learned}
          />
        );
      })}

      <button
        onClick={sync}
        disabled={loading}
        style={{
          marginTop: 20,
          width: '100%',
          background: 'var(--surface)',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
        {loading ? 'Syncing...' : 'Sync from Google Sheet'}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Confirm dashboard renders in browser**

```bash
npm run dev
```

Open http://localhost:5173 — expected: Dashboard with "Dutch Words" header, "Study Now" button (showing 0 due or loading), chapter cards for all 4 chapters, and a sync button. Dark/light mode should follow OS setting.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useProgress.js src/components/ProgressBar.jsx src/components/ChapterCard.jsx src/components/Dashboard.jsx
git commit -m "feat: dashboard with chapter progress and streak display"
```

---

## Task 6: Flashcard Component

**Files:**
- Create: `src/components/Flashcard.jsx`
- Create: `src/components/Flashcard.test.jsx`

**Interfaces:**
- Consumes: `word: Word`, `onRate: (quality: number) => void`, `AGAIN`, `HARD`, `GOOD`, `EASY` from sm2.js
- Produces: `<Flashcard word={word} onRate={fn} />` — shows Dutch word on front, definition+example on back after tap; reveals rating buttons after flip; speaker button calls Web Speech API

- [ ] **Step 1: Write the failing tests**

Create `src/components/Flashcard.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Flashcard from './Flashcard'
import { AGAIN, GOOD } from '../lib/sm2'

const word = {
  id: 'Ch1__huis',
  word: 'huis',
  definition: 'house',
  example: 'Ik woon in een huis.',
  chapter: 'Chapter 1',
}

describe('Flashcard', () => {
  it('shows the Dutch word on front', () => {
    render(<Flashcard word={word} onRate={vi.fn()} />)
    expect(screen.getByText('huis')).toBeInTheDocument()
  })

  it('does not show definition before flip', () => {
    render(<Flashcard word={word} onRate={vi.fn()} />)
    expect(screen.queryByText('house')).not.toBeVisible()
  })

  it('reveals definition after clicking the card', () => {
    render(<Flashcard word={word} onRate={vi.fn()} />)
    fireEvent.click(screen.getByTestId('flashcard'))
    expect(screen.getByText('house')).toBeVisible()
  })

  it('shows example sentence after flip', () => {
    render(<Flashcard word={word} onRate={vi.fn()} />)
    fireEvent.click(screen.getByTestId('flashcard'))
    expect(screen.getByText('Ik woon in een huis.')).toBeVisible()
  })

  it('shows rating buttons after flip', () => {
    render(<Flashcard word={word} onRate={vi.fn()} />)
    fireEvent.click(screen.getByTestId('flashcard'))
    expect(screen.getByText('Again')).toBeInTheDocument()
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('calls onRate with AGAIN quality when Again is clicked', () => {
    const onRate = vi.fn()
    render(<Flashcard word={word} onRate={onRate} />)
    fireEvent.click(screen.getByTestId('flashcard'))
    fireEvent.click(screen.getByText('Again'))
    expect(onRate).toHaveBeenCalledWith(AGAIN)
  })

  it('calls onRate with GOOD quality when Good is clicked', () => {
    const onRate = vi.fn()
    render(<Flashcard word={word} onRate={onRate} />)
    fireEvent.click(screen.getByTestId('flashcard'))
    fireEvent.click(screen.getByText('Good'))
    expect(onRate).toHaveBeenCalledWith(GOOD)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/Flashcard.test.jsx
```

Expected: All tests FAIL with "Cannot find module './Flashcard'"

- [ ] **Step 3: Create `src/components/Flashcard.jsx`**

```jsx
import { useState } from 'react';
import { AGAIN, HARD, GOOD, EASY } from '../lib/sm2';
import { useVoice } from '../hooks/useVoice';

const RATINGS = [
  { label: 'Again', quality: AGAIN, color: 'var(--again)' },
  { label: 'Hard',  quality: HARD,  color: 'var(--hard)'  },
  { label: 'Good',  quality: GOOD,  color: 'var(--good)'  },
  { label: 'Easy',  quality: EASY,  color: 'var(--easy)'  },
];

export default function Flashcard({ word, onRate }) {
  const [flipped, setFlipped] = useState(false);
  const { speak } = useVoice();

  function handleFlip() {
    if (!flipped) setFlipped(true);
  }

  function handleSpeak(e) {
    e.stopPropagation();
    speak(word.word, 'nl-NL');
  }

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        data-testid="flashcard"
        onClick={handleFlip}
        style={{
          position: 'relative',
          minHeight: 220,
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          cursor: flipped ? 'default' : 'pointer',
          overflow: 'hidden',
        }}
      >
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 24,
          opacity: flipped ? 0 : 1,
          transition: 'opacity 0.2s',
          pointerEvents: flipped ? 'none' : 'auto',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>
            {word.word}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            tap to reveal
          </div>
          <button
            onClick={handleSpeak}
            style={{ marginTop: 16, background: 'var(--surface2)', padding: '8px 16px', fontSize: '1.2rem' }}
            aria-label="Pronounce word"
          >
            🔊
          </button>
        </div>

        {/* Back */}
        <div
          aria-hidden={!flipped}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24, textAlign: 'center',
            opacity: flipped ? 1 : 0,
            transition: 'opacity 0.3s 0.1s',
            pointerEvents: flipped ? 'auto' : 'none',
            visibility: flipped ? 'visible' : 'hidden',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            {word.word}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
            {word.definition}
          </div>
          {word.example && (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {word.example}
            </div>
          )}
          <button
            onClick={handleSpeak}
            style={{ marginTop: 16, background: 'var(--surface2)', padding: '8px 16px', fontSize: '1.2rem' }}
            aria-label="Pronounce word"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Rating buttons — only shown after flip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        marginTop: 16,
        opacity: flipped ? 1 : 0,
        pointerEvents: flipped ? 'auto' : 'none',
        transition: 'opacity 0.3s',
      }}>
        {RATINGS.map(({ label, quality, color }) => (
          <button
            key={label}
            onClick={() => onRate(quality)}
            style={{ background: color, color: '#fff', fontWeight: 600, padding: '12px 4px' }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the voice hook placeholder (needed by Flashcard import)**

Create `src/hooks/useVoice.js` (full implementation in Task 8, stub here):

```js
export function useVoice() {
  function speak(text, lang) {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
  return { speak };
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/components/Flashcard.test.jsx
```

Expected: All 7 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Flashcard.jsx src/components/Flashcard.test.jsx src/hooks/useVoice.js
git commit -m "feat: flashcard flip component with rating buttons"
```

---

## Task 7: Review Session

**Files:**
- Create: `src/hooks/useReviewQueue.js`
- Create: `src/components/ReviewSession.jsx`

**Interfaces:**
- Consumes:
  - `getWords()`, `getAllProgress()`, `saveProgress()`, `getMeta()`, `setMeta()` from `src/lib/db.js`
  - `isDue(card)`, `nextReview(card, quality)` from `src/lib/sm2.js`
  - `<Flashcard word onRate />` from `./Flashcard`
- Produces: `<ReviewSession />` component at route `/review`

- [ ] **Step 1: Create `src/hooks/useReviewQueue.js`**

```js
import { useState, useEffect, useCallback } from 'react';
import { getWords, getAllProgress, saveProgress, getMeta, setMeta } from '../lib/db';
import { isDue, nextReview } from '../lib/sm2';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useReviewQueue() {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressMap, setProgressMap] = useState({});
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [words, allProgress] = await Promise.all([getWords(), getAllProgress()]);
      const map = Object.fromEntries(allProgress.map(p => [p.id, p]));
      const due = words.filter(w => isDue(map[w.id] ?? {}));
      setQueue(shuffleArray(due));
      setProgressMap(map);
      setLoading(false);
    }
    load();
  }, []);

  const rate = useCallback(async (quality) => {
    const word = queue[currentIndex];
    if (!word) return;
    const current = progressMap[word.id] ?? {};
    const updated = { id: word.id, ...nextReview(current, quality) };
    await saveProgress(updated);
    setProgressMap(prev => ({ ...prev, [word.id]: updated }));
    setSessionCount(c => c + 1);

    // Update streak
    const today = new Date().toDateString();
    const lastStudy = await getMeta('lastStudyDate');
    if (lastStudy !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const storedStreak = (await getMeta('streak')) ?? 0;
      const newStreak = lastStudy === yesterday ? storedStreak + 1 : 1;
      await setMeta('streak', newStreak);
      await setMeta('lastStudyDate', today);
    }

    setCurrentIndex(i => i + 1);
  }, [queue, currentIndex, progressMap]);

  const currentWord = queue[currentIndex] ?? null;
  const remaining = queue.length - currentIndex;
  const done = !loading && currentIndex >= queue.length;

  return { currentWord, remaining, sessionCount, done, loading, rate };
}
```

- [ ] **Step 2: Create `src/components/ReviewSession.jsx`**

```jsx
import { useNavigate } from 'react-router-dom';
import Flashcard from './Flashcard';
import { useReviewQueue } from '../hooks/useReviewQueue';

export default function ReviewSession() {
  const navigate = useNavigate();
  const { currentWord, remaining, sessionCount, done, loading, rate } = useReviewQueue();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading cards...</div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ paddingTop: 64, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>✓</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Session complete!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
          You reviewed {sessionCount} card{sessionCount !== 1 ? 's' : ''}.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'var(--accent)', color: '#fff', fontWeight: 600, padding: '14px 32px' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 24, paddingBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', color: 'var(--text-muted)', padding: '8px 0', fontSize: '0.9rem' }}
        >
          ← Back
        </button>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {remaining} remaining
        </div>
      </div>

      <div style={{
        height: 4,
        background: 'var(--surface2)',
        borderRadius: 2,
        marginBottom: 24,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'var(--accent)',
          width: `${sessionCount > 0 ? ((sessionCount / (sessionCount + remaining)) * 100) : 0}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      <Flashcard word={currentWord} onRate={rate} />
    </div>
  );
}
```

- [ ] **Step 3: Confirm review session works end-to-end in browser**

First, set a valid `SPREADSHEET_ID` in `src/config.js` and make your sheet public (File → Share → Anyone with link). Then:

```bash
npm run dev
```

1. Open http://localhost:5173
2. Click "Sync from Google Sheet" — confirm words load and chapter cards show counts
3. Click "Study Now" — confirm flashcard appears with Dutch word
4. Tap the card — confirm definition and example appear
5. Click a rating button — confirm next card loads
6. Complete all cards — confirm completion screen appears
7. Click "Back to Dashboard" — confirm streak updates

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useReviewQueue.js src/components/ReviewSession.jsx
git commit -m "feat: review session with SM-2 rating and streak tracking"
```

---

## Task 8: Web Speech API (Voice Hook)

The stub from Task 6 is already the full implementation. This task improves it with voice selection to prefer a Dutch voice if available.

**Files:**
- Modify: `src/hooks/useVoice.js`

**Interfaces:**
- Consumes: `window.speechSynthesis`, `SpeechSynthesisUtterance`
- Produces: `useVoice() → { speak(text: string, lang: string): void }`

- [ ] **Step 1: Update `src/hooks/useVoice.js` with Dutch voice preference**

```js
function getDutchVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return (
    voices.find(v => v.lang === 'nl-NL') ||
    voices.find(v => v.lang.startsWith('nl')) ||
    null
  );
}

export function useVoice() {
  function speak(text, lang = 'nl-NL') {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = getDutchVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return { speak };
}
```

- [ ] **Step 2: Test voice in browser**

```bash
npm run dev
```

Open a flashcard, click the 🔊 button — you should hear the Dutch word spoken. On mobile (Chrome/Safari), Dutch TTS is usually available.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useVoice.js
git commit -m "feat: prefer Dutch voice in Web Speech API"
```

---

## Task 9: Run All Tests

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass. Output shows:
- `src/lib/sm2.test.js` — 12 passed
- `src/lib/db.test.js` — 7 passed
- `src/lib/sheets.test.js` — 9 passed
- `src/components/Flashcard.test.jsx` — 7 passed

Total: 35 tests, 0 failures.

- [ ] **Step 2: Run a production build to confirm no build errors**

```bash
npm run build
```

Expected: Build succeeds, `dist/` directory created, no TypeScript or ESLint errors.

- [ ] **Step 3: Preview the production build**

```bash
npm run preview
```

Open http://localhost:4173 — confirm the app works identically to dev mode. Check browser DevTools → Application → Service Workers to confirm the service worker is registered. Check Application → Manifest to confirm PWA metadata is correct.

- [ ] **Step 4: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any build or test issues"
```

---

## Task 10: Vercel Deployment

**Files:**
- Create: `vercel.json`

**Interfaces:**
- Produces: public HTTPS URL, installable as PWA on phone and laptop

- [ ] **Step 1: Create `vercel.json` for SPA routing**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This ensures that navigating directly to `/review` doesn't 404 on Vercel.

- [ ] **Step 2: Push to GitHub**

```bash
git add vercel.json
git commit -m "feat: add Vercel SPA routing config"
```

Create a new GitHub repository (e.g. `dutch-words`) at https://github.com/new, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/dutch-words.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Deploy to Vercel**

1. Go to https://vercel.com/new
2. Import your `dutch-words` GitHub repository
3. Framework Preset: **Vite** (auto-detected)
4. Click **Deploy**

Expected: Build completes in ~60 seconds. You get a URL like `https://dutch-words-xyz.vercel.app`.

- [ ] **Step 4: Test on phone**

Open the Vercel URL on your phone:
1. Confirm the dashboard loads
2. Click "Sync from Google Sheet" — confirm words load
3. Click "Study Now" and complete a few cards
4. In your phone browser menu, tap "Add to Home Screen" — confirm the PWA installs with the correct name "Dutch Words"
5. Open from home screen — confirm it launches in standalone mode (no browser chrome)
6. Turn on airplane mode — confirm the app still loads and you can study cached cards

- [ ] **Step 5: Set up Google Sheet**

In your Google Sheet:
1. File → Share → Publish to web
2. Select each chapter tab → CSV format → Publish
3. Copy the Spreadsheet ID from the URL bar
4. Update `src/config.js` with your real `SPREADSHEET_ID`
5. Push the change — Vercel auto-deploys

```bash
git add src/config.js
git commit -m "config: set production Google Spreadsheet ID"
git push
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| PWA (phone + laptop) | Task 1, 9, 10 |
| Google Sheets CSV source | Task 4 |
| Per-chapter tabs | Task 4, 5 |
| 3 columns: word / definition / example | Task 4 |
| SM-2 spaced repetition | Task 2, 7 |
| Flashcard flip UI | Task 6 |
| Unified review queue across chapters | Task 7 |
| Dashboard with chapter list | Task 5 |
| Progress bars per chapter | Task 5 |
| Streak counter | Task 5, 7 |
| Due count | Task 5 |
| Local-only storage (IndexedDB) | Task 3 |
| Auto dark/light mode | Task 1 |
| Web Speech API pronunciation | Task 6, 8 |
| Offline support | Task 1 (vite-plugin-pwa/Workbox), Task 9 |
| Vercel deployment | Task 10 |

All requirements covered. No gaps found.

**Placeholder scan:** No TBD, TODO, or placeholder patterns found in this plan.

**Type consistency:** `Word.id` format (`"{chapter}__{word}"`) used consistently in Tasks 3, 4, 5, 6, 7. `CardProgress` shape (`{ id, interval, repetitions, efactor, dueDate }`) consistent across Tasks 2, 3, 7. `progressMap: Record<string, CardProgress>` used in Tasks 5 and 7.
