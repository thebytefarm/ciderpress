# Get Started Contributing

Set up your local environment to contribute to ciderpress.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24.0.0
- [pnpm](https://pnpm.io/) 11.x (any recent pnpm will do — the `packageManager` field pins the exact version and pnpm switches to it automatically)
- [Git](https://git-scm.com/)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (optional but recommended)

## Steps

### 1. Fork and clone

```bash
gh repo fork thebytefarm/ciderpress --clone
cd ciderpress
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Verify the build

Run a full build and check suite to confirm everything works:

```bash
pnpm build && pnpm check
```

> Build must run first so that workspace packages have compiled output for cross-package type checking.

### 4. Run the dev server

Start the ciderpress documentation site locally using the project-blessed script (`package.json:22`):

```bash
pnpm docs:dev
```

For non-TTY shells (tmux panes without a real PTY, background agent tasks, CI logs), use the headless variant — it skips the Ink TUI and emits plain log output:

```bash
pnpm docs:dev --headless
```

Both run a sync + Rspress dev server on `http://localhost:6174` with file watching.

### 5. Understand the project

Read the project docs in this order:

1. `CLAUDE.md` (repo root) -- tech stack, project structure, available commands
2. [`contributing/concepts/architecture.md`](../concepts/architecture.md) -- packages, sync engine, and data flow
3. [`contributing/concepts/engine/overview.md`](../concepts/engine/overview.md) -- sync engine, build vs dev, key concepts
4. Relevant standards in the [Contributing](../README.md) overview as needed

### 6. Set up Claude Code (optional)

The repo includes built-in configuration for Claude Code:

| File                          | Purpose                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `CLAUDE.md`                   | Persona, project structure, tech stack, and commands                         |
| `.claude/settings.json`       | PostToolUse hooks that auto-format and lint TypeScript files on save         |
| `.claude/rules/typescript.md` | Functional programming rules Claude follows for all `packages/**/*.ts` files |

## Verification

Confirm all checks pass:

```bash
pnpm build && pnpm check
```

> Build must run first so that workspace packages have compiled output for cross-package type checking.

## Troubleshooting

### pnpm not found

**Issue:** Running `pnpm` returns "command not found."

**Fix:**

```bash
npm install -g pnpm
```

Once pnpm is on your PATH it reads the `packageManager` field in the root
`package.json` and switches itself to the pinned version, so the globally
installed one only needs to be recent enough to bootstrap.

### Lockfile mismatch after switching branches

**Issue:** Build or install fails after checking out a different branch.

**Fix:**

```bash
pnpm install
```

## References

- [Architecture](../concepts/architecture.md)
- [Contributing](../README.md)
