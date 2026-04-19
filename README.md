# Shape

> *Shaping the minds of tomorrow today*

An AI-native interactive textbook built at HackPrinceton 2026. The student opens a digital page (built-in or imported PDF), taps a formal definition, and a popup unfolds with a Manim animation, native-language narration, and a chat that can answer follow-ups. Everything — UI labels, theorem prose, formal definitions, chat replies, narration — translates into one of seven languages on a single click.

> ** Note: this repository will not run on machines that have not been pre-configured for Shape at this time.** It depends on a specific local toolchain (Manim CE + MiKTeX + uv-managed venvs, FFmpeg via `imageio-ffmpeg`, an Anthropic + Azure Speech key, and a hand-built `manim_scenes/.venv`) plus pre-rendered MP4s and a translation bundle that aren't checked into git. Treat this as a hackathon submission and demo artifact.

---

## What it does

- **A textbook viewer** with three built-in books and unlimited PDF imports:
  - **Calculus** — 12 theorems across limits, derivatives, complex numbers, double integration, linear algebra, multivariable optimization, probability theory.
  - **Geometry (Middle School)** — 6 theorems on triangles and circles.
  - **Algebra (Middle School)** — 5 theorems on identities, equations, linear functions.
- **Tappable simpler-explanation boxes**. Each section shows a formal printed-textbook-style definition, then a tappable "simpler explanation" box. Tapping opens a side panel with the relevant Manim animation, a chat for follow-ups, and a transcript.
- **PDF import**. Upload any PDF; the backend extracts text via PyMuPDF, sends it to Claude with a strict JSON schema, and the result is rendered through the same chapters/sections/theorems pipeline as the built-in books. Imported sections matching certain titles (Trapezium Rule, Simpson's Rule, Improper Integrals Type I/II, Comparison Test) automatically get one of the pre-rendered Manim helper videos attached.
- **A library** sidebar (invisible left-edge hover trigger → full-height side panel) listing every textbook in your library, sorted most-recently-opened, deletable.
- **A "✨ Generate visualization" gate** that holds for ten seconds with rotating math quotes before revealing each pre-rendered animation — sells the demo.
- **Audio-led playback**. Video pauses on its last frame to wait for the narration to finish; video stops the moment the audio ends. Narration in 7 languages via Azure Neural TTS.
- **Global chat** at the bottom of the page — draggable, double-click to reset position. Asks Claude with the textbook catalog as context; replies come back with step-by-step solutions, suggested theorem links, and (for matching topics) an embedded Manim video.
- **Single language filter** — every English string in the source flows through `useT()`. Pre-translated bundle ships with the build for instant switching; misses fall back to a runtime `/api/translate` call. Math expressions are masked from translation so LaTeX stays intact.
- **Translation scope** picker — translate the *full page* or just the *popup* that opens when a theorem is tapped.
- **Theme**, **font**, **language**, and **scope** are all switchable from the top nav and persist across reloads.

---

## Tech stack

### What's actually doing the work in the running demo

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, react-katex, Three.js |
| Backend | FastAPI 0.115 + Uvicorn, Pydantic v2, PyMuPDF |
| LLM | **Anthropic Claude (Sonnet 4.6)** — handles the translation, PDF structuring, /ask chat, and the fallback for /explain |
| TTS | **Microsoft Azure Cognitive Services Speech** — neural voices for all 7 languages |
| Animation | **Manim Community 0.20.1** — pre-rendered to MP4 at 1080p60 by `scripts/build_cache.py` |
| LaTeX | MiKTeX (auto-discovered on Windows) |
| FFmpeg | `imageio-ffmpeg` shipped binary |

### Wired for routing but not carrying demo traffic

- **K2-Think v2** (MBZUAI/IFM/Cerebras) — first hop in the English `/explain` cascade, falls through to Mercury → Claude on any error.
- **Mercury** (Inception Labs) — diffusion LLM, sits between K2 and Claude for English.
- **Nile-Chat-12B** (MBZUAI-Paris) — slot for native Egyptian Arabic; in practice `/explain` for `ar` falls through to Claude in this demo.
- **Sherkala-8B-Chat** (MBZUAI/Inception/Cerebras) — slot reserved for native Kazakh; not yet integrated as a client.

The MBZUAI / IFM models are deliberately wired into the `/explain` routing graph as part of the original PRD vision (native-language tutoring for Kazakh and Egyptian Arabic students), but the demo is being carried end-to-end by **Claude + Azure**.

---

## Languages supported

Each language has: a native script label in the picker, a BCP-47 tag, an Azure neural voice for narration, and pre-translated UI strings bundled at build time. Math notation stays in LaTeX in every language.

| Code | Name | Azure voice |
|---|---|---|
| `en` | English | en-US-AndrewNeural (chat-style) |
| `ar` | Egyptian Arabic | ar-EG-ShakirNeural |
| `hi` | Hindi | hi-IN-MadhurNeural |
| `zh` | Simplified Chinese | zh-CN-YunxiNeural |
| `fr` | French | fr-FR-HenriNeural |
| `kk` | Kazakh | kk-KZ-DauletNeural |
| `ja` | Japanese | ja-JP-KeitaNeural |

---

## Repo layout

```
shape/
├── backend/                       FastAPI app
│   ├── main.py                    All HTTP routes
│   ├── clients/                   Per-service wrappers
│   │   ├── ask.py                 /ask — Claude chat with theorem catalog context
│   │   ├── llm.py                 Claude wrapper used by /explain fallback
│   │   ├── k2.py                  K2-Think v2 client (English /explain)
│   │   ├── mercury.py             Inception Labs Mercury (English /explain fallback)
│   │   ├── inception.py           Nile-Chat client (Arabic /explain, slot)
│   │   ├── translate.py           Math-safe Claude translator (single + batched)
│   │   ├── tts.py                 Azure Neural TTS + edge-tts fallback
│   │   ├── pdf_import.py          PyMuPDF + Claude → structured chapters JSON
│   │   └── prewarm.py             Pre-cooked /explain answers for the demo path
│   └── requirements.txt
├── frontend/
│   ├── index.html                 Tab title, favicon, Google Fonts
│   ├── src/
│   │   ├── App.tsx                Top-level shell, providers, nav
│   │   ├── theorems-data.ts       Calculus theorems (titles, statements, transcripts)
│   │   ├── books/                 Built-in textbook registry
│   │   │   ├── calculus.ts
│   │   │   ├── geometry.ts
│   │   │   ├── algebra.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── Textbook.tsx       Renders ChapterView/SectionView from active book
│   │   │   ├── FormalDefinition.tsx   Boxed printed-textbook statement
│   │   │   ├── TheoremBlock.tsx       Tappable simpler-explanation box
│   │   │   ├── ExplainPanel.tsx       Popup hosting CinematicView + chat
│   │   │   ├── CinematicView.tsx      Generation gate + synced video/audio playback
│   │   │   ├── InteractiveView.tsx    JS slider-driven 2D plots
│   │   │   ├── Surface3DView.tsx      Three.js 3D playgrounds
│   │   │   ├── LibraryMenu.tsx        Hover-expanding side panel
│   │   │   ├── GlobalChat.tsx         Draggable bottom chat + modal
│   │   │   ├── ImportPdfButton.tsx    Upload to /api/import-pdf
│   │   │   └── InlineVideoGate.tsx    Smaller gate used inside chat steps
│   │   ├── lib/
│   │   │   ├── lang.tsx           Language + scope provider, polished-transcript picker
│   │   │   ├── translate.tsx      useT(), batched /translate fetch, popup scope
│   │   │   ├── library.tsx        Book registry + import storage + video matcher
│   │   │   ├── font.tsx           Manrope ↔ Crimson Pro switcher
│   │   │   ├── theme.tsx          Light ↔ dark
│   │   │   ├── math-text.tsx      $...$ splitter + markdown/LaTeX-junk scrubber
│   │   │   ├── player.ts          Global narration play/stop
│   │   │   └── tts.ts             /api/tts client + per-text memo cache
│   │   ├── preloaded-translations.json   Build-time bundle (~590 KB, 6 langs × 206 strings)
│   │   ├── polished-transcripts.json     Hand-curated per-theorem narration overrides
│   │   ├── index.css              CSS variables + KaTeX overflow rules
│   │   └── types.ts               Lang, Theorem, Spec types
│   ├── public/
│   │   ├── logo.png               Tab icon + nav wordmark
│   │   └── logo.svg               Fallback wordmark
│   └── vite.config.ts             Proxies /api → :9003 and /cache → :9003
├── manim_scenes/                  Manim CE scene files (28 total)
│   ├── 01_limit.py … 12_poisson_exp_gamma.py     Calculus
│   ├── geom_01_pythagoras.py … geom_06_similar.py    Geometry
│   ├── alg_01_distributive.py … alg_05_quadratic.py  Algebra
│   └── calc_trapezium.py … calc_comparison.py        Imported-PDF helpers
├── scripts/
│   ├── build_cache.py             Render every Manim scene → cache/videos/
│   ├── preload_translations.py    Mine English strings → Claude → JSON bundle
│   └── polish_transcripts.py      Iterate transcripts via Claude
└── cache/
    ├── videos/                    Pre-rendered MP4s (gitignored, large)
    ├── audio/                     Per-(text, lang) Azure TTS results
    └── translations/              Per-(text, lang) Claude translations
```

---

## Architecture flow

```
        Browser (React + Vite, port 5173)
                │   /api/* and /cache/* proxied
                ▼
       FastAPI backend (port 9003)
                │
   ┌────────────┼─────────────┬─────────────┬───────────────┐
   ▼            ▼             ▼             ▼               ▼
 /ask       /explain      /translate      /tts        /import-pdf
 Claude   K2 → Mercury   Claude          Claude →    PyMuPDF →
          → Claude      (math-masked)   Azure TTS   Claude
                                        (audio MP3) (chapters JSON)
                │
          /cache/videos/*.mp4    (pre-rendered offline by build_cache.py)
          /cache/audio/*.mp3     (lazy, per text+lang)
          /cache/translations/   (lazy, per text+lang)
```

Translation has two layers: a **build-time JSON bundle** that the frontend hydrates on load (instant switches for known strings), and a **runtime fallback** through `/api/translate` for strings that weren't pre-bundled (e.g. text from a freshly-imported PDF).

Math is preserved across translation by masking `$...$` and `$$...$$` blocks to opaque `<m0/>`-style XML sentinels before sending the prose to Claude, then splicing the original LaTeX back in afterwards. A permissive restorer handles the corruptions Claude is known to introduce (`[m0]`, `**<m0/>**`, `【m0】`, etc).

---

## Demo controls (top nav)

| Control | What it does |
|---|---|
| Logo | Pinned to top-left |
| Import PDF | Upload a PDF; new book added to the library |
| Font (Sans Serif / Serif) | Switches every visible string between Manrope and Crimson Pro |
| Language (EN / عربي / हिंदी / 中文 / FR / Қазақ / 日本語) | Reload the page in the chosen language |
| Translation scope (Full page / Popup only) | Translate everything, or just the panel that opens on tap |
| Theme toggle | Light ↔ dark |

Hover the **left edge** of the page → library panel slides out with all books in your library, most recently opened first.

---

## Built-in scenes rendered by `scripts/build_cache.py`

28 Manim scenes total; quality default `--quality h` = 1080p60.

- Calculus (12): ε–δ limit, derivative as tangent slope, chain rule, exponential family, damped oscillator, De Moivre's theorem, double integral as Riemann sum of prisms, 2×2 determinant as signed area, critical points of `z = ax² + by²`, Gaussian integral via polar trick, normal distribution `N(μ, σ²)`, Poisson process → Poisson + Exponential + Gamma.
- Geometry (6): Pythagorean theorem with squared sides, triangle angle sum tiling a half-disc, area of triangle as half of bounding rectangle, circumference via rolling circle, area of circle via wedge zipper, similar triangles with proportional sides.
- Algebra (5): distributive property as rectangle decomposition, difference of squares as L-shape rearrangement, linear equation balance, slope-intercept sweep, quadratic formula with discriminant sweep.
- Imported-PDF helpers (5): trapezium rule, Simpson's rule, improper integrals type I (infinite limits), improper integrals type II (vertical asymptotes), comparison test.

---

## Credits

Built at HackPrinceton 2026 (Education track) using Manim Community, Anthropic Claude, Microsoft Azure Speech, KaTeX, React, Tailwind, Three.js, FastAPI, PyMuPDF, Vite, edge-tts.

The **MBZUAI Institute of Foundation Models** sponsor angle (Sherkala for Kazakh, Nile-Chat for Egyptian Arabic, K2-Think for general English) is reflected in the routing scaffolding in `backend/clients/` and the language picker, but the running demo is carried end-to-end by **Claude + Azure**.
