# TLÁO Documentation Site

This is the documentation site for TLÁO (Tactical Layer for Action & Outcomes), built with Docusaurus 3.x.

## Getting Started

### Prerequisites

- Node.js 22.22.0
- pnpm >= 8.0.0

### Installation

From the monorepo root:

```bash
pnpm install
```

### Development

Start the development server:

```bash
# From the monorepo root
pnpm --filter @tlao/docs dev

# Or from this directory
pnpm dev
```

The site will be available at http://localhost:3000

### Building

Build the static site:

```bash
# From the monorepo root
pnpm --filter @tlao/docs build

# Or from this directory
pnpm build
```

The static files will be generated in the `build/` directory.

### Testing

Run tests:

```bash
pnpm test
```

Run type checking:

```bash
pnpm type-check
```

Run linting:

```bash
pnpm lint
```

## Project Structure

```
apps/docs/
├── docs/                   # Documentation content (Markdown/MDX)
├── src/                    # Custom React components and pages
│   ├── components/         # Reusable React components
│   └── css/               # Custom styles
├── static/                # Static assets (images, files)
├── docusaurus.config.ts   # Docusaurus configuration
├── sidebars.ts            # Sidebar navigation structure
└── package.json
```

## Configuration

The main configuration is in `docusaurus.config.ts`. Key settings:

- **URL**: https://docs.tláo.com
- **Base URL**: /
- **Route Base Path**: / (docs served at root)
- **Locales**: English (default)

## Deployment

The site is configured to deploy to Vercel. The build command and output directory are:

- Build command: `pnpm build`
- Output directory: `build/`

## Documentation

For more information about Docusaurus, see the [official documentation](https://docusaurus.io/).
