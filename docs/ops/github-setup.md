# GitHub setup

Human-only steps. Do these in the GitHub UI, not from an agent.

## 1. Collaborators

Add the two other writers with **Write** access. Everyone else gets read access through the public link.

## 2. Protect `main`

Settings -> Branches -> add a branch protection rule for `main`:

- Require a pull request before merging.
- Leave required approvals at 0. The team does not mandate an approval count.
- Block force pushes.
- Block deletions.

The rule that only Arys merges is social. Branch protection enforces the pull-request path.

## 3. Security

Settings -> Code security:

- Enable secret scanning.
- Enable Dependabot alerts.
- Enable Dependabot security updates.

## 4. Keep it public

The repository stays public and shareable as a plain link. Do not add private vendor data to make a demo easier.

## 5. CI

No CI workflow is added yet. The team runs `make verify` locally. Add CI only when the team agrees on a single command and a runtime budget.

## 6. Branch names

- `agent/<slug>` for agent and feature work.
- `fix/<slug>` for a bug fix.
- `docs/<slug>` for documentation only.

Delete the branch after merge.
