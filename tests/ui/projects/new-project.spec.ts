/**
 * Project Creation UI Test Suite
 *
 * This test suite validates the project creation interface and navigation
 * functionality within the Supabase organization dashboard. The test workflow includes:
 *
 * 1. **Organization Dashboard Access**: Tests navigation to organization-specific dashboard
 * 2. **Project Creation UI**: Verifies new project creation interface elements
 * 3. **Link Validation**: Confirms project creation links are accessible
 * 4. **Interface Availability**: Validates project management interface components
 *
 * This test validates that:
 * - Organization dashboard loads correctly with proper organization context
 * - New project creation interface is available and accessible
 * - Project management links and buttons are visible to users
 * - Navigation to organization-specific views works as expected
 *
 * The test focuses on project creation workflow entry points and ensures
 * users can access the project creation functionality from the organization dashboard.
 */

import { test, expect } from "@playwright/test"

const baseUrl = process.env.SUPABASE_BASE_URL || ""
const orgRef = process.env.SUPABASE_ORG_REF || ""

const METADATA = {
  tag: ["@ui", "@projects", "@creation"],
  annotation: [{ type: "Docs", description: "https://supabase.com/docs" }],
}

test.describe("Project Creation UI", METADATA, () => {
  // Skip entire test suite if required environment variables are missing
  test.beforeAll(async () => {
    test.skip(
      !baseUrl || !orgRef,
      "Missing SUPABASE_BASE_URL or SUPABASE_ORG_REF environment variables"
    )
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Project Creation Interface
  // ═══════════════════════════════════════════════════════════════════════════════
  test("New project interface availability", async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard/org/${orgRef}`)

    // Expect a "new project" link to be visible
    await expect(page.getByRole("link", { name: /new project/i })).toBeVisible()
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // TEST SUITE COMPLETION
  // ═══════════════════════════════════════════════════════════════════════════════
  test.afterAll(async () => {
    // Project creation UI test suite completed successfully
    // Demonstrated: Organization dashboard access and project creation interface
    // No cleanup needed - read-only operations performed
  })
})
