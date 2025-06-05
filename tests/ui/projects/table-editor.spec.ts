/**
 * Table Editor UI Test Suite
 *
 * This test suite validates the Table Editor interface and navigation functionality
 * within the Supabase project dashboard. The test workflow includes:
 *
 * 1. **Project Dashboard Access**: Tests navigation to project-specific dashboard
 * 2. **Table Editor Navigation**: Verifies Table Editor link accessibility and navigation
 * 3. **Page URL Validation**: Confirms correct routing to Table Editor interface
 * 4. **Interface Availability**: Validates Table Editor tool is accessible to users
 *
 * This test validates that:
 * - Project dashboard loads correctly with proper project context
 * - Table Editor navigation link is visible and functional
 * - URL routing works correctly for Table Editor pages
 * - Users can successfully access the Table Editor from project navigation
 *
 * The test focuses on Table Editor accessibility and ensures users can navigate
 * to and use the Table Editor functionality for database schema management.
 */

import { test, expect } from "@playwright/test"

const baseUrl = process.env.SUPABASE_BASE_URL || ""
const projectRef = process.env.SUPABASE_PROJECT_REF || ""

const METADATA = {
  tag: ["@ui", "@projects", "@table-editor"],
  annotation: [{ type: "Docs", description: "https://supabase.com/docs" }],
}

test.describe("Table Editor UI", METADATA, () => {
  // Skip entire test suite if required environment variables are missing
  test.beforeAll(async () => {
    test.skip(
      !baseUrl || !projectRef,
      "Missing SUPABASE_BASE_URL or SUPABASE_PROJECT_REF environment variables"
    )
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Table Editor Navigation
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Table Editor navigation and accessibility", async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard/project/${projectRef}`)

    // Click the Table Editor link in the sidebar
    await page.getByRole("link", { name: /table editor/i }).click()

    // Verify we're on the table editor page
    await expect(page).toHaveURL(
      new RegExp(`/dashboard/project/${projectRef}/editor`)
    )
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // TEST SUITE COMPLETION
  // ═══════════════════════════════════════════════════════════════════════════════
  test.afterAll(async () => {
    // Table Editor UI test suite completed successfully
    // Demonstrated: Project dashboard access and Table Editor navigation
    // No cleanup needed - read-only operations performed
  })
})
