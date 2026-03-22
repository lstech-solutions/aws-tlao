# Versioning Guide

This project uses [@edcalderon/versioning](https://www.npmjs.com/package/@edcalderon/versioning) for comprehensive version management and changelog generation.

## Quick Start

### Bump Versions

```bash
# Patch release (1.0.3 → 1.0.4)
pnpm version:patch

# Minor release (1.0.3 → 1.1.0)
pnpm version:minor

# Major release (1.0.3 → 2.0.0)
pnpm version:major

# Prerelease (1.0.3 → 1.0.4-alpha.0)
pnpm version:prerelease
```

### Sync Versions

Synchronize versions across all packages in the monorepo:

```bash
pnpm version:sync
```

### Generate Changelog

Generate changelog from conventional commits:

```bash
pnpm version:changelog
```

### Validate Versions

Ensure all packages have synchronized versions:

```bash
pnpm version:validate
```

## Configuration

The versioning tool is configured in `versioning.config.json`:

```json
{
  "rootPackageJson": "package.json",
  "packages": [
    "packages/versioning",
    "packages/backend",
    "apps/landing"
  ],
  "changelogFile": "CHANGELOG.md",
  "conventionalCommits": true,
  "syncDependencies": true
}
```

## Packages

The monorepo contains three packages that are version-synchronized:

1. **@tlao/versioning** (`packages/versioning`)
   - Versioning utilities and helpers

2. **@tlao/backend** (`packages/backend`)
   - AWS Lambda functions and backend services

3. **@tlao/landing** (`apps/landing`)
   - Next.js landing page application

## Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, dependencies, etc.

### Examples

```bash
git commit -m "feat: add infinite grid animation to hero"
git commit -m "fix: resolve TypeScript errors in backend services"
git commit -m "docs: update README with setup instructions"
git commit -m "chore(release): bump version to 1.0.3"
```

## Changelog

The `CHANGELOG.md` file is automatically generated and updated with each version bump. It follows the [Keep a Changelog](https://keepachangelog.com/) format.

### Current Version

**v1.0.3** - Released 2026-01-03

### Version History

- **v1.0.3** - Enhanced UI/UX with animations and theme support
- **v1.0.2** - Added legal pages and improved styling
- **v1.0.1** - Initial monorepo setup
- **v1.0.0** - Initial release

## Workflow

### Creating a Release

1. Make your changes and commit with conventional commit messages
2. Run `pnpm version:patch` (or minor/major as needed)
3. Review the updated `CHANGELOG.md`
4. Push changes and tags to repository

### Pre-release Workflow

For alpha/beta releases:

```bash
pnpm version:prerelease
```

This creates versions like `1.0.3-alpha.0`, `1.0.3-beta.0`, etc.

## Extensions

The versioning tool supports extensions for custom business logic. Built-in extensions include:

- **lifecycle-hooks**: Demonstrates pre/post version hooks
- **npm-publish**: Handles NPM package publishing
- **sample-extension**: Example extension with custom commands

## Troubleshooting

### Versions Out of Sync

If versions become out of sync:

```bash
pnpm version:validate
```

This will report which packages have mismatched versions.

### Regenerate Changelog

To regenerate the changelog:

```bash
pnpm version:changelog
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [@edcalderon/versioning Documentation](https://www.npmjs.com/package/@edcalderon/versioning)
