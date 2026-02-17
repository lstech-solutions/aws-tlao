/**
 * Unit Tests for Custom Agents Documentation
 *
 * This test suite validates Requirements 1.1, 1.2, 1.3:
 * - Requirement 1.1: Documentation site includes page explaining custom agents
 * - Requirement 1.2: Documentation presents definition of custom agents
 * - Requirement 1.3: Documentation lists key benefits of custom agents
 *
 * Task: 3.2 Write unit tests for introduction page
 */

import * as fs from 'fs'
import * as path from 'path'

describe('Custom Agents Documentation', () => {
  const docsPath = path.join(__dirname, '..', 'docs')
  const customAgentsPath = path.join(docsPath, 'custom-agents')

  describe('introduction.md', () => {
    let introContent: string

    beforeAll(() => {
      const introPath = path.join(customAgentsPath, 'introduction.md')
      introContent = fs.readFileSync(introPath, 'utf-8')
    })

    it('should exist at correct path', () => {
      // Validates: Requirement 1.1
      const introPath = path.join(customAgentsPath, 'introduction.md')
      expect(fs.existsSync(introPath)).toBe(true)
    })

    it('should have valid frontmatter with sidebar_position', () => {
      // Validates: Requirement 1.1
      expect(introContent).toContain('---')
      expect(introContent).toContain('sidebar_position:')

      // Extract frontmatter and verify it's valid YAML
      const frontmatterMatch = introContent.match(/^---\n([\s\S]*?)\n---/)
      expect(frontmatterMatch).not.toBeNull()

      // Verify sidebar_position is set to 1 (first page)
      expect(introContent).toContain('sidebar_position: 1')
    })

    it('should contain custom agents definition', () => {
      // Validates: Requirement 1.2
      expect(introContent).toContain('Custom agents')
      expect(introContent).toContain('What are Custom Agents?')

      // Should explain that custom agents are specialized configurations
      expect(introContent.toLowerCase()).toContain('specialized')
      expect(introContent.toLowerCase()).toContain('configuration')
    })

    it('should mention all five key benefits', () => {
      // Validates: Requirement 1.3
      const benefits = [
        'Workflow Optimization',
        'Reduced Interruptions',
        'Enhanced Context',
        'Team Collaboration',
        'Security Control',
      ]

      benefits.forEach((benefit) => {
        expect(introContent).toContain(benefit)
      })
    })

    it('should explain workflow optimization benefit', () => {
      // Validates: Requirement 1.3
      expect(introContent).toContain('Workflow Optimization')
      expect(introContent.toLowerCase()).toContain('specific tasks')
    })

    it('should explain reduced interruptions benefit', () => {
      // Validates: Requirement 1.3
      expect(introContent).toContain('Reduced Interruptions')
      expect(introContent.toLowerCase()).toContain('confirmation')
    })

    it('should explain enhanced context benefit', () => {
      // Validates: Requirement 1.3
      expect(introContent).toContain('Enhanced Context')
      expect(introContent.toLowerCase()).toContain('system prompt')
    })

    it('should explain team collaboration benefit', () => {
      // Validates: Requirement 1.3
      expect(introContent).toContain('Team Collaboration')
      expect(introContent.toLowerCase()).toContain('shared')
    })

    it('should explain security control benefit', () => {
      // Validates: Requirement 1.3
      expect(introContent).toContain('Security Control')
      expect(introContent.toLowerCase()).toContain('permissions')
    })

    it('should explain relationship to Kiro CLI', () => {
      // Validates: Requirement 1.4
      expect(introContent).toContain('Kiro CLI')
      expect(introContent).toContain('--mode')
    })

    it('should include when to use custom agents section', () => {
      // Validates: Requirement 1.1
      expect(introContent).toContain('When to Use Custom Agents')
    })

    it('should include next steps section with links', () => {
      // Validates: Requirement 1.1
      expect(introContent).toContain('Next Steps')
      expect(introContent).toContain('getting-started')
      expect(introContent).toContain('configuration')
      expect(introContent).toContain('tool-access')
      expect(introContent).toContain('examples')
    })
  })

  describe('getting-started.md', () => {
    let gettingStartedContent: string

    beforeAll(() => {
      const gettingStartedPath = path.join(customAgentsPath, 'getting-started.md')
      gettingStartedContent = fs.readFileSync(gettingStartedPath, 'utf-8')
    })

    it('should exist at correct path', () => {
      // Validates: Requirement 3.1
      const gettingStartedPath = path.join(customAgentsPath, 'getting-started.md')
      expect(fs.existsSync(gettingStartedPath)).toBe(true)
    })

    it('should have valid frontmatter with sidebar_position', () => {
      // Validates: Requirement 3.1
      expect(gettingStartedContent).toContain('---')
      expect(gettingStartedContent).toContain('sidebar_position:')

      // Extract frontmatter and verify it's valid YAML
      const frontmatterMatch = gettingStartedContent.match(/^---\n([\s\S]*?)\n---/)
      expect(frontmatterMatch).not.toBeNull()

      // Verify sidebar_position is set to 2 (second page)
      expect(gettingStartedContent).toContain('sidebar_position: 2')
    })

    it('should contain prerequisites section', () => {
      // Validates: Requirement 3.1
      expect(gettingStartedContent).toContain('Prerequisites')
      expect(gettingStartedContent).toContain('Kiro CLI')
    })

    it('should contain step-by-step instructions', () => {
      // Validates: Requirement 3.1
      expect(gettingStartedContent).toContain('Step 1:')
      expect(gettingStartedContent).toContain('Step 2:')
      expect(gettingStartedContent).toContain('Step 3:')

      // Should have multiple steps for creating an agent
      expect(gettingStartedContent).toContain('Create the Agents Directory')
      expect(gettingStartedContent).toContain('Create a Configuration File')
      expect(gettingStartedContent).toContain('Define the Basic Configuration')
    })

    it('should contain code examples', () => {
      // Validates: Requirement 3.4
      // Should have bash code blocks
      expect(gettingStartedContent).toContain('```bash')

      // Should have JSON configuration example
      expect(gettingStartedContent).toContain('```json')

      // Should show how to create agents directory
      expect(gettingStartedContent).toContain('mkdir -p ~/.kiro/agents')

      // Should show basic configuration structure
      expect(gettingStartedContent).toContain('"name":')
      expect(gettingStartedContent).toContain('"description":')
      expect(gettingStartedContent).toContain('"prompt":')
    })

    it('should explain how to run custom agent', () => {
      // Validates: Requirement 3.1
      expect(gettingStartedContent).toContain('Running Your Custom Agent')
      expect(gettingStartedContent).toContain('kiro chat')
      expect(gettingStartedContent).toContain('--mode')
    })

    it('should include verification steps', () => {
      // Validates: Requirement 3.1
      expect(gettingStartedContent).toContain('Verifying Your Agent Works')
      expect(gettingStartedContent).toContain('Test')
    })

    it('should include troubleshooting section', () => {
      // Validates: Requirement 3.1
      expect(gettingStartedContent).toContain('Troubleshooting')
      expect(gettingStartedContent).toContain('Problem')
      expect(gettingStartedContent).toContain('Solutions')
    })

    it('should include next steps section with links', () => {
      // Validates: Requirement 3.1
      expect(gettingStartedContent).toContain('Next Steps')
      expect(gettingStartedContent).toContain('configuration')
      expect(gettingStartedContent).toContain('tool-access')
      expect(gettingStartedContent).toContain('examples')
    })

    it('should explain configuration fields', () => {
      // Validates: Requirement 3.4
      expect(gettingStartedContent).toContain('name')
      expect(gettingStartedContent).toContain('description')
      expect(gettingStartedContent).toContain('prompt')
      expect(gettingStartedContent).toContain('tools')
    })

    it('should provide complete working example', () => {
      // Validates: Requirement 3.4
      // Should have a complete JSON configuration example
      expect(gettingStartedContent).toContain('docs-writer')
      expect(gettingStartedContent).toContain('"tools":')
      expect(gettingStartedContent).toContain('"allowedTools":')
    })
  })

  describe('configuration.md', () => {
    let configContent: string

    beforeAll(() => {
      const configPath = path.join(customAgentsPath, 'configuration.md')
      configContent = fs.readFileSync(configPath, 'utf-8')
    })

    it('should exist at correct path', () => {
      // Validates: Requirement 3.2
      const configPath = path.join(customAgentsPath, 'configuration.md')
      expect(fs.existsSync(configPath)).toBe(true)
    })

    it('should have valid frontmatter with sidebar_position', () => {
      // Validates: Requirement 3.2
      expect(configContent).toContain('---')
      expect(configContent).toContain('sidebar_position:')

      // Extract frontmatter and verify it's valid YAML
      const frontmatterMatch = configContent.match(/^---\n([\s\S]*?)\n---/)
      expect(frontmatterMatch).not.toBeNull()

      // Verify sidebar_position is set to 3 (third page)
      expect(configContent).toContain('sidebar_position: 3')
    })

    it('should document configuration file format', () => {
      // Validates: Requirement 3.2
      expect(configContent).toContain('Configuration File Format')
      expect(configContent).toContain('JSON')
      expect(configContent).toContain('~/.kiro/agents/')
    })

    it('should document file location', () => {
      // Validates: Requirement 3.2
      expect(configContent).toContain('File Location')
      expect(configContent).toContain('~/.kiro/agents/')
      expect(configContent).toContain('.json')
    })

    it('should document basic configuration structure', () => {
      // Validates: Requirement 3.2
      expect(configContent).toContain('Basic Structure')
      expect(configContent).toContain('```json')

      // Should show the basic structure with all fields
      expect(configContent).toContain('"name":')
      expect(configContent).toContain('"description":')
      expect(configContent).toContain('"prompt":')
      expect(configContent).toContain('"tools":')
    })

    it('should document core configuration options', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('Core Configuration Options')

      // Should document name field
      expect(configContent).toContain('### name')
      expect(configContent).toContain('required')

      // Should document description field
      expect(configContent).toContain('### description')

      // Should document prompt field
      expect(configContent).toContain('### prompt')
    })

    it('should document tool configuration options', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('Tool Configuration')

      // Should document tools array
      expect(configContent).toContain('### tools')
      expect(configContent).toContain('tool categories')

      // Should list available tool categories
      expect(configContent).toContain('read')
      expect(configContent).toContain('write')
      expect(configContent).toContain('shell')
      expect(configContent).toContain('grep')
      expect(configContent).toContain('glob')
    })

    it('should document allowedTools option', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('### allowedTools')
      expect(configContent).toContain('pre-approved')
      expect(configContent).toContain('without user confirmation')
    })

    it('should document MCP integration', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('MCP Integration')
      expect(configContent).toContain('### mcpServers')
      expect(configContent).toContain('Model Context Protocol')

      // Should explain MCP server structure
      expect(configContent).toContain('command')
      expect(configContent).toContain('args')
      expect(configContent).toContain('env')
    })

    it('should document advanced configuration options', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('Advanced Configuration')

      // Should document model option
      expect(configContent).toContain('### model')

      // Should document other advanced options
      expect(configContent).toContain('### resources')
      expect(configContent).toContain('### hooks')
      expect(configContent).toContain('### includeMcpJson')
    })

    it('should include configuration examples', () => {
      // Validates: Requirement 3.4
      expect(configContent).toContain('Configuration Examples')

      // Should have multiple examples
      expect(configContent).toContain('Example 1:')
      expect(configContent).toContain('Example 2:')
      expect(configContent).toContain('Example 3:')

      // Should have JSON code blocks for examples
      const jsonBlocks = configContent.match(/```json/g)
      expect(jsonBlocks).not.toBeNull()
      expect(jsonBlocks!.length).toBeGreaterThan(5) // Multiple examples with code
    })

    it('should include documentation writer example', () => {
      // Validates: Requirement 3.4
      expect(configContent).toContain('Documentation Writer')
      expect(configContent).toContain('docs-writer')

      // Should have complete configuration
      expect(configContent).toContain('"name": "docs-writer"')
      expect(configContent).toContain('"description":')
      expect(configContent).toContain('"prompt":')
    })

    it('should include code review agent example', () => {
      // Validates: Requirement 3.4
      expect(configContent).toContain('Code Review Agent')
      expect(configContent).toContain('code-reviewer')

      // Should have complete configuration
      expect(configContent).toContain('"name": "code-reviewer"')
    })

    it('should include minimal configuration example', () => {
      // Validates: Requirement 3.4
      expect(configContent).toContain('Minimal Configuration')
      expect(configContent).toContain('simple')

      // Should show simplest possible config
      expect(configContent).toContain('"name":')
      expect(configContent).toContain('"description":')
    })

    it('should include pre-approved tools example', () => {
      // Validates: Requirement 3.4
      expect(configContent).toContain('Pre-Approved Tools')
      expect(configContent).toContain('"allowedTools":')

      // Should show specific tools being pre-approved
      expect(configContent).toContain('readFile')
      expect(configContent).toContain('readMultipleFiles')
    })

    it('should include MCP integration example', () => {
      // Validates: Requirement 3.4
      expect(configContent).toContain('Database Agent with MCP')
      expect(configContent).toContain('"mcpServers":')

      // Should show complete MCP server configuration
      expect(configContent).toContain('"command":')
      expect(configContent).toContain('"args":')
      expect(configContent).toContain('"env":')
    })

    it('should document configuration validation', () => {
      // Validates: Requirement 3.2
      expect(configContent).toContain('Configuration Validation')
      expect(configContent).toContain('Validating Your Configuration')

      // Should provide validation commands
      expect(configContent).toContain('jq')
    })

    it('should document common configuration errors', () => {
      // Validates: Requirement 3.2
      expect(configContent).toContain('Common Configuration Errors')

      // Should list common mistakes
      expect(configContent).toContain('Invalid JSON')
      expect(configContent).toContain('Missing Required Fields')
    })

    it('should include troubleshooting section', () => {
      // Validates: Requirement 3.2
      expect(configContent).toContain('Troubleshooting')

      // Should provide solutions for common issues
      expect(configContent).toContain('Agent Not Found')
      expect(configContent).toContain('Tool Access Errors')
    })

    it('should include next steps section with links', () => {
      // Validates: Requirement 3.2
      expect(configContent).toContain('Next Steps')
      expect(configContent).toContain('tool-access')
      expect(configContent).toContain('examples')
    })

    it('should explain usage of configured agents', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('Usage')
      expect(configContent).toContain('kiro chat')
      expect(configContent).toContain('--mode')
    })

    it('should provide best practices for configuration', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('Best Practices')

      // Should have multiple best practice sections
      const bestPracticesCount = (configContent.match(/Best Practices/gi) || []).length
      expect(bestPracticesCount).toBeGreaterThan(1)
    })

    it('should explain security considerations', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('Security Considerations')
      expect(configContent).toContain('pre-approve')
      expect(configContent).toContain('trust')
    })

    it('should document when to use pre-approval', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('When to Use Pre-Approval')
      expect(configContent).toContain('Automating')
      expect(configContent).toContain('Reducing interruptions')
    })

    it('should explain tool categories', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('Available Tool Categories')

      // Should explain what each category does
      expect(configContent).toContain('File reading operations')
      expect(configContent).toContain('File writing and editing')
      expect(configContent).toContain('Shell command execution')
    })

    it('should explain MCP tool formats', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('MCP Tool Formats')
      expect(configContent).toContain('@server_name/tool_name')
      expect(configContent).toContain('@server_name')
    })

    it('should have proper code syntax highlighting', () => {
      // Validates: Requirement 3.4
      // All code blocks should have language specifiers
      const codeBlocks = configContent.match(/```(\w+)/g)
      expect(codeBlocks).not.toBeNull()
      expect(codeBlocks!.length).toBeGreaterThan(10)

      // Should have json, bash code blocks
      expect(configContent).toContain('```json')
      expect(configContent).toContain('```bash')
    })

    it('should explain configuration rules', () => {
      // Validates: Requirement 3.3
      expect(configContent).toContain('Rules')

      // Should provide clear rules for configuration
      expect(configContent).toContain('Must be unique')
      expect(configContent).toContain('kebab-case')
    })
  })
})
