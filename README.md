# presence

A text-adventure / interactive terminal experience built with React + Vite.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) 20 LTS (with npm 9+)

## Installation

```bash
git clone <repository-url>
cd presence
npm install
```

## Running / Development

```bash
# Frontend dev server (React + Vite)
npm run dev -w frontend
# → http://localhost:5173

# API server (Node/Express)
npm run dev -w api
```

## Running Tests

```bash
# Run all tests
npm test --workspaces --if-present

# Run frontend tests only
npm test -w frontend

# Run frontend tests in watch mode
npm run test:watch -w frontend

# Run with coverage
npm run test:coverage -w frontend
```

## Type Checking

```bash
# Check all workspaces
npm run typecheck --workspaces --if-present

# Check frontend only
npm run typecheck -w frontend
```

## Building

```bash
# Build all workspaces in dependency order
npm run build -w packages/types
npm run build -w api
npm run build -w frontend

# Or build all at once
npm run build --workspaces --if-present
```

## Deploying

* Deploy via appveyor

## Further Reading / Useful Links

* [React](https://react.dev/)
* [Vite](https://vitejs.dev/)
* [Vitest](https://vitest.dev/)
