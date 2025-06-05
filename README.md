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
   npm run setup:prod

   # For staging
   npm run setup:staging
   ```

## Running Tests

### Production Environment
```sh
npm run test:prod
  Runs all tests against production environment

npm run test:prod:ui
  Runs tests in interactive UI mode against production
```

### Staging Environment
```sh
npm run test:staging
  Runs all tests against staging environment

npm run test:staging:ui
  Runs tests in interactive UI mode against staging
```

### Additional Commands
```sh
pnpm exec playwright test --debug
  Runs tests in debug mode with step-by-step execution

pnpm exec playwright codegen
  Auto generate tests with Codegen

pnpm exec playwright test --project=setup
  Run only the authentication setup
```

## Notes

- Authentication is handled automatically via the setup project
- All tests will run with your logged-in Supabase session
- The `.env` file and `playwright/.auth/` directory are gitignored for security
- Tests automatically use the configured base URL from environment variables
