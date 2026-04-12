# Contributing

## Setup

This project uses [Bun](https://bun.sh/) as the package manager.

```bash
bun install
```

## Development

```bash
bun run dev
```

The dev server starts at `http://localhost:5173` with hot module replacement.

## Code Style

- **Prettier** for formatting (auto-applied via `bun run format`)
- **ESLint** with react-hooks, react-refresh, and TypeScript type-checked rules
- **TypeScript** strict mode — no `any`, no implicit `any`

Run checks before committing:

```bash
bun run lint
bun run build    # includes tsc type check
bun run test
```

## Project Structure

See [README.md](README.md#architecture) for the directory layout.

### Adding a New Feature

1. Identify which layer it belongs to (lib, stores, hooks, components)
2. Follow existing patterns — look at similar files for conventions
3. Keep components under 150 lines; extract sub-components when needed
4. Add tests for new logic (unit tests in `src/**/*.test.ts`, E2E in `tests/e2e/`)

### State Management

All simulation state lives in Zustand stores (`src/stores/`). The main store is `simulationStore.ts`. Add new stores in separate files when the state is conceptually distinct (e.g., `keyBindingsStore.ts`, `themeStore.ts`).

### 3D Components

When writing R3F components that manipulate Three.js buffer attributes directly, you may need to disable the `react-hooks/immutability` ESLint rule for that block:

```ts
/* eslint-disable react-hooks/immutability */
positionAttr.array[i] = value;
positionAttr.needsUpdate = true;
/* eslint-enable react-hooks/immutability */
```

## Testing

```bash
# Unit tests (Vitest + jsdom)
bun run test

# E2E tests (Playwright + Chromium)
bun run test:e2e
```

### Adding Tests

- **Unit tests**: colocate with the file being tested (`foo.test.ts` next to `foo.ts`)
- **Component tests**: place in the same directory as the component
- **E2E tests**: add to `tests/e2e/`

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Reference any related issues in the description
- Ensure CI passes (lint, build, tests)
