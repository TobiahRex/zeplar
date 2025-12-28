# GitHub Setup

## Branch Protection Rules

To enforce CI checks before merging to `main`, configure branch protection rules in your GitHub repository:

### Setup Instructions

1. Navigate to repository Settings
2. Go to Branches → Branch protection rules
3. Add rule for `main` branch
4. Configure the following settings:

#### Required Settings

- **Require a pull request before merging**
  - Require approvals: 1 (recommended)
  - Dismiss stale pull request approvals when new commits are pushed

- **Require status checks to pass before merging**
  - Require branches to be up to date before merging
  - Add required status checks:
    - `test` (the CI workflow job name)

- **Do not allow bypassing the above settings** (recommended for team repos)

### CI Workflow

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on:

- Every pull request to `main`
- Every push to `main`

The workflow executes these steps:

1. **Lint** - ESLint code quality checks
2. **Type check** - TypeScript type validation
3. **Tests** - Vitest unit tests
4. **Build** - Production build verification

All steps must pass for the CI check to succeed.

### Local Pre-commit Hooks

This repository uses Husky + lint-staged for pre-commit validation:

- Automatically runs on `git commit`
- Lints and formats staged files
- Configured in `package.json` under `lint-staged`

To bypass pre-commit hooks (not recommended):

```bash
git commit --no-verify
```

### Testing CI Steps Locally

Before pushing, verify all CI steps pass:

```bash
npm ci              # Clean install dependencies
npm run lint        # Lint check
npx tsc --noEmit    # Type check
npm run test:run    # Run tests
npm run build       # Production build
```
