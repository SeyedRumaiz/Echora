#!/bin/bash
# EchoraOS — commit plan for this batch of changes.
# Run this in your real terminal from the project root (not device_bash —
# it can't clean up .git/index.lock reliably).
#
# If any single commit fails, fix it in place, re-run just that block, and
# continue from the next one — each is independent.
set -e

git add shared/citations.ts
git commit -m "feat: add shared citation-parsing module for grounded AI references

Both the server (when generating [[REF:id|title|date]] tokens) and the
client (when rendering them as clickable citations) used to parse this
format independently. Extracting one implementation means the two can
never silently drift apart."

git add server.ts server/app.ts server/lib/gemini.ts server/lib/journalContext.ts
git commit -m "refactor: split server into a testable Express app plus lib modules

server.ts is now a thin entrypoint (Vite middleware in dev, static dist/
in prod, then listen). The actual routes live in server/app.ts, which
exports a plain Express app with no .listen() call -- that's what lets
the new test suite import and exercise the API without a real network
listener or a live Gemini key. Gemini client construction and the
grounding system prompt moved to server/lib/gemini.ts, and journal
context formatting to server/lib/journalContext.ts.

Also fixes Cloud Run compatibility: PORT is now read from
process.env.PORT (falling back to 3000 locally) instead of being
hardcoded, so the container binds to the port Cloud Run actually
assigns it."

git add vitest.config.ts package.json server/app.test.ts server/lib/gemini.test.ts server/lib/journalContext.test.ts shared/citations.test.ts
git commit -m "test: add Vitest + Supertest suite for server routes and shared modules

Covers request validation on all three AI endpoints and /api/health,
Gemini client configuration handling (missing/placeholder key vs. a
real one), journal-context formatting, and citation parsing/splitting.
None of it calls the real Gemini API, so it runs with no API key and no
network access -- run with \`npm test\`."

git add src/components/AIReflectionView.tsx
git commit -m "fix(reflect): surface real errors and add an honest empty state

The Reflect chat's catch-all swallowed every failure behind a single
hardcoded 'Could not reach reflection service.' toast, even though
aiService.ts already throws specific, useful error messages. It now
shows the real thrown message instead.

Also: when a user has zero journal entries, the empty state no longer
offers starter prompts that presuppose journal history exists -- it
explains there's nothing to ground a reflection in yet. And the
'Reflecting...' status now announces itself via aria-live for
screen-reader users.

(Rendering was already switched over to the shared citation parser in
shared/citations.ts as part of that extraction.)"

git add src/components/TodayView.tsx
git commit -m "fix(today): remove fabricated fallback observation

The 'thread' shown on the Today view fell back to a hardcoded, made-up
quote ('You've returned to questions about your pacing...') whenever
there was no real AI-derived observation yet -- presented exactly like
a genuine insight into the user's own writing. That violates the app's
core promise that nothing in front of the user is invented.

It now only ever shows a real quote (from a saved insight or an
entry's own AI takeaway), and otherwise says plainly that nothing has
been synthesized yet, with a link to generate one in Insights."

git add src/components/InsightsView.tsx
git commit -m "feat(insights): surface real Gemini-generated insight fields

The 'Recurring Threads' and 'Moments Worth Remembering' sections only
ever showed client-side heuristics (tag frequency counts, entries with
a long takeaway), even after a real longitudinal synthesis had been
generated. Meanwhile currentInsight.themes, meaningfulMoments,
goalsAndIntentions, challenges, suggestedNextSteps, and
moodTrendObservation -- all computed by the Gemini /api/ai/reflect
endpoint -- were computed and stored but never rendered anywhere.

Recurring Threads and Moments now prefer the real AI-generated data
when a synthesis exists (Moments links back to its source entry via
onOpenSourceEntry when the AI recorded one), falling back to the
existing client-side heuristics before a synthesis has been run. Added
new Goals & Intentions, Challenges, and Suggested Next Steps sections.
Also removed a dead branch referencing currentInsight.recommendations,
a field that doesn't exist on the LongitudinalInsight type."

git add src/components/JournalView.tsx
git commit -m "feat(journal): add debounced autosave and accessibility polish

Autosaves a draft ~2.5s after typing pauses (reusing the existing
saveStatus indicator), so a closed tab or a lost connection doesn't
lose real writing -- autosave never shows a toast or an 'enter a title'
warning, only an explicit Save does that. Also adds an honest empty
state under Observation before anything has been synthesized, and
aria-labels on the title and content inputs."

git add src/hooks/useFocusTrap.ts src/components/ConfirmModal.tsx src/components/SourceEntryModal.tsx src/components/LandingView.tsx
git commit -m "feat(a11y): add a focus-trap hook and wire it into all modal dialogs

ConfirmModal and SourceEntryModal already had Escape-to-close and
proper aria-modal/aria-labelledby, but Tab/Shift+Tab could still move
focus out of the dialog into the dimmed content behind it. Added a
reusable useFocusTrap hook (moves focus in on open, cycles Tab within
the dialog, restores focus on close) and wired it into both, plus
Landing's email/password auth modal -- which additionally gets
role=dialog/aria-modal/aria-labelledby and Escape-to-close, which it
was missing entirely."

git add src/components/SettingsView.tsx
git commit -m "feat(settings): add a grounding/citation trust card

The Google Cloud Architecture grid covered Firestore isolation, Secret
Manager, and Cloud Run, but said nothing about the app's central
privacy claim: that Gemini is grounded strictly in the user's own
entries and never invents people or events. Added a fourth card
stating that contract explicitly, next to the infrastructure ones."

git add .env.example
git commit -m "docs: fix stale AI Studio boilerplate in .env.example

The comments described an AI Studio secrets panel injecting these vars
automatically, which isn't how this app is actually deployed (Cloud
Run + Secret Manager). Rewrote the GEMINI_API_KEY comment to describe
the real deployment path, and removed APP_URL, which is unused
anywhere in the codebase."

git add README.md
git commit -m "docs: document the server/app/lib split and add testing instructions

Added a Server architecture section explaining the server.ts /
server/app.ts / server/lib split (and why it exists -- testability),
a Testing section with npm test instructions and what the suite
covers, and fixed a line claiming the port was hardcoded now that it
reads PORT from the environment."

echo ""
echo "Done. Run 'git log --oneline -11' to see the new commits."
