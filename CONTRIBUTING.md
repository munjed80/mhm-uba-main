# Contributing to MHM UBA

Thank you for your interest in contributing to MHM Universal Business Automator! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Coding Standards](#coding-standards)
- [Testing](#testing)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment. Be kind, considerate, and constructive in your interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mhm-uba-main.git
   cd mhm-uba-main
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/munjed80/mhm-uba-main.git
   ```

## Development Setup

1. **Install dependencies** (optional for linting/formatting):
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   
   This will start a local server at http://localhost:8000

3. **Open in browser** and start developing!

## Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our [Coding Standards](#coding-standards)

3. **Test your changes** thoroughly:
   - Manual testing in the browser
   - Run Cypress tests: `npm test`
   - Check for console errors
   - Test across different browsers

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add: Brief description of your changes"
   ```
   
   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for updates to existing features
   - `Refactor:` for code refactoring
   - `Docs:` for documentation changes

## Submitting a Pull Request

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub:
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - List any breaking changes

3. **Wait for review**:
   - Maintainers will review your PR
   - Address any requested changes
   - Once approved, your PR will be merged

## Coding Standards

### JavaScript
- Use modern ES6+ JavaScript
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use const/let instead of var

### HTML
- Use semantic HTML5 elements
- Include proper accessibility attributes (ARIA labels, alt text)
- Maintain consistent indentation
- Follow existing structure patterns

### CSS
- Use meaningful class names following BEM methodology where applicable
- Keep selectors specific but not overly complex
- Use CSS variables for colors and common values
- Organize styles logically (layout, typography, components)

### Code Quality
- Run `npm run lint:js` to check JavaScript
- Run `npm run format` to format code with Prettier
- Ensure no console errors in browser
- Test in multiple browsers

## Testing

### Manual Testing
1. Serve the project locally
2. Test your changes in the relevant pages
3. Verify data persistence (localStorage)
4. Test across different screen sizes
5. Check language switching functionality

### Automated Testing
Run Cypress tests:
```bash
npm test
```

Add new tests for new features in `cypress/e2e/`

## File Structure

When adding new features:
- **HTML pages**: Place in root directory
- **JavaScript**: Add to `assets/js/`
- **CSS**: Add to `assets/css/`
- **Tests**: Add to `cypress/e2e/`
- **Documentation**: Update relevant `.md` files

## Questions?

Feel free to:
- Open an issue for discussion
- Ask questions in pull requests
- Reach out to maintainers

Thank you for contributing to MHM UBA! 🎉
