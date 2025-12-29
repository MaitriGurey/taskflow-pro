# TaskFlow Pro

A task management application built with React 18, TypeScript, and modern frontend tooling. Designed as a production-ready frontend that can operate standalone with local persistence or integrate with a backend API.

## Overview

TaskFlow Pro provides a clean, accessible interface for managing tasks with:

- Task creation, completion, and organization
- Subtask support with independent completion tracking
- Drag-and-drop reordering via keyboard or pointer
- Filtering by status, priority, tags, and due date
- Search across titles and descriptions
- Full undo/redo with keyboard shortcuts
- Offline-first persistence via IndexedDB
- Session-based authentication (simulated)

## Screenshots
<img width="400" height="500" alt="Screenshot 2025-12-29 163533" src="https://github.com/user-attachments/assets/12adca5b-4e98-4950-94bc-f43a26eab0df" />
<img width="400" height="500" alt="Screenshot 2025-12-29 163705" src="https://github.com/user-attachments/assets/d77f4761-c112-4cc0-9540-1325245451d7" />
<img width="400" height="500" alt="Screenshot 2025-12-29 164113" src="https://github.com/user-attachments/assets/35ff8c46-7f7a-4447-9a24-0e3cf5912092" />
<img width="400" height="500" alt="Screenshot 2025-12-29 164152" src="https://github.com/user-attachments/assets/d7ec8edc-b632-4b4d-96fd-6d1e188c8e82" />

## Tech Stack

| Layer           | Choice                         | Rationale                                                         |
| --------------- | ------------------------------ | ----------------------------------------------------------------- |
| **Framework**   | React 18                       | Stable, well-understood, strong ecosystem                         |
| **Language**    | TypeScript (strict)            | Catches bugs early, self-documenting, better refactoring          |
| **Routing**     | React Router v6                | De facto standard, lazy loading support                           |
| **State**       | Zustand                        | Minimal boilerplate, good TypeScript support, no providers needed |
| **Persistence** | IndexedDB (idb)                | Structured storage, handles large datasets, async-friendly        |
| **Styling**     | Tailwind CSS                   | Utility-first, no CSS files to manage, consistent design tokens   |
| **Drag & Drop** | @dnd-kit                       | Accessible by default, keyboard support, headless architecture    |
| **Testing**     | Vitest + React Testing Library | Fast, Jest-compatible, focuses on user behavior                   |
| **E2E**         | Playwright                     | Cross-browser, reliable, good DX                                  |
| **Build**       | Vite                           | Fast HMR, ES modules, minimal config                              |

## Architecture

```
src/
├── components/     # Shared UI components
├── hooks/          # Custom React hooks
├── lib/            # External service integrations (IndexedDB)
├── pages/          # Route-level components
├── stores/         # Zustand state stores
├── test/           # Test utilities and setup
└── types/          # TypeScript type definitions
```

| Decision                      | Benefit                           | Cost                                   |
| ----------------------------- | --------------------------------- | -------------------------------------- |
| Frontend-only auth            | Simple to demo, no backend needed | Not secure, simulated JWT              |
| Full state snapshots for undo | Simple, correct                   | Memory usage scales with history depth |
| Debounced persistence         | Reduces IndexedDB writes          | 300ms delay before data is persisted   |
| Lazy-loaded routes            | Smaller initial bundle            | Brief loading state on navigation      |
| Single store for tasks        | Predictable, easy to persist      | All task operations in one file        |

## Backend Integration

The app is designed for easy backend migration:

1. **Auth Store** → Replace `login()` with API call, store real JWT, add token refresh
2. **Task Store** → Replace `loadTasks()` and persistence subscription with API calls
3. **IndexedDB** → Keep as offline cache, sync with server on reconnect
4. **Types** → Already match typical REST resource shapes

## Future Improvements

- Collaborative editing with operational transforms
- Activity feed across users
- Calendar integration
- Mobile app via React Native (shared business logic)

## Development

```bash
npm install
npm run dev      # Start dev server
npm run build    # Production build
npm test         # Run unit tests
npm run test:e2e # Run Playwright tests
```
