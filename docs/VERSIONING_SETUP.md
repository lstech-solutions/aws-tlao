# Versioning Setup Guide

## Overview

The project uses `@edcalderon/versioning` v1.3.1 for comprehensive version management across the monorepo.

## Features Enabled

### 1. Private Package Checking

- Ensures private packages are not accidentally published
- Validates package.json `private` field

### 2. Root Cleanup

- Automatically cleans up root directory
- Removes unnecessary files
- Maintains clean project structure

### 3. Reentry Status Tracking

- Tracks version history in `.versioning/reentry.status.json`
- Maintains REENTRY.md for quick reference
- Enables fast layer status updates

### 4. Secrets Scanning

- Scans staged files for potential secrets
- Prevents accidental credential commits
- Runs automatically in pre-commit hook

### 5. Roadmap Management

- Tracks features in ROADMAP.md
- Integrates with version bumps
- Provides project planning visibility

## Available Commands

### Version Bumping

```bash
# Patch release (1.3.1 → 1.3.2)
pnpm run version:patch

# Minor release (1.3.1 → 1.4.0)
pnpm run version:minor

# Major release (1.3.1 → 2.0.0)
pnpm run version:major

# Prerelease (1.3.1 → 1.3.2-alpha.0)
pnpm run version:prerelease
```

### Synchronization

```bash
# Sync versions across all packages
pnpm run version:sync

# Validate version consistency
pnpm run version:validate
```

### Changelog

```bash
# Generate changelog from commits
pnpm run version:changelog
```

### Utilities

```bash
# Clean up root directory
pnpm run version:cleanup

# Manage reentry status
pnpm run version:reentry

# Manage roadmap
pnpm run version:roadmap

# Scan for secrets
pnpm run version:secrets
```

## Husky Pre-commit Hooks

### Pre-commit Hook

Runs before each commit:

1. Version validation
2. Lint-staged (ESLint + Prettier)
3. Secrets scanning

### Commit Message Hook

Validates commit message format:

- Must follow Conventional Commits
- Format: `<type>(<scope>): <description>`
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

## Configuration

### versioning.config.json

```json
{
  "rootPackageJson": "package.json",
  "packages": ["packages/versioning", "packages/backend", "apps/landing", "apps/docs"],
  "changelogFile": "CHANGELOG.md",
  "conventionalCommits": true,
  "syncDependencies": true,
  "privateCheck": true,
  "cleanupRoot": true,
  "roadmapFile": "ROADMAP.md",
  "reentryFeatures": {
    "enabled": true,
    "trackHistory": true,
    "versionHistory": ".version-history.json"
  },
  "validation": {
    "enforceConventionalCommits": true,
    "requireChangelog": true,
    "checkDependencySync": true
  }
}
```

## Workflow

### Making a Release

1. **Make changes and commit**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   - Pre-commit hooks run automatically
   - Commit message is validated

2. **Bump version**

   ```bash
   pnpm run version:patch  # or minor/major
   ```

   - Updates all package.json files
   - Generates changelog
   - Creates git tag

3. **Push changes**
   ```bash
   git push && git push --tags
   ```

### Adding a New Package

1. Create package directory
2. Add to `versioning.config.json` packages array
3. Run `pnpm run version:sync`

## Reentry Status

The reentry status tracks:

- Current version
- Last commit
- Pending changes
- Version history

View status:

```bash
pnpm exec versioning reentry show
```

Update status:

```bash
pnpm exec versioning reentry update
```

## Secrets Scanning

Scans for:

- API keys
- Passwords
- Tokens
- Private keys
- AWS credentials

Runs automatically on:

- Pre-commit hook
- Manual: `pnpm run version:secrets`

## Troubleshooting

### Version validation fails

```bash
# Sync versions manually
pnpm run version:sync

# Validate again
pnpm run version:validate
```

### Commit message rejected

Ensure format: `type(scope): description`

Example:

```bash
git commit -m "feat(landing): add 3D carousel"
```

### Pre-commit hook fails

```bash
# Run checks manually
pnpm run version:validate
pnpm run lint

# Fix issues and try again
```

## Best Practices

1. **Always use conventional commits**
   - Makes changelog generation automatic
   - Enables semantic versioning

2. **Run version:sync after package changes**
   - Keeps dependencies in sync
   - Prevents version conflicts

3. **Review changelog before release**
   - Ensure all changes are documented
   - Edit if needed

4. **Use appropriate version bumps**
   - Patch: Bug fixes
   - Minor: New features (backward compatible)
   - Major: Breaking changes

5. **Keep ROADMAP.md updated**
   - Document planned features
   - Track progress

## Extensions

The versioning tool includes these extensions:

- `cleanup-repo` - Repository cleanup
- `lifecycle-hooks` - Pre/post hooks
- `npm-publish` - Publishing utilities
- `reentry-status` - Status tracking
- `secrets-check` - Secret scanning

## Support

For issues with versioning:

- Check [versioning documentation](https://github.com/edcalderon/versioning)
- Review `.versioning/` directory
- Contact: admin@tláo.com
