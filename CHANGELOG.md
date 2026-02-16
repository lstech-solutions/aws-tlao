## [1.1.1](https://github.com/lstech-solutions/aws/compare/v1.1.0...v1.1.1) (2026-01-03)


### Bug Fixes

* add basePath for GitHub Pages subdirectory deployment ([61f3abc](https://github.com/lstech-solutions/aws/commit/61f3abc72dc577c2962fa1202b5267cc25f20cd8))
* add ESLint configs and fix linting errors ([fef6d94](https://github.com/lstech-solutions/aws/commit/fef6d94b607b6d256b1d345e9aba7ea0b6c3f29f))
* allow tests to pass when no tests exist ([f87de74](https://github.com/lstech-solutions/aws/commit/f87de748addfa6fc8e50efac1a4f154a15b7faf2))
* correct working-directory placement in deploy step ([cd996ee](https://github.com/lstech-solutions/aws/commit/cd996ee994298eaec21e97a5b232644b48678255))
* disable no-explicit-any ESLint rule for backend and versioning ([e8a368f](https://github.com/lstech-solutions/aws/commit/e8a368fea9d5fe1cc49a3a17c2f89a3dd90b4029))
* use Vercel CLI instead of non-existent action ([3bfea27](https://github.com/lstech-solutions/aws/commit/3bfea2785875f8508a5bc7630354ff2a0c7b43a8))


### Features

* configure GitHub Pages deployment ([f923a51](https://github.com/lstech-solutions/aws/commit/f923a5157d8b0047401bada229cc5a87f6caa6a9))





# [1.1.0](https://github.com/lstech-solutions/aws/compare/v1.0.1...v1.1.0) (2026-01-03)





## [1.0.3](https://github.com/lstech-solutions/aws/compare/v1.0.1...v1.0.3) (2026-01-03)





# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2024-01-03

### Added
- Beautiful infinite grid animation with mouse-tracking flashlight effect
- Professional dark and light mode support with system detection
- Three-state theme system (system, light, dark)
- Clickable scroll indicator for smooth navigation
- Back-to-top button with smooth scrolling
- Privacy Policy page with comprehensive privacy information
- Terms of Service page with legal terms
- Contact page with working email form integration
- Proper footer with theme toggle and legal links
- Enhanced gradient design matching reference images
- Framer Motion animations throughout the landing page

### Changed
- Updated gradient from purple to subtle peach-to-blue gradient
- Improved grid pattern visibility and styling
- Enhanced footer with light/dark mode support
- Updated all email addresses to lstech.solutions domain

### Fixed
- TypeScript errors in backend services (bedrock, document-parser, dynamodb, transcribe)
- Unused variable warnings in document ingestion
- Footer styling for proper light mode appearance
- SSR/hydration issues with theme provider

## [1.0.1] - 2024-01-02

### Added
- Initial project setup with monorepo structure
- Backend services with AWS integration
- Landing page with hero section
- Versioning package for version management

### Changed
- Project structure optimized for scalability

## [1.0.0] - 2024-01-01

### Added
- Initial release of AI Agent Platform
- Ops Copilot agent for operational management
- Grant Navigator agent for grant discovery
- AWS Bedrock integration
- Lambda functions for serverless processing
- DynamoDB for data persistence
- S3 for file storage
- Transcribe for audio processing
