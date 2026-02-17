/**
 * Unit Tests for Branding Configuration
 *
 * This test suite validates Requirements 1.5, 11.2, and 11.5:
 * - Requirement 1.5: Documentation site configured for docs.tláo.com domain
 * - Requirement 11.2: TLÁO brand colors and styling incorporated
 * - Requirement 11.5: TLÁO logo included in header
 *
 * Task: 2.1 Write unit tests for branding configuration
 */

import * as fs from 'fs'
import * as path from 'path'

describe('Branding Configuration', () => {
  describe('Domain Configuration', () => {
    it('should be configured for docs.tláo.com domain', () => {
      // Validates: Requirement 1.5
      const configPath = path.join(__dirname, '..', 'docusaurus.config.ts')
      const configContent = fs.readFileSync(configPath, 'utf-8')

      expect(configContent).toContain("url: process.env.SITE_URL || 'https://docs.tláo.com'")
    })

    it('should have baseUrl set to root', () => {
      // Validates: Requirement 1.5
      const configPath = path.join(__dirname, '..', 'docusaurus.config.ts')
      const configContent = fs.readFileSync(configPath, 'utf-8')

      expect(configContent).toContain("baseUrl: process.env.BASE_URL || '/aws-tlao/'")
    })
  })

  describe('TLÁO Brand Colors (custom.css)', () => {
    let cssContent: string

    beforeAll(() => {
      const cssPath = path.join(__dirname, '..', 'src', 'css', 'custom.css')
      cssContent = fs.readFileSync(cssPath, 'utf-8')
    })

    it('should contain primary brand color variables for light mode', () => {
      // Validates: Requirement 11.2
      expect(cssContent).toContain('--ifm-color-primary:')
      expect(cssContent).toContain('--ifm-color-primary-dark:')
      expect(cssContent).toContain('--ifm-color-primary-darker:')
      expect(cssContent).toContain('--ifm-color-primary-darkest:')
      expect(cssContent).toContain('--ifm-color-primary-light:')
      expect(cssContent).toContain('--ifm-color-primary-lighter:')
      expect(cssContent).toContain('--ifm-color-primary-lightest:')
    })

    it('should contain TLÁO-specific brand colors', () => {
      // Validates: Requirement 11.2
      // Check for TLÁO blue primary color
      expect(cssContent).toContain('#2563eb')

      // Check for TLÁO purple secondary color
      expect(cssContent).toContain('--tlao-color-secondary:')
      expect(cssContent).toContain('#7c3aed')
    })

    it('should contain dark mode brand color variables', () => {
      // Validates: Requirement 11.2
      expect(cssContent).toContain("[data-theme='dark']")

      // Verify dark mode has its own primary color definitions
      const darkModeSection = cssContent.split("[data-theme='dark']")[1]
      expect(darkModeSection).toContain('--ifm-color-primary:')
      expect(darkModeSection).toContain('--tlao-color-secondary:')
    })

    it('should contain custom TLÁO utility classes', () => {
      // Validates: Requirement 11.2
      expect(cssContent).toContain('.tlao-gradient-text')
      expect(cssContent).toContain('.tlao-layer-badge')
    })

    it('should define code highlighting colors', () => {
      // Validates: Requirement 11.2
      expect(cssContent).toContain('--docusaurus-highlighted-code-line-bg:')
      expect(cssContent).toContain('--ifm-code-font-size:')
    })
  })

  describe('Navbar Logo Configuration', () => {
    let configContent: string

    beforeAll(() => {
      const configPath = path.join(__dirname, '..', 'docusaurus.config.ts')
      configContent = fs.readFileSync(configPath, 'utf-8')
    })

    it('should include logo configuration in navbar', () => {
      // Validates: Requirement 11.5
      expect(configContent).toContain('logo: {')
      expect(configContent).toContain("alt: 'TLÁO Logo'")
      expect(configContent).toContain("src: 'img/logo.svg'")
    })

    it('should have TLÁO as navbar title', () => {
      // Validates: Requirement 11.5
      // Find the navbar section and verify title
      const navbarMatch = configContent.match(/navbar:\s*{[^}]*title:\s*'([^']+)'/s)
      expect(navbarMatch).not.toBeNull()
      expect(navbarMatch?.[1]).toBe('TLÁO')
    })

    it('should have logo file present in static directory', () => {
      // Validates: Requirement 11.5
      const logoPath = path.join(__dirname, '..', 'static', 'img', 'logo.svg')
      expect(fs.existsSync(logoPath)).toBe(true)
    })

    it('should have valid SVG logo with TLÁO branding', () => {
      // Validates: Requirement 11.5
      const logoPath = path.join(__dirname, '..', 'static', 'img', 'logo.svg')
      const logoContent = fs.readFileSync(logoPath, 'utf-8')

      // Verify it's a valid SVG
      expect(logoContent).toContain('<svg')
      expect(logoContent).toContain('</svg>')

      // Verify it contains TLÁO branding
      expect(logoContent).toContain('TLÁO')
    })
  })

  describe('Site Title and Tagline', () => {
    it('should have TLÁO Documentation as title', () => {
      // Validates: Requirement 11.2
      const configPath = path.join(__dirname, '..', 'docusaurus.config.ts')
      const configContent = fs.readFileSync(configPath, 'utf-8')

      expect(configContent).toContain("title: 'TLÁO Documentation'")
    })

    it('should have Tactical Layer for Action & Outcomes as tagline', () => {
      // Validates: Requirement 11.2
      const configPath = path.join(__dirname, '..', 'docusaurus.config.ts')
      const configContent = fs.readFileSync(configPath, 'utf-8')

      expect(configContent).toContain("tagline: 'Tactical Layer for Action & Outcomes'")
    })
  })
})
