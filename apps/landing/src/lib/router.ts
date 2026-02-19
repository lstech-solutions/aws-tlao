/**
 * Router utility for handling base path in dev and production
 * - Dev (localhost): no base path
 * - Prod (GitHub Pages): /aws-tlao base path
 */

export const getBasePath = (): string => {
  return process.env.NEXT_PUBLIC_BASE_PATH || ''
}

export const createPath = (path: string): string => {
  const basePath = getBasePath()
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${basePath}${normalizedPath}`
}

export const createHref = (path: string): string => {
  return createPath(path)
}
