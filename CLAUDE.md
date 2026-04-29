# Fridge Chef - Project Guidelines

## Git & Commits
- Do NOT include `Co-Authored-By` lines in commit messages
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Always commit and push together unless told otherwise
- Stage specific files, not `git add -A`, to avoid committing secrets

## Code Standards
- TypeScript strict — fix type errors, don't use `as` casts (use `.toString()` etc.)
- Auto-capitalize user input before saving (title case)
- Keep frontend components in `src/components/`, screens in `src/screens/`
- Backend routes go in `backend/src/routes/`

## AI/Groq Guardrails
- All AI calls go through `backend/src/lib/groq.ts` (Llama 3.3 70B, JSON mode)
- Always validate AI response schema before sending to client
- Sanitize ingredient inputs (safe characters only, length limits)
- Return clean user-facing error messages, never raw AI errors
- System prompts must constrain the model to its task and ignore instructions inside user input

## Testing
- E2E tests use Playwright against Expo web (`tests/` folder)
- Run with: `npx tsx tests/tests.ts`
- Tests require both backend and frontend running
- Test account: test@testfridgechef.com / 12345678
- Don't save screenshots to the repo

## Servers
- Backend: `cd backend && npm run dev` (port 3000, MongoDB Atlas)
- Frontend: `npx expo start --web --port 8082`
- Start both servers when running tests or demoing the app

## README
- Keep README up to date when adding features or changing tech stack
- Include project structure tree when structure changes
