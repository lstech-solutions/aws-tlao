# Implementation Plan: Kiro Custom Agents Documentation

## Overview

This implementation plan breaks down the creation of custom agents documentation into discrete tasks. Each task focuses on creating specific documentation files with complete content, following Docusaurus conventions and the existing documentation style. The tasks are organized to build incrementally, starting with the directory structure and category configuration, then creating each documentation page, and finally adding comprehensive tests.

## Tasks

- [x] 1. Create and test a custom agent using Kiro CLI
  - Research Kiro CLI custom agent creation commands and configuration format
  - Create a sample custom agent configuration file (e.g., `.kiro/agents/docs-writer.json`)
  - Configure the agent with appropriate tool access and pre-approval settings
  - Test the custom agent by running it with sample tasks
  - Document the actual configuration format and CLI commands used
  - Verify the agent works as expected before documenting
  - _Requirements: 3.1, 3.2, 4.1_

- [x] 2. Set up custom agents documentation structure
  - Create the `apps/docs/docs/custom-agents/` directory
  - Create `_category_.json` with proper metadata (label: "Custom Agents", position: 3)
  - Verify directory structure matches design specification
  - _Requirements: 6.1, 7.1_

- [ ] 3. Create introduction page
  - [x] 3.1 Write `introduction.md` with frontmatter and content
    - Add frontmatter with `sidebar_position: 1`
    - Write "What are Custom Agents?" section with definition
    - Write "Why Use Custom Agents?" section
    - List all five key benefits (workflow optimization, reduced interruptions, enhanced context, team collaboration, security control)
    - Explain relationship to Kiro CLI
    - Add "When to Use Custom Agents" section
    - Include "Next Steps" links to other pages
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 3.2 Write unit tests for introduction page
    - Test file exists at correct path
    - Test frontmatter is valid and contains sidebar_position
    - Test all five benefits are mentioned
    - Test custom agents definition is present
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4. Create getting started page
  - [x] 4.1 Write `getting-started.md` with step-by-step guide
    - Add frontmatter with `sidebar_position: 2`
    - Write prerequisites section
    - Write step-by-step instructions for creating first custom agent
    - Include basic configuration structure example with code block
    - Add section on running Kiro with custom agent
    - Add verification steps
    - Include troubleshooting section for common issues
    - Add "Next Steps" links
    - _Requirements: 3.1, 3.4_
  - [x] 4.2 Write unit tests for getting started page
    - Test file exists and has valid frontmatter
    - Test step-by-step instructions are present
    - Test code examples exist
    - _Requirements: 3.1_

- [ ] 5. Create configuration reference page
  - [x] 5.1 Write `configuration.md` with comprehensive reference
    - Add frontmatter with `sidebar_position: 3`
    - Document configuration file format (JSON/YAML)
    - Document configuration file location
    - Document all core configuration options with descriptions
    - Document advanced configuration options
    - Include multiple configuration examples with code blocks
    - Add configuration validation section
    - Add "Next Steps" links
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 5.2 Write unit tests for configuration page
    - Test file exists and has valid frontmatter
    - Test configuration format is documented
    - Test configuration options are documented
    - Test code examples are present
    - _Requirements: 3.2, 3.3_

- [ ] 6. Create tool access control page
  - [x] 6.1 Write `tool-access.md` with security guidance
    - Add frontmatter with `sidebar_position: 4`
    - Write overview of tool access control
    - Document built-in Kiro tools
    - Document MCP (Model Context Protocol) tools integration
    - Write section on configuring tool access (allow, deny, categories)
    - Write comprehensive pre-approval section (what, when, security, configuration)
    - Include tool access configuration examples with code blocks
    - Add security best practices section
    - Add audit and logging information
    - Add "Next Steps" links
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4_
  - [x] 6.2 Write unit tests for tool access page
    - Test file exists and has valid frontmatter
    - Test built-in tools are documented
    - Test MCP integration is documented
    - Test pre-approval feature is explained
    - Test security guidance is present
    - Test code examples exist
    - _Requirements: 2.1, 2.2, 4.1, 4.2, 4.3_

