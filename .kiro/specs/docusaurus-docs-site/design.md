# Design Document: Docusaurus Documentation Site for TLÁO

## Overview

This design document outlines the architecture and implementation approach for building a comprehensive documentation site for TLÁO (Tactical Layer for Action & Outcomes) using Docusaurus 3.x. The site will be deployed at docs.tláo.com and will serve as the primary resource for understanding TLÁO's architecture, agents, and implementation details.

The documentation site will be structured as a new application within the existing monorepo, leveraging the project's existing tooling (pnpm, Turbo) while maintaining independence from other applications. The site will support three languages (EN, ES, PT), provide comprehensive search functionality, and include automated system change detection to ensure documentation stays synchronized with the codebase.

## Architecture

### High-Level Architecture

The Docusaurus documentation site follows a static site generation (SSG) architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Documentation Source                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Markdown   │  │    React     │  │    Assets    │      │
│  │    Files     │  │  Components  │  │  (Images/    │      │
│  │              │  │              │  │   Diagrams)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Docusaurus Build System                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Markdown Processing (MDX)                         │   │
│  │  • React Component Rendering                         │   │
│  │  • i18n Translation Loading                          │   │
│  │  • Search Index Generation                           │   │
│  │  • Version Management                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Static Site Output                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     HTML     │  │      CSS     │  │  JavaScript  │      │
│  │    Pages     │  │    Bundles   │  │   Bundles    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Deployment (docs.tláo.com)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • CDN Distribution (Vercel/Cloudflare)              │   │
│  │  • HTTPS/SSL                                         │   │
│  │  • IDN Support for "tláo.com"                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

The documentation site will be organized within the monorepo as follows:

```
apps/docs/
├── docs/                          # Documentation content
│   ├── intro.md                   # Introduction/landing page
│   ├── concepts/                  # Core concepts
│   │   ├── why-layer.md
│   │   ├── why-tactical.md
│   │   └── action-outcomes.md
│   ├── architecture/              # 5-layer architecture
│   │   ├── overview.md
│   │   ├── layer-0-identity.md
│   │   ├── layer-1-intake.md
│   │   ├── layer-2-understanding.md
│   │   ├── layer-3-tactical-reasoning.md
│   │   ├── layer-4-action-interface.md
│   │   └── layer-5-orchestration.md
│   ├── agents/                    # Agent documentation
│   │   ├── overview.md
│   │   ├── tlao-plan.md
│   │   └── tlao-grant.md
│   ├── implementation/            # Implementation guides
│   │   ├── getting-started.md
│   │   ├── build-plan.md
│   │   ├── json-schemas.md
│   │   ├── integrations.md
│   │   └── api-reference.md
│   └── guides/                    # User guides
│       └── quickstart.md
├── i18n/                          # Internationalization
│   ├── es/                        # Spanish translations
│   │   └── docusaurus-plugin-content-docs/
│   │       └── current/
│   └── pt/                        # Portuguese translations
│       └── docusaurus-plugin-content-docs/
│           └── current/
├── src/                           # Custom components and pages
│   ├── components/                # React components
│   │   ├── LayerDiagram.tsx
│   │   ├── AgentCard.tsx
│   │   └── SchemaViewer.tsx
│   ├── css/                       # Custom styles
│   │   └── custom.css
│   └── pages/                     # Custom pages
│       └── index.tsx              # Custom homepage
├── static/                        # Static assets
│   ├── img/                       # Images and diagrams
│   └── schemas/                   # JSON schema files
├── scripts/                       # Build and utility scripts
│   └── check-docs-sync.ts         # System change detector
├── docusaurus.config.js           # Main configuration
├── sidebars.js                    # Sidebar navigation
├── package.json
└── tsconfig.json
```

## Components and Interfaces

### Core Docusaurus Configuration

The `docusaurus.config.js` file will configure all aspects of the site:

