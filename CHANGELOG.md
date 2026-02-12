# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-13

### Added
- Initial release of @tempyemail/e2e-testing
- Core `TempyEmail` client for creating and managing temporary mailboxes
- `Mailbox` class with helper methods for email operations
- Smart email polling with exponential backoff
- OTP extraction utilities (6-digit, numeric, alphanumeric, UUID)
- Link extraction utilities (verification links, magic links)
- Webhook support for real-time notifications
- TypeScript type definitions
- Comprehensive examples for:
  - Playwright
  - Cypress
  - Jest
  - Vitest
  - Basic Node.js usage
- Full documentation and API reference

### Features
- Zero configuration - works out of the box
- No authentication required
- Automatic mailbox cleanup (1 hour expiration)
- Framework agnostic
- TypeScript native with full type safety
- Smart OTP and link parsing
- Real-time webhook notifications

[1.0.0]: https://github.com/TempyEmail/e2e-testing/releases/tag/v1.0.0
