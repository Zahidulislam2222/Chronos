# Branch Protection Rules for `main`

These rules should be configured via GitHub Settings > Branches > Add rule.

## Recommended Settings

### Branch name pattern
`main`

### Protect matching branches

- [x] **Require a pull request before merging**
  - Require 1 approval
  - Dismiss stale pull request approvals when new commits are pushed

- [x] **Require status checks to pass before merging**
  - Required checks:
    - `PHP Tests` (from CI Pipeline workflow)
    - `Blocks Build & Tests` (from CI Pipeline workflow)
    - `Frontend Build` (from CI Pipeline workflow)
  - Require branches to be up to date before merging

- [x] **Do not allow bypassing the above settings**

### Optional (recommended)

- [x] **Require conversation resolution before merging**
- [ ] Require signed commits (only if GPG is set up)
- [ ] Require linear history (if you prefer rebase over merge commits)

## How to Configure

1. Go to https://github.com/Zahidulislam2222/Chronos/settings/branches
2. Click "Add branch protection rule"
3. Enter `main` as the branch name pattern
4. Check the boxes above
5. Click "Create"

Or use GitHub CLI:
```bash
gh api repos/Zahidulislam2222/Chronos/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["PHP Tests","Blocks Build & Tests","Frontend Build"]}' \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field enforce_admins=true
```
