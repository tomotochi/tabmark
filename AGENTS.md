# Agent Guidelines

This document provides guidelines for AI agents working on the Tabmark repository.

## Core Principles

- **Test-Driven**: Always run tests before and after changes. If adding a feature, add a test case.
- **Format-First**: Ensure code is formatted.
- **Changelog**: Update `CHANGELOG.md` in the relevant package when making significant changes.

## Workflow

1. **Understand**: Read `README.md` and `AGENTS.md`.
2. **Plan**: Create an implementation plan if the task is complex.
3. **Implement**:
    - Write code.
    - Run tests: `npm test` (root or package level).
    - Format code: `npm run format` (if available) or ensure standard formatting.
4. **Verify**: Run full test suite.

## Repository Structure

- `packages/core`: Core logic (Markdown parser).
- `packages/cli`: CLI tool.
- `packages/vscode`: VS Code extension.

## Common Tasks

- **Updating Core**:
    - Update `packages/core`.
    - Run `npm test` in `packages/core`.
    - Update `CHANGELOG.md` in `packages/core`.
- **Updating VS Code Extension**:
    - Update `packages/vscode`.
    - Verify with `npm run compile` in `packages/vscode`.
    - Update `CHANGELOG.md` in `packages/vscode`.
