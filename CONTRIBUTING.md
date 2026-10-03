# Contributing

Thank you for your interest in contributing to PayPal AI Expense Agent. This document covers everything you need to get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Style](#commit-style)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

Be respectful and constructive. Focus feedback on the code, not the person. Discriminatory or harassing behavior will not be tolerated.

## Getting Started

1. Fork the repository and clone your fork.

```bash
git clone https://github.com/your-username/paypal-ai-expense-agent.git
cd paypal-ai-expense-agent
```

2. Install dependencies.

```bash
npm install
```

3. Copy the environment template and configure your credentials.

```bash
cp .env.example .env.local
```

See the [README](README.md) for the full list of required environment variables.

4. Start the development server.

```bash
npm run dev
```

## Development Workflow

1. Create a branch from `main` with a descriptive name.

```bash
git checkout -b fix/transaction-date-parsing
git checkout -b feat/export-to-csv
```

2. Make your changes. Keep commits focused — one logical change per commit.

3. Before opening a pull request, make sure the following pass locally.

```bash
npm run type-check   # TypeScript
npm run lint         # ESLint
npm run build        # Production build
```

4. Push your branch and open a pull request against `main`.

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add CSV export for transaction table
fix: correct date range filter off-by-one
docs: update environment variable reference
chore: upgrade openai sdk to 4.68
refactor: extract PayPal token refresh logic
```

Allowed prefixes: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`.

## Pull Request Process

- Fill in the PR template: what changed, why, and how to test it.
- Keep PRs focused. If you are fixing a bug and spotting an unrelated cleanup, open a separate PR for the cleanup.
- One approving review is required before merge.
- Resolve all review comments before requesting re-review.
- Squash merge is preferred to keep the history readable.

## Reporting Issues

Use [GitHub Issues](https://github.com/kayodedcreative/paypal-ai-expense-agent/issues). Include:

- A clear title describing the problem.
- Steps to reproduce.
- Expected vs. actual behavior.
- Relevant logs, screenshots, or environment details (Node version, browser, OS).

For security vulnerabilities, do not open a public issue. Email the maintainer directly.
