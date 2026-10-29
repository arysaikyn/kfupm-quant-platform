# Design

How this app gets to the standard the reference products set, and what was copied
from where. Every claim below is from a source that was read in text; nothing is
copied from a screenshot we could not read.

## There is no award to copy

The Apple Design Awards gave **no award to a retail finance app in 2025 or 2026**
(the full winner lists were read). The only finance product in that window is
Copilot Money, an ADA finalist in 2024 and an App Store Editor's Choice. So the
bar is set by shipped products and by the written decisions their teams publish,
not by jury quotes.

## The method

1. **Build a pattern atlas before building a screen**: one screen type × ten
   shipped apps. Mobbin describes exactly this as a paid research deliverable
   ([x.com/mobbin](https://x.com/mobbin/status/2072333355073650760)), and a
   practitioner's workflow post adds the rule that matters: feed the pattern
   report **plus our token set plus the spec** to the builder first, or the output
   is generic ([x.com/rachelhxw](https://x.com/rachelxw/status/2082663915117498416)).
2. **One swap at a time.** A reference is accepted only if it names a pattern, the
   product that ships it, and a measurement we can run before and after.
3. **Measure the mechanics, not the taste.** The number of font sizes in use, the
   number of labels that clip at 320px, horizontal overflow, contrast, tap targets.

## Where independent sources agree

Five findings repeat across sources that did not talk to each other, which is the
strongest signal available without a jury:

1. **Colour belongs to data, not to chrome.** Copilot spends colour only on money
   ([design analysis](https://blakecrosley.com/guides/design/copilot-money)); Monzo
   documents the "Hot Coral dilemma" — brand red reads as an error inside the UI,
   so it survives only as a moment of delight
   ([Monzo](https://monzo.com/blog/reimagining-monzo-com)); 同花顺 deliberately
   demotes its tab bar so attention stays on content.
2. **Numerals are a legibility layer.** `tabular-nums` on every price and
   percentage, digits aligned by decimal place, 1px low-opacity dividers instead of
   gridlines, and the sign inside the text so direction is never colour-only
   ([Damir Akaza §7](https://x.com/Damir_Akaza/status/2114686640899699008), DGA
   Metric component, [zostaff](https://x.com/zostaff/article/2064307487306571913)).
3. **Dark is surface luminance, not glow.** A floor around `#0A0A0C` (never pure
   black), elevation by lighter graphite, body text at 88–92% white (Damir §12;
   Copilot's `#000814` canvas with four surface tiers).
4. **Arabic is a second type scale, not a font swap.** Body 10–20% larger,
   line-height 1.6–1.8 for prose, a hard 14px floor for body copy, Latin digits,
   `letter-spacing: normal` because tracking disconnects cursive glyphs
   ([mikdam](https://mikdam.com/arabic-typography-in-ui), Saudi DGA RTL library,
   and Alinma's live Arabic DOM using Western digits).
5. **Dense tables hold muscle memory.** A redesign that hides the primary list
   behind a search bar, or drops the Y-axis numbers, was reverted in ten days
   ([Trading 212](https://www.tradingview.com/news/tradingview:…)). TradingView
   instead hides chart settings behind a long press on the price scale.

## Copy list

Ranked by impact on a dense mobile finance UI. Each row names the source, the
screen it lands on, and the test that decides whether the swap worked.

| # | Pattern | Source | Our screen | Acceptance |
|---|---|---|---|---|
| 1 | One type scale, Arabic gets its own step | mikdam; Damir §6 | all | ≤10 sizes rendered, none below 11px (14px for Arabic body), 0 clipped labels at 320px — **done, see below** |
| 2 | Colour reserved for values; brand accent only on chrome and the AI orb | Copilot; Monzo; 同花顺 | 行情 table, 策略 cards | no accent-coloured number; up/down never distinguished by hue alone (icon or sign too) |
| 3 | Dark surface ladder, no glow behind dense tables | Damir §12; Copilot | theme | three surface tiers ≥ 4% apart in luminance; body text ≥ 88% white |
| 4 | Market home opens on the user's own numbers, then market breadth, then ranking, then news | 同花顺 App Store listing; Apple Stocks | 行情 总览 | the first card above the fold is a number the user owns or a mover, not index chrome |
| 5 | One entry that aggregates: search box + 3–5 quick-prompt chips, everything else behind it | 妙想 (woshipm 2025) | 行情 top / AI orb | first screen has ≤1 text input; every other entry is one tap from it |
| 6 | Chart as control: tap a segment, get the cause and the numbers in place | Copilot; Lightyear "Why did it move?" | 个股详情, 回测结果 | a chart interaction reveals an explanation without leaving the screen |
| 7 | Quote row = name · price · change · sparkline, with an edit mode | Apple Stocks | 行情 榜单 | the colour-coded sparkline is in the row; sort by % change |
| 8 | Rule grammar made visible: ALL / ANY group headers | Composer | 策略 规则卡 | the rule card reads as a sentence with one visible grouping operator |
| 9 | Skeleton that keeps final geometry, empty with one action, error with retry | Damir §17; 同花顺 outage coverage | every data surface | no layout shift between skeleton and data |
| 10 | 320px torture test | Damir §19 | CI | no horizontal scroll, no clipped label, with `$999,999,999.99` and a 120-char Arabic string |

## What we do not copy

- **Gallery screenshots** (@mobbin, @dribbble, @godly): image-only posts name no
  app and no pattern. Copying them produces screens that look good in a shot and
  are dead in hand.
- **Fully transparent "Liquid Glass" chrome over dense tables**: NN/g documents it
  obscuring content and competing for attention. Keep the shape, keep opacity.
- **Trading 212's bubble/pull-up redesign**: a dated, documented revert.
- **Order tickets and 100+ indicator pickers**: we ship no execution, and the
  indicator count is a treadmill.
- **8pt-grid and "make it clean" posts**: hygiene, not a differentiator.

## Pass 1: the type scale (this commit)

The app already declared a ramp in `styles.css` (`--text-2xs` … `--text-2xl`) and
then ignored it: 734 hand-set pixel sizes across 48 files, 22 distinct sizes, 78
of them below 11px, and Arabic held at the same size as Latin. Measured on four
screens at two widths, before and after:

| Measure | Before | After |
|---|---|---|
| Distinct rendered sizes (max per screen) | 12 | 10 |
| Smallest text | 8px | 10px (SVG axis ticks only) |
| Clipped labels, en @320 / ar @320 | 4 / 2 | 0 / 0 |
| Horizontal overflow | none | none |
| Arabic body floor | 11px | 13px meta, 15px body, prose line-height 1.6 |

Three defects the measurement found on the way, all fixed:

- The `Strategies` tab label was cut to `Strategic…` at 320px; labels now take two
  lines, since the bar is 60px tall and always was.
- The index strip gave `SSE Composite` 45px and cut it mid-word; the name now owns
  a line and the number sits under it.
- An 8%-weight sector cell in the sector strip is ~25px wide at 320px, so its
  label is now hidden by a container query instead of printed as `Mat…`; colour
  and the accessible name carry the reading.
