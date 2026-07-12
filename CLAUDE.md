# CLAUDE.md

## Development Workflow (TDD)

Develop using Test-Driven Development. For every feature or bugfix:

1. **Write failing tests first.** Write tests that capture the desired behavior and confirm they fail before writing any implementation.
2. **Make them pass.** Write the minimum implementation needed to make the tests pass.
3. **Ask for refactoring feedback.** Once tests pass, ask the user for refactoring feedback before making further changes.

## Verifying Changes

To verify changes, **always** use this exact command — do NOT use any other command to verify all changes are okay:

```
npm run check:fix && npm test
```

## Git

Do not manage anything git related. The user handles all git operations (commits, branches, pushes, etc.) on their own.
