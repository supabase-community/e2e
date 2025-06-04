# Supabase e2e

End to end tests.

## Setup

1. **Install dependencies:**
   ```sh
   pnpm install
   ```

2. **Set up environment files:**
   ```sh
   cp .env.example .env.prod
   cp .env.example .env.staging
   ```
   Edit both files and add your Supabase credentials:
   ```
   SUPABASE_EMAIL=your-email@example.com
   SUPABASE_PASSWORD=your-password
   ```

3. **Create auth directory:**
   ```sh
   mkdir -p playwright/.auth
   ```

4. **Run authentication setup:**
   ```sh
   # For production
   pnpm run setup:prod

   # For staging
   pnpm run setup:staging
   ```

## Running Tests

```sh
pnpm exec playwright test
  Runs all end-to-end tests with authentication.

pnpm exec playwright test --ui
  Starts the interactive UI mode (recommended for development).

pnpm exec playwright test --project=chromium
  Runs tests only on Desktop Chrome.

pnpm exec playwright test supabase-dashboard
  Runs tests in a specific file.

pnpm exec playwright test --debug
  Runs tests in debug mode with step-by-step execution.

pnpm exec playwright codegen
  Auto generate tests with Codegen.
```

## Notes

- Authentication is handled automatically via the setup project
- All tests will run with your logged-in Supabase session
- The `.env` file and `playwright/.auth/` directory are gitignored for security
- Tests automatically use the configured base URL from environment variables
