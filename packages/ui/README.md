# @tlao/ui

Shared UI components for the TLÁO platform. This package provides reusable components that work across the landing page, documentation, and future applications.

## Features

- **AppProvider** - Context for managing app type and base path
- **Shared Footer** - Responsive footer with intelligent link routing
- **Router Utilities** - Cross-app navigation helpers

## Installation

The package is already included in the monorepo workspaces.

## Usage

### Setup AppProvider

Wrap your app with `AppProvider` in the root layout:

```tsx
import { AppProvider } from '@tlao/ui'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProvider appType="landing" basePath={process.env.NEXT_PUBLIC_BASE_PATH || ''}>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
```

### Use Shared Footer

```tsx
import { Footer } from '@tlao/ui'

export default function Page() {
  return (
    <>
      <main>Content</main>
      <Footer version="v1.3.15" />
    </>
  )
}
```

### Custom Links

Add custom links to the footer:

```tsx
<Footer
  version="v1.3.15"
  customLinks={[
    { label: 'Blog', href: '/blog', external: false },
    { label: 'Status', href: 'https://status.example.com', external: true },
  ]}
/>
```

### Router Utilities

```tsx
import { createInternalLink, getBasePath } from '@tlao/ui'

// Create a link to another app
const docsLink = createInternalLink('/guide', 'docs', {
  appType: 'landing',
  basePath: '/',
})

// Get current app's base path
const basePath = getBasePath('landing') // ''
```

## App Types

- `landing` - Main landing page
- `docs` - Documentation site
- `app` - Future application

## Environment Variables

- `NEXT_PUBLIC_LANDING_BASE_PATH` - Landing app base path (default: root `/`)
- `NEXT_PUBLIC_DOCS_BASE_PATH` - Docs app base path (default: `/documentation`)
- `NEXT_PUBLIC_APP_BASE_PATH` - App base path (default: `/app`)
