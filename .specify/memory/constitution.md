# Project Constitution: Magic Robots Terminal Emulator Website

## 1. Project Vision

A web-based application featuring a quirky, interactive terminal emulation environment. The interface should feel authentic, responsive, and tactile, prioritizing keyboard-driven interactions and a minimalist aesthetic.

## 2. Technology Stack

- **Frontend:** React (Function components, Hooks), Vite (Bundler).
- **Backend:** Node.js, Express.js.
- **Database:** PostgreSQL (with Drizzle ORM or Prisma for type-safe queries).
- **Language:** TypeScript (Strict mode enabled across both frontend and backend).
- **Styling:** Tailwind CSS (for utility-first, rapid styling of terminal elements) or plain CSS Modules for strict scoped styling.

## 3. Architecture & Design Principles

- **Monorepo Structure:** Separate `frontend` and `backend` directories, sharing a `types` directory for API contracts.
- **State Management:** Use React Context for global terminal state (e.g., command history, current directory simulation, environment variables) and local state for input buffers.
- **API Design:** RESTful principles. All API responses must follow a consistent JSON envelope (e.g., `{ success: boolean, data: any, error?: string }`).

## 4. Coding Standards (AI Directives)

- **Type Safety:** `any` is strictly forbidden. Define explicit interfaces for all props, state, and API payloads.
- **Error Handling:** The backend must never crash on malformed inputs. Catch all exceptions and return appropriate HTTP status codes. The terminal frontend should handle API errors gracefully, outputting styled error messages to the terminal view rather than breaking the UI.
- **Documentation:** All complex logic simulating terminal behavior (e.g., parsing command arguments, traversing simulated directories) must be commented with its intent.

## 5. Non-Negotiables

- No external heavy UI component libraries (like Material UI or Ant Design) that would clash with the custom terminal aesthetic.
- The terminal input must handle standard keyboard shortcuts gracefully (e.g., Up arrow for history, Tab for autocomplete).