```javascript
module.exports = {
  title: 'TLÁO Documentation',
  tagline: 'Tactical Layer for Action & Outcomes',
  url: 'https://docs.tláo.com',
  baseUrl: '/',
  
  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt'],
    localeConfigs: {
      en: { label: 'English' },
      es: { label: 'Español' },
      pt: { label: 'Português' }
    }
  },
  
  // Presets and plugins
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/[org]/[repo]/tree/main/apps/docs/',
          versions: {
            current: { label: 'Latest' }
          }
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        }
      }
    ]
  ],
  
  // Search configuration
  themes: ['@docusaurus/theme-search-algolia'],
  themeConfig: {
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_API_KEY',
      indexName: 'tlao-docs'
    },
    navbar: {
      title: 'TLÁO',
      logo: {
        alt: 'TLÁO Logo',
        src: 'img/logo.svg'
      },
      items: [
        { type: 'doc', docId: 'intro', label: 'Docs' },
        { type: 'localeDropdown', position: 'right' },
        { type: 'docsVersionDropdown', position: 'right' }
      ]
    }
  }
}
```

### Sidebar Navigation Structure

The `sidebars.js` file defines the documentation hierarchy:

```javascript
module.exports = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'concepts/why-layer',
        'concepts/why-tactical',
        'concepts/action-outcomes'
      ]
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/layer-0-identity',
        'architecture/layer-1-intake',
        'architecture/layer-2-understanding',
        'architecture/layer-3-tactical-reasoning',
        'architecture/layer-4-action-interface',
        'architecture/layer-5-orchestration'
      ]
    },
    {
      type: 'category',
      label: 'Agents',
      items: [
        'agents/overview',
        'agents/tlao-plan',
        'agents/tlao-grant'
      ]
    },
    {
      type: 'category',
      label: 'Implementation',
      items: [
        'implementation/getting-started',
        'implementation/build-plan',
        'implementation/json-schemas',
        'implementation/integrations',
        'implementation/api-reference'
      ]
    }
  ]
}
```

### Custom React Components

#### LayerDiagram Component

Interactive diagram showing the 5-layer architecture:

```typescript
interface LayerDiagramProps {
  highlightLayer?: number;
  interactive?: boolean;
}

export function LayerDiagram({ highlightLayer, interactive = true }: LayerDiagramProps) {
  // Renders an SVG or interactive diagram showing:
  // - Layer 0: Identity & Workspace
  // - Layer 1: Intake
  // - Layer 2: Understanding
  // - Layer 3: Tactical Reasoning
  // - Layer 4: Action Interface
  // - Layer 5: Orchestration
  // 
  // Supports highlighting specific layers and click navigation
}
```

#### AgentCard Component

Displays agent information in a consistent format:

```typescript
interface AgentCardProps {
  name: string;
  description: string;
  capabilities: string[];
  schemaLink: string;
  exampleLink: string;
}

export function AgentCard(props: AgentCardProps) {
  // Renders a card with agent details
  // Includes links to schemas and examples
}
```

#### SchemaViewer Component

Interactive JSON schema viewer:

```typescript
interface SchemaViewerProps {
  schemaPath: string;
  title: string;
  description?: string;
}

export function SchemaViewer({ schemaPath, title, description }: SchemaViewerProps) {
  // Loads and displays JSON schema
  // Provides syntax highlighting
  // Supports collapsible sections
  // Includes copy-to-clipboard functionality
}
```

## Data Models

### Documentation Content Structure

Each documentation page follows MDX format with frontmatter:

```markdown
---
id: layer-1-intake
title: Layer 1 - Intake Layer
sidebar_label: Intake Layer
sidebar_position: 2
description: Unified ingestion of messy inputs into TLÁO
keywords: [intake, ingestion, layer-1, unstructured-data]
---

# Layer 1: Intake Layer

[Content here...]
```

### Translation Structure

Translations are organized by locale with the same structure as the source:

```
i18n/
├── es/
│   └── docusaurus-plugin-content-docs/
│       └── current/
│           ├── intro.md
│           ├── concepts/
│           │   └── why-layer.md
│           └── ...
└── pt/
    └── docusaurus-plugin-content-docs/
        └── current/
            └── ...
```

### JSON Schema Format

