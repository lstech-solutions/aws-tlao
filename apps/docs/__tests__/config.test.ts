import * as fs from 'fs'
import * as path from 'path'

describe('Docusaurus Configuration', () => {
  describe('package.json', () => {
    it('should include required Docusaurus dependencies', () => {
      const packageJsonPath = path.join(__dirname, '..', 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      // Check for required Docusaurus dependencies
      expect(packageJson.dependencies).toHaveProperty('@docusaurus/core')
      expect(packageJson.dependencies).toHaveProperty('@docusaurus/preset-classic')
      expect(packageJson.dependencies).toHaveProperty('react')
      expect(packageJson.dependencies).toHaveProperty('react-dom')
    })

    it('should have Docusaurus version >= 3.0.0', () => {
      const packageJsonPath = path.join(__dirname, '..', 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      const docusaurusVersion = packageJson.dependencies['@docusaurus/core']
      // Extract version number (handle ^ and ~ prefixes)
      const versionMatch = docusaurusVersion.match(/[\d.]+/)
      expect(versionMatch).not.toBeNull()

      if (versionMatch) {
        const [major] = versionMatch[0].split('.').map(Number)
        expect(major).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe('docusaurus.config.ts', () => {
    it('should set url to https://docs.tláo.com', async () => {
      // Import the config dynamically
      const configPath = path.join(__dirname, '..', 'docusaurus.config.ts')

      // Read the file content
      const configContent = fs.readFileSync(configPath, 'utf-8')

      // Check if the URL is set correctly
      expect(configContent).toContain("url: process.env.SITE_URL || 'https://docs.tláo.com'")
    })

    it('should have TLÁO title and tagline', async () => {
      const configPath = path.join(__dirname, '..', 'docusaurus.config.ts')
      const configContent = fs.readFileSync(configPath, 'utf-8')

      expect(configContent).toContain("title: 'TLÁO Documentation'")
      expect(configContent).toContain("tagline: 'Tactical Layer for Action & Outcomes'")
    })

    it('should have routeBasePath set to root', async () => {
      const configPath = path.join(__dirname, '..', 'docusaurus.config.ts')
      const configContent = fs.readFileSync(configPath, 'utf-8')

      expect(configContent).toContain("routeBasePath: '/'")
    })

    it('should include logo configuration in navbar', async () => {
      const configPath = path.join(__dirname, '..', 'docusaurus.config.ts')
      const configContent = fs.readFileSync(configPath, 'utf-8')

      // Check for logo configuration
      expect(configContent).toContain('logo: {')
      expect(configContent).toContain("alt: 'TLÁO Logo'")
      expect(configContent).toContain("src: 'img/logo.svg'")
    })

    it('should have navbar title set to TLÁO', async () => {
      const configPath = path.join(__dirname, '..', 'docusaurus.config.ts')
      const configContent = fs.readFileSync(configPath, 'utf-8')

      expect(configContent).toContain("title: 'TLÁO'")
    })
  })

  describe('custom.css', () => {
    it('should contain TLÁO brand color variables', () => {
      const cssPath = path.join(__dirname, '..', 'src', 'css', 'custom.css')
      const cssContent = fs.readFileSync(cssPath, 'utf-8')

      // Check for primary brand colors (blue theme)
      expect(cssContent).toContain('--ifm-color-primary: #2563eb')
      expect(cssContent).toContain('--ifm-color-primary-dark: #1d4ed8')
      expect(cssContent).toContain('--ifm-color-primary-light: #3b82f6')

      // Check for secondary accent color (purple)
      expect(cssContent).toContain('--tlao-color-secondary: #7c3aed')
    })

    it('should contain dark mode color variables', () => {
      const cssPath = path.join(__dirname, '..', 'src', 'css', 'custom.css')
      const cssContent = fs.readFileSync(cssPath, 'utf-8')

      // Check for dark mode section
      expect(cssContent).toContain("[data-theme='dark']")

      // Check for dark mode primary colors
      expect(cssContent).toContain('--ifm-color-primary: #60a5fa')
    })

    it('should contain TLÁO custom utility classes', () => {
      const cssPath = path.join(__dirname, '..', 'src', 'css', 'custom.css')
      const cssContent = fs.readFileSync(cssPath, 'utf-8')

      // Check for custom TLÁO classes
      expect(cssContent).toContain('.tlao-gradient-text')
      expect(cssContent).toContain('.tlao-layer-badge')
    })
  })

  describe('logo', () => {
    it('should have TLÁO logo file in static/img directory', () => {
      const logoPath = path.join(__dirname, '..', 'static', 'img', 'logo.svg')
      expect(fs.existsSync(logoPath)).toBe(true)
    })

    it('should have valid SVG logo', () => {
      const logoPath = path.join(__dirname, '..', 'static', 'img', 'logo.svg')
      const logoContent = fs.readFileSync(logoPath, 'utf-8')

      // Check for SVG structure
      expect(logoContent).toContain('<svg')
      expect(logoContent).toContain('</svg>')

      // Check for TLÁO branding elements
      expect(logoContent).toContain('TLÁO')
    })
  })
})
