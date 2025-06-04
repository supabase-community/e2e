# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Playwright-based end-to-end testing suite for Supabase, supporting both UI and API testing across multiple environments (production and staging). The test suite includes authentication setup, database operations, and backup/recovery workflows.

## Commands

### Environment Setup
```bash
# Install dependencies
pnpm install

# Set up environment files for different environments
cp .env.example .env.prod
cp .env.example .env.staging

# Create authentication directory
mkdir -p playwright/.auth
```

### Authentication Setup
```bash
# Run authentication setup for production
pnpm run setup:prod

# Run authentication setup for staging  
pnpm run setup:staging
```

### Running Tests
```bash
# Run all tests for production environment
pnpm run test:prod

# Run all tests for staging environment
pnpm run test:staging

# Run tests with UI mode for development
pnpm run test:prod:ui
pnpm run test:staging:ui

# Run specific test projects
npx playwright test --project=chromium
npx playwright test --project=setup

# Run specific test files or folders
npx playwright test tests/api/
npx playwright test tests/ui/
npx playwright test tests/api/database-healthcheck.spec.ts

# Debug mode for troubleshooting
npx playwright test --debug

# Generate new test code
npx playwright codegen
```

## Architecture

### Test Organization
- **`tests/api/`** - API tests using Playwright's request fixture to test Supabase Management API endpoints
- **`tests/ui/`** - UI tests for browser-based interactions with the Supabase dashboard
- **`auth.setup.ts`** - Authentication setup that runs before all tests, storing session state for reuse

### Environment Configuration
The project uses a multi-environment setup:
- **`.env.prod`** and **`.env.staging`** contain environment-specific configuration
- **npm scripts** automatically copy the appropriate `.env` file before running tests
- **Authentication state** is stored in `playwright/.auth/user.json` and shared across tests

### Required Environment Variables
```
SUPABASE_BASE_URL="https://supabase.com"              # Dashboard URL
SUPABASE_BASE_API_URL="https://api.supabase.com"     # API endpoint
SUPABASE_EMAIL="your-email@example.com"              # Login credentials
SUPABASE_PASSWORD="your-password"                    # Login credentials
SUPABASE_ORG_REF="your-org-ref-id"                   # Organization reference
SUPABASE_PROJECT_REF="your-project-ref-id"           # Project reference
SUPABASE_ACCESS_TOKEN="your-access-token"            # API authentication token
```

### Playwright Configuration
- **Browser support**: Primarily Chromium (Firefox/Safari commented out)
- **Authentication flow**: Setup project runs first, creates session state, other tests depend on it
- **Parallel execution**: Enabled for faster test runs
- **Retries**: Configured for CI environments only

### API Test Patterns
API tests use the `request` fixture and follow this structure:
1. **Environment validation** - Skip tests if required variables are missing
2. **Endpoint construction** - Build URLs using environment variables
3. **Request execution** - POST/GET requests with proper headers including Bearer token authentication
4. **Response validation** - Status code and data structure assertions
5. **Cleanup considerations** - Some tests create database objects that may need manual cleanup

### Key API Endpoints Tested
- **Database queries**: `/v1/projects/{ref}/database/query` - Execute SQL queries
- **Migrations**: `/v1/projects/{ref}/database/migrations` - Schema changes with idempotency
- **Backup operations**: `/v1/projects/{ref}/database/backups/*` - Restore points and rollback functionality

## Code Documentation Standards

**All code in this repository must be extensively documented to read like interactive documentation.** Tests should be self-explanatory to humans reading through them:

- **File-level documentation**: Each test file starts with a comprehensive JSDoc block explaining the purpose, workflow, and validation goals
- **Step-by-step comments**: Every major operation includes detailed inline comments with emojis and visual separators for easy scanning  
- **Explanatory variable names**: Use descriptive names that clearly indicate purpose (e.g., `restorePointEndpoint`, `checkpointName`)
- **API context**: Explain what each endpoint does, what parameters mean, and what responses indicate
- **Human-readable flow**: Tests should read like a tutorial, with clear explanations of "why" not just "what"

Example documentation pattern:
```typescript
/**
 * Database Backup & Recovery Lifecycle Test
 * 
 * This comprehensive test demonstrates...
 * 1. **Create Restore Point**: Establishes a checkpoint...
 * 2. **Schema Migration**: Creates a new table...
 */

// ═══════════════════════════════════════════════════════════════════
// STEP 1: Create Restore Point (Checkpoint Before Migration)  
// ═══════════════════════════════════════════════════════════════════

console.log("🎯 Creating restore point before any database changes...");
const restorePointResponse = await request.post(restorePointEndpoint, {
  // ... detailed comments explaining each parameter
});
```

**The goal is that anyone reading the test code can understand the complete API workflow without external documentation.**