# Claude Code Instructions

## Worktrees
**Never use worktrees.** Do not pass `isolation: "worktree"` when calling the Agent tool. All work should happen directly in the main working directory.

## Active Technologies
- TypeScript 5.x (strict) / Node.js 20 LTS + React 18, Vite 5, @vitejs/plugin-react, react-router-dom 6, Vitest 2, jsdom, @testing-library/react (004-tech-debt-refactor)
- PostgreSQL (Drizzle ORM in API — out of scope for this feature) + localStorage (frontend persistence module) (004-tech-debt-refactor)

## Recent Changes
- 004-tech-debt-refactor: Added TypeScript 5.x (strict) / Node.js 20 LTS + React 18, Vite 5, @vitejs/plugin-react, react-router-dom 6, Vitest 2, jsdom, @testing-library/react
