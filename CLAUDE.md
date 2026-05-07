# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PatternFly React is a monorepo of React components implementing the PatternFly design system, maintained by Red Hat. It supports React 17/18/19.

## Prerequisites

- Node.js >= 22.17.1
- Yarn 4.7.0 (via Corepack: `corepack enable`)

## Common Commands

```bash
# Install dependencies
yarn install

# Full build (required before first test run)
yarn build

# Build ESM only (fastest for iterating)
yarn build:esm

# Watch mode for development
yarn watch

# Run all tests
yarn test

# Run a specific test file
yarn test Button.test.tsx

# Run tests matching a pattern
yarn test -- --testPathPattern="packages/react-core/src/components/Button"

# Update snapshots
yarn test -u

# Lint
yarn lint

# Lint with auto-fix
yarn lint --fix

# Scaffold a new component
yarn generate

# Start dev server (builds + watches + serves docs on port 8002)
yarn start
```

Tests run with `TZ=EST LC_ALL=en_US.UTF8` set automatically. The test environment is jsdom with React Testing Library.

## Architecture

### Monorepo Structure

Managed with Lerna (independent versioning) and Yarn workspaces. Key packages under `packages/`:

- **react-core** — Primary component library (Button, Modal, Alert, Table layouts, etc.)
- **react-table** — Table components
- **react-charts** — Chart/visualization components
- **react-icons** — Icon components (generated)
- **react-styles** — CSS style utilities
- **react-tokens** — CSS variable design tokens (generated)
- **react-code-editor** — Code editor component
- **react-drag-drop** — Drag and drop components
- **react-templates** — Template components
- **react-docs** — Gatsby documentation site
- **react-integration** — Cypress integration tests + demo app

### Build Pipeline

`yarn build` runs: clean → generate → ESM (tsc) → CJS (tsc) → subpaths → single packages

TypeScript uses project references (`packages/tsconfig.json`) with custom transformers (`transformer-cjs-imports`, `transformer-react-styles-esm-imports`). Each package outputs to `dist/esm/` (ES modules) and `dist/js/` (CommonJS).

### Component File Organization

Components follow this structure inside each package's `src/components/`:

```
ComponentName/
  ComponentName.tsx          # Implementation
  index.ts                   # Named exports
  __tests__/
    ComponentName.test.tsx   # Jest + React Testing Library tests
    __snapshots__/           # Jest snapshots
  examples/                  # Documentation examples
  ComponentName.md           # Component documentation
```

### Conventions

- PascalCase for component names and their directories
- Named exports (no default exports)
- Props interfaces named `{ComponentName}Props`
- Stateless/props-driven components preferred
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Prettier: 2 spaces, single quotes, semicolons, 120 char width
- Pre-commit hook runs lint-staged (auto-fixes lint issues on committed files)

### Testing

- Jest 29 with babel-jest transformer and jsdom environment
- React Testing Library for component tests
- Tests located in `__tests__/` directories alongside components
- CSS/SCSS imports are mocked via `jest-transform-stub`
- Cypress for integration tests (`packages/react-integration/`)

### ESLint

Uses flat config (`eslint.config.mjs`) with typescript-eslint, react, react-hooks, react-compiler, and prettier plugins. A custom `eslint-plugin-patternfly-react` package provides project-specific rules.
