# CLAUDE.md

Behavioral guidelines for 少年球探 frontend development.
Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed.
For trivial tasks, use judgment.

## Project Overview

少年球探 (Youth Scout) - 青少年足球成长服务平台前端
新官网前端应用

## Tech Stack

- Framework: React 19.2
- Language: TypeScript 5.9
- Build Tool: Vite 8
- Styling: Tailwind CSS 3.4
- State Management: Zustand 5
- HTTP Client: Axios
- Routing: React Router DOM 7
- Forms: React Hook Form
- UI Components: Radix UI + class-variance-authority + tailwind-merge
- Icons: Lucide React
- Charts: ECharts 6, Recharts
- Animation: Framer Motion
- Maps: 高德地图 AMap
- Video: Video.js
- PDF: jsPDF + html2canvas
- Testing: Vitest 4 + Playwright 1.58 + @testing-library

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.
- Prefer Zustand for simple state; don't add Redux/Context unless necessary.
- Use React built-in hooks before custom hooks.

Ask yourself: "Would a senior engineer say this is overcomplicated?"
If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Follow existing component organization in src/.
- Don't change tailwind.config.js or global styles without explicit approval.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add a component" → "Render with test props, verify UI matches design"
- "Fix the bug" → "Reproduce in browser, fix, verify no longer reproducible"
- "Refactor X" → "Ensure `npm run build` passes and feature works identically"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently.
Weak criteria ("make it work") require constant clarification.

## React/TypeScript Rules

- Use functional components with hooks
- Type all props, state, and API responses explicitly (no `any`)
- Prefer `const` arrow functions for components
- Use Tailwind utility classes for styling, avoid inline styles
- Keep components focused and single-responsibility
- Use cn() utility (clsx + tailwind-merge) for conditional classes
- Follow strict TypeScript configuration

## State Management (Zustand)

- One store per domain feature when possible
- Keep store actions simple and focused
- Don't put derived state in stores; use selectors or computed values
- Prefer atomic stores over monolithic stores

## API Integration (Axios)

- Use the existing Axios instance/config, don't create new ones
- Type all API request payloads and responses
- Handle loading and error states for all API calls
- Use React Query / SWR patterns if already in the project

## Testing Rules

- Unit tests with Vitest for utilities and hooks
- Component tests with @testing-library/react
- E2E tests with Playwright for critical user flows
- Write tests for bug fixes to prevent regression

## Testing Checklist

Before declaring a task complete:
- [ ] Component renders without TypeScript errors (`tsc --noEmit`)
- [ ] Build passes (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] UI matches expected design/behavior
- [ ] No console errors or warnings
- [ ] Responsive on mobile (375px), tablet (768px), desktop (1440px)
- [ ] E2E tests pass for affected flows (`npm run test:e2e`)