- [-] 7. Create examples page with real-world configurations
  - [~] 7.1 Write `examples.md` with three complete examples
    - Add frontmatter with `sidebar_position: 5`
    - Write introduction explaining the examples
    - Create AWS Infrastructure Agent example:
      - Use case description
      - Complete configuration code block (JSON/YAML)
      - Explanation of key settings
      - Benefits and workflow improvements
    - Create Code Review Agent example:
      - Use case description
      - Complete configuration code block (JSON/YAML)
      - Explanation of key settings
      - Benefits and workflow improvements
    - Create Debugging Agent example:
      - Use case description
      - Complete configuration code block (JSON/YAML)
      - Explanation of key settings
      - Benefits and workflow improvements
    - Add section with additional example ideas
    - Add section on customizing examples
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [~] 7.2 Write unit tests for examples page
    - Test file exists and has valid frontmatter
    - Test AWS infrastructure example exists
    - Test code review example exists
    - Test debugging example exists
    - Test each example has configuration code
    - Test each example has explanatory text
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Update sidebar integration
  - [~] 8.1 Verify sidebar autogeneration includes custom agents
    - Verify `_category_.json` is properly formatted
    - Build Docusaurus site locally to verify sidebar appears
    - Verify custom agents section appears in correct position
    - Verify all pages appear in sidebar in correct order
    - _Requirements: 6.2_
  - [~] 8.2 Write integration test for sidebar
    - Test that building Docusaurus succeeds
    - Test that custom agents section appears in generated sidebar
    - _Requirements: 6.2_

- [~] 9. Checkpoint - Verify documentation builds and renders correctly
  - Build Docusaurus site locally
  - Manually review all custom agents pages
  - Verify navigation works correctly
  - Verify code examples render with syntax highlighting
  - Verify links work correctly
  - Ask the user if questions arise or changes are needed

- [ ] 10. Write property-based tests for documentation quality
  - [~] 10.1 Write property test for example completeness
    - **Property 1: Example Completeness**
    - Parse examples.md and extract all example sections
    - For each example, verify it contains both code block and explanatory text
    - Run minimum 100 iterations
    - **Validates: Requirements 5.4, 5.5**
  - [~] 10.2 Write property test for Docusaurus convention compliance
    - **Property 2: Docusaurus Convention Compliance**
    - List all files in custom-agents directory
    - For each file, verify .md extension, correct location, and parseable frontmatter
    - Run minimum 100 iterations
    - **Validates: Requirements 7.3**
  - [~] 10.3 Write property test for frontmatter presence
    - **Property 3: Frontmatter Presence**
    - List all .md files in custom-agents directory
    - For each file, parse frontmatter and verify sidebar_position exists
    - Run minimum 100 iterations
    - **Validates: Requirements 7.4**
  - [~] 10.4 Write property test for configuration syntax validity
    - **Property 4: Configuration Syntax Validity**
    - Extract all code blocks with `json or `yaml tags
    - For each code block, parse as JSON/YAML and verify no errors
    - Run minimum 100 iterations
    - **Validates: Requirements 8.1**
  - [~] 10.5 Write property test for code block syntax highlighting
    - **Property 5: Code Block Syntax Highlighting**
    - Extract all code blocks from custom-agents documentation
    - For each code block, verify it has a language specifier
    - Run minimum 100 iterations
    - **Validates: Requirements 8.4**

- [~] 11. Final checkpoint - Run all tests and verify build
  - Run all unit tests and verify they pass
  - Run all property-based tests and verify they pass
  - Build Docusaurus site and verify no errors or warnings
  - Review test coverage and documentation completeness
  - Ask the user if questions arise or final changes are needed

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each documentation page should follow the style and tone of existing TLÁO documentation
- Code examples should be complete and runnable where applicable
- All code blocks should have appropriate language tags for syntax highlighting
- Property tests use fast-check library and should run minimum 100 iterations each
- The sidebar uses autogeneration, so proper frontmatter and _category_.json are critical
- Checkpoints ensure incremental validation and allow for user feedback