Agent schemas follow JSON Schema Draft 7:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TLÁO Plan Agent Input",
  "type": "object",
  "properties": {
    "context": {
      "type": "string",
      "description": "Unstructured input describing the situation"
    },
    "sources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "enum": ["email", "pdf", "note", "transcript"] },
          "content": { "type": "string" },
          "metadata": { "type": "object" }
        }
      }
    }
  },
  "required": ["context"]
}
```

### System Change Detection Data Model

The change detector tracks component-to-documentation mappings:

```typescript
interface ComponentDocMapping {
  componentPath: string;
  relatedDocs: string[];
  lastSynced: Date;
  checksum: string;
}

interface ChangeReport {
  changedComponents: Array<{
    path: string;
    changeType: 'modified' | 'added' | 'deleted';
    affectedDocs: string[];
  }>;
  outdatedDocs: string[];
  timestamp: Date;
}
```

## Data Flow

### Build Process Flow

```
1. Source Files (Markdown/MDX + React Components)
   ↓
2. Docusaurus Plugin Processing
   - MDX compilation
   - React component bundling
   - Asset optimization
   ↓
3. i18n Processing
   - Load translations for each locale
   - Generate locale-specific pages
   ↓
4. Search Index Generation
   - Extract text content
   - Build Algolia index
   ↓
5. Static Site Generation
   - Render all pages to HTML
   - Generate CSS/JS bundles
   - Optimize assets
   ↓
6. Output (Static Files)
```

### System Change Detection Flow

```
1. CI/CD Trigger (on push to main)
   ↓
2. Component Analysis
   - Calculate checksums for core components
   - Compare with previous checksums
   ↓
3. Mapping Lookup
   - Identify affected documentation pages
   ↓
4. Documentation Check
   - Verify last sync timestamp
   - Check if docs were updated in same commit
   ↓
5. Report Generation
   - List outdated documentation
   - Create GitHub issue or PR comment
   ↓
6. Status Update
   - Mark docs as synced or outdated
```

### Search Flow

```
1. User enters search query
   ↓
2. Algolia DocSearch
   - Query Algolia index
   - Filter by current locale
   ↓
3. Results Display
   - Show matching pages
   - Highlight search terms
   - Provide context snippets
   ↓
4. User selects result
   ↓
