# Claude Code Instructions

## Coding Conventions

### Function Style
- Use arrow functions: `const myFunction = () => {}` instead of `function myFunction() {}`
- Export at declaration: `export const myFunction = () => {}`

### React Components
- Use FC pattern: `const MyComponent: FC<Props> = ({ prop1, prop2 }) => {}`
- ForwardRef: `const MyComponent = forwardRef<HTMLElement, Props>(({ prop1 }, ref) => {})`
- Props interfaces above component: `interface MyComponentProps { ... }`
- **Avoid excessive props** - Too many props is a code smell. Prefer:
  - Context for shared state instead of prop drilling
  - Composition (children/render props) over callbacks
  - Grouping related props into objects
  - Having components call hooks directly instead of receiving state as props

### Business Logic
- Extract business logic into custom hooks in `src/hooks/`
- Hooks should be independently testable
- Keep components focused on rendering

---

## Testing Requirements

This project uses Vitest for testing. Follow these guidelines:

### After Making Code Changes
1. **Always run tests** after modifying functionality: `npm run test:run`
2. **Run the build** to verify no type errors: `npm run build`
3. If tests fail, fix them before considering the task complete

### When Adding New Features
1. Write tests for new functionality in a corresponding `.test.ts` or `.test.tsx` file
2. Place test files next to the source files they test
3. Use existing test patterns from `src/services/storage.test.ts` as reference

### Test Coverage Guidelines
- All utility functions in `src/services/` must have tests
- All data lookup functions in `src/data/` must have tests
- React components should have tests for key interactions
- Context providers should have tests for state management

### Running Tests
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once (use this after changes)
- `npm run test:coverage` - Run with coverage report

### Build Commands
- `npm run build` - TypeScript check + production build
- `npm run dev` - Start development server

---

## Git Workflow

**IMPORTANT:** Do NOT commit or push unless explicitly asked by the user.
- Only run `git commit` when the user explicitly requests a commit
- Only run `git push` when the user explicitly requests a push
- It's fine to stage files with `git add` as part of reviewing changes
