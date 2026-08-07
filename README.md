# App Template (Daniil)

Build a one-page web app called "Virality Predictor" by SocialSensor — an AI audit tool for short-form videos (TikTok, Instagram Reels, YouTube Shorts). Frontend only for now, use realistic mock data for the analysis result. ALL copy in English. No authentication. Follow the DESIGN SYSTEM section exactly — this feature must look native to an existing product (see attached screenshot for reference).

SCREEN 1 — LANDING / UPLOAD:

- Hero: "Will your video go viral? Find out before you post" + subheadline "AI video audit in 30 seconds: virality score, target audience, weak spots, and timestamped fixes"

- Big upload dropzone card (drag & drop + click to browse, accepts mp4/mov, shows selected file name and size)

- Platform selector pills: TikTok / Reels / Shorts / Auto-detect

- "Analyze video" primary button

- 4 small metric-style feature cards below: "Hook Score", "Retention Audit", "Target Audience", "Fix Checklist"

SCREEN 2 — LOADING STATE (after clicking Analyze):

- Full-screen engaging loader, rotating messages every 2s: "Watching the first 3 seconds...", "Estimating your audience...", "Auditing retention...", "Scoring viral factors..."

- Fake 8-second delay, then show results

SCREEN 3 — RESULTS (render from a mock JSON object, structure it exactly like this so we can plug a real API later):

{

  overall_score: 58, virality_tier: "average",

  verdict: "Solid concept undermined by a slow hook and a static mid-section.",

  audience: {

    primary: { gender: "male", age_range: "35-54", label: "Men 35-54, cars & fishing", interests: ["cars","fishing","DIY"], why: "Topic, speaker's age, garage setting" },

    secondary: { gender: "male", age_range: "25-34", label: "Men 25-34, car detailing", interests: ["detailing","auto tools"] },

    audience_width: "medium",

    targeting_tip: "Add on-screen captions with niche slang to sharpen the fit."

  },

  factors: [

    { key: "hook", name: "Hook (first 3 sec)", score: 41, finding: "First 2 seconds are a static logo — a classic swipe trigger.", fix: "Start mid-action at 0:04 and move the logo to the end." },

    { key: "retention", name: "Retention", score: 55, finding: "0:07-0:14 is one static shot.", fix: "Cut into 2-3 shots or add a punch-in zoom." },

    { key: "silent_watch", name: "Sound-off watchability", score: 70, finding: "Captions present but small.", fix: "Increase caption size by ~30%." },

    { key: "emotion", name: "Emotional trigger", score: 62, finding: "Mild curiosity, no stakes.", fix: "Add a before/after payoff." },

    { key: "shareability", name: "Shareability", score: 48, finding: "No reason to send to a friend.", fix: "End with a relatable one-liner." },

    { key: "platform_fit", name: "Platform fit", score: 85, finding: "Clean 9:16, good light.", fix: "Nothing critical." }

  ],

  top_fixes: [

    { timecode: "0:00-0:02", issue: "Static logo intro", action: "Cut it, start mid-action", impact: "high" },

    { timecode: "0:07-0:14", issue: "Static shot", action: "Split into 2-3 cuts", impact: "high" },

    { timecode: "0:28", issue: "Weak ending", action: "Loop back to the opening shot", impact: "medium" }

  ],

  strengths: ["Great lighting", "Captions present", "Clear niche topic"]

}

Results layout:

- Big animated circular score gauge (0-100) with tier label: low → "Not viral yet", below_average → "Below average", average → "Average", high → "Strong potential", very_high → "High viral potential". Gauge stroke: purple-to-pink gradient (#7638FA → #EE3D84)

- Verdict text under the gauge

- AUDIENCE CARD right below the score: primary segment as a highlighted chip row (gender icon + age range + label), interests as pink tag chips, "why" as small muted text, secondary segment as a smaller row, audience_width badge (narrow → "Niche", medium → "Medium", broad → "Mass market"), targeting_tip in a soft callout titled "Targeting tip"

- 6 factor cards in a responsive grid, styled like metric tiles: name, score progress bar (gradient purple→pink fill on light track), finding, fix

- "Top fixes" numbered list: timecode chip, issue, action, impact badge (high = red tint, medium = amber tint, low = gray tint)

- "What's already working" list with green check icons

- "Analyze another video" button that resets to Screen 1

DESIGN SYSTEM (match exactly, this is an existing product's design language):

- LIGHT theme. Page background: very light off-white with a subtle lavender tint

- Font: "Instrument Sans" (Google Fonts). H2: Bold 24px, H3: SemiBold 22px, body: Medium 14px, small: Medium 13px, captions: Medium 12px. Line-height 1.3

- Text colors: primary #150610; secondary rgba(12,6,21,0.35); tertiary rgba(12,6,21,0.2)

- Accents: purple #7638FA (primary actions, chart strokes, gauge), pink #EE3D84 (secondary accent, tags, highlights, usernames), pink tint bg rgba(238,61,114,0.05); destructive red #E94334 with tint bg rgba(255,37,18,0.05)

- Cards: background rgba(255,255,255,0.88), 1px solid #FEFEFE border, border-radius 20px, padding 12px, shadow: 1px 5px 11.7px rgba(0,0,0,0.03)

- Inner tiles/metric items inside cards: background #F7F7F7, border-radius 12px, padding 16px

- Small stat boxes: 1px border rgba(12,6,21,0.05), border-radius 12px

- Icon containers: 36px circles with background rgba(12,6,21,0.05), thin-line 20px icons inside (use lucide icons, stroke ~1.5px)

- Buttons: height 56px, border-radius 12px; primary = purple #7638FA filled with white text; soft/tinted variants use 5% opacity color backgrounds with colored text

- Small tags/pills: border-radius 17px, padding 4px 8px, 12px Medium text, tinted backgrounds (e.g. pink 5% bg + pink text)

- Mobile-first responsive layout, cards stack vertically on mobile

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1c33acf6-e476-4198-886b-93f45b55d91b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
