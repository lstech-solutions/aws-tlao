import type { AppType } from '../context/AppContext'

/**
 * Router utility for handling navigation across different apps
 * Handles internal links (landing, docs, app) and external links
 */

export interface LinkConfig {
  appType: AppType
  basePath: string
}

/**
 * Create an internal link that works across apps
 * @param path - The path to navigate to
 * @param targetApp - The target app (defaults to current app)
 */
export function createInternalLink(path: string, targetApp: AppType): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  // Map app types to their base paths
  const appBasePaths: Record<AppType, string> = {
    landing: process.env.NEXT_PUBLIC_LANDING_BASE_PATH || '/aws-tlao',
    docs: process.env.NEXT_PUBLIC_DOCS_BASE_PATH || '/aws-tlao/documentation',
    app: process.env.NEXT_PUBLIC_APP_BASE_PATH || '/app',
  }

  const targetBasePath = appBasePaths[targetApp]
  return `${targetBasePath}${normalizedPath}`
}

/**
 * Create a link for the current app
 */
export function createLink(path: string, appType: AppType): string {
  return createInternalLink(path, appType)
}

/**
 * Get the app's base path
 */
export function getBasePath(appType: AppType): string {
  const appBasePaths: Record<AppType, string> = {
    landing: process.env.NEXT_PUBLIC_LANDING_BASE_PATH || '/aws-tlao',
    docs: process.env.NEXT_PUBLIC_DOCS_BASE_PATH || '/aws-tlao/documentation',
    app: process.env.NEXT_PUBLIC_APP_BASE_PATH || '/app',
  }

  return appBasePaths[appType]
}
