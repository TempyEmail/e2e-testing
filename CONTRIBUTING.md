# Contributing to @tempyemail/e2e-testing

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/TempyEmail/e2e-testing.git
   cd e2e-testing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes to the source files in `src/`

3. Build and test your changes:
   ```bash
   npm run build
   node test-exports.js
   ```

4. Test with examples:
   ```bash
   cd examples/basic
   node simple.js
   ```

### Code Style

- Use TypeScript for all source code
- Follow existing code formatting
- Include JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions small and focused

### TypeScript Guidelines

- Always provide proper type annotations
- Avoid `any` types
- Use interfaces for object shapes
- Export types that users might need
- Include inline documentation for complex types

### Adding Features

When adding new features:

1. **Update types** - Add interfaces to `src/types.ts`
2. **Implement functionality** - Add code to appropriate files
3. **Export from index** - Update `src/index.ts`
4. **Add examples** - Create usage examples
5. **Update README** - Document the new feature
6. **Update CHANGELOG** - Note the addition

### Adding Parsers

When adding new parser functions (OTP, links, etc.):

1. Add to `src/parsers/`
2. Export from `src/index.ts`
3. Add tests in `test-exports.js`
4. Document in README with examples
5. Add example usage in `examples/`

## Testing

### Manual Testing

Test your changes with the basic examples:

```bash
# Test OTP extraction
node examples/basic/otp-extraction.js

# Test simple mailbox
node examples/basic/simple.js
```

### Framework Testing

Test with specific frameworks:

```bash
# Playwright
cd examples/playwright
npm install
npm test

# Cypress
cd examples/cypress
npm install
npm run cy:run

# Jest
cd examples/jest
npm install
npm test
```

## Documentation

### README Updates

When updating the README:

- Keep sections organized
- Use clear, concise examples
- Test all code examples
- Include both simple and advanced usage
- Add troubleshooting tips if relevant

### API Documentation

For new public methods:

- Add JSDoc comments with `@param` and `@returns`
- Include usage examples in comments
- Document error conditions
- Add to API Reference section in README

### Examples

When adding examples:

- Make them runnable out of the box
- Include comments explaining each step
- Show error handling
- Demonstrate best practices
- Keep them focused on one use case

## Pull Request Process

1. **Update documentation**
   - Update README if adding features
   - Update CHANGELOG with your changes
   - Add JSDoc comments to new code

2. **Test thoroughly**
   - Run `npm run build`
   - Test with `node test-exports.js`
   - Test relevant examples

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add support for X"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Use a clear, descriptive title
   - Describe what changes you made
   - Reference any related issues
   - Include examples of the new functionality

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add support for custom polling intervals
fix: handle undefined webhook URLs correctly
docs: improve OTP extraction examples
```

## Reporting Issues

When reporting issues:

1. **Check existing issues** - Search to avoid duplicates
2. **Provide details**:
   - Node.js version
   - Package version
   - Operating system
   - Error messages
   - Code example to reproduce
3. **Be specific** - "waitForOTP() times out" is better than "email doesn't work"

### Issue Template

```markdown
**Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Create mailbox
2. Call waitForOTP()
3. ...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Node version: 20.11.0
- Package version: 1.0.0
- OS: macOS 14.0
```

## Feature Requests

We welcome feature requests! When requesting features:

1. **Search existing requests** - It might already be planned
2. **Describe the use case** - Why would this be useful?
3. **Propose an API** - What would it look like?
4. **Consider alternatives** - Can it be done with existing features?

## Code Review

All submissions require review. We'll check:

- Code quality and style
- Test coverage
- Documentation completeness
- Backward compatibility
- Performance impact

## Release Process

Releases are handled by maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Build: `npm run build`
4. Tag: `git tag v1.x.x`
5. Publish: `npm publish`

## Questions?

- Open an issue with the `question` label
- Check existing documentation
- Review examples in `examples/`

Thank you for contributing to @tempyemail/e2e-testing! 🎉
