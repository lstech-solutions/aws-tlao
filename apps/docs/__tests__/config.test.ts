import { describe, it, expect } from '@jest/globals'
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
      expect(configContent).toContain("url: 'https://docs.tláo.com'")
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
  })
})
