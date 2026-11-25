# Branch Protection Rules for `main`

`main` has been protected since 25 November 2026. A read-only check of the
GitHub API on that date returned the settings below; the repository has no
separate rulesets. Re-check them with:

```bash
gh api repos/Zahidulislam2222/Chronos/branches/main/protection
```

## Enforced settings

- **Pull request required before merging**, with 0 required approvals
  (single maintainer; a required approval would block every change). Stale
  approvals are dismissed when new commits are pushed.
- **Required status checks, branch must be up to date (strict):**
  - `PHP Tests`, `Blocks Build & Tests`, `Frontend Build` (CI Pipeline workflow)
  - `gitleaks`, `npm audit`, `composer audit`, `bandit`, `semgrep` (Security workflow)
  - `Analyze (javascript-typescript)`, `Analyze (actions)` (CodeQL workflow)
- **Administrators included:** the rules apply to the repository owner too.
- **Conversation resolution required** before merging.
- **Force pushes and branch deletion blocked.**
- Not enabled: signed commits, linear history (merge commits are used).

All ten checks run automatically on every pull request and need no secrets.
Conditional jobs (retired deployment jobs, integration jobs) are not
required, because they do not report a status on unrelated pull requests.

## Changing the rules

Use GitHub Settings > Branches, or the CLI:

```bash
gh api repos/Zahidulislam2222/Chronos/branches/main/protection \
  --method PUT \
  --input protection.json
```

where `protection.json` lists the same `required_status_checks` (strict, the
ten contexts above), `enforce_admins: true`, `required_pull_request_reviews`
(`required_approving_review_count: 0`, `dismiss_stale_reviews: true`),
`required_conversation_resolution: true`, `allow_force_pushes: false` and
`allow_deletions: false`. Record any change in [CHANGELOG.md](../CHANGELOG.md).
