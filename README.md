# Tatva Social Dashboard (internal preview)

Monthly social reporting and planning for Tatva Global School, built by Zamstars.
Personal/local version — not deployed, no repo yet.

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

**Client view (default, `#/`)** — what Tatva sees, two visits a month:
- **Home** — the two things that need them this month.
- **Review October** — every planned post with its design (or script for reels). Two gates per post: idea & copy / script first, then design / final cut. Approve or ask for changes with a comment; "Send feedback" gives a summary to paste into WhatsApp or email.
- **Results** — four plain numbers vs last month (people reached, reactions & comments, shares & saves, new followers), what worked, what was quieter, plan delivery, and every post with a one-line verdict.

- **Accounts** — bird's-eye view of Instagram and Facebook: followers, net new followers, views, reach, interactions, messages over the last 28 days vs the 28 before, with a by-day chart. Snapshot pulled from Meta Business Suite (`pipeline/raw/account.json`).

**Click to compare** — every headline number opens a breakdown: month by month, vs any other month (total, per post, by format, planned vs outside plan) and the posts that drove it. Every post can be compared with the typical post of its format, the month's average, or any other post.

**Team view (`#/team/…`)** — Zamstars' working view: overview, posts, plan vs live calendar, boosts, trends, collabs, data & review queue. Post detail keeps the full Meta numbers behind tabs.

Light / dark / match-system toggle in both. Every screen has its own URL.

**Review decisions are saved in this browser only** (preview build). The hosted version stores them in the database so Zamstars sees them live.

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
pipeline/reconcile.json        manual decisions: plan ↔ post matches, tags, titles
```

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

## Later (after approval)

Private GitHub repo → Vercel (Pro for client use) → Supabase for data + images + client logins → client review and comments.