5. Navigate to page with highlighted terms
```

## Implementation Details

### Monorepo Integration

The docs app will integrate with the existing monorepo structure:

1. **Package Management**: Use pnpm workspaces (already configured)
2. **Build Orchestration**: Add to Turbo pipeline in `turbo.json`
3. **Shared Dependencies**: Leverage root-level dependencies where possible
4. **Independent Deployment**: Deploy separately from other apps

### Turbo Configuration Addition

Add to `turbo.json`:

```json
{
  "pipeline": {
    "docs#build": {
      "outputs": ["build/**", ".docusaurus/**"],
      "dependsOn": ["^build"]
    },
    "docs#dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Internationalization Strategy

1. **Default Language**: English (en) - complete documentation
2. **Translation Workflow**:
   - Write content in English first
   - Use Docusaurus i18n commands to extract translatable strings
   - Translate markdown files to Spanish and Portuguese
   - Store translations in `i18n/{locale}/` directories
3. **Fallback Behavior**: If translation missing, show English version
4. **Language Detection**: Use browser locale for initial language selection
5. **Persistence**: Store language preference in localStorage

### Search Implementation

Use Docusaurus's built-in Algolia DocSearch integration:

1. **Index Creation**: Algolia crawler indexes the deployed site
2. **Configuration**: Configure crawler to index all locales
3. **Search UI**: Use default Docusaurus search bar
4. **Customization**: Style search results to match TLÁO branding

### Version Management

Implement documentation versioning for TLÁO releases:

1. **Version Creation**: Use `docusaurus docs:version X.Y.Z` command
2. **Version Storage**: Store in `versioned_docs/` and `versioned_sidebars/`
3. **Version Selector**: Add dropdown in navbar
4. **Latest Version**: Always show "Latest" for current development
5. **Archived Versions**: Maintain last 3 major versions

### System Change Detector Implementation

Create a TypeScript script that runs in CI/CD:

```typescript
// scripts/check-docs-sync.ts

interface Config {
  componentPaths: string[];
  docsMappings: Record<string, string[]>;
  checksumFile: string;
}

async function detectChanges(config: Config): Promise<ChangeReport> {
  // 1. Calculate current checksums for monitored components
  // 2. Load previous checksums from file
  // 3. Identify changed components
  // 4. Look up affected documentation pages
  // 5. Check if docs were updated in same commit
  // 6. Generate report
}

async function main() {
  const config = loadConfig();
  const report = await detectChanges(config);
  
  if (report.outdatedDocs.length > 0) {
    console.error('Outdated documentation detected:');
    report.outdatedDocs.forEach(doc => console.error(`  - ${doc}`));
    process.exit(1);
  }
}
```

Configuration file (`docs-sync-config.json`):

```json
{
  "componentPaths": [
    "packages/core/src/layers/**/*.ts",
    "packages/agents/src/**/*.ts"
  ],
  "docsMappings": {
    "packages/core/src/layers/intake": [
      "docs/architecture/layer-1-intake.md"
    ],
    "packages/agents/src/plan": [
      "docs/agents/tlao-plan.md",
      "docs/implementation/json-schemas.md"
    ]
  },
  "checksumFile": ".docs-checksums.json"
}
```

### Deployment Configuration

For Vercel deployment:

```json
{
  "buildCommand": "cd apps/docs && pnpm build",
  "outputDirectory": "apps/docs/build",
  "framework": null,
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

Domain configuration:
- Configure DNS to point docs.tláo.com to Vercel
- Enable automatic HTTPS
- Configure IDN (Internationalized Domain Name) support for the "á" character

### Custom Styling

Create `src/css/custom.css` with TLÁO branding:

```css
:root {
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  --ifm-color-primary-darker: #277148;
  --ifm-color-primary-darkest: #205d3b;
  --ifm-color-primary-light: #33925d;
  --ifm-color-primary-lighter: #359962;
  --ifm-color-primary-lightest: #3cad6e;
  --ifm-code-font-size: 95%;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
  --ifm-color-primary-dark: #21af90;
  --ifm-color-primary-darker: #1fa588;
  --ifm-color-primary-darkest: #1a8870;
  --ifm-color-primary-light: #29d5b0;
  --ifm-color-primary-lighter: #32d8b4;
  --ifm-color-primary-lightest: #4fddbf;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.3);
}
```

## Error Handling

### Build-Time Error Handling

1. **Broken Links**: Docusaurus will fail the build if internal links are broken
2. **Missing Translations**: Warn but don't fail if translations are incomplete
3. **Invalid MDX**: Fail build with clear error message showing file and line
4. **Schema Validation**: Validate JSON schemas during build

### Runtime Error Handling

1. **404 Pages**: Custom 404 page with search and navigation
2. **Failed Search**: Show error message and fallback to browse navigation
3. **Missing Assets**: Use placeholder images for missing diagrams
4. **Locale Loading**: Fall back to English if locale fails to load

### System Change Detector Error Handling

1. **Missing Checksums**: Treat as first run, generate initial checksums
2. **Invalid Config**: Fail with clear error message
3. **File Access Errors**: Log warning and continue with available files
4. **Git Errors**: Fall back to file system timestamps

## Testing Strategy


A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

The following properties are derived from the testable acceptance criteria identified in the requirements. Each property is designed to be implemented as an automated test that validates the correctness of the documentation site.

### Configuration and Structure Properties

**Property 1: Build output contains HTML files**
*For any* successful build execution, the output directory should contain at least one HTML file for each documented page
**Validates: Requirements 1.2**

**Property 2: Code blocks have syntax highlighting**
*For any* markdown file containing code blocks, the rendered output should include language-specific syntax highlighting classes
**Validates: Requirements 6.6**

**Property 3: Architecture pages cross-link to related layers**
*For any* architecture layer documentation page, the content should include links to at least two other related layer pages
**Validates: Requirements 10.3**

**Property 4: Agent pages cross-link to implementation guides**
*For any* agent documentation page, the content should include links to relevant implementation guide pages
**Validates: Requirements 10.4**

### System Change Detector Properties

**Property 5: Change detector identifies modified components**
*For any* set of component files with changed checksums, the change detector should correctly identify all modified components
**Validates: Requirements 8.1**

**Property 6: Change detector maps components to documentation**
*For any* changed component, the change detector should return all documentation pages that reference that component according to the mapping configuration
**Validates: Requirements 8.2**

**Property 7: Change detector generates structured reports**
*For any* execution of the change detector, the output should be a valid ChangeReport object containing changedComponents, outdatedDocs, and timestamp fields
**Validates: Requirements 8.3**

**Property 8: Documentation sync status updates**
*For any* documentation file that is updated in the same commit as its related component, the change detector should mark that documentation as synchronized
**Validates: Requirements 8.5**

### File Existence and Structure Examples

The following are specific examples that verify the presence and structure of required files:

**Example 1: Docusaurus version check**
The package.json should specify @docusaurus/core version >= 3.0.0
**Validates: Requirements 1.1**

**Example 2: Package.json exists with required dependencies**
The apps/docs/package.json file should exist and include dependencies for @docusaurus/core, @docusaurus/preset-classic, and react
**Validates: Requirements 1.3**

**Example 3: Domain configuration**
The docusaurus.config.js should set url to 'https://docs.tláo.com'
**Validates: Requirements 1.5, 2.1**

**Example 4: DNS documentation exists**
A documentation file explaining DNS configuration should exist in the docs directory
**Validates: Requirements 2.3**

**Example 5: Core concept pages exist**
Documentation files should exist for why-layer.md, why-tactical.md, and action-outcomes.md
**Validates: Requirements 3.1**

**Example 6: All architecture layer pages exist**
Documentation files should exist for all 5 layers: layer-0-identity.md through layer-5-orchestration.md
**Validates: Requirements 4.1**

**Example 7: Layer diagrams exist**
Visual diagram components or files should exist to illustrate layer interactions
**Validates: Requirements 4.8**

**Example 8: Agent documentation section exists**
An agents directory should exist containing documentation for TLÁO agents
**Validates: Requirements 5.1**

**Example 9: Build plan documentation exists**
A build-plan.md file should exist in the implementation directory
**Validates: Requirements 6.1**

**Example 10: Plan agent JSON schema exists**
A valid JSON schema file for TLÁO Plan Agent should exist in static/schemas/
**Validates: Requirements 6.2**

**Example 11: Grant agent JSON schema exists**
A valid JSON schema file for TLÁO Grant Agent should exist in static/schemas/
**Validates: Requirements 6.3**

**Example 12: Integration guides exist**
An integrations.md file should exist in the implementation directory
**Validates: Requirements 6.4**

**Example 13: API documentation exists**
An api-reference.md file should exist in the implementation directory
**Validates: Requirements 6.5**

**Example 14: Internationalization configuration**
The docusaurus.config.js i18n section should include 'en', 'es', and 'pt' in the locales array with 'en' as defaultLocale
**Validates: Requirements 7.1, 7.2, 7.3**

**Example 15: Language switcher in navigation**
The themeConfig.navbar should include an item with type: 'localeDropdown'
**Validates: Requirements 7.5**

**Example 16: Fallback to English configured**
The i18n configuration should specify English as the default locale for fallback behavior
**Validates: Requirements 7.6**

**Example 17: Search configuration exists**
The themeConfig should include algolia configuration with appId, apiKey, and indexName
**Validates: Requirements 9.1**

**Example 18: Search supports all languages**
The Algolia configuration should be set up to index all configured locales
**Validates: Requirements 9.5**

**Example 19: Sidebar navigation exists**
A sidebars.js file should exist with hierarchical structure for all documentation sections
**Validates: Requirements 10.1**

**Example 20: Breadcrumbs enabled**
The theme configuration should enable breadcrumb navigation (default Docusaurus behavior)
**Validates: Requirements 10.2**

**Example 21: Table of contents enabled**
The docs plugin configuration should enable table of contents for pages (default behavior)
**Validates: Requirements 10.5**

**Example 22: Custom styling exists**
A custom.css file should exist with TLÁO brand color variables defined
**Validates: Requirements 11.2**

**Example 23: Logo in header**
The navbar configuration should include a logo object with src and alt properties
**Validates: Requirements 11.5**

**Example 24: Version configuration exists**
The docs preset should include versions configuration
**Validates: Requirements 12.1**

**Example 25: Version selector in navigation**
The navbar should include an item with type: 'docsVersionDropdown'
**Validates: Requirements 12.2, 12.4**

**Example 26: Multiple versions maintained**
The versioned_docs directory should contain at least 3 version subdirectories
**Validates: Requirements 12.5**

## Error Handling

### Build-Time Errors

1. **Broken Internal Links**: Docusaurus validates all internal links during build. If a link points to a non-existent page, the build fails with a clear error message indicating the source file and broken link.

2. **Invalid MDX Syntax**: If MDX files contain syntax errors, the build fails with the file path, line number, and error description.

3. **Missing Required Configuration**: If required configuration fields are missing from docusaurus.config.js, the build fails with a validation error.

4. **Invalid JSON Schemas**: JSON schema files are validated during build. Invalid schemas cause build failure with validation errors.

5. **Missing Translation Files**: If a translation is referenced but the file doesn't exist, log a warning but continue the build (graceful degradation).

### Runtime Errors

1. **404 Not Found**: Display a custom 404 page with:
   - Search functionality to find the intended page
   - Links to main documentation sections
   - Suggestion to check the URL or use the navigation

2. **Search Service Unavailable**: If Algolia search fails:
   - Display an error message: "Search is temporarily unavailable"
   - Provide alternative navigation options
   - Log the error for monitoring

3. **Missing Assets**: If an image or diagram fails to load:
   - Display a placeholder with alt text
   - Log the missing asset for investigation
   - Don't break page rendering

4. **Locale Loading Failure**: If a translation file fails to load:
   - Fall back to English version
   - Display a notice: "Showing English version"
   - Log the error

### System Change Detector Errors

1. **Missing Checksum File**: On first run, if .docs-checksums.json doesn't exist:
   - Generate initial checksums for all monitored components
   - Create the checksum file
   - Exit with success (no changes to report)

2. **Invalid Configuration**: If docs-sync-config.json is malformed:
   - Fail with clear error message
   - Indicate which field is invalid
   - Provide example of correct format

3. **Component File Not Found**: If a configured component path doesn't exist:
   - Log a warning with the missing path
   - Continue processing other components
   - Include warning in the report

4. **Git Command Failure**: If git commands fail (e.g., not in a git repo):
   - Fall back to file system timestamps
   - Log a warning about degraded functionality
   - Continue with available information

5. **Permission Errors**: If unable to read/write checksum file:
   - Fail with clear error message
   - Indicate the file path and required permissions
   - Suggest resolution steps

## Testing Strategy

The documentation site will be validated through a combination of unit tests, integration tests, and property-based tests. Testing will focus on verifiable aspects of the site structure, configuration, and automated tooling.

### Unit Testing

Unit tests will verify specific examples and configuration:

- **Configuration Validation**: Test that docusaurus.config.js contains all required fields
- **File Existence**: Test that all required documentation files exist
- **JSON Schema Validation**: Test that schema files are valid JSON Schema Draft 7
- **Sidebar Structure**: Test that sidebars.js has correct structure
- **Component Rendering**: Test that custom React components render without errors

**Testing Framework**: Jest with React Testing Library for component tests

**Example Unit Test**:
```typescript
describe('Docusaurus Configuration', () => {
  it('should specify correct domain', () => {
    const config = require('./docusaurus.config.js');
    expect(config.url).toBe('https://docs.tláo.com');
  });

  it('should include all required locales', () => {
    const config = require('./docusaurus.config.js');
    expect(config.i18n.locales).toEqual(['en', 'es', 'pt']);
    expect(config.i18n.defaultLocale).toBe('en');
  });
});
```

### Property-Based Testing

Property-based tests will verify universal properties across the documentation:

- **Build Output Validation**: For any successful build, verify HTML files exist
- **Cross-Linking**: For any architecture/agent page, verify proper cross-links
- **System Change Detection**: For any component change, verify correct doc mapping

**Testing Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run minimum 100 iterations

**Example Property Test**:
```typescript
import fc from 'fast-check';

describe('Documentation Cross-Linking', () => {
  it('architecture pages link to related layers', () => {
    // Feature: docusaurus-docs-site, Property 3: Architecture pages cross-link to related layers
    fc.assert(
      fc.property(
        fc.constantFrom('layer-0', 'layer-1', 'layer-2', 'layer-3', 'layer-4', 'layer-5'),
        (layerFile) => {
          const content = fs.readFileSync(`docs/architecture/${layerFile}-*.md`, 'utf-8');
          const links = extractMarkdownLinks(content);
          const layerLinks = links.filter(link => link.includes('architecture/layer-'));
          return layerLinks.length >= 2;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests will verify the build process and system change detector:

- **Full Build Test**: Run `docusaurus build` and verify output structure
- **Multi-Language Build**: Verify all locales build successfully
- **Change Detector Integration**: Test the full change detection workflow

**Example Integration Test**:
```typescript
describe('Build Process', () => {
  it('should generate HTML for all documentation pages', async () => {
    await execAsync('pnpm build');
    const buildDir = 'build';
    const htmlFiles = glob.sync(`${buildDir}/**/*.html`);
    
    // Should have HTML for intro, concepts, architecture, agents, implementation
    expect(htmlFiles.length).toBeGreaterThan(15);
    
    // Should have index.html
    expect(fs.existsSync(`${buildDir}/index.html`)).toBe(true);
  });
});
```

### System Change Detector Testing

Dedicated tests for the change detection system:

- **Checksum Calculation**: Verify checksums are calculated correctly
- **Change Detection**: Verify changed files are identified
- **Mapping Lookup**: Verify correct docs are identified for changed components
- **Report Generation**: Verify report structure and content

**Example Test**:
```typescript
describe('System Change Detector', () => {
  it('should identify outdated docs when component changes', async () => {
    // Feature: docusaurus-docs-site, Property 6: Change detector maps components to documentation
    const config = {
      componentPaths: ['test/fixtures/components'],
      docsMappings: {
        'test/fixtures/components/intake.ts': ['docs/architecture/layer-1-intake.md']
      },
      checksumFile: 'test/fixtures/.checksums.json'
    };

    // Modify component
    fs.writeFileSync('test/fixtures/components/intake.ts', '// modified');

    const report = await detectChanges(config);
    
    expect(report.changedComponents).toHaveLength(1);
    expect(report.outdatedDocs).toContain('docs/architecture/layer-1-intake.md');
  });
});
```

### Manual Testing Checklist

Some aspects require manual verification:

- [ ] Visual design matches TLÁO branding
- [ ] Content is accurate and well-written
- [ ] Navigation is intuitive
- [ ] Search returns relevant results
- [ ] Mobile responsiveness works well
- [ ] All languages display correctly
- [ ] Version switching works smoothly
- [ ] HTTPS works on deployed site
- [ ] IDN domain (tláo.com) resolves correctly

### Continuous Integration

The CI/CD pipeline should run:

1. **Lint**: ESLint and Prettier checks
2. **Type Check**: TypeScript compilation
3. **Unit Tests**: All Jest tests
4. **Property Tests**: All fast-check tests
5. **Build Test**: Full Docusaurus build
6. **Change Detection**: Run system change detector
7. **Deploy**: Deploy to Vercel (on main branch)

**CI Configuration** (.github/workflows/docs.yml):
```yaml
name: Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm --filter docs lint
      - run: pnpm --filter docs type-check
      - run: pnpm --filter docs test
      - run: pnpm --filter docs build
      - run: pnpm --filter docs check-sync
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/docs
```

### Test Coverage Goals

- **Configuration Files**: 100% coverage (all fields validated)
- **System Change Detector**: 90%+ coverage
- **Custom React Components**: 80%+ coverage
- **Build Scripts**: 80%+ coverage

The combination of unit tests, property-based tests, and integration tests ensures that the documentation site is correctly configured, properly structured, and stays synchronized with the codebase.
