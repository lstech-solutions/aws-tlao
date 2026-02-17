import * as fs from 'fs'
import * as path from 'path'

describe('Core Concept Documentation', () => {
  const docsPath = path.join(__dirname, '..', 'docs')

  describe('intro.md', () => {
    it('should exist', () => {
      const introPath = path.join(docsPath, 'intro.md')
      expect(fs.existsSync(introPath)).toBe(true)
    })

    it('should contain TLÁO introduction', () => {
      const introPath = path.join(docsPath, 'intro.md')
      const content = fs.readFileSync(introPath, 'utf-8')

      expect(content).toContain('TLÁO')
      expect(content).toContain('Tactical Layer for Action & Outcomes')
    })

    it('should have proper frontmatter with slug', () => {
      const introPath = path.join(docsPath, 'intro.md')
      const content = fs.readFileSync(introPath, 'utf-8')

      expect(content).toContain('---')
      expect(content).toContain('slug: /')
    })
  })

  describe('concepts directory', () => {
    it('should exist', () => {
      const conceptsPath = path.join(docsPath, 'concepts')
      expect(fs.existsSync(conceptsPath)).toBe(true)
      expect(fs.statSync(conceptsPath).isDirectory()).toBe(true)
    })
  })

  describe('why-layer.md', () => {
    it('should exist', () => {
      const filePath = path.join(docsPath, 'concepts', 'why-layer.md')
      expect(fs.existsSync(filePath)).toBe(true)
    })

    it('should explain the Layer concept', () => {
      const filePath = path.join(docsPath, 'concepts', 'why-layer.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).toContain('Layer')
      expect(content).toContain('unstructured')
      expect(content).toContain('execution systems')
    })

    it('should include examples of unstructured inputs', () => {
      const filePath = path.join(docsPath, 'concepts', 'why-layer.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      // Check for at least 3 examples of unstructured inputs
      const unstructuredExamples = ['email', 'pdf', 'note', 'invoice', 'transcript', 'grant']

      const foundExamples = unstructuredExamples.filter((example) =>
        content.toLowerCase().includes(example.toLowerCase())
      )

      expect(foundExamples.length).toBeGreaterThanOrEqual(3)
    })

    it('should include examples of execution systems', () => {
      const filePath = path.join(docsPath, 'concepts', 'why-layer.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      // Check for at least 3 examples of execution systems
      const executionExamples = ['github', 'calendar', 'notion', 'jira', 'budget', 'deployment']

      const foundExamples = executionExamples.filter((example) =>
        content.toLowerCase().includes(example.toLowerCase())
      )

      expect(foundExamples.length).toBeGreaterThanOrEqual(3)
    })

    it('should have proper frontmatter', () => {
      const filePath = path.join(docsPath, 'concepts', 'why-layer.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).toContain('---')
      expect(content).toContain('sidebar_position:')
    })
  })

  describe('why-tactical.md', () => {
    it('should exist', () => {
      const filePath = path.join(docsPath, 'concepts', 'why-tactical.md')
      expect(fs.existsSync(filePath)).toBe(true)
    })

    it('should explain the Tactical concept', () => {
      const filePath = path.join(docsPath, 'concepts', 'why-tactical.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).toContain('Tactical')
      expect(content.toLowerCase()).toContain('short')
      expect(content.toLowerCase()).toContain('actionable')
    })

    it('should distinguish between strategic, tactical, and operational', () => {
      const filePath = path.join(docsPath, 'concepts', 'why-tactical.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content.toLowerCase()).toContain('strategic')
      expect(content.toLowerCase()).toContain('tactical')
      expect(content.toLowerCase()).toContain('operational')
    })

    it('should include time horizon information', () => {
      const filePath = path.join(docsPath, 'concepts', 'why-tactical.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      // Should mention time-related concepts
      const timeKeywords = ['day', 'week', 'time', 'deadline', 'horizon']

      const foundKeywords = timeKeywords.filter((keyword) =>
        content.toLowerCase().includes(keyword)
      )

      expect(foundKeywords.length).toBeGreaterThanOrEqual(2)
    })

    it('should have proper frontmatter', () => {
      const filePath = path.join(docsPath, 'concepts', 'why-tactical.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).toContain('---')
      expect(content).toContain('sidebar_position:')
    })
  })

  describe('action-outcomes.md', () => {
    it('should exist', () => {
      const filePath = path.join(docsPath, 'concepts', 'action-outcomes.md')
      expect(fs.existsSync(filePath)).toBe(true)
    })

    it('should explain Action & Outcomes', () => {
      const filePath = path.join(docsPath, 'concepts', 'action-outcomes.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).toContain('Action')
      expect(content).toContain('Outcome')
    })

    it('should include action properties', () => {
      const filePath = path.join(docsPath, 'concepts', 'action-outcomes.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      // Check for key action properties
      const actionProperties = ['task', 'owner', 'deadline', 'priority', 'dependencies']

      const foundProperties = actionProperties.filter((prop) =>
        content.toLowerCase().includes(prop.toLowerCase())
      )

      expect(foundProperties.length).toBeGreaterThanOrEqual(4)
    })

    it('should include examples', () => {
      const filePath = path.join(docsPath, 'concepts', 'action-outcomes.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      // Should have code blocks or examples
      expect(content).toContain('```')
      expect(content.toLowerCase()).toContain('example')
    })

    it('should have proper frontmatter', () => {
      const filePath = path.join(docsPath, 'concepts', 'action-outcomes.md')
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).toContain('---')
      expect(content).toContain('sidebar_position:')
    })
  })

  describe('cross-linking', () => {
    it('intro.md should link to concept pages', () => {
      const introPath = path.join(docsPath, 'intro.md')
      const content = fs.readFileSync(introPath, 'utf-8')

      expect(content).toContain('concepts/why-layer')
      expect(content).toContain('concepts/why-tactical')
      expect(content).toContain('concepts/action-outcomes')
    })

    it('concept pages should cross-link to each other', () => {
      const whyLayerPath = path.join(docsPath, 'concepts', 'why-layer.md')
      const whyLayerContent = fs.readFileSync(whyLayerPath, 'utf-8')

      // why-layer should link to other concepts
      expect(
        whyLayerContent.includes('why-tactical') || whyLayerContent.includes('action-outcomes')
      ).toBe(true)
    })
  })
})
