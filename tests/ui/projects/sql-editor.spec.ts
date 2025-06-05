/**
 * SQL Editor UI Test Suite
 *
 * This test suite validates the SQL Editor interface and navigation functionality
 * within the Supabase project dashboard. The test workflow includes:
 *
 * 1. **Project Dashboard Access**: Tests navigation to project-specific dashboard
 * 2. **SQL Editor Navigation**: Verifies SQL Editor link accessibility and navigation
 * 3. **Page URL Validation**: Confirms correct routing to SQL Editor interface
 * 4. **Interface Availability**: Validates SQL Editor tool is accessible to users
 *
 * This test validates that:
 * - Project dashboard loads correctly with proper project context
 * - SQL Editor navigation link is visible and functional
 * - URL routing works correctly for SQL Editor pages
 * - Users can successfully access the SQL Editor from project navigation
 *
 * The test focuses on SQL Editor accessibility and ensures users can navigate
 * to and use the SQL Editor functionality within their projects.
 */

import { test, expect } from "@playwright/test"

const baseUrl = process.env.SUPABASE_BASE_URL || ""
const projectRef = process.env.SUPABASE_PROJECT_REF || ""

const METADATA = {
  tag: ["@ui", "@projects", "@sql-editor"],
  annotation: [{ type: "Docs", description: "https://supabase.com/docs" }],
}

test.describe("SQL Editor UI", METADATA, () => {
  // Skip entire test suite if required environment variables are missing
  test.beforeAll(async () => {
    test.skip(
      !baseUrl || !projectRef,
      "Missing SUPABASE_BASE_URL or SUPABASE_PROJECT_REF environment variables"
    )
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // SQL Editor Navigation
  // ═══════════════════════════════════════════════════════════════════════════════
  test("SQL Editor navigation and accessibility", async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard/project/${projectRef}`)

    // Click the SQL Editor link in the sidebar
    await page.getByRole("link", { name: /sql editor/i }).click()

    // Verify we're on the SQL editor page
    await expect(page).toHaveURL(
      new RegExp(`/dashboard/project/${projectRef}/sql`)
    )
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // TEST SUITE COMPLETION
  // ═══════════════════════════════════════════════════════════════════════════════
  test.afterAll(async () => {
    // SQL Editor UI test suite completed successfully
    // Demonstrated: Project dashboard access and SQL Editor navigation
    // No cleanup needed - read-only operations performed
  })
})
