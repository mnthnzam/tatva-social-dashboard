# Tatva Social Dashboard

Monthly social reporting and planning for Tatva Global School, built by Zamstars.
Live at https://tatva-dashboard.vercel.app/ (deploys from `main`).

## Open it

**Quickest:** double-click `app/dist/index.html`. Keep the `creatives` folder next to it (it holds the post images).
Fonts load from Google Fonts when online; offline it falls back to system fonts.

**Dev server (live reload):**
```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

## Two modes

**Client view (default, `#/`)** — what Tatva sees. View-only: plan approvals and change requests happen on the call or WhatsApp.
- **Home** — next month's plan and last month's results as two cards, then the accounts at a glance: Instagram and Facebook followers, net new followers, views, reach, interactions and messages over the last 28 days vs the 28 before, with a by-day chart. Account snapshot from Meta Business Suite (`pipeline/raw/account.json`).
- **October plan** (`#/plan`) — every planned post week by week with its design (or script for reels), where it stands (design ready / script ready · footage due / topic to be fixed), and the footage Tatva needs to send by when.
- **Results** (`#/results/<month>`) — the lead funnel first (people reached → conversations → enquiries → campus visits → admissions, by source, with untagged leads counted openly), the lead-to-admission journey from the school's admissions tracker (`journey` in `leads.json`, all channels), then four plain numbers vs last month (people reached, reactions & comments, shares & saves, new followers), what worked, what was quieter, plan delivery, who posted (Zamstars / Tatva team / unconfirmed), paid kept apart from organic, what else happened, and every post with a one-line verdict. A notice shows when the export stopped before the month ended.
- **Big moves, explained** (Home) — every account change of 30% or more gets a reason line (`why` on the metric in `pipeline/raw/account.json`); until one is entered it says the reason is being checked.

**Insights links** — every KPI tile, money row and card opens the detail behind it. Card `ref` in `leads.json` brief: `c:<content id>` opens a post, `s:<page>#<section>` jumps to a page section (`funnel`, `journey`, `posts`, `paid`, `web` on Results).

Old links `#/review` and `#/account` still work (they open the plan and home).

**Click to compare** — every headline number opens a breakdown: month by month, vs any other month (total, per post, by format, planned vs outside plan) and the posts that drove it. Every post can be compared with the typical post of its format, the month's average, or any other post.

**Team view (`#/team/…`)** — Zamstars' working view: overview, accounts, posts, plan vs live calendar, boosts, trends, collabs, data & review queue. Post detail keeps the full Meta numbers behind tabs.

Light / dark / match-system toggle in both. Every screen has its own URL.

## Verdicts (client language)

Each own post gets one: **Standout** (≥ 1.5×), **Steady** (0.75–1.5×) or **Quiet** (< 0.75×) — reach and engagement against the Jul–Sep median for its format. Boosted posts are labelled **Boosted** and judged on what the ad added. The one-line "why" under each post is generated from the same numbers.

"People reached" is organic reach added across posts, so a parent who saw three posts counts three times.

## Post tags

- **Planned** — in the content calendar and matched to a live post.
- **Last-minute · Zamstars** — not in the calendar, but the design is in that month's Zamstars Canva file.
- **Outside plan · unconfirmed** — not in the calendar and no Zamstars design found (likely Tatva team). Needs a tag.
- **Collab** — posted from a partner account with TGS as collaborator.
- **₹ Boosted** — Meta reports views or reach from ads. **💵** — marked for a boost in the calendar.

## Update the data (monthly)

```
pipeline/raw/meta_posts.json   Meta Business Suite per-post export (90 days, IG + FB)
pipeline/raw/meta_items.json   same posts with Meta content ids
pipeline/raw/meta_img/         full post images ({content id}.jpg)
pipeline/raw/calendar.xlsx     the content calendar sheet
pipeline/raw/oct_items.json    next month's cleaned plan
pipeline/raw/canva/            creatives exported from Canva
pipeline/raw/leads.json        hand-entered: funnel by source, paid campaigns, month context, report inputs checklist
pipeline/reconcile.json        manual decisions: plan ↔ post matches, tags, titles, funnel job (reach / enquiry / visit), 4C
```

Pull Meta data on or after the 1st and set `dataCutoff` to the month's last day — `build.py` warns when it doesn't. The report is due on the 3rd working day; the team **Data & review** view shows the inputs checklist and the due date.

```bash
cd app
npm run data      # python3 ../pipeline/build.py  → app/src/data/tgs.json + app/public/creatives
npm run verify    # independent checks against the raw export
npm run build     # → app/dist/index.html (single file) + dist/creatives
```

`build.py` stops with a message when a calendar row can't be matched automatically — add the decision to `reconcile.json` and rerun.

## Known gaps in this pilot

- Tatva Kids: the Meta login used has no access to the TK page.
- Ad spend / cost per result: needs Meta ad-account access.
- 3 Tatva Basketball Academy collab carousels have no preview (Meta doesn't expose partner-account posts in TGS insights).
- Reel previews are the opening frame of the video (Meta doesn't expose the chosen cover for IG reels here). The Admissions FAQ reel opens on a blank frame, so it shows no preview.
- Stories only appear in Meta's export from mid-August.

## Later

Client logins (the site is currently open to anyone with the link) and a scheduled monthly data refresh.
