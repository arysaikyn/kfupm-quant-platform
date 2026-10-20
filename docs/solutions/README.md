# Solutions

Learnings that should change the next plan. This directory is the compounding loop: each hard task makes the next one cheaper.

## Read side

Before a non-trivial plan:

```bash
rg -li "<area>" docs/solutions/
```

Load the hits as priors. A plan that contradicts a Prevention rule states why.

## Write side

Fire after:

- A root-cause debug that took real effort.
- A review finding that changed the design.
- A non-obvious toolchain, data, or environment fix.

Skip trivial edits, one-line fixes, and anything already recorded. Deduplicate first; update the existing note instead of writing a twin.

## Format

At most 30 lines:

```markdown
---
date: YYYY-MM-DD
area: <subsystem>
tags: [<language>, <failure-class>]
---
## Problem
## Root cause
## Fix
## Prevention rule
```

The Prevention rule is one line the next plan can obey.

## Boundary

Repo-specific facts only. A cross-project lesson goes to native memory instead. Do not write the same lesson in both places.
